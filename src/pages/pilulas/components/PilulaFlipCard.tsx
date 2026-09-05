import { motion, useAnimation, AnimatePresence, type PanInfo } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useMotionValue, useTransform } from 'framer-motion';

const SWIPE_THRESHOLD = 80;

interface Card {
  id: string;
  titulo: string;
  subtitulo: string;
  imagem: string;
  texto_detalhado: string;
  ordem: number;
}

interface PilulaFlipCardProps {
  pilulas: Card[];
  index: number;
  flipped: boolean;
  onFlip: () => void;
  onAdvance: (direction: 'right' | 'left') => Promise<void>;
}

export function PilulaFlipCard({ pilulas, index, flipped, onFlip, onAdvance }: PilulaFlipCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const controls = useAnimation();

  // Reset quando card muda
  // Nota: o reset é controlado pelo parent via key/index

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > SWIPE_THRESHOLD || velocity > 400) {
      await controls.start({ x: window.innerWidth, opacity: 0, transition: { duration: 0.25 } });
      await onAdvance('right');
    } else if (offset < -SWIPE_THRESHOLD || velocity < -400) {
      await controls.start({ x: -window.innerWidth, opacity: 0, transition: { duration: 0.25 } });
      await onAdvance('left');
    } else {
      controls.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div className="relative w-full max-w-[360px] aspect-[3/4] preserve-3d">
      <AnimatePresence>
        {pilulas.map((pilula, i) => {
          if (i < index) return null;
          if (i > index + 2) return null;

          const isFront = i === index;
          const offset = i - index;

          return (
            <motion.div
              key={pilula.id}
              drag={isFront ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onDragEnd={isFront ? handleDragEnd : undefined}
              style={{
                zIndex: pilulas.length - i,
                x: isFront ? x : 0,
                rotate: isFront ? rotate : 0,
                willChange: 'transform, opacity',
                z: 0,
              }}
              animate={isFront ? controls : {
                scale: 1 - offset * 0.05,
                y: offset * 20,
                opacity: 1 - offset * 0.3,
              }}
              initial={isFront ? { scale: 0.95, opacity: 0 } : false}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={isFront ? onFlip : undefined}
              className="absolute inset-0 cursor-grab active:cursor-grabbing preserve-3d select-none"
              role="button"
              aria-label={`Pílula ${i + 1} de ${pilulas.length}: ${pilula.titulo}. Toque para virar.`}
              tabIndex={isFront ? 0 : -1}
            >
              <motion.div
                animate={{ rotateY: (isFront && flipped) ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-full h-full relative preserve-3d shadow-2xl rounded-[2rem] select-none"
                style={{ willChange: 'transform', z: 0 }}
              >
                {/* Frente */}
                <div className="absolute inset-0 backface-hidden rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-800">
                  <img
                    src={pilula.imagem}
                    alt={pilula.titulo}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                  
                  <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center text-center">
                    <span className="text-[12px] font-bold text-[#36AF85] tracking-widest uppercase mb-3 drop-shadow-md">
                      Pílula {i + 1} de {pilulas.length}
                    </span>
                    <h2 className="text-[32px] font-black text-white leading-tight text-center px-6">
                      {pilula.titulo}
                    </h2>
                    {pilula.subtitulo && (
                      <p className="mt-3 text-lg font-medium text-white/90 text-center px-8 drop-shadow-md">
                        {pilula.subtitulo}
                      </p>
                    )}
                    {isFront && (
                      <p className="mt-8 text-[15px] font-medium text-white/80 drop-shadow flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Toque para girar
                      </p>
                    )}
                  </div>
                </div>

                {/* Verso */}
                <div
                  className="absolute inset-0 backface-hidden rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-800"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <div className="absolute inset-0">
                    <img
                      src={pilula.imagem}
                      alt={pilula.titulo}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-cover blur-xl scale-110 opacity-40"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                  </div>

                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 text-center">
                    <h3 className="text-[24px] font-black text-white mb-6 leading-tight">
                      {pilula.titulo}
                    </h3>
                    <p className="text-[17px] leading-relaxed text-zinc-200">
                      {pilula.texto_detalhado}
                    </p>
                    
                    {isFront && (
                      <div className="absolute bottom-8 text-[13px] text-zinc-400 flex items-center gap-2">
                        Deslize para avançar &rarr;
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        }).reverse()}
      </AnimatePresence>
    </div>
  );
}
