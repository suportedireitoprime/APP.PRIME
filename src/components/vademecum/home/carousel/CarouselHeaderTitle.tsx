import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CarouselHeaderTitleProps {
  kind?: 'blog' | 'livro' | 'noticia';
}

const CarouselHeaderTitle = (_props: CarouselHeaderTitleProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-3.5 relative z-10 pointer-events-none px-5 sm:px-7 md:px-9 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-white text-[14.5px] sm:text-[15.5px] font-bold flex items-center gap-2 pointer-events-auto uppercase tracking-[0.05em]">
          <span className="w-1 h-4 rounded-full bg-primary shrink-0 shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />
          <span className="truncate">NOTÍCIAS</span>
        </h3>
        <p className="font-sans text-white/50 text-[11.5px] sm:text-[12px] leading-snug ml-3 pointer-events-auto truncate mt-0.5">
          Atualizações jurídicas, OAB e concursos
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/noticias')}
        className="group pointer-events-auto shrink-0 mt-0.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/10 text-[11.5px] sm:text-[12px] font-semibold text-white/80 hover:text-white transition-all shadow-sm cursor-pointer"
      >
        <span>Ver todas</span>
        <ChevronRight className="w-3.5 h-3.5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </button>
    </div>
  );
};

export default memo(CarouselHeaderTitle);
