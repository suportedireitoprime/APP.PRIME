import { memo, useRef, useEffect, useCallback } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { AprenderItem } from './aprenderCarouselTypes';

interface AprenderCarousel3DProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

export const AprenderCarousel3D = memo(({ items, onItemClick }: AprenderCarousel3DProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isInteracting = useRef(false);
  const isHovered = useRef(false);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragRef = useRef<{ startX: number; startScroll: number; moved: number; isDragging: boolean } | null>(null);

  if (!items || items.length === 0) return null;

  // Triplica os items para criar o efeito infinito perfeito
  const duplicatedItems = [...items, ...items, ...items];

  const pauseInteraction = useCallback((durationMs = 3000) => {
    isInteracting.current = true;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      if (!dragRef.current?.isDragging && !isHovered.current) {
        isInteracting.current = false;
      }
    }, durationMs);
  }, []);

  // Inicializa a posição de scroll no meio para permitir drag em ambas as direções
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const initMiddle = () => {
      const oneSetWidth = el.scrollWidth / 3;
      if (oneSetWidth > 0 && el.scrollLeft === 0) {
        el.scrollLeft = oneSetWidth;
      }
    };
    const timer = setTimeout(initMiddle, 50);
    return () => clearTimeout(timer);
  }, [items.length]);

  // Wrap-around contínuo durante scroll manual (touch ou drag)
  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const oneSetWidth = el.scrollWidth / 3;
    if (oneSetWidth <= 0) return;

    if (el.scrollLeft < oneSetWidth * 0.25) {
      el.scrollLeft += oneSetWidth;
    } else if (el.scrollLeft > oneSetWidth * 2.25) {
      el.scrollLeft -= oneSetWidth;
    }
  }, []);

  // Auto-scroll suave com requestAnimationFrame quando não estiver interagindo
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      const el = scrollerRef.current;
      if (el && !isInteracting.current && !isHovered.current && delta < 100) {
        el.scrollLeft += delta * 0.035; // ~35px por segundo para leitura suave e elegante

        const oneSetWidth = el.scrollWidth / 3;
        if (oneSetWidth > 0 && el.scrollLeft >= oneSetWidth * 2.25) {
          el.scrollLeft -= oneSetWidth;
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  // Mouse Drag (Desktop)
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    isInteracting.current = true;
    dragRef.current = {
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
      isDragging: true,
    };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = scrollerRef.current;
    if (!d || !d.isDragging || !el) return;
    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));
    if (d.moved > 3) {
      el.scrollLeft = d.startScroll - dx;
    }
  }, []);

  const endMouseDrag = useCallback(() => {
    if (dragRef.current) {
      setTimeout(() => {
        dragRef.current = null;
      }, 50);
      pauseInteraction(2500);
    }
  }, [pauseInteraction]);

  // Touch Handlers (Mobile)
  const onTouchStart = useCallback(() => {
    isInteracting.current = true;
  }, []);

  const onTouchEnd = useCallback(() => {
    pauseInteraction(3000);
  }, [pauseInteraction]);

  const onMouseEnter = useCallback(() => {
    isHovered.current = true;
  }, []);

  const onMouseLeave = useCallback(() => {
    isHovered.current = false;
    endMouseDrag();
  }, [endMouseDrag]);

  const scrollByAmount = useCallback((direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    isInteracting.current = true;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    pauseInteraction(3000);
  }, [pauseInteraction]);

  return (
    <div className="group relative w-full pt-1 pb-4 overflow-hidden">
      {/* Botões de Navegação Desktop */}
      <button
        onClick={(e) => { e.preventDefault(); scrollByAmount('left'); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-black/80 shadow-lg backdrop-blur-sm"
        aria-label="Rolar para esquerda"
      >
        <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); scrollByAmount('right'); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:bg-black/80 shadow-lg backdrop-blur-sm"
        aria-label="Rolar para direita"
      >
        <ChevronRight className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
      </button>

      {/* Máscaras de gradiente para suavizar as bordas (fade-out) */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endMouseDrag}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={onMouseEnter}
        className="flex gap-3 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-3 py-1 cursor-grab active:cursor-grabbing select-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {duplicatedItems.map((item, idx) => (
          <button
            key={`${item.id}-${idx}`}
            type="button"
            onClick={(e) => {
              if (dragRef.current && dragRef.current.moved > 6) {
                e.preventDefault();
                return;
              }
              onItemClick(item);
            }}
            className="group relative shrink-0 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden shadow-lg border border-white/10 active:scale-[0.98] transition-all focus:outline-none hover:shadow-xl hover:border-white/20 select-none"
          >
            <img
              src={item.image}
              alt={item.fullName}
              loading="lazy"
              draggable={false}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-80" />
            
            {/* Play Button (Glassmorphism) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-transform duration-300 group-hover:scale-110">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" fill="currentColor" />
              </div>
            </div>

            <div className="absolute bottom-2 left-2 right-2 text-left pointer-events-none z-10">
              <span className="text-[12px] sm:text-[13px] font-bold text-white drop-shadow-md leading-tight block line-clamp-2">
                {item.fullName || item.text}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

AprenderCarousel3D.displayName = 'AprenderCarousel3D';
