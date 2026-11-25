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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

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
    if (!isReady) {
      // Inicia sempre centralizado em Vade Mecum (cópia do meio)
      const initialIndex = ITEMS.length * 2;
      setActiveIndex(initialIndex);
      const t = setTimeout(() => {
        scrollToIndex(initialIndex, 'instant' as ScrollBehavior);
        setIsReady(true);
      }, 40);
      return () => clearTimeout(t);
    }
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
    <section className="space-y-3">
      <div className="px-1">
        <h3 className="font-display text-white text-[14.5px] sm:text-[15.5px] font-bold flex items-center gap-2 uppercase tracking-[0.05em]">
          <span className="w-1 h-4 rounded-full bg-primary shrink-0 shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />
          <span className="truncate">EM ALTA</span>
        </h3>
      </div>

      {/* Carrossel Infinito com Zoom no Card Central (mesma técnica de Leis em Alta) */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-[calc(50%-72px)] sm:px-[calc(50%-82px)] flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
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
              className={`snap-center shrink-0 w-[144px] sm:w-[164px] text-left cursor-pointer focus-visible:outline-none relative rounded-2xl bg-[#252528] hover:bg-[#2F2F33] border transition-all duration-300 ease-out p-3.5 sm:p-4 flex flex-col justify-between min-h-[112px] sm:min-h-[120px] ${
                isActive
                  ? 'scale-[1.10] opacity-100 z-10 shadow-xl border-white/25 ring-1 ring-white/15'
                  : 'scale-[0.88] opacity-65 z-0 shadow-sm border-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon
                  className={`w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-white/80'
                  }`}
                  strokeWidth={1.8}
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
