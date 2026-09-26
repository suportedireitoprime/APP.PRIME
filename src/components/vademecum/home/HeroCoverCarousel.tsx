import { useState, useEffect, memo } from 'react';

const COVER_POSITIONS = ['right', 'left', 'right', 'left'] as const;

interface HeroCoverCarouselProps {
  covers: { url: string; preset?: string }[];
  forcePosition?: 'right' | 'left';
}

const HeroCoverCarousel = ({ covers, forcePosition }: HeroCoverCarouselProps) => {
  const [coverIndex, setCoverIndex] = useState(() => {
    const len = covers?.length || 0;
    return len > 0 ? Math.floor(Math.random() * len) : 0;
  });

  // Mantém o índice válido sem flicker se o número de capas mudar (ex: após carregar do Supabase)
  useEffect(() => {
    if (!covers || covers.length === 0) return;
    setCoverIndex((curr) => curr % covers.length);
  }, [covers]);

  // Preload caching logic para transições suaves
  useEffect(() => {
    if (!covers || covers.length <= 1) return;
    const next = covers[(coverIndex + 1) % covers.length];
    if (!next?.url) return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 400));
    const cancel = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback || clearTimeout;
    const handle = idle(() => {
      const img = new Image();
      img.decoding = 'async';
      img.src = next.url;
    });
    return () => cancel(handle as number);
  }, [coverIndex, covers]);

  // Troca de capa espaçada a cada 10s (pausada quando a aba está em background)
  useEffect(() => {
    if (!covers || covers.length <= 1) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => setCoverIndex((i) => (i + 1) % covers.length), 10000);
    };
    const stop = () => { if (id) { clearInterval(id); id = null; } };
    if (!document.hidden) start();
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [covers]);

  if (!covers || covers.length === 0) return null;

  const current = covers[coverIndex % covers.length];
  if (!current) return null;
  const pos = forcePosition ? forcePosition : COVER_POSITIONS[coverIndex % COVER_POSITIONS.length];
  const posClass =
    pos === 'right'
      ? 'right-[2%] sm:right-[4%] left-auto'
      : 'left-[2%] sm:left-[4%] right-auto';

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      <img
        key={current.url}
        src={current.url}
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority="high"
        width={1024}
        height={1024}
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          el.style.opacity = '0';
        }}
        style={{
          transform: 'translateZ(0)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 98%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 98%)',
        }}
        className={`absolute bottom-0 h-[68%] sm:h-[75%] md:h-[85%] w-auto max-w-[56%] sm:max-w-[48%] md:max-w-[40%] landscape:max-w-[34%] landscape:h-[88%] object-contain object-bottom drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)] opacity-80 sm:opacity-90 transition-opacity duration-700 ease-out animate-fade-in ${posClass}`}
      />
    </div>
  );
};

export default memo(HeroCoverCarousel);
