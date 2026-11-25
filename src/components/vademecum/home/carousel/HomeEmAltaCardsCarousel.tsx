import { memo, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, BookOpen, Wrench, ChevronRight, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import CarouselDots from './CarouselDots';

interface EmAltaFeatureItem {
  id: string;
  label: string;
  sublabel: string;
  route: string;
  icon: LucideIcon;
}

const ITEMS: EmAltaFeatureItem[] = [
  {
    id: 'vade-mecum',
    label: 'Vade Mecum',
    sublabel: 'Leis e Códigos',
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
];

const HomeEmAltaCardsCarousel = () => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(ITEMS.length * 2);
  const [isReady, setIsReady] = useState(false);
  const readyRef = useRef(false);

  // Duplica 5x para rolagem infinita suave para ambos os lados
  const loopedItems = useMemo(
    () => [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS],
    [],
  );

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
    const initialIndex = ITEMS.length * 2; // Vade Mecum centralizado
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
      setActiveIndex(initialIndex);
      setIsReady(true);
      requestAnimationFrame(() => {
        readyRef.current = true;
      });
    }, 60);
    return () => clearTimeout(t);
  }, [isReady, scrollToIndex]);

  const scrollRafRef = useRef<number | null>(null);
  const childMidpointsRef = useRef<number[]>([]);

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
    return () => {
      ro?.disconnect();
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [loopedItems.length]);

  const handleScroll = useCallback(() => {
    if (!readyRef.current) return;
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

      const N = ITEMS.length;
      if (best <= 1) {
        const jumpTo = best + N * 2;
        if (mids[jumpTo] !== undefined) {
          el.scrollTo({ left: mids[jumpTo] - halfWidth, behavior: 'auto' });
          setActiveIndex(jumpTo);
          return;
        }
      } else if (best >= loopedItems.length - 2) {
        const jumpTo = best - N * 2;
        if (mids[jumpTo] !== undefined) {
          el.scrollTo({ left: mids[jumpTo] - halfWidth, behavior: 'auto' });
          setActiveIndex(jumpTo);
          return;
        }
      }

      setActiveIndex(best);
    });
  }, [loopedItems.length]);

  return (
    <section className="flex flex-col gap-3.5">
      <div className="relative z-10 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-white text-[14.5px] sm:text-[15.5px] font-bold flex items-center gap-2 uppercase tracking-[0.05em]">
            <span className="w-1 h-4 rounded-full bg-primary shrink-0 shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />
            <span className="truncate">EM ALTA</span>
          </h3>
          <p className="font-sans text-white/50 text-[11.5px] sm:text-[12px] leading-snug ml-3 truncate mt-0.5">
            Principais recursos para seus estudos
          </p>
        </div>
      </div>

      {/* Carrossel Infinito com Zoom no Card Central (mesmo tamanho de Leis em Alta) */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-[calc(50%-74px)] sm:px-[calc(50%-81px)] flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
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
                setActiveIndex(i);
                navigate(item.route);
              }}
              data-track="home_card_click"
              data-track-name={item.label}
              data-track-section="em_alta"
              className={`snap-center shrink-0 w-[148px] sm:w-[162px] h-[116px] sm:h-[122px] text-left cursor-pointer focus-visible:outline-none relative rounded-2xl bg-card hover:bg-secondary/60 border border-border/60 transition-all duration-300 ease-out p-3.5 flex flex-col justify-between ${
                isActive
                  ? 'scale-[1.06] opacity-100 z-10 shadow-xl'
                  : 'scale-100 opacity-75 z-0 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon
                  className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 origin-center transition-transform duration-300 ease-out text-primary ${
                    isActive
                      ? 'scale-110 drop-shadow-[0_2px_8px_hsl(var(--primary)/0.45)]'
                      : 'scale-100 opacity-85'
                  }`}
                  strokeWidth={1.75}
                />
                <ChevronRight className="w-4 h-4 text-white/35 shrink-0" />
              </div>

              <div className="pt-3">
                <p className="font-display text-white text-sm sm:text-[15px] font-bold leading-tight truncate">
                  {item.label}
                </p>
                <p className="font-body text-white/55 text-[11px] sm:text-xs leading-snug truncate mt-0.5">
                  {item.sublabel}
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
