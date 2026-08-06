import { Play, BookOpen, Clock, ChevronRight, type LucideIcon } from 'lucide-react';
import type { AulaCarouselItem } from '@/hooks/useAprenderHomeLessonsMap';

type Props = {
  aula: AulaCarouselItem;
  icon?: { Icon: LucideIcon; color: string } | null;
  onOpen: () => void;
  onPrefetch: () => void;
};

export const AulaCarouselCard = ({ aula, icon, onOpen, onPrefetch }: Props) => {
  return (
    <button
      onClick={onOpen}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      className="group flex flex-col justify-between w-[240px] sm:w-[270px] h-[155px] shrink-0 snap-start rounded-2xl border border-border/80 bg-card/90 p-4 text-left transition-all hover:border-primary/60 hover:shadow-xl active:scale-[0.99] relative overflow-hidden"
    >
      {/* Header: Play Icon + Duration badge */}
      <div className="flex items-center justify-between w-full z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md group-hover:scale-105 transition-transform">
            <Play className="h-4 w-4 fill-primary-foreground ml-0.5" />
          </div>
          {aula.moduloTitulo && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate max-w-[130px]">
              {aula.moduloTitulo}
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-muted text-muted-foreground border border-border/60">
          <Clock className="w-3 h-3 text-primary" />
          {aula.duracaoMin} min
        </span>
      </div>

      {/* Content: Title & Objective */}
      <div className="w-full space-y-1.5 z-10 mt-1">
        <p className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
          {aula.titulo}
        </p>
        {aula.objetivo && (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">
            {aula.objetivo}
          </p>
        )}
      </div>

      {/* Footer: Start Action */}
      <div className="w-full flex items-center justify-between pt-1 border-t border-border/40 z-10">
        <span className="text-[11px] font-bold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Estudar agora
        </span>
        <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Hover ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
};

export default AulaCarouselCard;
