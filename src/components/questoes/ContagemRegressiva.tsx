import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';

type Props = {
  onFim: () => void;
  solido?: boolean;
  subtitulo?: string;
};

/** Contagem regressiva 3 · 2 · 1 · Já! antes de iniciar a prática. */
const ContagemRegressiva = ({ onFim, solido = false, subtitulo = 'Preparando sua prática…' }: Props) => {
  const [passo, setPasso] = useState(0); // 0..3 => 3,2,1,Já!
  const labels = ['3', '2', '1', 'Já!'];

  useEffect(() => {
    haptic.light?.();
    if (passo >= labels.length) return;
    const t = setTimeout(() => {
      if (passo === labels.length - 1) onFim();
      else setPasso((p) => p + 1);
    }, passo === labels.length - 1 ? 500 : 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${
        solido ? 'bg-background' : 'bg-background/95 backdrop-blur-sm'
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={passo}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="text-[clamp(5rem,24vw,9rem)] font-black leading-none text-primary font-display tracking-tighter"
        >
          {labels[passo]}
        </motion.span>
      </AnimatePresence>
      <p className="mt-4 text-[15px] font-extrabold text-muted-foreground">{subtitulo}</p>
    </div>
  );
};

export default ContagemRegressiva;
