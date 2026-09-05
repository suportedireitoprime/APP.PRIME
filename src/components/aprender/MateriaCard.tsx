import { BookOpen, ChevronRight, type LucideIcon } from 'lucide-react';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import type { AprenderHomeArea } from '@/lib/aprenderHomeSnapshot';

type Props = {
  area: AprenderHomeArea;
  icon?: { Icon: LucideIcon; color: string } | null;
  onOpen: () => void;
  onPrefetch: () => void;
};

const MateriaCard = ({ area, icon, onOpen, onPrefetch }: Props) => {
  const cover = getAreaCover(area.nome);
  const pct = area.pct ?? 0;
  const iniciada = pct > 0;

  return (
    <button
      onClick={onOpen}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      className="group flex flex-col justify-between w-[210px] sm:w-[250px] h-[170px] shrink-0 snap-start rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 text-left transition-all hover:bg-black/60 hover:border-primary/50 hover:shadow-lg active:scale-[0.99] relative overflow-hidden"
    >
      {/* Top bar: icon + percentage badge */}
      <div className="flex items-start justify-between w-full z-10">
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 p-2.5">
            <icon.Icon className="h-7 w-7" strokeWidth={2} style={{ color: icon.color }} />
          </div>
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden shadow-inner"
            style={{ background: cover?.tint ?? 'linear-gradient(135deg,hsl(348 78% 38%),#c9b83c)' }}
          >
            <BookOpen className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
        )}

        <span
          className={[
            'rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums shadow-sm',
            iniciada
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'bg-muted text-muted-foreground',
          ].join(' ')}
        >
          {pct}%
        </span>
      </div>

      {/* Middle & Bottom: Title, lesson count & progress bar */}
      <div className="w-full space-y-2 z-10">
        <div>
          <p
            className="line-clamp-2 text-[15px] font-bold leading-tight text-foreground group-hover:text-primary transition-colors"
            style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
          >
            {area.nome}
          </p>
          <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
            {area.totalAulas} {area.totalAulas === 1 ? 'aula' : 'aulas'}
            {area.concluidas > 0 && ` · ${area.concluidas} concluída${area.concluidas === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Subtle background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
};

export default MateriaCard;
