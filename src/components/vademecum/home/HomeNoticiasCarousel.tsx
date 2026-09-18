import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Noticia } from '@/services/noticiasService';
import NoticiaViewerSheet from '@/components/vademecum/blog/NoticiaViewerSheet';
import { resetBodyScrollLock } from '@/hooks/useBodyScrollLock';

import { AUTOPLAY_MS, FeedItem } from './carousel/carouselTypes';
import { useHomeFeed } from './carousel/useHomeFeed';
import CarouselHeaderTitle from './carousel/CarouselHeaderTitle';
import CarouselMediaCard from './carousel/CarouselMediaCard';
import CarouselDots from './carousel/CarouselDots';

interface Props {
  onOpenChange?: (open: boolean) => void;
  /** Quando false, o carrossel não avança automaticamente. */
  autoplay?: boolean;
  /** Estilo visual do carrossel */
  variant?: 'default' | 'hero';
}

function HomeNoticiasCarousel({ onOpenChange, autoplay = true, variant = 'default' }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const userInteractingRef = useRef(false);

  const { feed, feedMode } = useHomeFeed();
  const [activeIndex, setActiveIndexState] = useState(0);
  
  const setActiveIndex = useCallback((idx: number | ((prev: number) => number)) => {
    setActiveIndexState(idx);
  }, []);

  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);

  useEffect(() => {
    const hasOpen = !!selectedNoticia;
    onOpenChange?.(hasOpen);
    if (!hasOpen) {
      resetBodyScrollLock();
    }
  }, [selectedNoticia, onOpenChange]);


  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const child = scroller.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft - (scroller.clientWidth - child.clientWidth) / 2;
    scroller.scrollTo({ left: target, behavior });
  }, []);


  useEffect(() => {
    if (!autoplay || feed.length < 2) return;
    const tick = () => {
      if (userInteractingRef.current) return;
      const next = (activeIndex + 1) % feed.length;
      setActiveIndex(next);
      scrollToIndex(next);
    };
    autoplayRef.current = window.setInterval(tick, AUTOPLAY_MS);
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [autoplay, activeIndex, feed.length, scrollToIndex]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || feed.length === 0) return;

    const ratios = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.intersectionRatio);
        });

        let maxRatio = -1;
        let bestTarget: Element | null = null;
        ratios.forEach((ratio, target) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            bestTarget = target;
          }
        });

        if (bestTarget) {
          const idx = Array.from(scroller.children).indexOf(bestTarget);
          if (idx !== -1) setActiveIndex(idx);
        }
      },
      {
        root: scroller,
        threshold: Array.from({ length: 11 }, (_, i) => i / 10),
      }
    );

    Array.from(scroller.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [feed.length]);

  const pauseAutoplay = () => {
    userInteractingRef.current = true;
    window.setTimeout(() => {
      userInteractingRef.current = false;
    }, 4000);
  };

  const handleOpen = useCallback((item: FeedItem) => {
    if (item.kind === 'noticia') {
      setSelectedNoticia(item.data);
    }
  }, []);

  if (feed.length === 0) {
    return (
      <div className="space-y-2.5">
        <div className="h-6 w-32 rounded-md bg-white/[0.04] animate-pulse mx-4" />
        <div className="flex gap-3 overflow-hidden px-4">
          <div className="shrink-0 w-full h-[140px] rounded-2xl bg-card/60 animate-pulse aspect-[16/9] sm:aspect-[21/9]" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${variant === 'hero' ? 'max-w-[340px]' : ''}`}>
      {variant === 'default' && <CarouselHeaderTitle kind="noticia" />}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={feedMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          ref={scrollerRef}
          onPointerDown={pauseAutoplay}
          onTouchStart={pauseAutoplay}
          className={`flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            variant === 'hero' ? 'gap-4 px-0' : 'gap-3 md:gap-4 px-[7.5%] md:px-[4%] lg:px-[3%]'
          }`}
        >
          {feed.map((item, i) => (
            <CarouselMediaCard
              key={item.id}
              item={item}
              isActive={i === activeIndex}
              index={i}
              onOpen={handleOpen}
              variant={variant}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {variant === 'default' && <CarouselDots total={feed.length} activeIndex={activeIndex} />}

      <NoticiaViewerSheet noticia={selectedNoticia} onClose={() => setSelectedNoticia(null)} />
    </div>
  );
}

export default memo(HomeNoticiasCarousel);

