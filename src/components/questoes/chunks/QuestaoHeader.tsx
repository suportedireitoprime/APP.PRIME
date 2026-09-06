import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, AlertTriangle } from 'lucide-react';

interface QuestaoHeaderProps {
  disciplina?: string;
  streak: number;
  progresso: number;
  onBack?: () => void;
  onReportarErro: () => void;
}

export function QuestaoHeader({
  disciplina,
  streak,
  progresso,
  onBack,
  onReportarErro,
}: QuestaoHeaderProps) {
  return (
    <div className="sticky top-0 z-50 flex flex-col">
      <div className="flex items-center justify-between bg-primary px-4 pb-4 pt-safe-header text-primary-foreground shadow-sm">
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15 hover:bg-black/25 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 px-3 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <p className="line-clamp-1 text-[16px] font-bold leading-tight">{disciplina || 'Questão'}</p>
            <AnimatePresence>
              {streak >= 3 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5"
                >
                  <Trophy className="h-3 w-3 text-orange-500" />
                  <span className="text-[12px] font-bold text-orange-500">{streak}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <button
          onClick={onReportarErro}
          aria-label="Reportar Erro"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15 hover:bg-black/25 transition-colors"
        >
          <AlertTriangle className="h-5 w-5" />
        </button>
      </div>

      {/* Barra de Progresso Viva */}
      <div className="h-[3px] w-full bg-black/20">
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 rounded-r-full"
          initial={false}
          animate={{ width: `${progresso}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
