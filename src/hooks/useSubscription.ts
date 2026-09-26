import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';

interface SubscriptionState {
  isPremium: boolean;
  loading: boolean;
  plano: string | null;
  expiresAt: string | null;
  startedAt: string | null;
  source: 'play' | 'apple' | 'asaas' | null;
  status: string | null;
  isAdminOverride: boolean;
  isTrial: boolean;
  refresh: () => void;
}

// Evita repetir o resgate de assinatura legada a cada montagem do hook.
const claimedOnce = new Set<string>();

// Cache compartilhado em memória para eliminar waterfalls e checagens redundantes a cada rota
interface CachedSubEntry {
  timestamp: number;
  data: Omit<SubscriptionState, 'refresh'>;
}
const subMemoryCache = new Map<string, CachedSubEntry>();
const inflightFetches = new Map<string, Promise<boolean>>();
const SUB_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos de validade em memória

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
  const cacheKey = user ? `direitoprime:sub:${user.id}` : null;
  const emailLower = (user?.email || '').toLowerCase();
  const isAdmin = isAdminEmail(emailLower);
  const [state, setState] = useState<Omit<SubscriptionState, 'refresh'>>(() => {
    if (isAdmin) {
      const startedAt = new Date();
      const expiresAt = new Date(startedAt);
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);
      return {
        isPremium: true,
        loading: false,
        plano: 'vitalício',
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        source: 'play',
        status: 'SUBSCRIPTION_STATE_ACTIVE',
        isAdminOverride: true,
        isTrial: false,
      };
    }
    // 1. Memória imediata (0ms)
    if (user && subMemoryCache.has(user.id)) {
      const mem = subMemoryCache.get(user.id)!;
      if (Date.now() - mem.timestamp < SUB_CACHE_TTL_MS) {
        return mem.data;
      }
    }
    // 2. LocalStorage (offline)
    if (cacheKey && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw);
          const isTooOld = Date.now() - (cached.__cache_timestamp || 0) > 48 * 60 * 60 * 1000;
          const isExpiredTrial = cached.isTrial && cached.expiresAt && new Date(cached.expiresAt).getTime() <= Date.now();
          if (!isTooOld && !isExpiredTrial) {
            return { ...cached, loading: true };
          } else {
            localStorage.removeItem(cacheKey);
          }
        }
      } catch { /* ignore */ }
    }
    return { isPremium: false, loading: true, plano: null, expiresAt: null, startedAt: null, source: null, status: null, isAdminOverride: false, isTrial: false };
  });
  const persist = useCallback((s: Omit<SubscriptionState, 'refresh'>) => {
    setState(s);
    if (user) {
      subMemoryCache.set(user.id, { timestamp: Date.now(), data: s });
    }
    if (cacheKey && typeof localStorage !== 'undefined') {
      try { localStorage.setItem(cacheKey, JSON.stringify({ ...s, loading: false, __cache_timestamp: Date.now() })); } catch { /* ignore */ }
    }
  }, [cacheKey, user]);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => {
    if (user) {
      subMemoryCache.delete(user.id);
      inflightFetches.delete(user.id);
    }
    setNonce(n => n + 1);
  }, [user]);
  const pollActivated = useRef(false);

  useEffect(() => {
    if (!user) {
      setState({ isPremium: false, loading: false, plano: null, expiresAt: null, startedAt: null, source: null, status: null, isAdminOverride: false, isTrial: false });
      return;
    }
    // Se já temos cache fresco em memória e não é polling forçado pós-compra nem refresh explícito, reutiliza sem fazer 5 queries
    if (!pollOnMount && nonce === 0 && subMemoryCache.has(user.id)) {
      const mem = subMemoryCache.get(user.id)!;
      if (Date.now() - mem.timestamp < SUB_CACHE_TTL_MS) {
        setState(mem.data);
        return;
      }
    }
    // Offline: mantém o snapshot em cache (já hidratado no useState), mas
    // valida estritamente a expiração do trial para evitar bypass desligando a rede (Item 32).
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState(prev => {
        if (prev.isTrial && prev.expiresAt) {
          const expiresMs = new Date(prev.expiresAt).getTime();
          const nowMs = Date.now();
          let maxKnownTime = nowMs;
          try {
            const saved = localStorage.getItem('direitoprime:time:max');
            if (saved) maxKnownTime = Math.max(nowMs, Number(saved));
          } catch {}

          if (nowMs >= expiresMs || maxKnownTime >= expiresMs) {
            return {
              ...prev,
              isPremium: false,
              loading: false,
              plano: null,
              isTrial: false,
              status: 'EXPIRED',
            };
          }
        }
        return { ...prev, loading: false };
      });
      return;
    }
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const fetchOnce = async (skipStoreSync = false): Promise<boolean> => {
      try {
        const nowIso = new Date().toISOString();

        // 1. Paralelizar a busca de cancelamentos e das assinaturas ativas em todas as lojas
        const [cancelRes, playRes, appleRes, legadoRes, profileRes] = await Promise.all([
          supabase.from('assinatura_cancelamentos' as any).select('canceled_at').eq('user_id', user.id).maybeSingle(),
          supabase.from('play_subscriptions').select('product_id, status, expires_at').eq('user_id', user.id).in('status', ACTIVE_STATUSES).or(`expires_at.is.null,expires_at.gt.${nowIso}`).order('expires_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('apple_subscriptions').select('product_id, status, expires_at, start_time').eq('user_id', user.id).in('status', ['active', 'in_grace']).or(`expires_at.is.null,expires_at.gt.${nowIso}`).order('expires_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('asaas_subscriptions' as any).select('plano, status, expires_at, started_at').eq('user_id', user.id).in('status', ['ACTIVE', 'ACTIVE_GRACE']).or(`expires_at.is.null,expires_at.gt.${nowIso}`).limit(1).maybeSingle(),
          supabase.from('profiles').select('is_premium').eq('id', user.id).maybeSingle()
        ]);

        if (cancelled) return true;

        // 2. Atalho incondicional para administradores
        const email = (user.email || '').toLowerCase();
        if (isAdminEmail(email)) {
          const startedAt = new Date();
          const expiresAt = new Date(startedAt);
          expiresAt.setFullYear(expiresAt.getFullYear() + 100);
          persist({
            isPremium: true, loading: false, plano: 'vitalício', startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), source: 'play', status: 'SUBSCRIPTION_STATE_ACTIVE', isAdminOverride: true, isTrial: false,
          });
          return true;
        }

        // 3. Avaliar as respostas em ordem de prioridade (Lojas primeiro: Play Store, Apple, Asaas - Item 28)
        if (playRes.data) {
          persist({
            isPremium: true, loading: false,
            plano: playRes.data.product_id, expiresAt: playRes.data.expires_at, startedAt: null, source: 'play',
            status: playRes.data.status as string, isAdminOverride: false, isTrial: false,
          });
          return true;
        }

        if (appleRes.data) {
          persist({
            isPremium: true, loading: false,
            plano: appleRes.data.product_id, expiresAt: appleRes.data.expires_at, startedAt: appleRes.data.start_time, source: 'apple',
            status: appleRes.data.status as string, isAdminOverride: false, isTrial: false,
          });
          return true;
        }

        if (legadoRes.data) {
          const l = legadoRes.data as any;
          persist({
            isPremium: true, loading: false,
            plano: l.plano, expiresAt: l.expires_at, startedAt: l.started_at, source: 'asaas',
            status: l.status, isAdminOverride: false, isTrial: false,
          });
          return true;
        }

        // 3.1. Fallback de Segurança Máxima: se profiles.is_premium for true, garante que o usuário nunca seja bloqueado
        if (profileRes.data?.is_premium) {
          const { data: legacyRow } = await supabase.from('legacy_subscribers' as any)
            .select('tipo, expires_at, created_at')
            .or(`claimed_user_id.eq.${user.id},email.ilike.${user.email || ''}`)
            .limit(1).maybeSingle();

          const planoFallback = (legacyRow as any)?.tipo || 'anual';
          persist({
            isPremium: true, loading: false,
            plano: planoFallback, expiresAt: (legacyRow as any)?.expires_at ?? null, startedAt: (legacyRow as any)?.created_at ?? null, source: 'asaas',
            status: 'ACTIVE', isAdminOverride: false, isTrial: false,
          });
          return true;
        }

        // 4. Se não há assinatura de loja ativa, verifica período de teste (Trial de 3 dias)
        // com proteção anti-fraude contra manipulação do relógio local (Item 26),
        // capping estrito contra manipulação de user_metadata.trial_ends_at (Item 27)
        // e prevenção contra criação de múltiplas contas no mesmo dispositivo (Item 31).
        const createdAt = new Date(user.created_at);
        const maxAllowedTrialMs = createdAt.getTime() + 3 * 24 * 60 * 60 * 1000;
        let trialEndsAt = new Date(maxAllowedTrialMs);

        if (user.user_metadata?.trial_ends_at) {
          const metaTrial = new Date(user.user_metadata.trial_ends_at);
          if (!isNaN(metaTrial.getTime()) && metaTrial.getTime() <= maxAllowedTrialMs) {
            trialEndsAt = metaTrial;
          }
        }

        const nowMs = Date.now();
        let maxKnownTime = createdAt.getTime();
        try {
          const saved = localStorage.getItem('direitoprime:time:max');
          if (saved) maxKnownTime = Math.max(maxKnownTime, Number(saved));
        } catch {}

        const isClockTampered = nowMs < maxKnownTime;
        if (!isClockTampered) {
          try { localStorage.setItem('direitoprime:time:max', String(nowMs)); } catch {}
        }

        let isDeviceAbuse = false;
        try {
          const claimedUser = localStorage.getItem('direitoprime:device:trial_claimed');
          if (claimedUser && claimedUser !== user.id) {
            isDeviceAbuse = true;
          }
        } catch {}

        if (!isClockTampered && !isDeviceAbuse && trialEndsAt.getTime() > nowMs) {
          try {
            localStorage.setItem('direitoprime:device:trial_claimed', user.id);
            import('idb-keyval').then(({ set }) => set('direitoprime:device:trial_claimed', user.id)).catch(() => {});
          } catch {}

          persist({
            isPremium: true, loading: false, plano: 'Teste de 3 Dias', startedAt: createdAt.toISOString(), expiresAt: trialEndsAt.toISOString(), source: null, status: 'SUBSCRIPTION_STATE_ACTIVE', isAdminOverride: false, isTrial: true,
          });
          return true;
        }

        if (cancelRes.data) {
          persist({
            isPremium: false, loading: false, plano: null, expiresAt: null, startedAt: null,
            source: null, status: 'CANCELED', isAdminOverride: false, isTrial: false,
          });
          return true;
        }

        // 4. Sem plano: tenta resgatar (1× por sessão) uma assinatura do app antigo
        if (!skipStoreSync && !claimedOnce.has(user.id)) {
          claimedOnce.add(user.id);
          try {
            const { data: claimed } = await supabase.rpc('claim_my_legacy_subscription' as any);
            if (cancelled) return true;
            if (claimed === true) return fetchOnce(true);
          } catch { /* ignore */ }
        }

        // 5. Nada no banco: antes de rebaixar para gratuito, revalida em silêncio compras offline da loja
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

        // 6. Nenhuma assinatura encontrada
        persist({
          isPremium: false, loading: false, plano: null, expiresAt: null, startedAt: null,
          source: null, status: null, isAdminOverride: false, isTrial: false,
        });
        return false;

      } catch (err) {
        if (cancelled) return true;
        // Rede caiu no meio do fetch: mantém o snapshot em cache visível.
        setState(prev => ({ ...prev, loading: false }));
        return true;
      }
    };

    void (async () => {
      try {
        let found = false;
        if (inflightFetches.has(user.id)) {
          found = await inflightFetches.get(user.id)!;
          if (cancelled) return;
          if (subMemoryCache.has(user.id)) {
            setState(subMemoryCache.get(user.id)!.data);
          }
        } else {
          const fetchPromise = fetchOnce();
          inflightFetches.set(user.id, fetchPromise);
          try {
            found = await fetchPromise;
          } finally {
            inflightFetches.delete(user.id);
          }
        }
        if (cancelled) return;
        // Polling curto para cobrir latência entre validate-purchase e leitura
        if (!found && pollOnMount && !pollActivated.current) {
          pollActivated.current = true;
          const tick = async () => {
            if (cancelled) return;
            attempts += 1;
            const ok = await fetchOnce();
            if (!ok && attempts < 6 && !cancelled) {
              pollTimer = setTimeout(() => void tick().catch(console.error), 1000);
            }
          };
          pollTimer = setTimeout(() => void tick().catch(console.error), 1000);
        }
      } catch (err) {
        console.error('Erro não tratado no fetch de subscription:', err);
      }
    })();

    // Realtime: qualquer INSERT/UPDATE em play_subscriptions, apple_subscriptions,
    // asaas_subscriptions, profiles ou legacy_subscribers dispara re-fetch imediato.
    const channel = supabase
      .channel(`sub-${user.id}-${Math.random().toString(36).slice(2, 10)}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'play_subscriptions', filter: `user_id=eq.${user.id}` }, () => { void fetchOnce(); })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'apple_subscriptions', filter: `user_id=eq.${user.id}` }, () => { void fetchOnce(); })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'asaas_subscriptions', filter: `user_id=eq.${user.id}` }, () => { void fetchOnce(); })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => { void fetchOnce(); })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'legacy_subscribers', filter: `claimed_user_id=eq.${user.id}` }, () => { void fetchOnce(); })
      .subscribe();

    // Ao voltar do segundo plano: revalida com a loja e reconsulta. Cobre
    // renovações e o caso de concluir a compra fora do app.
    let removeAppListener: (() => void) | null = null;
    void (async () => {
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
          if (!cancelled) void fetchOnce(true).catch(console.error);
        });
        removeAppListener = () => { handle.remove(); };
      } catch { /* plugin ausente: ignora */ }
    })().catch(console.error);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (removeAppListener) removeAppListener();
      supabase.removeChannel(channel);
    };
  }, [user, nonce, pollOnMount]);

  // GA4 / Telemetria: dispara `assinatura_ativada` na primeira vez que o Premium fica ativo
  // Deduplicado via sessionStorage e ref para não poluir app_events com remontagens.
  useEffect(() => {
    if (!state.isPremium || state.loading || state.isAdminOverride) return;
    if (wasPremium.current) return;
    
    const sessKey = `direitoprime:sub_event:${user?.id}:${state.plano}`;
    if (typeof window !== 'undefined') {
      try {
        if (window.sessionStorage.getItem(sessKey)) {
          wasPremium.current = true;
          return;
        }
        window.sessionStorage.setItem(sessKey, '1');
      } catch {}
    }

    wasPremium.current = true;
    import('@/lib/appEvents').then(({ appEvents }) =>
      appEvents.assinaturaAtivada({ plano: state.plano, source: state.source })
    ).catch(() => {});
  }, [state.isPremium, state.loading, state.isAdminOverride, state.plano, state.source, user?.id]);

  return { ...state, refresh };
}
