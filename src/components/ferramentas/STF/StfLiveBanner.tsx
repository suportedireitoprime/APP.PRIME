import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, X, Radio } from 'lucide-react';
import horusOwlAsset from '@/assets/horus/horus-owl.webp';
import { useAuth } from '@/hooks/useAuth';

const DISMISSED_KEY = 'stf_live_dismissed_session';

/** Floating particle that drifts upward */
const Particle = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute rounded-full bg-red-500/40"
    style={{ width: 3, height: 3, left: `${x}%`, bottom: 0 }}
    initial={{ y: 0, opacity: 0 }}
    animate={{ y: -220, opacity: [0, 0.8, 0] }}
    transition={{ duration: 3.5, delay, repeat: Infinity, ease: 'easeOut' }}
  />
);

export default function StfLiveBanner() {
  const [liveSession, setLiveSession] = useState<{ id: string; title: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [showCTA, setShowCTA] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Generate stable particle positions
  const particles = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: Math.random() * 3,
      x: 5 + Math.random() * 90
    })),
    []
  );

  const fetchLiveSession = async () => {
    const { data } = await supabase
      .from('stf_sessions')
      .select('id, title')
      .eq('status', 'live')
      .order('scheduled_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      // Check localStorage – only show once per session id
      const previouslyDismissed = localStorage.getItem(DISMISSED_KEY);
      if (previouslyDismissed === data.id) {
        setDismissed(true);
      }
      setLiveSession(data);
    } else {
      setLiveSession(null);
    }
  };

  useEffect(() => {
    fetchLiveSession();

    const channel = supabase
      .channel('stf_live_banner')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stf_sessions' },
        (_payload: unknown) => {
          fetchLiveSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || user.user_metadata?.name;
      if (name) {
        setFirstName(name.split(' ')[0]);
      } else {
        supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
          if (data?.full_name) {
            setFirstName(data.full_name.split(' ')[0]);
          }
        });
      }
    }
  }, [user]);

  // Delayed CTA reveal for dramatic effect
  useEffect(() => {
    if (liveSession && !dismissed) {
      const timer = setTimeout(() => setShowCTA(true), 1800);
      return () => clearTimeout(timer);
    }
  }, [liveSession, dismissed]);

  const handleDismiss = () => {
    if (liveSession) {
      localStorage.setItem(DISMISSED_KEY, liveSession.id);
    }
    setDismissed(true);
  };

  const handleWatch = () => {
    handleDismiss();
    navigate('/ferramentas/stf');
  };

  // Hide banner if user is already on the STF page
  if (location.pathname.startsWith('/ferramentas/stf')) {
    return null;
  }

  const greeting = firstName ? `${firstName}, ` : '';
  const sessionTitle = liveSession?.title || 'Sessão Plenária';

  return (
    <AnimatePresence>
      {liveSession && !dismissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleDismiss}
        >
          {/* Backdrop with radial highlight */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center 40%, rgba(220,38,38,0.25) 0%, transparent 60%)'
            }}
          />

          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="w-full max-w-[360px] mx-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-red-500/30 via-red-600/20 to-red-500/30 blur-xl"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Horus Avatar — floating above the card */}
            <motion.div
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-30"
              initial={{ y: -20, scale: 0 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
            >
              <div className="relative w-24 h-24">
                {/* Pulse rings */}
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-red-500/60"
                  animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-red-500/40"
                  animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
                <div className="w-24 h-24 rounded-full border-4 border-zinc-900 bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center shadow-2xl shadow-red-500/20 relative overflow-hidden">
                  <img
                    src={horusOwlAsset}
                    alt="Horus"
                    className="w-20 h-20 object-contain relative z-10"
                    loading="eager"
                  />
                </div>
              </div>
            </motion.div>

            {/* Card body */}
            <div className="bg-gradient-to-b from-zinc-900/95 to-zinc-950/98 backdrop-blur-xl border border-red-500/20 rounded-3xl overflow-hidden relative">
              {/* Animated top border — sweeping glow */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.9), transparent)',
                  backgroundSize: '200% 100%'
                }}
                animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />

              {/* Floating particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map(p => (
                  <Particle key={p.id} delay={p.delay} x={p.x} />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 px-6 pt-16 pb-7 flex flex-col items-center text-center">
                {/* Live badge */}
                <motion.div
                  className="flex items-center gap-2 mb-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="relative flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-full px-4 py-1.5">
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full bg-red-500"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-red-400">
                      Ao Vivo Agora
                    </span>
                    <Radio className="w-3.5 h-3.5 text-red-400" />
                  </div>
                </motion.div>

                {/* Greeting */}
                <motion.p
                  className="text-zinc-400 text-xs tracking-wide mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {greeting ? `${greeting}não perca!` : 'Não perca!'}
                </motion.p>

                {/* Session title — word-by-word reveal */}
                <motion.h3
                  className="text-base font-bold text-white min-h-[2.8rem] flex items-center justify-center flex-wrap gap-x-1.5 leading-relaxed mb-1"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 1 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.08, delayChildren: 0.7 }
                    }
                  }}
                >
                  {sessionTitle.split(' ').map((word, index) => (
                    <motion.span
                      key={`${word}-${index}`}
                      variants={{
                        hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
                        visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
                      }}
                      className="inline-block"
                    >
                      {word}
                    </motion.span>
                  ))}
                </motion.h3>

                {/* Subtitle */}
                <motion.p
                  className="text-zinc-500 text-[11px] tracking-wide mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  Transmissão ao vivo do Plenário do STF
                </motion.p>

                {/* CTA Button — delayed dramatic entrance */}
                <AnimatePresence>
                  {showCTA && (
                    <motion.button
                      initial={{ opacity: 0, y: 12, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                      onClick={handleWatch}
                      className="relative group flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-white px-8 py-3.5 rounded-2xl transition-all active:scale-95 w-full max-w-[260px] overflow-hidden"
                    >
                      {/* Button background with shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-2xl" />
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                          backgroundSize: '250% 100%'
                        }}
                        animate={{ backgroundPosition: ['-100% 0', '250% 0'] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                      />
                      <div className="absolute inset-0 rounded-2xl shadow-lg shadow-red-600/40 group-hover:shadow-red-600/60 transition-shadow" />
                      <PlayCircle className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">Assistir Agora</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Skip text */}
                <motion.button
                  onClick={handleDismiss}
                  className="mt-4 text-zinc-600 hover:text-zinc-400 text-[10px] uppercase tracking-widest transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5 }}
                >
                  Agora não
                </motion.button>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors z-20"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
