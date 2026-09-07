import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { AprenderItem } from './aprenderCarouselTypes';

interface AprenderCarousel3DProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

/** Posição visual em leque (deck de 7 cards) com profundidade e perspectiva */
const getSlot = (diff: number) => {
  switch (diff) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1.07, opacity: 1, z: 70 };
    case 1:
      return { x: 68, y: 9, rotate: 8.5, scale: 0.9, opacity: 0.92, z: 60 };
    case 2:
      return { x: 118, y: 19, rotate: 15.5, scale: 0.78, opacity: 0.68, z: 50 };
    case 3:
      return { x: 156, y: 29, rotate: 22, scale: 0.67, opacity: 0.42, z: 40 };
    case -1:
      return { x: -68, y: 9, rotate: -8.5, scale: 0.9, opacity: 0.92, z: 60 };
    case -2:
      return { x: -118, y: 19, rotate: -15.5, scale: 0.78, opacity: 0.68, z: 50 };
    case -3:
      return { x: -156, y: 29, rotate: -22, scale: 0.67, opacity: 0.42, z: 40 };
    default:
      if (diff > 0) {
        return { x: 180, y: 36, rotate: 26, scale: 0.58, opacity: 0, z: 10 };
      }
      return { x: -180, y: 36, rotate: -26, scale: 0.58, opacity: 0, z: 10 };
  }
};

/** Gera o path SVG exato do contorno com cantos arredondados iniciando no topo central (12h) no sentido horário */
const getCardPath = (w: number, h: number, r = 16) => {
  const pad = 1;
  const x = pad;
  const y = pad;
  const width = w - pad * 2;
  const height = h - pad * 2;
  const radius = Math.min(r, width / 2, height / 2);

  return `M ${x + width / 2} ${y} H ${x + width - radius} A ${radius} ${radius} 0 0 1 ${x + width} ${y + radius} V ${y + height - radius} A ${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height} H ${x + radius} A ${radius} ${radius} 0 0 1 ${x} ${y + height - radius} V ${y + radius} A ${radius} ${radius} 0 0 1 ${x + radius} ${y} Z`.replace(/\s+/g, ' ').trim();
};

