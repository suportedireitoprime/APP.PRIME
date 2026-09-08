import { useState, useEffect, startTransition } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsDesktop } from '@/hooks/use-desktop';
import { supabase } from '@/integrations/supabase/client';
import { AuthAjudaSheet } from '@/components/auth/AuthAjudaSheet';
import { AuthDecorations } from '@/components/auth/AuthDecorations';
import { AuthDrawer, type AuthMode } from '@/components/auth/AuthDrawer';
import { AuthDesktopHero } from '@/components/auth/AuthDesktopHero';
import { AuthMobileHero } from '@/components/auth/AuthMobileHero';
import { GoogleOneTap } from '@/components/auth/GoogleOneTap';

const Auth = () => {
  const { user, loading } = useAuth();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const [drawerMode, setDrawerMode] = useState<AuthMode>(null);
  const [ajudaOpen, setAjudaOpen] = useState(false);

  // Redireciona usuário autenticado via startTransition
  useEffect(() => {
    if (!loading && user) {
      const cacheKey = `onboarding_completed:${user.id}`;
      const isCompleted = localStorage.getItem(cacheKey) === '1';
      
      if (isCompleted) {
        startTransition(() => navigate('/', { replace: true }));
      } else {
        import('idb-keyval').then(({ get }) => {
          get(cacheKey).then((val) => {
             if (val === '1' || val === true) {
               try { localStorage.setItem(cacheKey, '1'); } catch {}
               startTransition(() => navigate('/', { replace: true }));
             } else {
               startTransition(() => navigate('/onboarding', { replace: true }));
             }
          }).catch(() => {
             startTransition(() => navigate('/onboarding', { replace: true }));
          });
        }).catch(() => {
           startTransition(() => navigate('/onboarding', { replace: true }));
        });
      }
    }
  }, [loading, user, navigate]);

  // Se for nativo (Android/iOS), registra listener para sucesso de autenticação nativa
  useEffect(() => {
    if (Capacitor.isNativePlatform() && !user) {
      let isSubscribed = true;
      let authHandle: { remove: () => void } | null = null;
      
      import('@/plugins/NativeAuthPlugin').then(({ NativeAuth }) => {
        NativeAuth.addListener('onAuthSuccess', async (data) => {
          if (data?.session) {
            try {
              const sessionObj =
                typeof data.session === 'string' ? JSON.parse(data.session) : data.session;
              if (sessionObj?.access_token && sessionObj?.refresh_token) {
                await supabase.auth.setSession({
                  access_token: sessionObj.access_token,
                  refresh_token: sessionObj.refresh_token,
                });
              }
            } catch (e) {
              console.warn('[Auth] Erro ao restaurar sessão nativa:', e);
            }
            startTransition(() => {
              navigate('/', { replace: true });
            });
          }
        }).then((h) => {
          if (!isSubscribed) {
            h?.remove?.();
          } else {
            authHandle = h;
          }
        });

        NativeAuth.openAuth({ mode: 'login' }).then(async (res) => {
          if (res?.success && res.session) {
            try {
              const sessionObj =
                typeof res.session === 'string' ? JSON.parse(res.session) : res.session;
              if (sessionObj?.access_token && sessionObj?.refresh_token) {
                await supabase.auth.setSession({
                  access_token: sessionObj.access_token,
                  refresh_token: sessionObj.refresh_token,
                });
              }
            } catch (e) {
              console.warn('[Auth] Erro ao restaurar sessão nativa:', e);
            }
            startTransition(() => {
              navigate('/', { replace: true });
            });
          }
        }).catch(() => {});
      }).catch(() => {});

      return () => {
        isSubscribed = false;
        authHandle?.remove?.();
      };
    }
  }, [navigate, user]);

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

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[#0d0f12]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (user) return null;

  return (
    <main className="min-h-dvh w-full relative flex flex-col bg-[#0d0f12] overflow-hidden">
      {isDesktop ? (
        <AuthDesktopHero />
      ) : (
        <AuthMobileHero
          onOpenDrawer={setDrawerMode}
          onOpenAjuda={() => setAjudaOpen(true)}
        />
      )}

      <AuthDecorations />

      {/* Botão de voltar */}
      <button
        onClick={() => navigate('/landing')}
        aria-label="Voltar"
        className="absolute top-[calc(var(--sai-top,0px)+1.25rem)] left-[calc(var(--sai-left,0px)+1rem)] z-20 w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition active:scale-95 touch-manipulation"
      >
        <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
      </button>

      <AuthDrawer
        mode={drawerMode}
        setMode={setDrawerMode}
        onClose={() => setDrawerMode(null)}
      />

      <AuthAjudaSheet open={ajudaOpen} onClose={() => setAjudaOpen(false)} />

      {!Capacitor.isNativePlatform() && <GoogleOneTap />}
    </main>
  );
};

export default Auth;

