import { memo, useEffect, useState } from 'react';

interface CarouselHeaderTitleProps {
  kind?: 'blog' | 'livro' | 'noticia';
}

const CarouselHeaderTitle = (_props: CarouselHeaderTitleProps) => {
  const [dataAtual, setDataAtual] = useState<string>('');

  useEffect(() => {
    setDataAtual(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  return (
    <div className="mb-0 relative z-10 pointer-events-none px-5 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2 pointer-events-auto uppercase tracking-widest">
          <span className="w-1 h-5 rounded-full bg-primary" />
          EXPLORAR
        </h3>
        <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3 pointer-events-auto whitespace-nowrap truncate min-h-[18px]">
          {dataAtual}
        </p>
      </div>
    </div>
  );
};

export default memo(CarouselHeaderTitle);
