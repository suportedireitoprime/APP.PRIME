import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionState {
  isPremium: boolean;
  loading: boolean;
  plano: string | null;
  expiresAt: string | null;
  startedAt: string | null;
  source: 'play' | 'apple' | 'asaas' | null;
  status: string | null;
  isAdminOverride: boolean;
  refresh: () => void;
}

const ADMIN_EMAILS = new Set([
  'wn7corporation@gmail.com',
  'suporte.vacatio@gmail.com',
  'wn7juridico@gmail.com',
]);

// Evita repetir o resgate de assinatura legada a cada montagem do hook.
const claimedOnce = new Set<string>();

const ACTIVE_STATUSES = [
  'SUBSCRIPTION_STATE_ACTIVE',
  'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
] as const;

interface Options {
  /** Se true, faz polling curto (6× a cada 1s) até detectar Premium. Usar logo após uma compra. */
  pollOnMount?: boolean;
}

export function useSubscription(options: Options = {}): SubscriptionState {
  const { pollOnMount = false } = options;
  const { user } = useAuth();
  const wasPremium = useRef(false);
  // Snapshot offline: hidrata imediatamente do cache local para não travar telas
  // premium quando o dispositivo está sem rede.
  const cacheKey = user ? `vacatio:sub:${user.id}` : null;
  const emailLower = (user?.email || '').toLowerCase();
  const isAdminEmail = ADMIN_EMAILS.has(emailLower);
  const [state, setState] = useState<Omit<SubscriptionState, 'refresh'>>(() => {
    if (isAdminEmail) {
      const startedAt = new Date();
      const expiresAt = new Date(startedAt);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      return {
        isPremium: true,
        loading: false,
        plano: 'anual',
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        source: 'play',
        status: 'SUBSCRIPTION_STATE_ACTIVE',
        isAdminOverride: true,
      };
    }
    if (cacheKey && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw);
          return { ...cached, loading: true };
        }
      } catch { /* ignore */ }
    }
    return { isPremium: false, loading: true, plano: null, expiresAt: null, startedAt: null, source: null, status: null, isAdminOverride: false };
  });
  const persist = useCallback((s: Omit<SubscriptionState, 'refresh'>) => {
    setState(s);
    if (cacheKey && typeof localStorage !== 'undefined') {
      try { localStorage.setItem(cacheKey, JSON.stringify({ ...s, loading: false })); } catch { /* ignore */ }
    }
  }, [cacheKey]);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce(n => n + 1), []);
  const pollActivated = useRef(false);

  useEffect(() => {
    if (!user) {
      setState({ isPremium: false, loading: false, plano: null, expiresAt: null, startedAt: null, source: null, status: null, isAdminOverride: false });
      return;
    }
    // Offline: mantém o snapshot em cache (já hidratado no useState).
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const fetchOnce = async (skipStoreSync = false): Promise<boolean> => {
      try {
      // 0) Checagem de cancelamento — se o usuário cancelou, rebaixa para gratuito
      //    mesmo se for admin (permite o admin testar o fluxo de cancelamento).
      const { data: canceled } = await supabase
        .from('assinatura_cancelamentos' as any)
        .select('canceled_at')
        .eq('user_id', user.id)
        .maybeSingle();

      // Atalho por e-mail: administradores recebem Premium Anual iniciado hoje
      // (incondicional — ignora cancelamentos e falhas de rede).
      const email = (user.email || '').toLowerCase();
      if (ADMIN_EMAILS.has(email)) {
        const startedAt = new Date();
        const expiresAt = new Date(startedAt);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        persist({
          isPremium: true,
          loading: false,
          plano: 'anual',
          startedAt: startedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          source: 'play',
          status: 'SUBSCRIPTION_STATE_ACTIVE',
          isAdminOverride: true,
        });
        return true;
      }
      if (cancelled) return true;

      // 1) Google Play (play_subscriptions) — fonte real usada por is_premium_user()
      const nowIso = new Date().toISOString();
      const { data: play } = await supabase
        .from('play_subscriptions')
        .select('product_id, status, expires_at')
        .eq('user_id', user.id)
        .in('status', ACTIVE_STATUSES)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return true;
      if (play) {
        persist({
          isPremium: true, loading: false,
          plano: play.product_id, expiresAt: play.expires_at, startedAt: null, source: 'play',
          status: play.status as string,
          isAdminOverride: false,
        });
        return true;
      }

      // 2) Apple App Store (apple_subscriptions)
      const { data: apple } = await supabase
        .from('apple_subscriptions')
        .select('product_id, status, expires_at, start_time')
        .eq('user_id', user.id)
        .in('status', ['active', 'in_grace'])
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return true;
      if (apple) {
        persist({
          isPremium: true, loading: false,
          plano: apple.product_id, expiresAt: apple.expires_at, startedAt: apple.start_time, source: 'apple',
          status: apple.status as string,
          isAdminOverride: false,
        });
        return true;
      }

      // 3) Assinantes migrados do app antigo (vitalícios e mensais via Asaas)
      const { data: legado } = await supabase
        .from('asaas_subscriptions' as any)
        .select('plano, status, expires_at, started_at')
        .eq('user_id', user.id)
        .in('status', ['ACTIVE', 'ACTIVE_GRACE'])
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .limit(1)
        .maybeSingle();

      if (cancelled) return true;
      if (legado) {
        const l = legado as any;
        persist({
          isPremium: true, loading: false,
          plano: l.plano, expiresAt: l.expires_at, startedAt: l.started_at, source: 'asaas',
          status: l.status as string,
          isAdminOverride: false,
        });
        return true;
      }

      // 4) Sem plano: tenta resgatar (1× por sessão) uma assinatura do app antigo
      //    ligada a este e-mail e revalida.
      if (!skipStoreSync && !claimedOnce.has(user.id)) {
        claimedOnce.add(user.id);
        try {
          const { data: claimed } = await supabase.rpc('claim_my_legacy_subscription' as any);
          if (cancelled) return true;
          if (claimed === true) return fetchOnce(true);
        } catch { /* ignore */ }
      }

      // 5) Nada no banco: antes de rebaixar para gratuito, revalida em silêncio
      //    as compras que o aparelho possui na loja (cobre renovações cuja
      //    notificação do Google/Apple não chegou a gravar).
      if (!skipStoreSync) {
        try {
          const { isBillingAvailable, syncEntitlements } = await import('@/lib/billing');
          if (isBillingAvailable()) {
            const synced = await syncEntitlements();
            if (cancelled) return true;
            if (synced > 0) return fetchOnce(true);
          }
        } catch { /* ignore */ }
      }

      persist({
        isPremium: false, loading: false, plano: null, expiresAt: null, startedAt: null,
        source: null, status: null, isAdminOverride: false,
      });
      return false;
      } catch {
        // Rede caiu no meio do fetch: mantém o snapshot em cache visível.
        setState(prev => ({ ...prev, loading: false }));
        return true;
      }
    };

    (async () => {
      const found = await fetchOnce();
      // Polling curto para cobrir latência entre validate-purchase e leitura
      if (!found && pollOnMount && !pollActivated.current) {
        pollActivated.current = true;
        const tick = async () => {
          if (cancelled) return;
          attempts += 1;
          const ok = await fetchOnce();
          if (!ok && attempts < 6 && !cancelled) {
            pollTimer = setTimeout(tick, 1000);
          }
        };
        pollTimer = setTimeout(tick, 1000);
      }
    })();

    // Realtime: qualquer INSERT/UPDATE em play_subscriptions ou apple_subscriptions
    // do usuário atual dispara re-fetch imediato (sem esperar polling).
    // Nome único por instância evita reuso do canal já `subscribed` em StrictMode/re-mount
    const channel = supabase
      .channel(`sub-${user.id}-${Math.random().toString(36).slice(2, 10)}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'play_subscriptions', filter: `user_id=eq.${user.id}` }, () => { fetchOnce(); })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'apple_subscriptions', filter: `user_id=eq.${user.id}` }, () => { fetchOnce(); })
      .subscribe();

    // Ao voltar do segundo plano: revalida com a loja e reconsulta. Cobre
    // renovações e o caso de concluir a compra fora do app.
    let removeAppListener: (() => void) | null = null;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('appStateChange', async ({ isActive }) => {
          if (!isActive || cancelled) return;
          try {
            const { syncEntitlements } = await import('@/lib/billing');
            await syncEntitlements();
          } catch { /* ignore */ }
          if (!cancelled) fetchOnce(true);
        });
        removeAppListener = () => { handle.remove(); };
      } catch { /* plugin ausente: ignora */ }
    })();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (removeAppListener) removeAppListener();
      supabase.removeChannel(channel);
    };
  }, [user, nonce, pollOnMount]);

  // GA4: dispara `assinatura_ativada` na primeira vez que o Premium fica ativo
  // (ignora admin override para evitar ruído em contas internas).
  useEffect(() => {
    if (!state.isPremium || state.loading || state.isAdminOverride) return;
    if (wasPremium.current) return;
    wasPremium.current = true;
    import('@/lib/appEvents').then(({ appEvents }) =>
      appEvents.assinaturaAtivada({ plano: state.plano, source: state.source })
    ).catch(() => {});
  }, [state.isPremium, state.loading, state.isAdminOverride, state.plano, state.source]);

  return { ...state, refresh };
}
