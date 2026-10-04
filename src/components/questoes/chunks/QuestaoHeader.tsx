import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, AlertTriangle } from 'lucide-react';

interface QuestaoHeaderProps {
  disciplina?: string;
  streak: number;
  progresso: number;
  onBack?: () => void;
  tempoNode?: React.ReactNode;
  encerrarNode?: React.ReactNode;
}

export function QuestaoHeader({
  disciplina,
  streak,
  progresso,
  onBack,
  tempoNode,
  encerrarNode,
}: QuestaoHeaderProps) {
  const isFilosofia = disciplina?.toLowerCase().includes('filosofia');

  return (
    <div className="sticky top-0 z-50 flex flex-col">
      <div className="relative flex items-center justify-between bg-[rgb(var(--tema-rgb))] px-4 pb-4 pt-safe-header text-white shadow-sm overflow-hidden">
        
        {/* Arte da Disciplina (Filosofia) */}
        {isFilosofia && (
          <div className="absolute left-0 bottom-0 h-full w-28 sm:w-32 z-0 pointer-events-none flex items-end opacity-70 sm:opacity-80">
            <img 
              src="/images/disciplinas/filosofia.png" 
              alt="" 
              className="h-[140%] w-auto object-contain object-left-bottom origin-bottom-left"
              style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' }}
            />
          </div>
        )}

        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15 hover:bg-black/25 transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : (
          <div className="h-10 w-10 shrink-0" />
        )}
        <div className="relative z-10 flex-1 px-2 flex flex-col items-center justify-center min-w-0">
          <div className="flex items-center gap-2 max-w-full">
            <p className="truncate text-[16px] font-bold leading-tight">{disciplina || 'Questão'}</p>
            <AnimatePresence>
              {streak >= 3 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 shrink-0"
                >
                  <Trophy className="h-3 w-3 text-orange-500" />
                  <span className="text-[12px] font-bold text-orange-500">{streak}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {tempoNode && <div className="mt-0.5">{tempoNode}</div>}
        </div>
        <div className="relative z-10 flex shrink-0 items-center justify-end min-w-[40px]">
          {encerrarNode || <div className="h-10 w-10 shrink-0" />}
        </div>
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
