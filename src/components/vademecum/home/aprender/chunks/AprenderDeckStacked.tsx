import { memo, useState } from 'react';
import { Play } from 'lucide-react';
import { AprenderItem } from './aprenderCarouselTypes';
import { motion, AnimatePresence } from 'framer-motion';

interface AprenderDeckStackedProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

export const AprenderDeckStacked = memo(({ items, onItemClick }: AprenderDeckStackedProps) => {
  const [cards, setCards] = useState(items);

  const handleCardClick = (item: AprenderItem, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 0) {
      onItemClick(item);
    } else {
      // Move clicked card to front
      setCards((prev) => {
        const newCards = [...prev];
        const clicked = newCards.splice(index, 1)[0];
        newCards.unshift(clicked);
        return newCards;
      });
    }
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div className="relative w-full h-[260px] flex items-center justify-start perspective-[1000px] ml-4">
      <AnimatePresence>
        {cards.slice(0, 4).reverse().map((item, reverseIdx, arr) => {
          const i = arr.length - 1 - reverseIdx;
          const isFront = i === 0;
          return (
            <motion.div
              key={item.id}
              layout
              initial={false}
              animate={{
                scale: 1 - i * 0.08,
                x: i * 35,
                y: i * -5,
                zIndex: 30 - i,
                opacity: 1 - (i * 0.15),
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={(e) => handleCardClick(item, i, e as any)}
              className="absolute w-[160px] h-[240px] rounded-2xl overflow-hidden cursor-pointer shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/20 origin-left"
            >
              <img
                src={item.image}
                alt={item.fullName}
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
              
              {isFront && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-left pointer-events-none z-10">
                    <span className="font-display font-black tracking-wide text-[13px] text-white drop-shadow-md leading-tight block line-clamp-2 uppercase">
                      {item.fullName || item.text}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

AprenderDeckStacked.displayName = 'AprenderDeckStacked';
