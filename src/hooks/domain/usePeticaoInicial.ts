import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import { Peticao } from '@/types/peticao';

export function usePeticaoInicial(id?: string) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canUse, register } = useFeatureLimit('peticao_inicial');
  const [pet, setPet] = useState<Peticao | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id || !user) return;
    const { data, error } = await supabase
      .from('peticoes_iniciais' as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error || !data) {
      toast.error(error?.message ?? 'Petição não encontrada');
      navigate('/ferramentas/peticao-inicial');
      return;
    }
    setPet(data as any);
    setLoading(false);
  }, [id, user, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (fields: Partial<Peticao>) => {
    if (!pet) return;
    setSaving(true);
    
    // Aplica localmente primeiro para UX offline-first.
    setPet({ ...pet, ...fields });
    const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    
    if (!online) {
      try {
        const { syncQueue } = await import('@/services/syncQueue');
        await syncQueue.enqueue({
          kind: 'table.update', table: 'peticoes_iniciais',
          match: { id: pet.id }, values: fields as any,
        });
      } catch {}
      setSaving(false);
      toast.message('Salvo localmente. Sincroniza quando voltar a internet.');
      return;
    }
    
    const { error } = await supabase
      .from('peticoes_iniciais' as any)
      .update(fields)
      .eq('id', pet.id);
      
    setSaving(false);
    
    if (error) {
      // Rede caiu no meio? Enfileira e informa.
      try {
        const { syncQueue } = await import('@/services/syncQueue');
        await syncQueue.enqueue({
          kind: 'table.update', table: 'peticoes_iniciais',
          match: { id: pet.id }, values: fields as any,
        });
        toast.message('Salvo localmente. Sincroniza quando voltar a internet.');
      } catch {
        toast.error(error.message);
      }
    }
  };

  return {
    pet,
    loading,
    saving,
    patch,
    canUse,
    register,
  };
}
