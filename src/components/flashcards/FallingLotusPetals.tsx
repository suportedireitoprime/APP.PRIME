import React, { memo, useMemo } from 'react';

interface PetalConfig {
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
  isFullFlower: boolean;
}

const LotusFlowerSvg = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
    {/* Pétala Central */}
    <path
      d="M32 8 C32 8 23 24 23 38 C23 46 27 51 32 53 C37 51 41 46 41 38 C41 24 32 8 32 8 Z"
      fill="url(#lotusGradCenter)"
    />
    {/* Pétalas Intermediárias */}
    <path
      d="M32 18 C23 21 13 30 15 42 C16 48 23 52 30 52 C25 45 24 34 32 18 Z"
      fill="url(#lotusGradMid)"
      opacity="0.9"
    />
    <path
      d="M32 18 C41 21 51 30 49 42 C48 48 41 52 34 52 C39 45 40 34 32 18 Z"
      fill="url(#lotusGradMid)"
      opacity="0.9"
    />
    {/* Pétalas Externas Abertas */}
    <path
      d="M29 30 C16 33 6 41 10 49 C13 53 23 52 27 49 C20 45 20 37 29 30 Z"
      fill="url(#lotusGradOuter)"
      opacity="0.8"
    />
    <path
      d="M35 30 C48 33 58 41 54 49 C51 53 41 52 37 49 C44 45 44 37 35 30 Z"
      fill="url(#lotusGradOuter)"
      opacity="0.8"
    />
    {/* Miolo Dourado com Luz Sagrada */}
    <ellipse cx="32" cy="51" rx="5" ry="2.2" fill="#fef08a" />
    <circle cx="32" cy="50" r="1.5" fill="#ffffff" />
    
    <defs>
      <linearGradient id="lotusGradCenter" x1="32" y1="8" x2="32" y2="53" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="0.25" stopColor="#fef08a" />
        <stop offset="0.65" stopColor="#f59e0b" />
        <stop offset="1" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="lotusGradMid" x1="18" y1="18" x2="32" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fef3c7" />
        <stop offset="0.6" stopColor="#d97706" />
        <stop offset="1" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="lotusGradOuter" x1="10" y1="30" x2="32" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fed7aa" />
        <stop offset="0.6" stopColor="#b45309" />
        <stop offset="1" stopColor="#451a03" />
      </linearGradient>
    </defs>
  </svg>
);

const LotusPetalSvg = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 3 C25 9 27 21 19 28 C12 26 7 18 16 3 Z"
      fill="url(#singlePetalGrad)"
    />
    <path
      d="M16 6 C17.5 13 16.5 21 17 25"
      stroke="#fef08a"
      strokeWidth="0.8"
      strokeLinecap="round"
      opacity="0.75"
    />
    <defs>
      <linearGradient id="singlePetalGrad" x1="16" y1="3" x2="16" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fffbeb" />
        <stop offset="0.3" stopColor="#fde68a" />
        <stop offset="0.7" stopColor="#f59e0b" />
        <stop offset="1" stopColor="#92400e" />
      </linearGradient>
    </defs>
  </svg>
);

