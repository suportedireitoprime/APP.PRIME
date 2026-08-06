import { BookOpen, ChevronRight, type LucideIcon } from 'lucide-react';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import type { AprenderHomeArea } from '@/lib/aprenderHomeSnapshot';

type Props = {
  area: AprenderHomeArea;
  icon?: { Icon: LucideIcon; color: string } | null;
  onOpen: () => void;
  onPrefetch: () => void;
};

export function shortenAreaName(name: string): string {
  if (!name) return name;
  const cleaned = name.replace(/^Direito\s+(de|do|da|dos|das)?\s*/i, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const MateriaRow = ({ area, icon, onOpen, onPrefetch }: Props) => {
  const cover = getAreaCover(area.nome);
  const pct = area.pct ?? 0;
  const iniciada = pct > 0;
  const displayName = shortenAreaName(area.nome);

  return (
    <button
      onClick={onOpen}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.995] sm:p-4"
    >
      {icon ? (
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 p-2 sm:h-14 sm:w-14">
          <icon.Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} style={{ color: icon.color }} />
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
                loading="lazy"
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
                ? 'bg-[hsl(var(--aprender-accent)/0.18)] text-[hsl(var(--aprender-accent))]'
                : 'bg-muted text-muted-foreground',
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
    </button>
  );
};

export default MateriaRow;
