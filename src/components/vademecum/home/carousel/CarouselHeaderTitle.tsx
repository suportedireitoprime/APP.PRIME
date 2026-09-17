import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CarouselHeaderTitleProps {
  kind?: 'blog' | 'livro' | 'noticia';
}

const CarouselHeaderTitle = ({ kind = 'noticia' }: CarouselHeaderTitleProps) => {
  const navigate = useNavigate();
  return (
    <div className="mb-0 relative z-10 pointer-events-none px-5 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2 pointer-events-auto uppercase tracking-widest">
          <span className="w-1 h-5 rounded-full bg-primary" />
          NOTÍCIAS JURÍDICAS
        </h3>
        <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3 pointer-events-auto whitespace-nowrap truncate">
          notícias do mundo jurídico em tempo real
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/noticias')}
        className="group pointer-events-auto shrink-0 mt-0.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 backdrop-blur-md border border-white/15 hover:border-white/25 text-[12px] font-semibold text-foreground/90 hover:text-white transition-all shadow-sm"
      >
        <span>Ver todas</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </button>
    </div>
  );
};

export default memo(CarouselHeaderTitle);
