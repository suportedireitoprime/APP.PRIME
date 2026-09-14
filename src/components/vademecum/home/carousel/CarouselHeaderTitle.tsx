import { memo } from 'react';

interface CarouselHeaderTitleProps {
  kind?: 'blog' | 'livro' | 'noticia';
}

const CarouselHeaderTitle = ({ kind = 'noticia' }: CarouselHeaderTitleProps) => {
  return (
    <div className="px-5 mb-2">
      <h3 className="font-display text-foreground text-[18px] font-bold mb-0.5 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-primary" />
        NOTÍCIAS JURÍDICAS
      </h3>
      <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3 truncate">
        notícias do mundo jurídico em tempo real
      </p>
    </div>
  );
};

export default memo(CarouselHeaderTitle);

