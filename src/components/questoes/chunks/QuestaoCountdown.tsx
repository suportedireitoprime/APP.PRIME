import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface QuestaoCountdownProps {
  countdown: number;
}

export function QuestaoCountdown({ countdown }: QuestaoCountdownProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={countdown}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="flex h-32 w-32 items-center justify-center rounded-full bg-[#E11D48]/10 text-6xl font-black text-[#E11D48] shadow-[0_0_40px_rgba(225,29,72,0.2)]"
        >
          {countdown > 0 ? countdown : <Loader2 className="h-12 w-12 animate-spin text-[#E11D48]" />}
        </motion.div>
      </AnimatePresence>
      <p className="mt-8 text-lg font-bold text-zinc-400 animate-pulse">Preparando suas questões...</p>
    </div>
  );
}
