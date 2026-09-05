import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { TemaRow } from './flashcardsLeisConstants';

interface FlashcardsLeisCardProps {
  lei: TemaRow;
  onSelect: (lei: TemaRow) => void;
}

export const FlashcardsLeisCard: React.FC<FlashcardsLeisCardProps> = ({
  lei,
  onSelect,
}) => {
  const progresso = lei.total ? Math.round((lei.compreendidos / lei.total) * 100) : 0;
  const strokeDasharray = 2 * Math.PI * 18; // r=18
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progresso) / 100;

  return (
    <button
      type="button"
      onClick={() => {
        if (lei.total === 0) return;
        haptic.selection?.();
        onSelect(lei);
      }}
      className={`lei-card group flex items-center justify-between p-4 rounded-2xl border bg-card text-left transition-all ${
        lei.total > 0
          ? 'border-border/80 hover:border-[#36AF85]/50 hover:shadow-md active:scale-[0.99] cursor-pointer'
          : 'border-border/40 opacity-70 cursor-default'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Circular Progress */}
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="18"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              className="text-muted/30"
            />
            <motion.circle
              cx="22"
              cy="22"
              r="18"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              strokeLinecap="round"
              className={progresso > 0 ? 'text-[#36AF85]' : 'text-transparent'}
              initial={{ strokeDashoffset: strokeDasharray }}
              animate={{
                strokeDashoffset: lei.total > 0 ? strokeDashoffset : strokeDasharray,
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ strokeDasharray }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span
              className={`text-[10px] font-bold ${
                progresso > 0 ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {progresso}%
            </span>
          </div>
        </div>

        <div className="flex flex-col min-w-0 pr-4">
          <span
            className={`font-bold text-sm sm:text-base leading-tight line-clamp-2 transition-colors ${
              lei.total > 0
                ? 'text-foreground group-hover:text-[#36AF85]'
                : 'text-muted-foreground'
            }`}
          >
            {lei.tema}
          </span>
          <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-muted-foreground">
            <span>
              {lei.total} {lei.total === 1 ? 'card' : 'cards'}
            </span>
          </div>
        </div>
      </div>
      {lei.total > 0 && (
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
      )}
    </button>
  );
};
