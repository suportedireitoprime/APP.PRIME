import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldAlert } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { checkHorusAvaliacaoEligibility, requestReviewNow } from '@/lib/inAppReview';
import horusStarImg from '@/assets/horus/horus-star.webp';
import tecladoSfx from '@/assets/teclado.mp3';

const TypewriterText = ({ text, onComplete }: { text: string, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    const audio = new Audio(tecladoSfx);
    audio.volume = 0.3;
    audio.loop = true;
    
    // Attempt to play audio
    audio.play().catch(() => {
      // User hasn't interacted with document yet, ignore
    });

    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index));
      index++;
      if (index > text.length) {
        clearInterval(interval);
        audio.pause();
        if (onComplete) onComplete();
      }
    }, 40);

    return () => {
      clearInterval(interval);
      audio.pause();
    };
  }, [text, onComplete]);

  return <>{displayedText}</>;
};

export function HorusAvaliacaoOverlay() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showButton, setShowButton] = useState(false);

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

  const logEvent = async (action: 'view' | 'click' | 'dismiss') => {
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
        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-6"
      >
        <motion.div 
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-w-[340px] w-full space-y-5 bg-[#111111] p-5 rounded-[2rem] border border-white/10 shadow-2xl relative text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.2 }}
            className="mx-auto relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/20 -mt-12 bg-[#1a1a1a]"
          >
            <img src={horusStarImg} alt="Hórus" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <ShieldAlert className="absolute bottom-2 right-4 w-4 h-4 text-primary" />
          </motion.div>

          <div className="space-y-2 px-2">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-display text-xl font-bold text-foreground"
            >
              Sua vez de contribuir!
            </motion.h2>
            <p className="font-body text-[14px] text-muted-foreground/90 leading-relaxed min-h-[60px] flex items-center justify-center">
              <TypewriterText 
                text="Vejo que você tem utilizado bastante o Direito Prime. Avalie o app na loja para continuarmos evoluindo!" 
                onComplete={() => setShowButton(true)}
              />
            </p>
          </div>

          <AnimatePresence>
            {showButton && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="pt-2"
              >
                <button
                  onClick={handleAvaliar}
                  disabled={submitting}
                  className="w-full relative group overflow-hidden rounded-xl bg-primary text-primary-foreground font-body font-bold text-[14px] py-3 shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Star className="w-4 h-4 fill-primary-foreground" />
                  {submitting ? 'Abrindo...' : 'Avaliar o Aplicativo'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
