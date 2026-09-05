import React from 'react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import authJudgeScene from '@/assets/auth-judge-scene.jpeg';
import type { AuthMode } from './AuthDrawer';

interface AuthMobileHeroProps {
  onOpenDrawer: (mode: AuthMode) => void;
  onOpenAjuda: () => void;
}

export const AuthMobileHero: React.FC<AuthMobileHeroProps> = ({
  onOpenDrawer,
  onOpenAjuda,
}) => {
  const navigate = useNavigate();

  const handleNativeOrDrawer = async (mode: 'login' | 'signup') => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { NativeAuth } = await import('@/plugins/NativeAuthPlugin');
        const res = await NativeAuth.openAuth({ mode });
        if (res?.success && res.session) {
          try {
            const sessionObj =
              typeof res.session === 'string' ? JSON.parse(res.session) : res.session;
            if (sessionObj?.access_token && sessionObj?.refresh_token) {
              await supabase.auth.setSession({
                access_token: sessionObj.access_token,
                refresh_token: sessionObj.refresh_token,
              });
              navigate('/', { replace: true });
              return;
            }
          } catch (e) {
            console.warn('[Auth] Erro ao restaurar sessão nativa:', e);
          }
        }
        if (!res?.success && !res?.cancelled) {
          onOpenDrawer(mode);
        }
      } catch (err) {
        console.warn('[NativeAuth] Erro no plugin nativo, abrindo gaveta React:', err);
        onOpenDrawer(mode);
      }
      return;
    }
    onOpenDrawer(mode);
  };

  return (
    <>
      {/* Background Image Mobile */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={authJudgeScene}
          alt="Tribunal de Justiça"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent h-[40%] top-auto" />
      </div>

      <div className="relative z-10 w-full pt-[calc(var(--sai-top,0px)+4rem)] px-6 text-center flex-1 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4"
        >
          {/* Logo e Tipografia */}
          <div className="flex flex-col items-center justify-center gap-4">
            <img
              src="/logo-prime.png"
              alt="Logo Direito Prime"
              className="w-24 h-24 xl:w-32 xl:h-32 object-contain drop-shadow-2xl relative z-10"
            />

            <div className="flex flex-col items-center justify-center gap-1 mt-1 w-full">
              <h1 className="font-serif italic font-bold text-[28px] text-white tracking-tight leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] whitespace-nowrap">
                Estudos Jurídicos
              </h1>
              <span className="font-sans font-medium text-white/90 text-[10px] tracking-[0.3em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] whitespace-nowrap">
                Estudo Profissional
              </span>
            </div>
          </div>

          <p className="font-body text-white/95 text-base leading-snug font-medium max-w-[300px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mt-2 bg-black/30 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/10">
            Todo o conhecimento jurídico que você precisa reunido em{' '}
            <span className="text-primary font-bold drop-shadow-md">uma única plataforma.</span>
          </p>
        </motion.div>

        {/* Área de Botões Inferiores */}
        <div className="w-full pb-[calc(var(--sai-bottom,0px)+2rem)] flex flex-col items-center justify-center gap-4 mt-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col gap-3 w-full"
          >
            <button
              onClick={() => handleNativeOrDrawer('login')}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-body font-bold text-[17px] shadow-[0_8px_32px_rgba(225,29,72,0.6)] active:scale-[0.98] transition-transform overflow-hidden relative shine-effect cursor-pointer"
            >
              <span className="relative z-10">Acessar conta</span>
            </button>

            <button
              onClick={() => handleNativeOrDrawer('signup')}
              className="w-full py-4 bg-black/40 backdrop-blur-lg border-2 border-white/20 text-white rounded-2xl font-body font-bold text-[17px] active:scale-[0.98] transition-all hover:bg-black/60 shadow-xl cursor-pointer"
            >
              Criar uma conta
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-2 text-center"
          >
            <button
              onClick={onOpenAjuda}
              className="inline-flex items-center gap-2 text-sm font-body text-white/70 hover:text-white transition-colors p-2 drop-shadow"
            >
              Precisa de ajuda?
              <HelpCircle className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
};
