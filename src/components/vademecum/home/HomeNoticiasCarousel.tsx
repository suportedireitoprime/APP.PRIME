import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
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
  const interactionTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const childMidpointsRef = useRef<number[]>([]);
  const readyRef = useRef(false);

  const { feed, hasLoadedNoticias } = useHomeFeed();
  const isInfinite = feed.length >= 2;

  const loopedFeed = useMemo(
    () => (isInfinite ? [...feed, ...feed, ...feed] : feed),
    [feed, isInfinite],
  );

  const [activeIndex, setActiveIndex] = useState(() => (isInfinite ? feed.length : 0));
  const activeIndexRef = useRef(isInfinite ? feed.length : 0);
  const [isReady, setIsReady] = useState(false);
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

  // Posiciona inicialmente na primeira notícia da cópia central para permitir loop infinito nos dois sentidos
  useEffect(() => {
    if (feed.length === 0) return;
    readyRef.current = false;
    setIsReady(false);
    const initialIdx = isInfinite ? feed.length : 0;

    const t = window.setTimeout(() => {
      const scroller = scrollerRef.current;
      if (scroller) {
        const mids: number[] = [];
        for (let i = 0; i < scroller.children.length; i++) {
          const child = scroller.children[i] as HTMLElement;
          mids.push(child.offsetLeft + child.clientWidth / 2);
        }
        childMidpointsRef.current = mids;
        scrollToIndex(initialIdx, 'auto');
      }
      activeIndexRef.current = initialIdx;
      setActiveIndex(initialIdx);
      setIsReady(true);
      requestAnimationFrame(() => {
        readyRef.current = true;
      });
    }, 60);

    return () => window.clearTimeout(t);
  }, [feed.length, isInfinite, scrollToIndex]);

  const settleWrapAround = useCallback(() => {
    if (!readyRef.current || !isInfinite || isDraggingRef.current) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const mids = childMidpointsRef.current;
    if (mids.length === 0) return;

    const current = activeIndexRef.current;
    const n = feed.length;
    const halfWidth = scroller.clientWidth / 2;

    if (current < n) {
      const jumpTo = current + n;
      if (mids[jumpTo] !== undefined) {
        scroller.scrollTo({ left: mids[jumpTo] - halfWidth, behavior: 'auto' });
        activeIndexRef.current = jumpTo;
        setActiveIndex(jumpTo);
      }
    } else if (current >= n * 2) {
      const jumpTo = current - n;
      if (mids[jumpTo] !== undefined) {
        scroller.scrollTo({ left: mids[jumpTo] - halfWidth, behavior: 'auto' });
        activeIndexRef.current = jumpTo;
        setActiveIndex(jumpTo);
      }
    }
  }, [feed.length, isInfinite]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || loopedFeed.length === 0) return;

    const measure = () => {
      const mids: number[] = [];
      for (let i = 0; i < scroller.children.length; i++) {
        const child = scroller.children[i] as HTMLElement;
        mids.push(child.offsetLeft + child.clientWidth / 2);
      }
      childMidpointsRef.current = mids;
    };

    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(scroller);

    const onScrollEnd = () => settleWrapAround();
    scroller.addEventListener('scrollend', onScrollEnd);

    return () => {
      ro?.disconnect();
      scroller.removeEventListener('scrollend', onScrollEnd);
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      if (interactionTimerRef.current !== null) window.clearTimeout(interactionTimerRef.current);
    };
  }, [loopedFeed.length, settleWrapAround]);

  const handleScroll = useCallback(() => {
    if (!readyRef.current) return;

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(settleWrapAround, 120);

    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const mids = childMidpointsRef.current;
      if (mids.length === 0) return;

      const halfWidth = scroller.clientWidth / 2;
      const center = scroller.scrollLeft + halfWidth;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < mids.length; i++) {
        const dist = Math.abs(mids[i] - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }

      if (best !== activeIndexRef.current) {
        activeIndexRef.current = best;
        setActiveIndex(best);
      }
    });
  }, [settleWrapAround]);

  useEffect(() => {
    if (!autoplay || feed.length < 2) return;
    const tick = () => {
      if (userInteractingRef.current || isDraggingRef.current) return;
      const next = activeIndexRef.current + 1;
      activeIndexRef.current = next;
      setActiveIndex(next);
      scrollToIndex(next, 'smooth');
    };
    autoplayRef.current = window.setInterval(tick, AUTOPLAY_MS);
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [autoplay, feed.length, scrollToIndex]);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    userInteractingRef.current = true;
    if (interactionTimerRef.current !== null) {
      window.clearTimeout(interactionTimerRef.current);
    }
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    if (interactionTimerRef.current !== null) {
      window.clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = window.setTimeout(() => {
      userInteractingRef.current = false;
    }, 4000);
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(settleWrapAround, 120);
  }, [settleWrapAround]);

  const handleOpen = useCallback((item: FeedItem) => {
    setSelectedNoticia(item.data);
  }, []);

  if (feed.length === 0) {
    if (hasLoadedNoticias) return null;
    return (
      <div className="space-y-2.5">
        <div className="h-6 w-32 rounded-md bg-white/[0.04] animate-pulse mx-4" />
        <div className="flex gap-3 overflow-hidden px-4">
          <div className="shrink-0 w-full h-[140px] rounded-2xl bg-card/60 animate-pulse aspect-[16/9] sm:aspect-[21/9]" />
        </div>
      </div>
    );
  }

  const normalizedActiveIndex = feed.length > 0 ? activeIndex % feed.length : 0;

  return (
    <div
      className={`space-y-3.5 ${variant === 'hero' ? 'max-w-[340px]' : ''}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 280px' }}
    >
      {variant === 'default' && <CarouselHeaderTitle kind="noticia" />}

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={handleDragStart}
        onTouchStart={handleDragStart}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        onTouchEnd={handleDragEnd}
        onTouchCancel={handleDragEnd}
        style={{ visibility: isReady ? 'visible' : 'hidden' }}
        className={`flex items-stretch overflow-x-auto overscroll-x-contain touch-pan-x touch-pan-y snap-x snap-mandatory pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none ${
          variant === 'hero'
            ? 'gap-4 px-0'
            : '-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 gap-3 md:gap-4 px-[7.5%] md:px-[4%] lg:px-[3%]'
        }`}
      >
        {loopedFeed.map((item, i) => (
          <CarouselMediaCard
            key={`${item.id}-${i}`}
            item={item}
            isActive={i === activeIndex}
            index={i % feed.length}
            onOpen={handleOpen}
            variant={variant}
          />
        ))}
      </div>

      {variant === 'default' && (
        <CarouselDots total={feed.length} activeIndex={normalizedActiveIndex} />
      )}

      <NoticiaViewerSheet noticia={selectedNoticia} onClose={() => setSelectedNoticia(null)} />
    </div>
  );
}

export default memo(HomeNoticiasCarousel);
