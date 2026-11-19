import React from 'react';
import { motion } from 'framer-motion';
import cerebroRoxo from '@/assets/covers/cerebro-vazado-roxo.webp';
import cerebroCiano from '@/assets/covers/cerebro-vazado-ciano.webp';
import cerebroDourado from '@/assets/covers/cerebro-vazado-dourado.webp';

interface FloatingOrbitingBrainsProps {
  className?: string;
  position?: 'left' | 'right';
}

const BRAIN_VARIANTS = [
  { img: cerebroRoxo, glow: 'rgba(168,85,247,0.75)' },
  { img: cerebroCiano, glow: 'rgba(56,189,248,0.75)' },
  { img: cerebroDourado, glow: 'rgba(251,191,36,0.75)' },
];

export const FloatingOrbitingBrains: React.FC<FloatingOrbitingBrainsProps> = ({
  className,
  position = 'right',
}) => {
  const defaultClass =
    position === 'left'
      ? "absolute left-[-15px] sm:left-4 top-[26%] -translate-y-1/2 w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] pointer-events-none z-[3]"
      : "absolute right-[-10px] sm:right-6 top-[28%] -translate-y-1/2 w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] pointer-events-none z-[3]";

  return (
    <div className={className || defaultClass} aria-hidden="true">
      {BRAIN_VARIANTS.map((brain, i) => {
        const delay = i * 4.6;
        return (
          <motion.div
            key={i}
            className="absolute w-12 h-12 sm:w-16 sm:h-16"
            animate={{
              x: [
                100 * Math.cos(0),
                100 * Math.cos((2 * Math.PI) / 3),
                100 * Math.cos((4 * Math.PI) / 3),
                100 * Math.cos(2 * Math.PI),
              ],
              y: [
                42 * Math.sin(0),
                42 * Math.sin((2 * Math.PI) / 3),
                42 * Math.sin((4 * Math.PI) / 3),
                42 * Math.sin(2 * Math.PI),
              ],
              scale: [1, 0.72, 1.15, 1],
              opacity: [0.92, 0.5, 1, 0.92],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'linear',
              delay: -delay,
            }}
            style={{
              left: '50%',
              top: '50%',
              marginLeft: -24,
              marginTop: -24,
            }}
          >
            <img
              src={brain.img}
              alt=""
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_var(--glow)]"
              style={{ ['--glow' as string]: brain.glow }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingOrbitingBrains;
