import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <motion.button
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      whileHover={{ scale: wide ? 1.01 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(aula.aulaId)}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      className={[
        'group relative overflow-hidden rounded-2xl border border-border bg-card text-left transition-all min-h-[135px] w-full',
        'hover:border-primary/50 hover:shadow-xl focus-visible:outline-none',
      ].join(' ')}
    >
      {cover?.cover && (
        <>
          <img
            src={cover.cover}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-500"
            loading="eager"
            decoding="async"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(18,18,18,0.95) 0%, rgba(28,28,28,0.85) 55%, rgba(0,0,0,0.9) 100%)',
            }}
          />
        </>
      )}
      <div className="relative flex items-center gap-3.5 p-4 sm:gap-4 sm:p-5 h-full">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-transform sm:h-14 sm:w-14">
          <Play className="h-5 w-5 fill-current ml-0.5 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-[10.5px] font-bold uppercase tracking-widest text-primary">
            {aula.areaNome}
          </p>
          <p
            className="text-[14.5px] font-bold leading-snug text-foreground sm:text-base line-clamp-2"
            style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
          >
            {aula.titulo}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${aula.pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[12px] font-bold tabular-nums text-primary sm:text-[13px]">
              {aula.pct}%
            </span>
          </div>
          {aula.blocosTotal > 0 && restantes > 0 && (
            <p className="text-[11px] text-muted-foreground font-medium">
              {restantes === 1 ? 'falta 1 etapa' : `faltam ${restantes} etapas`}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/**
 * "Continue de onde parou" dinâmico:
 *  - 1 aula em andamento → card grande
 *  - 2+ aulas           → grid de 2 colunas no Desktop, carrossel no Mobile
 */
const ContinueCarousel = ({ aulas, onOpen }: Props) => {
  if (!aulas.length) return null;

  const single = aulas.length === 1;

  return (
    <section aria-label="Continue de onde parou" className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
          Continue de onde parou
        </p>
        {!single && (
          <span className="text-[11px] font-semibold text-muted-foreground">
            {aulas.length} em andamento
          </span>
        )}
      </div>

      {single ? (
        <motion.div initial="hidden" animate="show">
          <AulaCard aula={aulas[0]} onOpen={onOpen} wide={true} />
        </motion.div>
      ) : (
        <motion.div 
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
          }}
        >
          {aulas.map((a) => (
            <div key={a.aulaId} className="w-[82%] sm:w-[310px] shrink-0 snap-start">
              <AulaCard aula={a} onOpen={onOpen} wide={false} />
            </div>
          ))}
        </motion.div>
      )}
    </section>
  );
};

export default ContinueCarousel;
