import { memo, useRef, useEffect, useCallback } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { AprenderItem } from './aprenderCarouselTypes';

interface AprenderCarousel3DProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

export const AprenderCarousel3D = memo(({ items, onItemClick }: AprenderCarousel3DProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startScroll: number; moved: number; isDragging: boolean } | null>(null);
  const rafId = useRef<number | null>(null);

  // Guarda o índice aleatório inicial para não mudar em re-renders da mesma montagem
  const randomStartIndexRef = useRef<number | null>(null);
  if (randomStartIndexRef.current === null && items && items.length > 0) {
    randomStartIndexRef.current = Math.floor(Math.random() * items.length);
  }

  // 🎯 Atualiza o card centralizado aplicando o zoom e ativando a animação de reflexo vítreo
  const updateCenterCard = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const cards = el.querySelectorAll<HTMLElement>('[data-carousel-card]');
    if (cards.length === 0) return;

    const containerRect = el.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestCard: HTMLElement | null = null;
    let minDistance = Infinity;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cardRect = card.getBoundingClientRect();

      // Otimização: desativa cards fora da tela
      if (cardRect.right < containerRect.left - 120 || cardRect.left > containerRect.right + 120) {
        if (card.getAttribute('data-is-center') === 'true') {
          card.setAttribute('data-is-center', 'false');
        }
        continue;
      }

      const cardCenter = cardRect.left + cardRect.width / 2;
      const dist = Math.abs(cardCenter - containerCenter);

      if (dist < minDistance) {
        minDistance = dist;
        closestCard = card;
      }
    }

    if (closestCard) {
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const isCenter = card === closestCard;
        const currentVal = card.getAttribute('data-is-center') === 'true';
        if (isCenter !== currentVal) {
          card.setAttribute('data-is-center', isCenter ? 'true' : 'false');
        }
      }
    }
  }, []);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // Listener de resize da janela para manter o alinhamento
  useEffect(() => {
    const handleResize = () => {
      updateCenterCard();
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateCenterCard]);

  if (!items || items.length === 0) return null;

  // Triplica os items para permitir scroll infinito sem saltos
  const duplicatedItems = [...items, ...items, ...items];
  const targetCardIndex = items.length + (randomStartIndexRef.current ?? 0);

  // 🎯 Centraliza a capa aleatória no meio exato ao montar
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const centerTargetCard = () => {
      const cards = el.querySelectorAll<HTMLElement>('[data-carousel-card]');
      const targetCard = cards[targetCardIndex];
      if (targetCard) {
        const elRect = el.getBoundingClientRect();
        const cardRect = targetCard.getBoundingClientRect();
        const scrollTarget = el.scrollLeft + (cardRect.left - elRect.left) - (el.clientWidth / 2) + (targetCard.clientWidth / 2);
        el.scrollLeft = scrollTarget;
      } else {
        const oneSetWidth = el.scrollWidth / 3;
        if (oneSetWidth > 0 && el.scrollLeft === 0) {
          el.scrollLeft = oneSetWidth;
        }
      }
      updateCenterCard();
    };

    centerTargetCard();
    const t1 = setTimeout(centerTargetCard, 40);
    const t2 = setTimeout(centerTargetCard, 140);
    const t3 = setTimeout(centerTargetCard, 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [items.length, targetCardIndex, updateCenterCard]);

  // Wrap-around contínuo durante scroll manual (touch ou drag) sincronizado ao V-Sync
  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const oneSetWidth = el.scrollWidth / 3;
    if (oneSetWidth > 0) {
      if (el.scrollLeft < oneSetWidth * 0.25) {
        el.scrollLeft += oneSetWidth;
      } else if (el.scrollLeft > oneSetWidth * 2.25) {
        el.scrollLeft -= oneSetWidth;
      }
    }

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        updateCenterCard();
      });
    }
  }, [updateCenterCard]);

  // Mouse Drag (Desktop)
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
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
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          rafId.current = null;
          updateCenterCard();
        });
      }
    }
  }, [updateCenterCard]);

  const endMouseDrag = useCallback(() => {
    if (dragRef.current) {
      setTimeout(() => {
        dragRef.current = null;
      }, 50);
    }
  }, []);

  // Touch Handlers (Mobile)
  const onTouchEnd = useCallback(() => {
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        updateCenterCard();
      });
    }
  }, [updateCenterCard]);

  const scrollByAmount = useCallback((direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(updateCenterCard, 350);
  }, [updateCenterCard]);

  const handleCardClick = useCallback((item: AprenderItem) => {
    onItemClick(item);
  }, [onItemClick]);

  return (
    <div className="group relative w-full pt-1 pb-3 overflow-hidden">
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

      {/* Máscaras de gradiente suaves */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endMouseDrag}
        onMouseLeave={endMouseDrag}
        onTouchEnd={onTouchEnd}
        className="relative flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 py-4 cursor-grab active:cursor-grabbing select-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {duplicatedItems.map((item, idx) => {
          const isClone = idx < items.length || idx >= items.length * 2;
          return (
          <button
            key={`${item.id}-${idx}`}
            type="button"
            data-carousel-card="true"
            data-is-center="false"
            aria-hidden={isClone}
            tabIndex={isClone ? -1 : 0}
            onClick={(e) => {
              if (dragRef.current && dragRef.current.moved > 6) {
                e.preventDefault();
                return;
              }
              handleCardClick(item);
            }}
            className="group relative shrink-0 w-[calc(42vw-12px)] max-w-[150px] min-w-[130px] h-44 sm:w-36 sm:h-48 md:w-40 md:h-56 rounded-2xl overflow-hidden cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
              will-change-transform
              transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]

              /* Estado Padrão (Laterais / Fora do Centro) */
              scale-[0.92] sm:scale-[0.93] opacity-75 translate-y-0 z-10
              border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.45)]
              hover:opacity-90 hover:scale-[0.96]

              /* Estado CENTRALIZADO: Zoom e Relevo sem contorno branco */
              data-[is-center=true]:scale-[1.08] sm:data-[is-center=true]:scale-[1.10]
              data-[is-center=true]:-translate-y-2.5
              data-[is-center=true]:opacity-100
              data-[is-center=true]:z-20
              data-[is-center=true]:border-white/15
              data-[is-center=true]:shadow-[0_22px_44px_-6px_rgba(0,0,0,0.85)]
              active:scale-[1.02]
            "
          >
            <img
              src={item.image}
              alt={item.fullName}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              draggable={false}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-data-[is-center=true]:scale-105 pointer-events-none select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none transition-opacity duration-300 group-data-[is-center=true]:from-black/75" />
            
            {/* Animação de Reflexo Vítreo (Glass Sheen / Shimmer) no card central */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-2xl opacity-0 group-data-[is-center=true]:opacity-100 transition-opacity duration-700">
              {/* Feixe de luz diagonal animado que varre suavemente a superfície */}
              <div
                className="absolute -inset-y-6 w-full pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.04) 38%, rgba(255, 255, 255, 0.35) 48%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0.35) 52%, rgba(255, 255, 255, 0.04) 62%, transparent 80%)',
                  animation: 'shimmer-reflect-loop 3.2s ease-in-out infinite',
                  mixBlendMode: 'screen',
                }}
              />
              {/* Brilho superior de reflexo especular */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 via-white/[0.02] to-transparent pointer-events-none" />
            </div>

            {/* Play Button (Glassmorphism) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-transform duration-300 group-data-[is-center=true]:scale-110">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/25 backdrop-blur-md border border-white/35 group-data-[is-center=true]:border-white/60 group-data-[is-center=true]:bg-black/35 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-300">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5 transition-transform group-data-[is-center=true]:scale-105" fill="currentColor" />
              </div>
            </div>

            <div className="absolute bottom-2.5 left-2.5 right-2.5 text-left pointer-events-none z-10 transition-all duration-300">
              <span className="text-[12px] sm:text-[13px] font-bold text-white drop-shadow-md leading-tight block line-clamp-2 group-data-[is-center=true]:font-black group-data-[is-center=true]:drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                {item.fullName || item.text}
              </span>
            </div>
          </button>
        )})}
      </div>
    </div>
  );
});

AprenderCarousel3D.displayName = 'AprenderCarousel3D';
