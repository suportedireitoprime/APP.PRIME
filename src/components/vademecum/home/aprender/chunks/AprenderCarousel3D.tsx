import { memo, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Play } from 'lucide-react';
import { AprenderItem } from './aprenderCarouselTypes';

interface AprenderCarousel3DProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

export const AprenderCarousel3D = memo(({ items, onItemClick }: AprenderCarousel3DProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isInteractingRef = useRef(false);
  const interactTimeoutRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);

  // Duplica os itens 3 vezes para criar o loop circular contínuo e infinito
  const tripleItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return [...items, ...items, ...items];
  }, [items]);

  // Atualiza dinamicamente o arco circular (curvatura e rotação tangente) de cada capa
  const updateCardTransforms = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const centerX = scrollerRect.width / 2;
    const cards = scroller.querySelectorAll<HTMLElement>('[data-aprender-card="true"]');
    const maxDist = Math.max(1, scrollerRect.width * 0.58);

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2 - scrollerRect.left;
      const distX = cardCenterX - centerX;
      const t = Math.max(-1.35, Math.min(1.35, distX / maxDist));

      // Arco circular elegante: no centro eleva levemente; nas pontas desce e inclina tangencialmente
      const translateY = Math.abs(t) * Math.abs(t) * 14;
      const rotate = t * 5.5; // -5.5° à esquerda, 0° no centro, +5.5° à direita
      const scale = Math.max(0.92, 1 - Math.abs(t) * 0.05);

      card.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.transformOrigin = '50% 90%';
    });
  }, []);

  // Inicializa o scroll no terço central para permitir rolagem bidirecional imediata
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) return;

    const timer = setTimeout(() => {
      if (scroller) {
        const totalWidth = scroller.scrollWidth;
        const oneThird = totalWidth / 3;
        scroller.scrollLeft = oneThird;
        updateCardTransforms();
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [items.length, updateCardTransforms]);

  // Loop contínuo de movimentação circular ultra-suave em requestAnimationFrame
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) return;

    let lastTime = performance.now();
    const speed = 0.55; // pixels por frame a 60fps (aprox 33px/s)

    const loop = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 16.67, 2);
      lastTime = currentTime;

      if (!isInteractingRef.current && scroller) {
        scroller.scrollLeft += speed * delta;

        const totalWidth = scroller.scrollWidth;
        const oneThird = totalWidth / 3;

        if (scroller.scrollLeft >= oneThird * 2) {
          scroller.scrollLeft -= oneThird;
        } else if (scroller.scrollLeft <= 5) {
          scroller.scrollLeft += oneThird;
        }
      }

      updateCardTransforms();
      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [items.length, updateCardTransforms]);

  const pauseAutoScroll = useCallback(() => {
    isInteractingRef.current = true;
    if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current);
  }, []);

  const resumeAutoScroll = useCallback(() => {
    if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current);
    interactTimeoutRef.current = window.setTimeout(() => {
      isInteractingRef.current = false;
    }, 1800);
  }, []);

  // Normalização circular durante scroll manual ou por toque
  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) return;

    const totalWidth = scroller.scrollWidth;
    const oneThird = totalWidth / 3;

    if (scroller.scrollLeft >= oneThird * 2) {
      scroller.scrollLeft -= oneThird;
    } else if (scroller.scrollLeft <= 5) {
      scroller.scrollLeft += oneThird;
    }

    updateCardTransforms();
  }, [items.length, updateCardTransforms]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pauseAutoScroll();
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    const scroller = scrollerRef.current;
    dragStartScrollLeft.current = scroller ? scroller.scrollLeft : 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 6) {
      hasDragged.current = true;
    }
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.scrollLeft = dragStartScrollLeft.current - dx;
      updateCardTransforms();
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    resumeAutoScroll();
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden pt-2 pb-6"
      onMouseEnter={pauseAutoScroll}
      onMouseLeave={resumeAutoScroll}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={pauseAutoScroll}
        onTouchEnd={resumeAutoScroll}
        className="flex gap-3 sm:gap-3.5 overflow-x-auto select-none touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 cursor-grab active:cursor-grabbing items-start"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tripleItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            data-aprender-card="true"
            onClick={() => {
              if (!hasDragged.current) {
                onItemClick(item);
              }
            }}
            className="w-[134px] sm:w-[150px] h-[196px] sm:h-[218px] shrink-0 rounded-2xl overflow-hidden relative border border-white/10 shadow-lg shadow-black/50 bg-zinc-950 group cursor-pointer active:scale-95 transition-transform duration-100 will-change-transform"
          >
            {/* Capa normal (imagem padrão idêntica ao carrossel de notícias) */}
            <img
              src={item.image}
              alt={item.text}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500"
            />

            {/* Gradientes para contraste e elegância visual */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 pointer-events-none" />

            {/* Botão de Play circular translúcido centralizado */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl group-hover:scale-110 group-active:scale-95 transition-transform">
                <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Título da matéria no rodapé do card */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none">
              <span className="font-bold text-[13px] sm:text-[14px] text-white leading-tight line-clamp-2 drop-shadow-md">
                {item.text}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

AprenderCarousel3D.displayName = 'AprenderCarousel3D';
