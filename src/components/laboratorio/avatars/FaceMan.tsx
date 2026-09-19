import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceMan = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 1.5;
  const browOffset = mouth.openAmount * -5;
  const headNod = volume * 3;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="skinMan" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5d0b5" />
          <stop offset="100%" stopColor="#d7b299" />
        </linearGradient>
      </defs>

      <g className="transition-all duration-100" style={{ transform: `translateY(${headNod}px)` }}>
        {/* Formato do rosto mais retangular/robusto */}
        <rect x="25" y="20" width="50" height="70" rx="20" fill="url(#skinMan)" />
        
        {/* Cabelo (Corte moderno) */}
        <path d="M 23 35 Q 25 15 50 15 Q 75 15 77 35 Q 70 20 50 20 Q 30 20 23 35 Z" fill="#3e2723" />
        <path d="M 23 35 Q 23 50 25 50 L 25 35 Z" fill="#3e2723" />
        <path d="M 77 35 Q 77 50 75 50 L 75 35 Z" fill="#3e2723" />

        {/* Sobrancelhas retas */}
        <rect x="30" y="36" width="12" height="3" fill="#3e2723" rx="1.5" className="transition-transform duration-100" style={{ transform: `translateY(${browOffset}px)` }} />
        <rect x="58" y="36" width="12" height="3" fill="#3e2723" rx="1.5" className="transition-transform duration-100" style={{ transform: `translateY(${browOffset}px)` }} />

        {/* Olhos */}
        <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '36px 42px' }}>
          <circle cx="36" cy="42" r="4.5" fill="#4e342e" />
          <circle cx="35" cy="41" r="1.5" fill="#fff" />
        </g>
        <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '64px 42px' }}>
          <circle cx="64" cy="42" r="4.5" fill="#4e342e" />
          <circle cx="63" cy="41" r="1.5" fill="#fff" />
        </g>

        {/* Nariz angulado */}
        <path d="M 50 45 L 48 55 L 52 55" fill="none" stroke="#bcaaa4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Barba (por fazer) */}
        <path d="M 30 65 Q 50 85 70 65 Q 50 90 30 65 Z" fill="#8d6e63" opacity="0.3" />

        {/* Boca 3 Camadas */}
        <g className="transition-all duration-100" style={{ transform: 'translateY(5px)' }}>
          <path d={mouth.lips} fill="#bcaaa4" />
          <path d={mouth.opening} fill="#3e2723" />
          <path d={mouth.tongue} fill="#e57373" />
        </g>
      </g>
    </svg>
  );
};
