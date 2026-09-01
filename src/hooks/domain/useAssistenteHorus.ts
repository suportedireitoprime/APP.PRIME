import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { horusService, NotifPrefs, DEFAULT_PREFS, HorusLinkedStatus } from '@/services/horusService';
import { haptic } from '@/lib/nativeHaptics';

export const HORUS_CACHE_KEY = 'horus:status-cache:v1';

export function useAssistenteHorus() {
  const cachedInit = (() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(HORUS_CACHE_KEY) : null;
      return raw ? JSON.parse(raw) as { linked: HorusLinkedStatus; profileName: string } : null;
    } catch { return null; }
  })();

  const [statusLoading, setStatusLoading] = useState(!cachedInit);
  const [profileName, setProfileName] = useState<string>(cachedInit?.profileName || '');
  const [linked, setLinked] = useState<HorusLinkedStatus | null>(cachedInit?.linked || null);
  
  const [nomeEdit, setNomeEdit] = useState<string>(cachedInit?.profileName || cachedInit?.linked?.nome_preferido || '');
  const [apelidoEdit, setApelidoEdit] = useState<string>(cachedInit?.linked?.apelido || '');
  const [apelidoAtivo, setApelidoAtivo] = useState<boolean>(Boolean(cachedInit?.linked?.apelido_ativo));
  
  const [savingNome, setSavingNome] = useState(false);
  const [savingApelido, setSavingApelido] = useState(false);
  const [savingKey, setSavingKey] = useState<keyof NotifPrefs | null>(null);

  const loadStatus = useCallback(async () => {
    if (!cachedInit) setStatusLoading(true);
    const { user, linked: nextLinked, profileName: nextProfileName } = await horusService.getStatus();
    
    if (!user) {
      setStatusLoading(false);
      return;
    }

    setLinked(nextLinked);
    setProfileName(nextProfileName);
    setNomeEdit(nextProfileName || (nextLinked?.nome_preferido) || '');
    setApelidoEdit((nextLinked?.apelido) || '');
    setApelidoAtivo(Boolean(nextLinked?.apelido_ativo));
    setStatusLoading(false);
    
    try {
      window.localStorage.setItem(
        HORUS_CACHE_KEY,
        JSON.stringify({ linked: nextLinked, profileName: nextProfileName })
      );
    } catch {}
  }, [cachedInit]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel(`horus-whatsapp-user-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'horus_whatsapp_users',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            try { window.localStorage.removeItem(HORUS_CACHE_KEY); } catch {}
            loadStatus();
          },
        )
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [loadStatus]);

  const prefs: NotifPrefs = useMemo(
    () => ({ ...DEFAULT_PREFS, ...(linked?.notif_prefs || {}) }),
    [linked?.notif_prefs]
  );

  const isVerified = Boolean(linked?.verified_at);
  const displayName = ((linked?.apelido_ativo && (linked?.apelido || '').trim()) || profileName || (linked?.nome_preferido || '').trim() || '').trim();

  const handleVerified = useCallback(() => {
    try { window.localStorage.removeItem(HORUS_CACHE_KEY); } catch {}
    loadStatus();
  }, [loadStatus]);

  const savePref = async (key: keyof NotifPrefs, value: boolean, requireVerification: () => void) => {
    if (!linked) {
      toast.error('Verifique seu WhatsApp primeiro');
      requireVerification();
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setSavingKey(key);
    const next = { ...prefs, [key]: value };
    setLinked((prev) => (prev ? { ...prev, notif_prefs: next } : prev)); // Optimistic update
    
    const { error } = await horusService.updatePrefs(user.id, next);
    setSavingKey(null);
    if (error) {
      toast.error('Não deu pra salvar');
      loadStatus();
    }
  };

  const saveNome = async () => {
    const finalName = nomeEdit.trim();
    if (!finalName) return toast.error('Digite um nome');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setSavingNome(true);
    await horusService.updateNome(user.id, linked?.phone_e164, finalName);
    setSavingNome(false);
    
    haptic.medium();
    toast.success(`Beleza, ${finalName.split(' ')[0]}!`);
    loadStatus();
  };

  const saveApelido = async () => {
    if (!linked) return toast.error('Verifique seu WhatsApp primeiro');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const finalApelido = apelidoEdit.trim();
    if (apelidoAtivo && !finalApelido) return toast.error('Digite o apelido ou desative');
    
    setSavingApelido(true);
    await horusService.updateApelido(user.id, finalApelido, apelidoAtivo);
    setSavingApelido(false);
    
    haptic.medium();
    toast.success(apelidoAtivo && finalApelido ? `Vou te chamar de ${finalApelido}!` : 'Apelido desativado');
    loadStatus();
  };

  return {
    statusLoading,
    profileName,
    linked,
    isVerified,
    displayName,
    prefs,
    
    // Editor State
    nomeEdit, setNomeEdit,
    apelidoEdit, setApelidoEdit,
    apelidoAtivo, setApelidoAtivo,
    
    // Loading States
    savingNome,
    savingApelido,
    savingKey,
    
    // Actions
    loadStatus,
    handleVerified,
    savePref,
    saveNome,
    saveApelido
  };
}
