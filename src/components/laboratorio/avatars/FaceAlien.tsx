import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceAlien = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 1.5;
  const headPulse = 1 + volume * 0.05;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="skinAlien" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#81c784" />
          <stop offset="100%" stopColor="#388e3c" />
        </linearGradient>
      </defs>

      {/* Cabeça alienígena clássica invertida gota */}
      <g className="transition-transform duration-100" style={{ transform: `scale(${headPulse})`, transformOrigin: '50px 50px' }}>
        <path d="M 15 35 Q 50 -15 85 35 Q 95 80 50 95 Q 5 80 15 35 Z" fill="url(#skinAlien)" />
        
        {/* Olhos imensos (Alien Gray) */}
        <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '30px 48px' }}>
          <ellipse cx="30" cy="48" rx="16" ry="24" fill="#111" transform="rotate(-25 30 48)" />
          <ellipse cx="26" cy="42" rx="4" ry="8" fill="#fff" opacity="0.4" transform="rotate(-25 26 42)" />
        </g>
        <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '70px 48px' }}>
          <ellipse cx="70" cy="48" rx="16" ry="24" fill="#111" transform="rotate(25 70 48)" />
          <ellipse cx="74" cy="42" rx="4" ry="8" fill="#fff" opacity="0.4" transform="rotate(25 74 42)" />
        </g>

        {/* Narinas discretas */}
        <circle cx="47" cy="65" r="1" fill="#1b5e20" />
        <circle cx="53" cy="65" r="1" fill="#1b5e20" />

        {/* Boca 3 Camadas */}
        <g className="transition-all duration-100" style={{ transform: 'translateY(12px) scale(0.8)', transformOrigin: '50px 70px' }}>
          <path d={mouth.lips} fill="#1b5e20" />
          <path d={mouth.opening} fill="#000" />
          <path d={mouth.tongue} fill="#66bb6a" />
        </g>
      </g>
    </svg>
  );
};
