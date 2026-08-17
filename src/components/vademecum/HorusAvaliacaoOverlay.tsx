import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldAlert } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { checkHorusAvaliacaoEligibility, requestReviewNow } from '@/lib/inAppReview';
import horusAgentImg from '@/assets/horus/horus-owl.webp';

export function HorusAvaliacaoOverlay() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check eligibility when component mounts (app start)
    checkHorusAvaliacaoEligibility().then((eligible) => {
      if (eligible) {
        setShow(true);
        logEvent('view');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logEvent = async (action: 'view' | 'click') => {
    try {
      if (!user) return;
      const displayName =
        (user.user_metadata as any)?.display_name ??
        (user.user_metadata as any)?.full_name ??
        user.email?.split('@')[0] ?? null;

      await supabase.from('app_feedback' as any).insert({
        user_id: user.id,
        email: user.email || null,
        display_name: displayName,
        comentario: `[Hórus Avaliação] - ${action}`,
        tag: `horus_avaliacao_${action}`,
        platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
      });
    } catch {
      // silencioso
    }
  };

  const handleAvaliar = async () => {
    setSubmitting(true);
    await logEvent('click');

    if (Capacitor.isNativePlatform()) {
      await requestReviewNow();
    }
    
    // Libera a pessoa de usar o app
    setShow(false);
    setSubmitting(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="max-w-sm w-full space-y-6">
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.2 }}
            className="mx-auto relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/20"
          >
            <img src={horusAgentImg} alt="Hórus" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <ShieldAlert className="absolute bottom-2 right-2 w-5 h-5 text-primary" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <h2 className="font-display text-2xl font-bold text-foreground">
              Sua vez de contribuir!
            </h2>
            <p className="font-body text-[15px] text-muted-foreground leading-relaxed">
              Vejo que você tem utilizado bastante o Direito Prime. Nossa plataforma cresce com a força da comunidade. 
              Avalie o app na loja para continuarmos evoluindo!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-4"
          >
            <button
              onClick={handleAvaliar}
              disabled={submitting}
              className="w-full relative group overflow-hidden rounded-2xl bg-primary text-primary-foreground font-body font-bold text-[15px] py-4 shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Star className="w-5 h-5 fill-primary-foreground" />
              {submitting ? 'Abrindo...' : 'Avaliar o Aplicativo'}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
