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

const Auth = () => {
  const { user, loading } = useAuth();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const [drawerMode, setDrawerMode] = useState<AuthMode>(null);
  const [ajudaOpen, setAjudaOpen] = useState(false);

  // Redireciona usuário autenticado via startTransition
  useEffect(() => {
    if (!loading && user) {
      startTransition(() => {
        navigate('/', { replace: true });
      });
    }
  }, [loading, user, navigate]);

  // Se for nativo (Android/iOS), registra listener para sucesso de autenticação nativa
  useEffect(() => {
    if (Capacitor.isNativePlatform() && !user) {
      let handle: any;
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
            navigate('/', { replace: true });
          }
        }).then((h) => {
          handle = h;
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
            navigate('/', { replace: true });
          }
        }).catch(() => {});
      }).catch(() => {});

      return () => {
        handle?.remove?.();
      };
    }
  }, [navigate, user]);

  // Pré-aquece a Home/Dashboard assim que o usuário entra na tela de Auth
  useEffect(() => {
    const ric: (cb: () => void) => number = (window as any).requestIdleCallback
      ? (cb) => (window as any).requestIdleCallback(cb, { timeout: 2000 })
      : (cb) => window.setTimeout(cb, 500);

    const id = ric(() => {
      import('@/pages/Index').catch(() => {});
      import('@/pages/IndexMobile').catch(() => {});
      import('@/components/vademecum/home/HomeHeaderHero').catch(() => {});
      import('@/components/vademecum/home/MobileHomeSections').catch(() => {});
    });

    return () => {
      const cic = (window as any).cancelIdleCallback;
      if (cic) cic(id);
      else window.clearTimeout(id);
    };
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

      <AnimatePresence>
        {drawerMode && (
          <AuthDrawer
            mode={drawerMode}
            setMode={setDrawerMode}
            onClose={() => setDrawerMode(null)}
          />
        )}
      </AnimatePresence>

      <AuthAjudaSheet open={ajudaOpen} onClose={() => setAjudaOpen(false)} />
    </main>
  );
};

export default Auth;

