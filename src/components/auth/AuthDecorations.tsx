import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { LEGAL_TERMS } from './authUtils';

export const AuthDecorations = memo(function AuthDecorations() {
  const [items, setItems] = useState<
    { id: number; word: string; x: number; duration: number; delay: number; size: number; maxOpacity: number }[]
  >([]);

  useEffect(() => {
    // 8 itens para visual limpo, elegante e leve
    const newItems = Array.from({ length: 8 }).map((_, i) => {
      return {
        id: i,
        word: LEGAL_TERMS[Math.floor(Math.random() * LEGAL_TERMS.length)],
        x: Math.random() * 80 + 10,
        duration: 40 + Math.random() * 40,
        delay: Math.random() * -80,
        size: 16 + Math.random() * 20,
        maxOpacity: 0.08 + Math.random() * 0.12,
      };
    });
    setItems(newItems);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="absolute text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-display font-bold tracking-[0.2em] whitespace-nowrap"
          style={{ fontSize: item.size }}
          initial={{ y: '-10vh', x: `${item.x}vw`, opacity: 0 }}
          animate={{
            y: '110vh',
            opacity: [0, item.maxOpacity, item.maxOpacity, 0],
          }}
          transition={{
            y: { duration: item.duration, repeat: Infinity, ease: 'linear', delay: item.delay },
            opacity: {
              duration: item.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
              times: [0, 0.3, 0.7, 1],
            },
          }}
        >
          {item.word}
        </motion.div>
      ))}
    </div>
  );
});
