import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Global presence state accessible by the admin monitor
let presenceState: Record<string, any[]> = {};

export function getPresenceState() {
  return presenceState;
}

export function usePresenceTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeRef = useRef(location.pathname);

  // Keep routeRef in sync without re-running the channel effect
  useEffect(() => {
    routeRef.current = location.pathname;
  }, [location.pathname]);

  // Update presence track when route changes (without recreating channel)
  useEffect(() => {
    if (!user) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

    if (channelRef.current) {
      channelRef.current.track({
        user_id: user.id,
        email: user.email ?? '',
        display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '',
        current_route: location.pathname,
        online_at: new Date().toISOString(),
      }).catch(() => {});
    }

    // Registra page_view somente com sessão ativa para evitar 401/42501 no Gateway e Postgres
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.access_token) return;
      supabase.from('app_events').insert({
        user_id: user.id,
        email: user.email ?? '',
        event_name: 'page_view',
        metadata: { route: location.pathname }
      }).then(() => {}, () => {});
    }).catch(() => {});
  }, [location.pathname, user]);

  // Connect channel and heartbeat once per user session
  useEffect(() => {
    if (!user?.id) return;

    let isDisposed = false;

    const payload = {
      user_id: user.id,
      email: user.email ?? '',
      display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '',
      current_route: routeRef.current,
      online_at: new Date().toISOString(),
    };

    // Realtime channel
    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        presenceState = channel.presenceState();
      })
      .subscribe(async (status) => {
        if (isDisposed) return;
        if (status === 'SUBSCRIBED') {
          await channel.track(payload).catch(() => {});
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Em caso de erro do Realtime (ex: rede oscilando ou token expirado), não tenta reconectar em loop frenético
          try {
            channel.untrack();
          } catch {}
        }
      });

    channelRef.current = channel;

    // Heartbeat: upsert activity log com proteção estrita de visibilidade e sessão
    const upsert = async () => {
      if (isDisposed) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.access_token) {
          // Sem sessão ativa: para o intervalo imediatamente para evitar flood de 401 no Gateway
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        const { error } = await supabase
          .from('user_activity_log')
          .upsert(
            {
              user_id: user.id,
              email: user.email ?? '',
              display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '',
              current_route: routeRef.current,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          // Se for erro de permissão ou token expirado, cancela o timer
          if (error.code === '401' || error.code === '42501' || error.message?.includes('JWT')) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      } catch {
        /* silencia erros de rede pontuais */
      }
    };

    const startHeartbeat = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      void upsert();
      intervalRef.current = setInterval(upsert, 30_000);
    };

    const stopHeartbeat = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Inicia heartbeat se visível
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      startHeartbeat();
    }

    // Pausa quando aba oculta / minimizada, retoma imediatamente ao focar
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isDisposed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      stopHeartbeat();
      if (channelRef.current) {
        try {
          channelRef.current.untrack();
          supabase.removeChannel(channelRef.current);
        } catch {}
        channelRef.current = null;
        presenceState = {};
      }
    };
  }, [user?.id]);
}
