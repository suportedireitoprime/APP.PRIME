import { useState, useEffect, startTransition, lazy, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsDesktop } from '@/hooks/use-desktop';
import { supabase } from '@/integrations/supabase/client';
import { isAdminEmail } from '@/lib/adminEmails';
import type { AuthMode } from '@/components/auth/AuthDrawer';
import { GoogleOneTap } from '@/components/auth/GoogleOneTap';

const AuthDesktopHero = lazy(() =>
  import('@/components/auth/AuthDesktopHero').then((m) => ({ default: m.AuthDesktopHero })),
);
const AuthMobileHero = lazy(() =>
  import('@/components/auth/AuthMobileHero').then((m) => ({ default: m.AuthMobileHero })),
);
const AuthDrawer = lazy(() =>
  import('@/components/auth/AuthDrawer').then((m) => ({ default: m.AuthDrawer })),
);
const AuthAjudaSheet = lazy(() =>
  import('@/components/auth/AuthAjudaSheet').then((m) => ({ default: m.AuthAjudaSheet })),
);

async function restoreNativeSession(rawSession: unknown): Promise<void> {
  try {
    const sessionObj = typeof rawSession === 'string' ? JSON.parse(rawSession) : rawSession;
    const access_token = (sessionObj as { access_token?: string })?.access_token;
    const refresh_token = (sessionObj as { refresh_token?: string })?.refresh_token;
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  } catch (e) {
    console.warn('[Auth] Erro ao restaurar sessão nativa:', e);
  }
}

const Auth = () => {
  const { user, loading } = useAuth();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerMode, setDrawerMode] = useState<AuthMode>(null);
  const [ajudaOpen, setAjudaOpen] = useState(false);

  // Redireciona usuário autenticado via startTransition com guard de unmount
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    const cacheKey = `onboarding_completed:${user.id}`;

    const go = (path: '/' | '/onboarding') => {
      if (!cancelled) {
        startTransition(() => navigate(path, { replace: true }));
      }
    };

    const checkDbOnboarding = async () => {
      try {
        if (isAdminEmail(user.email)) {
          try { localStorage.setItem(cacheKey, '1'); } catch {}
          import('idb-keyval').then(({ set }) => set(cacheKey, '1')).catch(() => {});
          void supabase.from('profiles').update({ onboarding_completed_at: new Date().toISOString() }).eq('id', user.id);
          go('/');
          return;
        }
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed_at')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled) return;
        if (data?.onboarding_completed_at) {
          try { localStorage.setItem(cacheKey, '1'); } catch {}
          import('idb-keyval').then(({ set }) => set(cacheKey, '1')).catch(() => {});
          go('/');
        } else {
          go('/onboarding');
        }
      } catch {
        go('/onboarding');
      }
    };

    if (localStorage.getItem(cacheKey) === '1') {
      go('/');
      return () => { cancelled = true; };
    }

    import('idb-keyval')
      .then(({ get }) => get(cacheKey))
      .then((val) => {
        if (cancelled) return;
        if (val === '1' || val === true) {
          try { localStorage.setItem(cacheKey, '1'); } catch {}
          go('/');
        } else {
          void checkDbOnboarding();
        }
      })
      .catch(() => {
        void checkDbOnboarding();
      });

    return () => { cancelled = true; };
  }, [loading, user, navigate]);

  // Se for nativo (Android/iOS), registra listener para sucesso de autenticação nativa
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || user) return;
    let isSubscribed = true;
    let authHandle: { remove: () => void } | null = null;

    import('@/plugins/NativeAuthPlugin')
      .then(({ NativeAuth }) => {
        if (!isSubscribed) return;
        NativeAuth.addListener('onAuthSuccess', async (data) => {
          if (!isSubscribed || !data?.session) return;
          await restoreNativeSession(data.session);
          if (isSubscribed) {
            startTransition(() => navigate('/', { replace: true }));
          }
        })
          .then((h) => {
            if (!isSubscribed) h?.remove?.();
            else authHandle = h;
          })
          .catch((err) => {
            console.warn('[Auth] NativeAuth.addListener não disponível:', err);
          });

        const autoMode = (location.state as { autoOpenMode?: 'login' | 'signup' } | null)?.autoOpenMode;
        if (autoMode) {
          NativeAuth.openAuth({ mode: autoMode })
            .then(async (res) => {
              if (!isSubscribed || !res?.success || !res.session) return;
              await restoreNativeSession(res.session);
              if (isSubscribed) {
                startTransition(() => navigate('/', { replace: true }));
              }
            })
            .catch((err) => {
              console.warn('[Auth] NativeAuth.openAuth não disponível:', err);
            });
        }
      })
      .catch((err) => {
        console.warn('[Auth] Falha ao carregar NativeAuthPlugin:', err);
      });

    return () => {
      isSubscribed = false;
      authHandle?.remove?.();
    };
  }, [navigate, user, location.state]);

  // Pré-aquece a Home/Dashboard apenas após o pico inicial de carregamento e Splash
  useEffect(() => {
    const timer = setTimeout(() => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number };
      const ric: (cb: () => void) => number = w.requestIdleCallback
        ? (cb) => w.requestIdleCallback!(cb, { timeout: 2000 })
        : (cb) => setTimeout(cb, 500) as unknown as number;

      ric(() => {
        import('@/pages/Index').catch(() => {});
        import('@/pages/IndexMobile').catch(() => {});
        import('@/components/vademecum/home/HomeHeaderHero').catch(() => {});
        import('@/components/vademecum/home/MobileHomeSections').catch(() => {});
      });
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  if (loading || user) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[#0d0f12]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh w-full relative flex flex-col bg-[#0d0f12] overflow-hidden">
      <Suspense fallback={<div className="min-h-dvh w-full bg-[#0d0f12]" />}>
        {isDesktop ? (
          <AuthDesktopHero />
        ) : (
          <AuthMobileHero
            onOpenDrawer={setDrawerMode}
            onOpenAjuda={() => setAjudaOpen(true)}
          />
        )}
      </Suspense>

      {/* Botão de voltar */}
      <button
        type="button"
        onClick={() => {
          if (ajudaOpen) {
            setAjudaOpen(false);
            return;
          }
          if (drawerMode) {
            setDrawerMode(null);
            return;
          }
          navigate('/landing', { replace: true });
        }}
        aria-label="Voltar"
        className="absolute top-[calc(var(--sai-top,0px)+1.25rem)] left-[calc(var(--sai-left,0px)+1rem)] z-20 w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition active:opacity-70 touch-manipulation cursor-pointer"
      >
        <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
      </button>

      <Suspense fallback={null}>
        {drawerMode !== null && (
          <AuthDrawer
            mode={drawerMode}
            setMode={setDrawerMode}
            onClose={() => setDrawerMode(null)}
          />
        )}
        {ajudaOpen && <AuthAjudaSheet open={ajudaOpen} onClose={() => setAjudaOpen(false)} />}
      </Suspense>

      {!Capacitor.isNativePlatform() && <GoogleOneTap />}
    </main>
  );
};

export default Auth;
