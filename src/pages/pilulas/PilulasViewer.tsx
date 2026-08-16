import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { MOCK_PILULAS_DATA } from './mockData';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import '@/pilulas.css';

const SWIPE_THRESHOLD = 100;

export default function PilulasViewer() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  
  const pilulas = MOCK_PILULAS_DATA[deckId || ''] || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const isFinished = index >= pilulas.length;

  // Swipe logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8]);

  const controls = useAnimation();

  // Reset states when current card changes
  useEffect(() => {
    setFlipped(false);
    x.set(0);
    controls.set({ x: 0, opacity: 1, scale: 1, rotate: 0 });
  }, [index, x, controls]);

  const handleDragEnd = async (e: any, info: any) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      // Swipe Right
      haptic.success?.();
      await controls.start({ x: window.innerWidth, opacity: 0, transition: { duration: 0.3 } });
      setIndex((i) => i + 1);
    } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      // Swipe Left
      haptic.selection?.();
      await controls.start({ x: -window.innerWidth, opacity: 0, transition: { duration: 0.3 } });
      setIndex((i) => i + 1);
    } else {
      // Return to center
      controls.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const handleFlip = () => {
    haptic.selection();
    setFlipped((f) => !f);
  };

  if (!pilulas.length) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-white">
        <p>Deck não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-zinc-950 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#36AF85]/20 via-zinc-950 to-zinc-950" />
      </div>

      <div className="relative z-10 pt-safe-header pb-2 px-4 flex justify-between items-center bg-transparent">
        <PageHeader title="" onBack={() => navigate('/pilulas')} rightAction={<div className="w-8" />} className="bg-transparent border-none" />
      </div>

      <div className="flex-1 relative flex items-center justify-center p-6 mb-10 overflow-hidden">
        {isFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="h-24 w-24 rounded-full bg-[#36AF85]/20 flex items-center justify-center">
              <span className="text-4xl">🎉</span>
            </div>
            <div>
              <h2 className="text-[28px] font-black text-white">Você concluiu!</h2>
              <p className="text-zinc-400 mt-2">Todas as pílulas deste tema foram vistas.</p>
            </div>
            <button
              onClick={() => {
                haptic.selection();
                setIndex(0);
              }}
              className="mt-4 px-8 h-14 bg-[#36AF85] hover:bg-[#2C9570] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#36AF85]/20"
            >
              <RotateCcw className="w-5 h-5" />
              Ver Novamente
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              key={index}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onDragEnd={handleDragEnd}
              style={{ x, rotate, opacity, scale }}
              animate={controls}
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={handleFlip}
              className="absolute w-full max-w-[360px] aspect-[3/4] cursor-grab active:cursor-grabbing preserve-3d"
            >
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-full h-full relative preserve-3d"
              >
                {/* Frente */}
                <div
                  className="absolute inset-0 backface-hidden rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl"
                >
                  <img
                    src={pilulas[index].image}
                    alt={pilulas[index].title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                  
                  <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center text-center">
                    <span className="text-[12px] font-bold text-[#36AF85] tracking-widest uppercase mb-3 drop-shadow-md">
                      Pílula {index + 1} de {pilulas.length}
                    </span>
                    <h2 className="text-[32px] font-black text-white leading-tight text-center px-6">
                      {pilulas[index].title}
                    </h2>
                    {pilulas[index].subtitle && (
                      <p className="mt-3 text-lg font-medium text-white/90 text-center px-8 drop-shadow-md">
                        {pilulas[index].subtitle}
                      </p>
                    )}
                    <p className="mt-8 text-[15px] font-medium text-white/80 drop-shadow flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Toque para girar
                    </p>
                  </div>
                </div>

                {/* Verso */}
                <div
                  className="absolute inset-0 backface-hidden rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  {/* Fundo Desfocado */}
                  <div className="absolute inset-0">
                    <img
                      src={pilulas[index].image}
                      alt={pilulas[index].title}
                      className="w-full h-full object-cover blur-xl scale-110 opacity-40"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                  </div>

                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 text-center">
                    <h3 className="text-[24px] font-black text-white mb-6 leading-tight">
                      {pilulas[index].title}
                    </h3>
                    <p className="text-[17px] leading-relaxed text-zinc-200">
                      {pilulas[index].text}
                    </p>

                    <div className="absolute bottom-8 text-[13px] text-zinc-400 flex items-center gap-2">
                      Deslize para avançar &rarr;
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
