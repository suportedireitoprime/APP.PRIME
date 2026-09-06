import { useState, useEffect, useMemo, memo, useCallback } from 'react';
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

export const AprenderCarousel3D = memo(({ items, onItemClick }: AprenderCarousel3DProps) => {
  const [ativo, setAtivo] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items?.length || 0;

  // Auto-avanço a cada 3.2 segundos se o usuário não estiver interagindo
  useEffect(() => {
    if (paused || total <= 1) return;
    const id = window.setInterval(() => {
      if (document.querySelector('[role="dialog"],[data-state="open"][data-radix-dialog-content]')) return;
      setAtivo((i) => (i + 1) % total);
    }, 3200);
    return () => window.clearInterval(id);
  }, [paused, total]);

  const handlePrev = useCallback(() => {
    setPaused(true);
    setAtivo((i) => (i - 1 + total) % total);
    setTimeout(() => setPaused(false), 2500);
  }, [total]);

  const handleNext = useCallback(() => {
    setPaused(true);
    setAtivo((i) => (i + 1) % total);
    setTimeout(() => setPaused(false), 2500);
  }, [total]);

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
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 2500)}
    >
      {/* Glow ambiente dinâmico suave atrás da capa central com a cor predominante da capa */}
      <motion.div
        animate={{
          backgroundColor: activeItem?.glowColor || 'rgba(225, 29, 72, 0.25)',
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute top-[100px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] blur-3xl rounded-full pointer-events-none opacity-60"
      />

      {/* Container principal do Deck de Cards em leque */}
      <div className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-[420px] h-[240px] sm:h-[258px]">
        {/* Botão de navegação anterior */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Área anterior"
          className="absolute -left-1 sm:left-1 z-[75] w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Botão de navegação próximo */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Próxima área"
          className="absolute -right-1 sm:right-1 z-[75] w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Deck interativo com suporte a swipe horizontal */}
        <motion.div
          className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing"
          onPanEnd={(_, info) => {
            if (info.offset.x < -25) {
              handleNext();
            } else if (info.offset.x > 25) {
              handlePrev();
            }
          }}
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
            const activeGlowColor = item.glowColor || 'rgba(225, 29, 72, 0.45)';

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
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  zIndex: slot.z,
                }}
                onClick={() => {
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
                {/* Card principal com borda, glow e cores reais da capa */}
                <div
                  className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 transition-colors duration-300 ${
                    frente
                      ? 'border-[3.5px]'
                      : 'border-2 border-white/20 shadow-black/60'
                  }`}
                  style={{
                    borderColor: frente ? activeBorderColor : undefined,
                    boxShadow: frente
                      ? `0 15px 40px ${activeGlowColor}`
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

                  {/* Nome/título SEM abreviação dentro da capa, mantendo a arte visível sem escurecer */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-4 z-10 pointer-events-none bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                    <span className="font-bold text-[11px] sm:text-[12px] text-white leading-tight block drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center">
                      {item.fullName || item.text}
                    </span>
                  </div>
                </div>

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


