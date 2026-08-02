import { BookOpen, ChevronRight, type LucideIcon } from 'lucide-react';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import type { AprenderHomeArea } from '@/lib/aprenderHomeSnapshot';

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

  return (
    <button
      onClick={onOpen}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.995] sm:p-3.5"
    >
      {icon ? (
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16 aprender-icon-shine">
          <icon.Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.9} style={{ color: icon.color }} />
        </div>
      ) : (
        <div
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-16"
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
            className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground sm:text-[16px]"
            style={{ fontFamily: "'Barlow', system-ui, sans-serif", letterSpacing: '-0.005em' }}
          >
            {area.nome}
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
