import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COVER_POSITIONS = ['right', 'left', 'right', 'left'] as const;

interface HeroCoverCarouselProps {
  covers: { url: string; preset?: string }[];
}

const HeroCoverCarousel = ({ covers }: HeroCoverCarouselProps) => {
  const [coverIndex, setCoverIndex] = useState(() => {
    const len = covers?.length || 0;
    return len > 0 ? Math.floor(Math.random() * len) : 0;
  });

  // Mantém o índice válido sem flicker se o número de capas mudar (ex: após carregar do Supabase)
  useEffect(() => {
    if (!covers || covers.length === 0) return;
    setCoverIndex((curr) => curr % covers.length);
  }, [covers]);

  // Preload caching logic for smooth transitions
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

  // Interval driver isolated here
  useEffect(() => {
    if (!covers || covers.length <= 1) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => setCoverIndex((i) => (i + 1) % covers.length), 9000);
    };
    const stop = () => { if (id) { clearInterval(id); id = null; } };
    if (!document.hidden) start();
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [covers]);

  if (!covers || covers.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      <AnimatePresence initial={false}>
        {(() => {
          const safeLen = covers.length;
          if (safeLen === 0) return null;
          const current = covers[coverIndex % safeLen];
          if (!current) return null;
          const pos = COVER_POSITIONS[coverIndex % COVER_POSITIONS.length];
          const posClass =
            pos === 'right'
              ? 'right-[2%] sm:right-[4%] left-auto origin-bottom-right'
              : 'left-[2%] sm:left-[4%] right-auto origin-bottom-left';

          // Fade-in com um leve zoom
          const preset = {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] as const },
          };
          
          const kenBurnsAnim = (coverIndex % 2 === 0)
            ? 'ken-burns-a 12s ease-in-out infinite alternate'
            : 'ken-burns-b 12s ease-in-out infinite alternate';

          return (
            <motion.img
              key={coverIndex}
              src={current.url}
              alt=""
              loading="eager"
              decoding="async"
              // @ts-expect-error non-standard yet-widely-supported hint
              fetchpriority="high"
              width={1024}
              height={1024}
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.opacity = '0';
              }}
              initial={preset.initial}
              animate={preset.animate}
              exit={preset.exit}
              transition={preset.transition}
              style={{
                animation: kenBurnsAnim,
                willChange: 'transform',
                maskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 98%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 98%)',
              }}
              className={`absolute bottom-0 h-[68%] sm:h-[75%] md:h-[85%] w-auto max-w-[56%] sm:max-w-[48%] md:max-w-[40%] landscape:max-w-[34%] landscape:h-[88%] object-contain object-bottom drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)] opacity-80 sm:opacity-90 ${posClass}`}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default memo(HeroCoverCarousel);