export const AprenderCarousel3D = memo(({ items, onItemClick }: AprenderCarousel3DProps) => {
  const [ativo, setAtivo] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  const lastWheelTime = useRef(0);
  const total = items?.length || 0;

  // Dimensões responsivas do card para traçado exato do contorno
  const [cardDims, setCardDims] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      return { w: 168, h: 232 };
    }
    return { w: 156, h: 216 };
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const isSm = window.innerWidth >= 640;
        setCardDims((prev) => {
          const nextW = isSm ? 168 : 156;
          const nextH = isSm ? 232 : 216;
          if (prev.w === nextW && prev.h === nextH) return prev;
          return { w: nextW, h: nextH };
        });
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const pathD = useMemo(() => getCardPath(cardDims.w, cardDims.h, 16), [cardDims]);

  // Avanço automático perfeitamente sincronizado com o timer
  const handleTimerComplete = useCallback(() => {
    if (total <= 1 || prefersReducedMotion) return;
    if (document.querySelector('[role="dialog"],[data-state="open"][data-radix-dialog-content]')) return;
    setAtivo((i) => (i + 1) % total);
  }, [total, prefersReducedMotion]);

  useEffect(() => {
    if (paused || prefersReducedMotion || total <= 1) return;
    const interval = setInterval(() => {
      handleTimerComplete();
    }, 5500);
    return () => clearInterval(interval);
  }, [paused, prefersReducedMotion, total, handleTimerComplete]);

  const handlePrev = useCallback(() => {
    setPaused(true);
    setAtivo((i) => (i - 1 + total) % total);
    setTimeout(() => setPaused(false), 400);
  }, [total]);

  const handleNext = useCallback(() => {
    setPaused(true);
    setAtivo((i) => (i + 1) % total);
    setTimeout(() => setPaused(false), 400);
  }, [total]);

  // Touch handlers nativos removidos em favor do onPan do Framer Motion para maior reatividade

  // Suporte a scroll com mouse / trackpad no Desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 20) {
      const now = Date.now();
      if (now - lastWheelTime.current > 300) {
        lastWheelTime.current = now;
        if (e.deltaX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  }, [handleNext, handlePrev]);

  const activeItem = useMemo(() => {
    if (!items || total === 0) return null;
    return items[ativo] || items[0];
  }, [items, ativo, total]);

  if (!items || total === 0) return null;

  return (
    <div
      className="relative w-full pt-3 pb-2 flex flex-col items-center select-none overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Container principal do Deck de Cards em leque */}
      <div className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-[420px] h-[240px] sm:h-[258px]">
        {/* Botão de navegação anterior */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Área anterior"
          className="absolute bottom-1 sm:bottom-3 left-2 sm:left-4 z-[75] w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Botão de navegação próximo */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Próxima área"
          className="absolute bottom-1 sm:bottom-3 right-2 sm:right-4 z-[75] w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Deck interativo com suporte a swipe horizontal pan reativo */}
        <motion.div
          onPanStart={(e, info) => {
            setIsDragging(true);
            setPaused(true);
            touchStartRef.current = { x: info.point.x, y: info.point.y, time: Date.now(), startIndex: ativo } as any;
          }}
          onPan={(e, info) => {
             const offset = info.offset.x;
             const steps = Math.round(offset / 70); // Ajuste sensibilidade: a cada 70px ele passa uma capa
             if (touchStartRef.current && 'startIndex' in touchStartRef.current) {
               const start = (touchStartRef.current as any).startIndex;
               const newAtivo = (start - steps + total * 10) % total;
               if (newAtivo !== ativo) setAtivo(newAtivo);
             }
          }}
          onPanEnd={(e, info) => {
             setIsDragging(false);
             setTimeout(() => setPaused(false), 400);
             const offset = info.offset.x;
             const velocity = info.velocity.x;
             const steps = Math.round(offset / 70);
             let extraStep = 0;
             if (velocity < -300) extraStep = 1;
             else if (velocity > 300) extraStep = -1;
             
             if (touchStartRef.current && 'startIndex' in touchStartRef.current) {
               const start = (touchStartRef.current as any).startIndex;
               setAtivo((start - steps + extraStep + total * 10) % total);
             }
          }}
          onWheel={handleWheel}
          className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {items.map((item, i) => {
            // Distância relativa circular mais curta entre o item e o ativo
            let diff = (i - ativo) % total;
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            const slot = getSlot(diff);
            const frente = diff === 0;

            // Otimização: renderiza exatamente os 7 cards do leque (-3 a +3)
            if (Math.abs(diff) > 3) return null;

            const activeBorderColor = item.borderColor || '#E11D48';

            return (
              <motion.div
                key={item.id}
                animate={{
                  x: slot.x,
                  y: slot.y,
                  rotate: slot.rotate,
                  scale: slot.scale,
                  opacity: slot.opacity,
                }}
                transition={{ duration: isDragging ? 0.15 : (prefersReducedMotion ? 0.05 : 0.45), ease: 'easeOut' }}
                style={{
                  zIndex: slot.z,
                }}
                onClick={(e) => {
                  if (isDragging || isSwipingRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  if (frente) {
                    onItemClick(item);
                  } else {
                    setPaused(true);
                    setAtivo(i);
                    setTimeout(() => setPaused(false), 2500);
                  }
                }}
                className="absolute w-[156px] sm:w-[168px] h-[216px] sm:h-[232px] shrink-0 cursor-pointer will-change-transform touch-pan-y"
              >
                {/* Card principal com contorno refinado e fino */}
                <div
                  className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 transition-colors duration-300 ${
                    frente
                      ? 'border border-white/10'
                      : 'border border-white/15 shadow-black/60'
                  }`}
                  style={{
                    boxShadow: frente
                      ? '0 18px 42px -6px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)'
                      : undefined,
                    clipPath: 'inset(0 round 16px)',
                    WebkitClipPath: 'inset(0 round 16px)',
                  }}
                >
                  {/* Imagem da capa com as cores 100% reais sem escurecer */}
                  <img
                    src={item.image}
                    alt={item.fullName}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover pointer-events-none select-none block"
                  />

                  {/* Camada de escurecimento suave APENAS para os cards secundários no fundo */}
                  {!frente && (
                    <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                  )}

                  {/* Animação de reflexo de luz (sheen sweep) cruzando a capa quando ela aparece na frente */}
                  {frente && (
                    <motion.div
                      key={`reflexo-sweep-${item.id}`}
                      initial={{ x: '-150%', opacity: 0 }}
                      animate={{ x: '180%', opacity: [0, 0.65, 0.65, 0] }}
                      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      className="absolute inset-y-0 w-3/4 -skew-x-12 pointer-events-none z-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  )}

                  {/* Botão Play central translúcido no card da frente */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-all duration-300 ${
                        frente ? 'opacity-90 scale-100' : 'opacity-0 scale-75'
                      }`}
                    >
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Nome/título SEM abreviação dentro da capa com degradê de baixo para cima dando ênfase */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 z-10 pointer-events-none transition-all duration-300 ${
                      frente
                        ? 'px-2.5 pb-2.5 pt-12 bg-gradient-to-t from-black/95 via-black/75 to-transparent'
                        : 'px-2 pb-2 pt-6 bg-gradient-to-t from-black/70 via-black/25 to-transparent'
                    }`}
                  >
                    <span
                      className={`font-bold leading-tight block text-center transition-all duration-300 ${
                        frente
                          ? 'text-[12px] sm:text-[13px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)] tracking-wide'
                          : 'text-[10.5px] sm:text-[11px] text-zinc-200 drop-shadow-md'
                      }`}
                    >
                      {item.fullName || item.text}
                    </span>
                  </div>
                </div>

                {/* Contorno fino estático e suave na capa em destaque */}
                {frente && (
                  <svg
                    key={`beam-svg-${ativo}`}
                    className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
                    style={{ width: cardDims.w, height: cardDims.h }}
                  >
                    <path
                      d={pathD}
                      fill="none"
                      stroke={activeBorderColor}
                      strokeWidth="1.0"
                      strokeOpacity="0.4"
                    />
                  </svg>
                )}

                {/* Animação de reflexo espelhado no chão sob a capa principal com a cor real da arte */}
                {frente && (
                  <motion.div
                    key={`reflexo-chao-${item.id}`}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 0.42, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="absolute top-[calc(100%+3px)] left-0 right-0 h-[44px] sm:h-[50px] rounded-b-xl overflow-hidden pointer-events-none select-none"
                    style={{
                      maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 88%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 88%)',
                    }}
                  >
                    <img
                      src={item.image}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-[216px] sm:h-[232px] object-cover block origin-top"
                      style={{
                        transform: 'scaleY(-1)',
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Descrição embaixo da capa em destaque SEM abreviação */}
      {activeItem && (
        <div className="mt-2 text-center px-4 max-w-sm mx-auto min-h-[42px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeItem.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="text-[12px] sm:text-[12.5px] text-zinc-300 font-medium leading-snug px-1"
            >
              {activeItem.descricao || 'Aulas de Direito passo a passo e detalhadas'}
            </motion.p>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

AprenderCarousel3D.displayName = 'AprenderCarousel3D';


