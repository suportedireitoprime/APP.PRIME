import { memo, useRef, useEffect, useCallback, useMemo } from 'react';
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
  const scrollSettleTimeoutRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const rafScrollRef = useRef<number | null>(null);
  const currentScrollRef = useRef(0);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const isDraggingMouse = useRef(false);
  const hasDragged = useRef(false);

  // Duplica os itens 3 vezes para criar o loop circular contínuo e infinito
  const tripleItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return [...items, ...items, ...items];
  }, [items]);

  // Atualiza a curvatura do arco circular matematicamente
  // Sem getBoundingClientRect (zero layout thrashing) e sem transições CSS conflitantes
  const updateCardTransforms = useCallback((scrollPos: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const viewportWidth = scroller.clientWidth;
    if (!viewportWidth) return;

    const centerX = viewportWidth / 2;
    const cards = scroller.children;
    const count = cards.length;
    if (count === 0) return;

    const firstCard = cards[0] as HTMLElement | undefined;
    const cardWidth = firstCard?.offsetWidth || 124;
    const gap = 12; // gap-3 = 12px
    const stride = cardWidth + gap;
    const paddingLeft = 16; // px-4 = 16px
    const maxDist = viewportWidth * 0.62;

    for (let i = 0; i < count; i++) {
      const card = cards[i] as HTMLElement;
      if (!card) continue;

      const cardCenterX = paddingLeft + i * stride + cardWidth / 2 - scrollPos;
      const distX = cardCenterX - centerX;

      // Se o card estiver fora da visualização com margem de segurança, desativa transform
      if (Math.abs(distX) > viewportWidth * 1.1) {
        card.style.transform = 'none';
        continue;
      }

      const t = Math.max(-1.25, Math.min(1.25, distX / maxDist));

      // Curvatura circular suave e estável (arco sutil com centro em destaque)
      const translateY = Math.abs(t) * Math.abs(t) * 9.5;
      const rotate = t * 3.8; // -3.8° à esquerda, 0° no centro, +3.8° à direita
      const scale = Math.max(0.92, 1 - Math.abs(t) * 0.045);

      card.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.transformOrigin = '50% 100%';
    }
  }, []);

  // Inicializa a rolagem no centro com medição assíncrona
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) return;

    const timer = setTimeout(() => {
      if (scroller) {
        const totalWidth = scroller.scrollWidth;
        const oneThird = totalWidth / 3;
        scroller.scrollLeft = oneThird;
        currentScrollRef.current = oneThird;
        updateCardTransforms(oneThird);
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [items.length, updateCardTransforms]);

  // Loop contínuo com acumulador suave quando não houver interação do usuário
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) return;

    let lastTime = performance.now();
    const speed = 0.5; // pixels por frame a 60fps

    const loop = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 16.67, 2);
      lastTime = currentTime;

      if (!isInteractingRef.current && scroller) {
        currentScrollRef.current += speed * delta;

        const totalWidth = scroller.scrollWidth;
        const oneThird = totalWidth / 3;

        if (currentScrollRef.current >= oneThird * 2) {
          currentScrollRef.current -= oneThird;
        } else if (currentScrollRef.current <= 5) {
          currentScrollRef.current += oneThird;
        }

        scroller.scrollLeft = currentScrollRef.current;
        updateCardTransforms(currentScrollRef.current);
      }

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
    }, 2200);
  }, []);

  // Sincronização durante rolagem nativa
  // Re-centraliza o carrossel apenas quando o usuário terminar a rolagem para evitar solavancos
  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) return;

    currentScrollRef.current = scroller.scrollLeft;

    if (rafScrollRef.current) cancelAnimationFrame(rafScrollRef.current);
    rafScrollRef.current = requestAnimationFrame(() => {
      updateCardTransforms(currentScrollRef.current);
    });

    // Quando o scroll estabilizar, normaliza a posição se tiver saído do terço central
    if (scrollSettleTimeoutRef.current) clearTimeout(scrollSettleTimeoutRef.current);
    scrollSettleTimeoutRef.current = window.setTimeout(() => {
      if (!scroller) return;
      const totalWidth = scroller.scrollWidth;
      const oneThird = totalWidth / 3;

      if (scroller.scrollLeft >= oneThird * 2) {
        scroller.scrollLeft -= oneThird;
        currentScrollRef.current = scroller.scrollLeft;
        updateCardTransforms(currentScrollRef.current);
      } else if (scroller.scrollLeft <= 20) {
        scroller.scrollLeft += oneThird;
        currentScrollRef.current = scroller.scrollLeft;
        updateCardTransforms(currentScrollRef.current);
      }
    }, 200);
  }, [items.length, updateCardTransforms]);

  // Arraste com o mouse no Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    pauseAutoScroll();
    isDraggingMouse.current = true;
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    const scroller = scrollerRef.current;
    dragStartScrollLeft.current = scroller ? scroller.scrollLeft : 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingMouse.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 5) {
      hasDragged.current = true;
    }
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.scrollLeft = dragStartScrollLeft.current - dx;
      currentScrollRef.current = scroller.scrollLeft;
      updateCardTransforms(currentScrollRef.current);
    }
  };

  const handleMouseUp = () => {
    isDraggingMouse.current = false;
    resumeAutoScroll();
  };

  // Interação de toque em celulares e tablets
  const handleTouchStart = () => {
    pauseAutoScroll();
    hasDragged.current = false;
  };

  const handleTouchMove = () => {
    hasDragged.current = true;
  };

  const handleTouchEnd = () => {
    resumeAutoScroll();
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden pt-1 pb-5"
      onMouseEnter={pauseAutoScroll}
      onMouseLeave={resumeAutoScroll}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="flex gap-3 overflow-x-auto select-none touch-pan-x overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 cursor-grab active:cursor-grabbing items-start"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tripleItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            onClick={() => {
              if (!hasDragged.current) {
                onItemClick(item);
              }
            }}
            className="w-[124px] sm:w-[140px] h-[180px] sm:h-[204px] shrink-0 overflow-hidden relative border border-white/10 shadow-md shadow-black/40 bg-zinc-950 cursor-pointer will-change-transform [isolation:isolate] [-webkit-mask-image:-webkit-radial-gradient(white,black)] [mask-image:radial-gradient(white,black)]"
            style={{
              borderRadius: '16px',
              clipPath: 'inset(0 round 16px)',
              WebkitClipPath: 'inset(0 round 16px)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              WebkitTransformStyle: 'flat',
              transformStyle: 'flat',
            }}
          >
            {/* Imagem com clip-path e border-radius de hardware inquebráveis */}
            <img
              src={item.image}
              alt={item.text}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover pointer-events-none select-none block"
              style={{
                borderRadius: '16px',
                clipPath: 'inset(0 round 16px)',
                WebkitClipPath: 'inset(0 round 16px)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
            />

            {/* Gradiente de contraste com cantos arredondados inquebráveis */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none"
              style={{
                borderRadius: '16px',
                clipPath: 'inset(0 round 16px)',
                WebkitClipPath: 'inset(0 round 16px)',
              }}
            />

            {/* Botão de Play circular translúcido centralizado */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Título da matéria no rodapé do card */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 pointer-events-none">
              <span className="font-bold text-[12px] sm:text-[13px] text-white leading-tight line-clamp-2 drop-shadow-md">
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

