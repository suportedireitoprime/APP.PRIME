import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PillGalleryItem } from '../data/galleryItems';

interface PilulasDeck3DProps {
  items: PillGalleryItem[];
  onItemClick: (item: PillGalleryItem) => void;
  defaultBorderColor?: string;
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

export const PilulasDeck3D = memo(({ items, onItemClick, defaultBorderColor = '#E11D48' }: PilulasDeck3DProps) => {
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
      return { w: 152, h: 208 };
    }
    return { w: 140, h: 192 };
  });

  useEffect(() => {
    const handleResize = () => {
      setCardDims(window.innerWidth >= 640 ? { w: 152, h: 208 } : { w: 140, h: 192 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pathD = useMemo(() => getCardPath(cardDims.w, cardDims.h, 16), [cardDims]);

  // Avanço automático perfeitamente sincronizado com o término do ciclo da luzinha (5.5s)
  const handleTimerComplete = useCallback(() => {
    if (total <= 1) return;
    if (document.querySelector('[role="dialog"],[data-state="open"][data-radix-dialog-content]')) return;
    setAtivo((i) => (i + 1) % total);
  }, [total]);

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

  // Touch handlers nativos e suaves para mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      isSwipingRef.current = false;
      setPaused(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwipingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = (e.changedTouches[0]?.clientX || 0) - touchStartRef.current.x;
    const deltaY = (e.changedTouches[0]?.clientY || 0) - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (isSwipingRef.current || (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY))) {
      const velocityX = deltaX / Math.max(deltaTime, 1);
      const isFar = Math.abs(deltaX) > 110;
      const isFast = Math.abs(velocityX) > 0.7;
      const step = (isFar && isFast) ? 2 : 1;

      if (deltaX < -22 || velocityX < -0.28) {
        setAtivo((i) => (i + step) % total);
      } else if (deltaX > 22 || velocityX > 0.28) {
        setAtivo((i) => (i - step + total) % total);
      }

      setIsDragging(true);
      setTimeout(() => setIsDragging(false), 120);
    } else {
      setIsDragging(false);
    }
    setTimeout(() => setPaused(false), 400);
  }, [total]);

  // Suporte a rolagem com mouse e trackpad
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
      className="relative w-full pt-3 pb-2 flex flex-col items-center select-none overflow-x-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Container principal do Deck de Cards em leque */}
      <div className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-[420px] h-[240px] sm:h-[258px]">
        {/* Botão anterior */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Item anterior"
          className="absolute -left-1 sm:left-1 z-[75] w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Botão próximo */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Próximo item"
          className="absolute -right-1 sm:right-1 z-[75] w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Deck interativo com drag e touch swipe */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => {
            setIsDragging(true);
            setPaused(true);
          }}
          onDragEnd={(_, info) => {
            setTimeout(() => setIsDragging(false), 120);
            const isFar = Math.abs(info.offset.x) > 110;
            const isFast = Math.abs(info.velocity.x) > 550;
            const step = (isFar && isFast) ? 2 : 1;

            if (info.offset.x < -24 || info.velocity.x < -180) {
              setAtivo((i) => (i + step) % total);
            } else if (info.offset.x > 24 || info.velocity.x > 180) {
              setAtivo((i) => (i - step + total) % total);
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {items.map((item, i) => {
            // Distância circular mais curta entre o item e o ativo
            let diff = (i - ativo) % total;
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            const slot = getSlot(diff);
            const frente = diff === 0;

            // Renderiza até 7 cards do leque (-3 a +3)
            if (Math.abs(diff) > 3) return null;

            const activeBorderColor = item.borderColor || defaultBorderColor;

            return (
              <motion.div
                key={item.fullName + i}
                animate={{
                  x: slot.x,
                  y: slot.y,
                  rotate: slot.rotate,
                  scale: slot.scale,
                  opacity: slot.opacity,
                }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
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
                className="absolute w-[140px] sm:w-[152px] h-[192px] sm:h-[208px] shrink-0 cursor-pointer will-change-transform"
              >
                {/* Card com contorno refinado */}
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
                  {/* Capa com cores 100% reais sem escurecimento */}
                  <img
                    src={item.image}
                    alt={item.fullName}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover pointer-events-none select-none block"
                  />

                  {/* Escurecimento suave nos cards laterais */}
                  {!frente && (
                    <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                  )}

                  {/* Sheen sweep na entrada do card frontal */}
                  {frente && (
                    <motion.div
                      key={`reflexo-sweep-${item.fullName}`}
                      initial={{ x: '-150%', opacity: 0 }}
                      animate={{ x: '180%', opacity: [0, 0.65, 0.65, 0] }}
                      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      className="absolute inset-y-0 w-3/4 -skew-x-12 pointer-events-none z-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  )}

                  {/* Play central no card frontal */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-all duration-300 ${
                        frente ? 'opacity-90 scale-100' : 'opacity-0 scale-75'
                      }`}
                    >
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Título na base do card com gradiente */}
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

                {/* Linha com luzinha contornando o card frontal com ciclo contínuo de 5.5s */}
                {frente && (
                  <svg
                    key={`beam-svg-${ativo}`}
                    className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
                    style={{ width: cardDims.w, height: cardDims.h }}
                  >
                    <style>{`
                      @keyframes pilulasBorderProgress {
                        0% { stroke-dashoffset: 1000; }
                        100% { stroke-dashoffset: 0; }
                      }
                      @keyframes pilulasBorderGlow {
                        0% { stroke-dashoffset: 0; }
                        100% { stroke-dashoffset: -1000; }
                      }
                    `}</style>

                    {/* Linha base fina */}
                    <path
                      d={pathD}
                      pathLength="1000"
                      fill="none"
                      stroke={activeBorderColor}
                      strokeWidth="1.5"
                      strokeOpacity="0.28"
                    />

                    {/* Progresso de contorno suave (5.5s) */}
                    <path
                      d={pathD}
                      pathLength="1000"
                      fill="none"
                      stroke={activeBorderColor}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: '1000 1000',
                        animation: 'pilulasBorderProgress 5.5s linear forwards',
                        animationPlayState: paused ? 'paused' : 'running',
                        filter: `drop-shadow(0 0 3px ${activeBorderColor})`,
                      }}
                      onAnimationEnd={handleTimerComplete}
                    />

                    {/* Luzinha brilhante no topo */}
                    <path
                      d={pathD}
                      pathLength="1000"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: '70 930',
                        animation: 'pilulasBorderGlow 5.5s linear forwards',
                        animationPlayState: paused ? 'paused' : 'running',
                        filter: `drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 0 8px ${activeBorderColor})`,
                      }}
                    />
                  </svg>
                )}

                {/* Reflexo espelhado no chão sob a capa principal */}
                {frente && (
                  <motion.div
                    key={`reflexo-chao-${item.fullName}`}
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
                      className="w-full h-[192px] sm:h-[208px] object-cover block origin-top"
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

      {/* Descrição embaixo da capa em destaque */}
      {activeItem && (
        <div className="mt-2 text-center px-4 max-w-sm mx-auto min-h-[40px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeItem.fullName}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="text-[12px] sm:text-[12.5px] text-zinc-300 font-medium leading-snug px-1"
            >
              {activeItem.descricao || activeItem.fullName}
            </motion.p>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

PilulasDeck3D.displayName = 'PilulasDeck3D';
export default PilulasDeck3D;
