import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface PilulasFinishedProps {
  onRestart: () => void;
}

export function PilulasFinished({ onRestart }: PilulasFinishedProps) {
  return (
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
          onRestart();
        }}
        className="mt-4 px-8 min-h-[48px] h-14 bg-[#36AF85] hover:bg-[#2C9570] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#36AF85]/20"
      >
        <RotateCcw className="w-5 h-5" />
        Ver Novamente
      </button>
    </motion.div>
  );
}
