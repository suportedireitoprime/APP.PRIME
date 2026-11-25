import { memo, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, BookOpen, Wrench, Bird, ChevronRight, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useTotalLivrosCount } from '@/hooks/useTotalLivrosCount';
import CarouselDots from './CarouselDots';
import HomeSectionHeader from '../sections/HomeSectionHeader';

interface EmAltaFeatureItem {
  id: string;
  label: string;
  sublabel: string;
  sublabelHighlight?: string;
  sublabelSuffix?: string;
  route: string;
  icon: LucideIcon;
}

const ITEMS: EmAltaFeatureItem[] = [
  {
    id: 'vade-mecum',
    label: 'Vade Mecum',
    sublabel: 'Legislação',
    sublabelHighlight: 'atualizada',
    route: '/vade-mecum',
    icon: Scale,
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca',
    sublabel: 'Obras',
    route: '/bibliotecas',
    icon: BookOpen,
  },
  {
    id: 'ferramentas',
    label: 'Ferramentas',
    sublabel: 'Utilitários',
    route: '/ferramentas',
    icon: Wrench,
  },
  {
    id: 'horus',
    label: 'Hórus',
    sublabel: 'Assistente IA',
    route: '/assistente-horus',
    icon: Bird,
  },
];

const HomeEmAltaCardsCarousel = () => {
  const navigate = useNavigate();
  const { data: totalLivros = 2000 } = useTotalLivrosCount();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const initialIndex = ITEMS.length * 2;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeIndexRef = useRef(initialIndex);
  const [isReady, setIsReady] = useState(false);
  const readyRef = useRef(false);
  const isDraggingRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const childMidpointsRef = useRef<number[]>([]);

  // Duplica 5x para rolagem infinita suave para ambos os lados
  const loopedItems = useMemo(() => {
    const resolved = ITEMS.map((item) =>
      item.id === 'biblioteca'
        ? {
            ...item,
            sublabel: 'Mais de',
            sublabelHighlight: totalLivros.toLocaleString('pt-BR'),
            sublabelSuffix: 'livros',
          }
        : item,
    );
    return [...resolved, ...resolved, ...resolved, ...resolved, ...resolved];
  }, [totalLivros]);

  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({ left: target, behavior });
  }, []);

  useEffect(() => {
    if (isReady) return;
    const t = setTimeout(() => {
      const el = scrollerRef.current;
      if (el) {
        const mids: number[] = [];
        for (let i = 0; i < el.children.length; i++) {
          const child = el.children[i] as HTMLElement;
          mids.push(child.offsetLeft + child.clientWidth / 2);
        }
        childMidpointsRef.current = mids;
        scrollToIndex(initialIndex, 'instant' as ScrollBehavior);
      }
      activeIndexRef.current = initialIndex;
      setActiveIndex(initialIndex);
      setIsReady(true);
      requestAnimationFrame(() => {
        readyRef.current = true;
      });
    }, 60);
    return () => clearTimeout(t);
  }, [initialIndex, isReady, scrollToIndex]);

  const settleWrapAround = useCallback(() => {
    if (!readyRef.current || isDraggingRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const mids = childMidpointsRef.current;
    if (mids.length === 0) return;

    const current = activeIndexRef.current;
    const N = ITEMS.length;
    const halfWidth = el.clientWidth / 2;

    if (current <= 1) {
      const jumpTo = current + N * 2;
      if (mids[jumpTo] !== undefined) {
        el.scrollTo({ left: mids[jumpTo] - halfWidth, behavior: 'auto' });
        activeIndexRef.current = jumpTo;
        setActiveIndex(jumpTo);
      }
    } else if (current >= loopedItems.length - 2) {
      const jumpTo = current - N * 2;
      if (mids[jumpTo] !== undefined) {
        el.scrollTo({ left: mids[jumpTo] - halfWidth, behavior: 'auto' });
        activeIndexRef.current = jumpTo;
        setActiveIndex(jumpTo);
      }
    }
  }, [loopedItems.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => {
      const mids: number[] = [];
      for (let i = 0; i < el.children.length; i++) {
        const child = el.children[i] as HTMLElement;
        mids.push(child.offsetLeft + child.clientWidth / 2);
      }
      childMidpointsRef.current = mids;
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);

    const onScrollEnd = () => settleWrapAround();
    el.addEventListener('scrollend', onScrollEnd);

    return () => {
      ro?.disconnect();
      el.removeEventListener('scrollend', onScrollEnd);
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    };
  }, [loopedItems.length, settleWrapAround]);

  const handleScroll = useCallback(() => {
    if (!readyRef.current) return;

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(settleWrapAround, 120);

    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollerRef.current;
      if (!el) return;
      const mids = childMidpointsRef.current;
      if (mids.length === 0) return;

      const halfWidth = el.clientWidth / 2;
      const center = el.scrollLeft + halfWidth;
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

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(settleWrapAround, 120);
  }, [settleWrapAround]);

  return (
    <section className="flex flex-col gap-2.5">
      <HomeSectionHeader
        title="EM ALTA"
        subtitle="Principais recursos para seus estudos"
      />

      {/* Carrossel Infinito com Zoom no Card Central (otimizado para 120fps) */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={handleDragStart}
        onTouchStart={handleDragStart}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        onTouchEnd={handleDragEnd}
        onTouchCancel={handleDragEnd}
        className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-[calc(50%-74px)] sm:px-[calc(50%-81px)] flex gap-2 sm:gap-2.5 overflow-x-auto overscroll-x-contain touch-pan-x snap-x snap-mandatory py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
        style={{ visibility: isReady ? 'visible' : 'hidden' }}
      >
        {loopedItems.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;

          return (
            <button
              key={`${item.id}-${i}`}
              type="button"
              onClick={() => {
                haptic.selection();
                activeIndexRef.current = i;
                setActiveIndex(i);
                navigate(item.route);
              }}
              data-track="home_card_click"
              data-track-name={item.label}
              data-track-section="em_alta"
              className={`snap-center shrink-0 w-[148px] sm:w-[162px] h-[116px] sm:h-[122px] text-left cursor-pointer focus-visible:outline-none relative rounded-2xl bg-card hover:bg-secondary/60 border border-border/60 transition-[transform,opacity] duration-200 ease-out transform-gpu p-3.5 flex flex-col justify-between ${
                isActive
                  ? 'scale-[1.08] opacity-100 z-10 shadow-xl'
                  : 'scale-[0.92] opacity-75 z-0 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon
                  className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 origin-center transition-transform duration-200 ease-out text-primary ${
                    isActive
                      ? 'scale-110 drop-shadow-[0_2px_8px_hsl(var(--primary)/0.45)]'
                      : 'scale-100 opacity-85'
                  }`}
                  strokeWidth={1.4}
                />
                <ChevronRight className="w-4 h-4 text-white/35 shrink-0" />
              </div>

              <div className="pt-3">
                <p className="font-display text-white text-sm sm:text-[15px] font-bold leading-tight truncate">
                  {item.label}
                </p>
                <p className="font-body text-white/55 text-[10.5px] sm:text-[11.5px] leading-snug truncate mt-0.5">
                  {item.sublabel}
                  {item.sublabelHighlight && (
                    <> <span className="text-primary font-semibold">{item.sublabelHighlight}</span></>
                  )}
                  {item.sublabelSuffix && ` ${item.sublabelSuffix}`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <CarouselDots total={ITEMS.length} activeIndex={activeIndex % ITEMS.length} />
    </section>
  );
};

export default memo(HomeEmAltaCardsCarousel);
