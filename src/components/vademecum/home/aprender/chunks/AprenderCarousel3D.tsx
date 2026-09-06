import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { AprenderItem } from './aprenderCarouselTypes';

interface AprenderCarousel3DProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

/** Posição visual em leque (deck de cards) inspirada no PaywallImageStack */
const getSlot = (diff: number) => {
  switch (diff) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1.06, opacity: 1, z: 60 };
    case 1:
      return { x: 72, y: 10, rotate: 9.5, scale: 0.88, opacity: 0.85, z: 50 };
    case 2:
      return { x: 124, y: 20, rotate: 17, scale: 0.75, opacity: 0.45, z: 40 };
    case -1:
      return { x: -72, y: 10, rotate: -9.5, scale: 0.88, opacity: 0.85, z: 50 };
    case -2:
      return { x: -124, y: 20, rotate: -17, scale: 0.75, opacity: 0.45, z: 40 };
    default:
      if (diff > 0) {
        return { x: 160, y: 28, rotate: 22, scale: 0.65, opacity: 0, z: 10 };
      }
      return { x: -160, y: 28, rotate: -22, scale: 0.65, opacity: 0, z: 10 };
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
      {/* Glow ambiente vermelho suave atrás da capa central em destaque */}
      <div className="absolute top-[100px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-[#E11D48]/15 blur-3xl rounded-full pointer-events-none" />

      {/* Container principal do Deck de Cards em leque */}
      <div className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-[420px] h-[220px] sm:h-[235px]">
        {/* Botão de navegação anterior */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Área anterior"
          className="absolute -left-1 sm:left-1 z-[70] w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Botão de navegação próximo */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Próxima área"
          className="absolute -right-1 sm:right-1 z-[70] w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
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

            // Otimização: esconde itens muito distantes do leque para economizar renderização
            if (Math.abs(diff) > 3) return null;

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
                  clipPath: 'inset(0 round 16px)',
                  WebkitClipPath: 'inset(0 round 16px)',
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
                className={`absolute w-[140px] sm:w-[152px] h-[192px] sm:h-[208px] rounded-2xl overflow-hidden shadow-2xl shrink-0 cursor-pointer will-change-transform bg-zinc-950 ${
                  frente
                    ? 'border-[3.5px] border-[#E11D48] shadow-[0_15px_40px_rgba(225,29,72,0.45)]'
                    : 'border-2 border-white/20 shadow-black/60'
                }`}
              >
                {/* Imagem da capa */}
                <img
                  src={item.image}
                  alt={item.fullName}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover pointer-events-none select-none block"
                  style={{
                    clipPath: 'inset(0 round 16px)',
                    WebkitClipPath: 'inset(0 round 16px)',
                  }}
                />

                {/* Camada de escurecimento sutil para cards que não estão na frente */}
                {!frente && (
                  <div className="absolute inset-0 bg-black/35 pointer-events-none" />
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

                {/* Nome/título SEM abreviação dentro da capa */}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-8 z-10 pointer-events-none bg-gradient-to-t from-black/95 via-black/65 to-transparent">
                  <span className="font-bold text-[11px] sm:text-[12px] text-white leading-tight block drop-shadow-md text-center">
                    {item.fullName || item.text}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Descrição embaixo da capa em destaque SEM abreviação */}
      {activeItem && (
        <div className="mt-3 text-center px-4 max-w-sm mx-auto min-h-[44px] flex flex-col items-center justify-center">
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


