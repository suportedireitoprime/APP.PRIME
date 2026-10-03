import { BookOpen, ChevronRight, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import type { AprenderHomeArea } from '@/lib/aprenderHomeSnapshot';
import { shortenAreaName } from '@/lib/areaNameShortener';

type Props = {
  area: AprenderHomeArea;
  icon?: { Icon: LucideIcon; color: string } | null;
  onOpen: () => void;
  onPrefetch: () => void;
  overrideLabel?: string;
  overrideTotal?: number;
  overrideConcluidas?: number;
  overridePct?: number;
};

const MateriaRow = ({ area, icon, onOpen, onPrefetch, overrideLabel, overrideTotal, overrideConcluidas, overridePct }: Props) => {
  const cover = getAreaCover(area.nome);
  const total = overrideTotal ?? area.totalAulas;
  const concluidas = overrideConcluidas ?? area.concluidas;
  const pct = overridePct ?? area.pct ?? 0;
  const label = overrideLabel ?? (total === 1 ? 'aula' : 'aulas');
  
  const iniciada = pct > 0;
  const displayName = shortenAreaName(area.nome);
  const accentColor = icon?.color || '#fb7185';

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      style={{ '--area-accent': accentColor } as React.CSSProperties}
      className="group relative flex flex-col w-full aspect-[3/4] overflow-hidden rounded-[20px] bg-card text-left transition-all hover:shadow-xl focus-visible:outline-none will-change-transform isolate"
    >
      {/* Background Image / Cover */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: cover?.tint ?? 'linear-gradient(135deg,hsl(348 78% 38%),#c9b83c)' }}
      >
        {cover?.cover ? (
          <img
            src={cover.cover}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center opacity-50">
            <BookOpen className="h-16 w-16 text-white" strokeWidth={1} />
          </div>
        )}
        
        {/* Gradient Overlay for Text */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"
        />
      </div>

      {/* Content - Pushed to bottom */}
      <div className="relative z-10 mt-auto flex w-full flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          {iniciada && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-black tabular-nums tracking-wider uppercase backdrop-blur-md"
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.4)', 
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)' 
              }}
            >
              {pct}%
            </span>
          )}
        </div>

        <p
          className="min-w-0 w-full text-base sm:text-lg font-black leading-tight text-white font-display drop-shadow-md line-clamp-2"
          style={{ fontFamily: "'Barlow', system-ui, sans-serif", letterSpacing: '-0.01em' }}
        >
          {displayName}
        </p>

        <p className="mt-1 text-[11px] sm:text-[12px] font-medium text-white/80 line-clamp-1 drop-shadow">
          {total} {label}
          {concluidas > 0 && ` • ${concluidas} concl.`}
        </p>

        {/* Progress Bar */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.max(pct, iniciada ? 4 : 0)}%`, 
              backgroundColor: pct === 100 ? '#10B981' : accentColor,
              boxShadow: pct > 0 ? `0 0 10px ${accentColor}` : 'none'
            }}
          />
        </div>
      </div>
    </motion.button>
  );
};

export default MateriaRow;
