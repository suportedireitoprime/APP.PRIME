import React, { memo, useMemo } from 'react';
import balancaDourada from '@/assets/flashcards/balanca-dourada.webp';
import marteloDourado from '@/assets/flashcards/martelo-dourado.webp';

interface SymbolConfig {
  id: number;
  left: number;
  duration: number;
  delay: number;
  swayDuration: number;
  driftX: number;
  swayX: number;
  swayRot: number;
  rotEnd: number;
  size: number;
  opacity: number;
  type: 'balanca' | 'martelo';
}

export const FallingLotusPetals = memo(() => {
  // Símbolos exclusivos da Justiça: Balança de Ouro e Martelo (Malhete) nítidos e dourados em alta resolução
  const symbols: SymbolConfig[] = useMemo(() => [
    { id: 1, left: 12, duration: 15, delay: -2, swayDuration: 4.5, driftX: 25, swayX: 18, swayRot: 20, rotEnd: 180, size: 30, opacity: 0.85, type: 'balanca' },
    { id: 2, left: 28, duration: 13.5, delay: -8, swayDuration: 3.8, driftX: -22, swayX: -16, swayRot: -22, rotEnd: -160, size: 28, opacity: 0.82, type: 'martelo' },
    { id: 3, left: 52, duration: 16, delay: -4, swayDuration: 4.8, driftX: 30, swayX: 20, swayRot: 24, rotEnd: 220, size: 32, opacity: 0.88, type: 'balanca' },
    { id: 4, left: 72, duration: 14, delay: -11, swayDuration: 4.2, driftX: -26, swayX: -18, swayRot: -20, rotEnd: -180, size: 29, opacity: 0.84, type: 'martelo' },
    { id: 5, left: 88, duration: 17, delay: -6, swayDuration: 5.0, driftX: 24, swayX: 16, swayRot: 18, rotEnd: 190, size: 31, opacity: 0.86, type: 'balanca' },
  ], []);

  return (
    <>
      <style>{`
        @keyframes legalSymbolFall {
          0% {
            transform: translate3d(0, -8vh, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--s-opacity, 0.85);
          }
          90% {
            opacity: var(--s-opacity, 0.85);
          }
          100% {
            transform: translate3d(var(--s-drift, 25px), 110vh, 0) rotate(var(--s-rot, 180deg));
            opacity: 0;
          }
        }
        @keyframes legalSymbolSway {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(var(--s-sway-x, 18px), 0, 0) rotate(var(--s-sway-rot, 20deg));
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
        }
      `}</style>

      <div 
        aria-hidden="true" 
        className="fixed inset-0 pointer-events-none z-[1] overflow-hidden select-none"
      >
        {symbols.map((s) => (
          <div
            key={s.id}
            className="absolute top-0 will-change-transform"
            style={{
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animation: `legalSymbolFall ${s.duration}s linear infinite`,
              animationDelay: `${s.delay}s`,
              ['--s-opacity' as any]: s.opacity,
              ['--s-drift' as any]: `${s.driftX}px`,
              ['--s-rot' as any]: `${s.rotEnd}deg`,
            }}
          >
            <div
              className="w-full h-full will-change-transform filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
              style={{
                animation: `legalSymbolSway ${s.swayDuration}s ease-in-out infinite`,
                animationDelay: `${s.delay * 0.35}s`,
                ['--s-sway-x' as any]: `${s.swayX}px`,
                ['--s-sway-rot' as any]: `${s.swayRot}deg`,
              }}
            >
              <img
                src={s.type === 'balanca' ? balancaDourada : marteloDourado}
                alt={s.type === 'balanca' ? 'Balança da Justiça' : 'Martelo da Justiça'}
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
});

FallingLotusPetals.displayName = 'FallingLotusPetals';
