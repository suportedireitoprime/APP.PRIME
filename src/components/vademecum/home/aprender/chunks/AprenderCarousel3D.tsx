import { memo } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { AprenderItem } from './aprenderCarouselTypes';

interface AprenderCarousel3DProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

export const AprenderCarousel3D = memo(({ items, onItemClick }: AprenderCarousel3DProps) => {
  if (!items || items.length === 0) return null;

  // Triplica os items para criar o efeito infinito perfeito com -33.333% de translação
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="relative w-full pt-1 pb-4 overflow-hidden">
      {/* Máscaras de gradiente para suavizar as bordas (fade-out) */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

      <motion.div
        className="flex gap-3 w-max px-2"
        animate={{ x: ["0%", "-33.333333%"] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: items.length * 6.5, // Velocidade reduzida: ~6.5s por item
        }}
      >
        {duplicatedItems.map((item, idx) => (
          <button
            key={`${item.id}-${idx}`}
            type="button"
            onClick={() => onItemClick(item)}
            className="group relative shrink-0 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden shadow-lg border border-white/10 active:scale-[0.98] transition-all focus:outline-none hover:shadow-xl hover:border-white/20"
          >
            <img
              src={item.image}
              alt={item.fullName}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
      </motion.div>
    </div>
  );
});

AprenderCarousel3D.displayName = 'AprenderCarousel3D';
