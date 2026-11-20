import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Global presence state mantido para compatibilidade
const presenceState: Record<string, any[]> = {};

export function getPresenceState() {
  return presenceState;
}

export function usePresenceTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeRef = useRef(location.pathname);

  // Keep routeRef in sync
  useEffect(() => {
    routeRef.current = location.pathname;
  }, [location.pathname]);

  // Heartbeat no Postgres (user_activity_log) a cada 30 segundos com proteção estrita de visibilidade e sessão
  useEffect(() => {
    if (!user?.id) return;

    let isDisposed = false;

    const upsert = async () => {
      if (isDisposed) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.access_token) {
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

    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      startHeartbeat();
    }

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
    };
  }, [user?.id, user?.email, user?.user_metadata]);
}
