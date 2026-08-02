import { Play } from 'lucide-react';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { prefetchAprenderAula } from '@/lib/aprenderAulaPrefetch';
import type { AprenderHomeAula } from '@/lib/aprenderHomeSnapshot';

type Props = {
  aulas: AprenderHomeAula[];
  onOpen: (aulaId: string) => void;
};

function AulaCard({ aula, onOpen, wide }: { aula: AprenderHomeAula; onOpen: (id: string) => void; wide: boolean }) {
  const cover = getAreaCover(aula.areaNome);
  const restantes = Math.max(0, (aula.blocosTotal ?? 0) - (aula.blocosFeitos ?? 0));
  const prefetch = () => prefetchAprenderAula(aula.aulaId);

  return (
    <button
      onClick={() => onOpen(aula.aulaId)}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      className={[
        'group relative overflow-hidden rounded-2xl border border-border bg-card text-left transition-all',
        'hover:border-primary/40 hover:shadow-md active:scale-[0.995]',
        wide ? 'w-full' : 'w-[85%] shrink-0 snap-start sm:w-[60%]',
      ].join(' ')}
    >
      {cover?.cover && (
        <>
          <img
            src={cover.cover}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            loading="eager"
            decoding="async"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(23,23,23,0.92) 0%, rgba(38,38,38,0.75) 55%, rgba(0,0,0,0.85) 100%)',
            }}
          />
        </>
      )}
      <div className="relative flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--aprender-accent))] shadow-lg sm:h-14 sm:w-14">
          <Play className="h-5 w-5 fill-current text-[hsl(var(--aprender-accent-foreground))] sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white/85">
            {aula.areaNome}
          </p>
          <p
            className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug text-white sm:text-base"
            style={{ fontFamily: "'Barlow', system-ui, sans-serif", letterSpacing: '-0.005em' }}
          >
            {aula.titulo}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[hsl(var(--aprender-accent))] transition-all"
                style={{ width: `${aula.pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[12px] font-bold tabular-nums text-white sm:text-[13px]">
              {aula.pct}%
            </span>
          </div>
          {aula.blocosTotal > 0 && restantes > 0 && (
            <p className="mt-1 text-[11px] text-white/70">
              {restantes === 1 ? 'falta 1 etapa' : `faltam ${restantes} etapas`}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * "Continue de onde parou" dinâmico:
 *  - 1 aula em andamento → card grande
 *  - 2+ aulas           → carrossel horizontal com snap
 */
const ContinueCarousel = ({ aulas, onOpen }: Props) => {
  if (!aulas.length) return null;

  const single = aulas.length === 1;

  return (
    <section aria-label="Continue de onde parou">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Continue de onde parou
        </p>
        {!single && (
          <span className="text-[11px] font-semibold text-muted-foreground">
            {aulas.length} em andamento
          </span>
        )}
      </div>

      {single ? (
        <AulaCard aula={aulas[0]} onOpen={onOpen} wide />
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6">
          {aulas.map((a) => (
            <AulaCard key={a.aulaId} aula={a} onOpen={onOpen} wide={false} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ContinueCarousel;
