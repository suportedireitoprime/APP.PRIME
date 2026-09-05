import type { RefObject } from 'react';

interface LivroHeaderBackdropProps {
  capaHorizontalUrl?: string | null;
  capaUrl?: string | null;
  titulo: string;
  autor?: string | null;
  area?: string | null;
  contentRef?: RefObject<HTMLDivElement>;
}

export const LivroHeaderBackdrop = ({
  capaHorizontalUrl,
  capaUrl,
  titulo,
  autor,
  area,
  contentRef,
}: LivroHeaderBackdropProps) => {
  const handleScrollReset = () => {
    const el = contentRef?.current;
    if (el && el.scrollTop < 4) el.scrollTop = 0;
  };

  return (
    <>
      {/* Backdrop horizontal — cover fills full landscape with palette-tinted gradient */}
      <div className="relative w-full h-[clamp(210px,28dvh,252px)] overflow-hidden bg-background">
        {(capaHorizontalUrl || capaUrl) && (
          <img
            src={capaHorizontalUrl || capaUrl}
            alt=""
            aria-hidden
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
          />
        )}
        {(capaHorizontalUrl || capaUrl) && (
          <img
            src={capaHorizontalUrl || capaUrl}
            alt=""
            aria-hidden
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
            onLoad={handleScrollReset}
          />
        )}
        {/* Palette-tinted gradients to blend */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-primary/20 mix-blend-multiply" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

        {/* Capa vertical sobreposta */}
        {capaUrl && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-10">
            <img
              src={capaUrl}
              alt={titulo}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-28 h-40 rounded-lg object-cover shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
              onLoad={handleScrollReset}
            />
          </div>
        )}
      </div>

      {/* Título, Autor e Área */}
      <div className="text-center space-y-1.5 pt-4 px-2">
        <h2 className="font-display text-lg sm:text-xl font-bold text-foreground leading-tight break-words px-2">
          {titulo}
        </h2>
        {autor && (
          <p className="text-sm text-muted-foreground">{autor}</p>
        )}
        {area && (
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wider">
              {area}
            </span>
          </div>
        )}
      </div>
    </>
  );
};
