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
};

const MateriaRow = ({ area, icon, onOpen, onPrefetch }: Props) => {
  const cover = getAreaCover(area.nome);
  const pct = area.pct ?? 0;
  const iniciada = pct > 0;
  const displayName = shortenAreaName(area.nome);

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-card p-3.5 text-left transition-all hover:bg-muted/70 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none sm:p-4"
    >
      {icon ? (
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
          <icon.Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.5} style={{ color: icon.color }} />
        </div>
      ) : (
        <div
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl sm:h-14 sm:w-14"
          style={{ background: cover?.tint ?? 'linear-gradient(135deg,hsl(348 78% 38%),#c9b83c)' }}
        >
          {cover?.cover ? (
            <>
              <img
                src={cover.cover}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${cover.tint} 0%, rgba(0,0,0,0.25) 100%)` }}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" strokeWidth={2} />
            </div>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className="min-w-0 flex-1 truncate text-base font-bold text-foreground sm:text-[17px] group-hover:text-primary transition-colors font-display"
            style={{ fontFamily: "'Barlow', system-ui, sans-serif", letterSpacing: '-0.005em' }}
          >
            {displayName}
          </p>
          <span
            className={[
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
              iniciada
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-muted text-muted-foreground border border-border/60',
            ].join(' ')}
          >
            {pct}%
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground sm:text-[13px]">
          {area.totalAulas} {area.totalAulas === 1 ? 'aula' : 'aulas'}
          {area.concluidas > 0 && ` · ${area.concluidas} concluída${area.concluidas === 1 ? '' : 's'}`}
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[hsl(var(--aprender-accent))] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </motion.button>
  );
};

export default MateriaRow;