export const FallingLotusPetals = memo(() => {
  // Configuração estática de 16 partículas com distribuição orgânica
  const petals: PetalConfig[] = useMemo(() => [
    { id: 1, left: 6, duration: 13, delay: -2, swayDuration: 4.2, driftX: 35, swayX: 25, swayRot: 28, rotEnd: 320, size: 28, opacity: 0.75, isFullFlower: true },
    { id: 2, left: 14, duration: 10, delay: -7, swayDuration: 3.5, driftX: -25, swayX: -18, swayRot: -22, rotEnd: 240, size: 18, opacity: 0.65, isFullFlower: false },
    { id: 3, left: 22, duration: 15, delay: -4, swayDuration: 4.8, driftX: 40, swayX: 30, swayRot: 35, rotEnd: 410, size: 32, opacity: 0.82, isFullFlower: true },
    { id: 4, left: 29, duration: 11, delay: -9, swayDuration: 3.8, driftX: -30, swayX: -22, swayRot: -28, rotEnd: 190, size: 16, opacity: 0.55, isFullFlower: false },
    { id: 5, left: 37, duration: 14, delay: -1, swayDuration: 4.5, driftX: 28, swayX: 20, swayRot: 24, rotEnd: 350, size: 26, opacity: 0.72, isFullFlower: true },
    { id: 6, left: 45, duration: 12, delay: -6, swayDuration: 3.9, driftX: -35, swayX: -25, swayRot: -30, rotEnd: 270, size: 19, opacity: 0.6, isFullFlower: false },
    { id: 7, left: 53, duration: 16, delay: -11, swayDuration: 5.2, driftX: 45, swayX: 32, swayRot: 38, rotEnd: 460, size: 30, opacity: 0.8, isFullFlower: true },
    { id: 8, left: 61, duration: 10.5, delay: -3.5, swayDuration: 3.6, driftX: -28, swayX: -20, swayRot: -25, rotEnd: 210, size: 17, opacity: 0.58, isFullFlower: false },
    { id: 9, left: 68, duration: 13.5, delay: -8, swayDuration: 4.4, driftX: 32, swayX: 22, swayRot: 26, rotEnd: 330, size: 27, opacity: 0.74, isFullFlower: true },
    { id: 10, left: 76, duration: 11.5, delay: -5, swayDuration: 3.7, driftX: -32, swayX: -24, swayRot: -28, rotEnd: 250, size: 18, opacity: 0.62, isFullFlower: false },
    { id: 11, left: 84, duration: 15.5, delay: -10, swayDuration: 5.0, driftX: 38, swayX: 28, swayRot: 32, rotEnd: 420, size: 31, opacity: 0.78, isFullFlower: true },
    { id: 12, left: 92, duration: 12, delay: -2.5, swayDuration: 4.0, driftX: -26, swayX: -19, swayRot: -20, rotEnd: 220, size: 16, opacity: 0.55, isFullFlower: false },
    { id: 13, left: 18, duration: 14.5, delay: -12, swayDuration: 4.6, driftX: 30, swayX: 24, swayRot: 27, rotEnd: 360, size: 24, opacity: 0.7, isFullFlower: false },
    { id: 14, left: 49, duration: 13, delay: -7.5, swayDuration: 4.1, driftX: -22, swayX: -17, swayRot: -22, rotEnd: 280, size: 29, opacity: 0.82, isFullFlower: true },
    { id: 15, left: 81, duration: 12.5, delay: -4.2, swayDuration: 3.8, driftX: 25, swayX: 18, swayRot: 25, rotEnd: 310, size: 20, opacity: 0.64, isFullFlower: false },
  ], []);

  return (
    <>
      <style>{`
        @keyframes lotusFall {
          0% {
            transform: translate3d(0, -8vh, 0) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: var(--p-opacity, 0.75);
          }
          90% {
            opacity: var(--p-opacity, 0.75);
          }
          100% {
            transform: translate3d(var(--p-drift, 30px), 108vh, 0) rotate(var(--p-rot, 360deg));
            opacity: 0;
          }
        }
        @keyframes lotusSway {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(var(--p-sway-x, 20px), 0, 0) rotate(var(--p-sway-rot, 20deg));
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
        }
      `}</style>

      <div 
        aria-hidden="true" 
        className="fixed inset-0 pointer-events-none z-[12] overflow-hidden select-none"
      >
        {petals.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 will-change-transform"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `lotusFall ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
              ['--p-opacity' as any]: p.opacity,
              ['--p-drift' as any]: `${p.driftX}px`,
              ['--p-rot' as any]: `${p.rotEnd}deg`,
            }}
          >
            <div
              className="w-full h-full will-change-transform drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              style={{
                animation: `lotusSway ${p.swayDuration}s ease-in-out infinite`,
                animationDelay: `${p.delay * 0.4}s`,
                ['--p-sway-x' as any]: `${p.swayX}px`,
                ['--p-sway-rot' as any]: `${p.swayRot}deg`,
              }}
            >
              {p.isFullFlower ? <LotusFlowerSvg /> : <LotusPetalSvg />}
            </div>
          </div>
        ))}
      </div>
    </>
  );
});

FallingLotusPetals.displayName = 'FallingLotusPetals';
