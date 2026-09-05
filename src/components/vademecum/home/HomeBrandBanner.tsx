import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SUBTITLES = [
  'Uso Profissional',
  'Para Estudantes',
  'Para Advogados',
  'Para Concurseiros',
  'Para Professores',
  'Para Servidores',
  'Para Magistrados',
];

const HomeBrandBanner = () => {
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % SUBTITLES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center text-center gap-2 pt-1">
      <div className="relative h-24 mb-2 flex items-center justify-center">
        <img
          src="/logo-prime.png"
          alt="Direito Prime"
          loading="eager"
          decoding="sync"
          {...({ fetchpriority: 'high' } as any)}
          className="w-auto h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
        />
      </div>
      <h1 className="font-serif italic text-white text-[24px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
        Estudos Jurídicos
      </h1>
      <div className="relative h-[16px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={subtitleIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="font-body text-white/85 text-[12.5px] font-medium tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] whitespace-nowrap"
          >
            {SUBTITLES[subtitleIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default memo(HomeBrandBanner);
