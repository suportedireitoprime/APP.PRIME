import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import law1 from '@/assets/paywall/law_1.webp';
import law2 from '@/assets/paywall/law_2.webp';
import law3 from '@/assets/paywall/law_3.webp';
import law4 from '@/assets/paywall/law_4.webp';
import law5 from '@/assets/paywall/law_5.webp';
import law6 from '@/assets/paywall/law_6.webp';

const IMAGES = [law1, law2, law3, law4, law5, law6];

/** Posição visual de cada card conforme a distância até o card da frente. */
const SLOTS = [
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, z: 60 },
  { x: 64, y: 8, rotate: 9, scale: 0.88, opacity: 0.85, z: 50 },
  { x: 104, y: 16, rotate: 15, scale: 0.76, opacity: 0.5, z: 40 },
  { x: 0, y: 20, rotate: 0, scale: 0.68, opacity: 0.28, z: 30 },
  { x: -104, y: 16, rotate: -15, scale: 0.76, opacity: 0.5, z: 40 },
  { x: -64, y: 8, rotate: -9, scale: 0.88, opacity: 0.85, z: 50 },
];

export default function PaywallImageStack() {
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    const reduz = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduz) return;
    const id = window.setInterval(() => setAtivo((i) => (i + 1) % IMAGES.length), 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative flex items-center justify-center pt-2 pb-6 px-4 overflow-hidden">
      <div className="relative flex items-center justify-center w-full max-w-[340px] h-[200px]">
        {IMAGES.map((src, i) => {
          const pos = (i - ativo + IMAGES.length) % IMAGES.length;
          const slot = SLOTS[pos];
          const frente = pos === 0;
          return (
            <motion.div
              key={src}
              animate={{ x: slot.x, y: slot.y, rotate: slot.rotate, scale: slot.scale, opacity: slot.opacity }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ zIndex: slot.z }}
              className={`absolute w-[150px] h-[180px] rounded-2xl overflow-hidden shadow-2xl shrink-0 ${
                frente
                  ? 'border-4 border-primary shadow-[0_15px_40px_rgba(224,31,71,0.45)]'
                  : 'border-2 border-white/20'
              }`}
            >
              <img
                src={src}
                alt=""
                width={768}
                height={1024}
                className="w-full h-full object-cover"
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}