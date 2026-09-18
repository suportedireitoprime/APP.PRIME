import { memo, useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { AprenderItem } from './aprenderCarouselTypes';
import { motion, AnimatePresence } from 'framer-motion';

interface AprenderDeckStackedProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

export const AprenderDeckStacked = memo(({ items, onItemClick }: AprenderDeckStackedProps) => {
  const [cards, setCards] = useState(items);
  const [isHovered, setIsHovered] = useState(false);

  // Garante que se os items carregarem de forma assíncrona, a lista atualiza
  useEffect(() => {
    if (items && items.length > 0) {
      setCards(items);
    }
  }, [items]);

  const handleCardClick = (item: AprenderItem, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 0) {
      onItemClick(item);
    } else {
      // Move o card clicado (seja da esquerda ou direita) para a frente do deck
      setCards((prev) => {
        const newCards = [...prev];
        const clicked = newCards.splice(index, 1)[0];
        newCards.unshift(clicked);
        return newCards;
      });
    }
  };

  if (!cards || cards.length === 0) return null;

  /**
   * Distribuição simétrica em leque para que as capas apareçam
   * visíveis TANTO na esquerda quanto na direita do card frontal.
   */
  const getCardTransform = (index: number) => {
    if (index === 0) {
      return { x: 0, y: 0, rotate: 0, scale: 1, zIndex: 30, opacity: 1 };
    }

    // Alterna: Ímpares vão para a DIREITA, Pares vão para a ESQUERDA
    const isRight = index % 2 === 1;
    const step = Math.ceil(index / 2); // 1 para index 1 e 2; 2 para index 3 e 4

    const spreadFactor = isHovered ? 1.25 : 1.0;
    const baseOffset = step === 1 ? 34 : 62;
    const x = (isRight ? baseOffset : -baseOffset) * spreadFactor;
    const rotate = (isRight ? (step === 1 ? 5 : 9) : (step === 1 ? -5 : -9)) * (isHovered ? 1.2 : 1.0);
    const scale = Math.max(0.85, 1 - step * 0.07);
    const zIndex = 30 - index;
    const opacity = Math.max(0.65, 1 - step * 0.16);

    return { x, y: step * -2, rotate, scale, zIndex, opacity };
  };

  return (
    <div 
      className="relative w-full h-[260px] flex items-center justify-center perspective-[1000px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {cards.slice(0, 5).reverse().map((item, reverseIdx, arr) => {
          const i = arr.length - 1 - reverseIdx;
          const isFront = i === 0;
          const transform = getCardTransform(i);

          return (
            <motion.div
              key={item.id}
              layout
              initial={false}
              animate={{
                scale: transform.scale,
                x: transform.x,
                y: transform.y,
                rotate: transform.rotate,
                zIndex: transform.zIndex,
                opacity: transform.opacity,
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              onClick={(e) => handleCardClick(item, i, e)}
              className="absolute w-[160px] h-[240px] rounded-2xl overflow-hidden cursor-pointer shadow-[0_12px_45px_rgba(0,0,0,0.7)] border border-white/20 origin-center transition-shadow hover:shadow-[0_16px_50px_rgba(0,0,0,0.9)]"
            >
              <img
                src={item.image}
                alt={item.fullName}
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />
              
              {isFront ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xl">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-left pointer-events-none z-10">
                    <span className="font-display font-black tracking-wide text-[13px] text-white drop-shadow-md leading-tight block line-clamp-2 uppercase">
                      {item.fullName || item.text}
                    </span>
                  </div>
                </>
              ) : (
                /* Card de fundo (esquerda ou direita): mostra faixa de identificação no rodapé */
                <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none z-10">
                  <span className="font-display text-[10px] font-bold text-white/90 drop-shadow-md leading-tight block truncate uppercase">
                    {item.fullName || item.text}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

AprenderDeckStacked.displayName = 'AprenderDeckStacked';
