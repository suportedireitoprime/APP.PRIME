import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COVER_POSITIONS = ['right', 'left', 'center', 'right', 'left'] as const;

interface HeroCoverCarouselProps {
  covers: { url: string; preset?: string }[];
}

const HeroCoverCarousel = ({ covers }: HeroCoverCarouselProps) => {
  const [coverIndex, setCoverIndex] = useState(() => Math.floor(Math.random() * Math.max(1, covers.length)));

  // Preload caching logic for smooth transitions
  useEffect(() => {
    if (covers.length <= 1) return;
    const next = covers[(coverIndex + 1) % covers.length];
    if (!next?.url) return;
    const w: any = window;
    const idle = w.requestIdleCallback || ((cb: any) => setTimeout(cb, 400));
    const cancel = w.cancelIdleCallback || clearTimeout;
    const handle = idle(() => {
      const img = new Image();
      img.decoding = 'async';
      img.src = next.url;
    });
    return () => cancel(handle);
  }, [coverIndex, covers]);

  // Interval driver isolated here
  useEffect(() => {
    if (covers.length <= 1) return;
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
  }, [covers.length]);

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      <AnimatePresence initial={false}>
        {(() => {
          const current = covers[coverIndex % covers.length];
          if (!current) return null;
          const pos = COVER_POSITIONS[coverIndex % COVER_POSITIONS.length];
          const posClass =
            pos === 'right'
              ? 'right-[4%] left-auto origin-bottom-right'
              : pos === 'left'
              ? 'left-[4%] right-auto origin-bottom-left'
              : 'left-1/2 -translate-x-1/2 origin-bottom';

          // Fade-in com um leve zoom.
          const preset = {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 1.6, ease: [0.22, 1, 0.36, 1] as const },
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
              style={{ animation: kenBurnsAnim, willChange: 'transform' }}
              className={`absolute bottom-0 h-[88%] w-auto max-w-[70%] object-contain object-bottom drop-shadow-[0_10px_28px_rgba(0,0,0,0.35)] ${posClass}`}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default memo(HeroCoverCarousel);
