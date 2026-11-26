import React from 'react';
import cerebroRoxo from '@/assets/covers/cerebro-vazado-roxo.webp';
import cerebroCiano from '@/assets/covers/cerebro-vazado-ciano.webp';
import cerebroDourado from '@/assets/covers/cerebro-vazado-dourado.webp';

interface FloatingOrbitingBrainsProps {
  className?: string;
  position?: 'left' | 'right' | 'bottom-right';
}

const BRAIN_VARIANTS = [
  { img: cerebroRoxo, delay: '0s' },
  { img: cerebroCiano, delay: '-4.6s' },
  { img: cerebroDourado, delay: '-9.2s' },
];

export const FloatingOrbitingBrains: React.FC<FloatingOrbitingBrainsProps> = ({
  className,
  position = 'right',
}) => {
  const [animar, setAnimar] = React.useState(false);

  React.useEffect(() => {
    const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    // Prioriza o first paint e toque do usuário; inicia a órbita CSS no compositor após 1.2s
    const t = setTimeout(() => {
      if (!document.hidden) setAnimar(true);
    }, 1200);

    const handleVisibility = () => {
      setAnimar(!document.hidden && !isReduced);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const defaultClass =
    position === 'left'
      ? "absolute left-[-15px] sm:left-4 top-[26%] -translate-y-1/2 w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] pointer-events-none z-[3]"
      : position === 'bottom-right'
        ? "absolute right-[-8px] sm:right-6 bottom-10 sm:bottom-12 w-[200px] h-[150px] sm:w-[260px] sm:h-[180px] pointer-events-none z-[3]"
        : "absolute right-[-10px] sm:right-6 top-[28%] -translate-y-1/2 w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] pointer-events-none z-[3]";

  return (
    <div className={className || defaultClass} aria-hidden="true">
      <style>{`
        @keyframes dpBrainOrbit {
          0%   { transform: translate3d(100px, 0px, 0) scale(1); opacity: 0.92; }
          33%  { transform: translate3d(-50px, 36.4px, 0) scale(0.72); opacity: 0.5; }
          66%  { transform: translate3d(-50px, -36.4px, 0) scale(1.15); opacity: 1; }
          100% { transform: translate3d(100px, 0px, 0) scale(1); opacity: 0.92; }
        }
      `}</style>
      {BRAIN_VARIANTS.map((brain, i) => (
        <div
          key={i}
          className="absolute w-12 h-12 sm:w-16 sm:h-16 transform-gpu will-change-transform"
          style={{
            left: '50%',
            top: '50%',
            marginLeft: -24,
            marginTop: -24,
            animation: animar ? `dpBrainOrbit 14s linear ${brain.delay} infinite` : 'none',
            opacity: animar ? undefined : 0.8,
          }}
        >
          <img
            src={brain.img}
            alt=""
            decoding="async"
            className="w-full h-full object-contain"
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingOrbitingBrains;
