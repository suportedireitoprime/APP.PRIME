import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceBear = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 1.4;
  const browOffset = mouth.openAmount * -5;
  const earBounce = volume * 4;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <radialGradient id="skinBear" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#8d6e63" />
          <stop offset="100%" stopColor="#5d4037" />
        </radialGradient>
      </defs>

      {/* Orelhas */}
      <circle cx="20" cy="30" r="15" fill="#5d4037" className="transition-transform duration-100" style={{ transform: `scale(${1 + earBounce * 0.1})`, transformOrigin: '20px 30px' }} />
      <circle cx="80" cy="30" r="15" fill="#5d4037" className="transition-transform duration-100" style={{ transform: `scale(${1 + earBounce * 0.1})`, transformOrigin: '80px 30px' }} />
      <circle cx="20" cy="30" r="8" fill="#d7ccc8" />
      <circle cx="80" cy="30" r="8" fill="#d7ccc8" />

      {/* Cabeça */}
      <circle cx="50" cy="55" r="40" fill="url(#skinBear)" />

      {/* Focinho */}
      <ellipse cx="50" cy="65" rx="20" ry="15" fill="#d7ccc8" />
      <path d="M 45 58 Q 50 62 55 58 Q 50 68 45 58 Z" fill="#3e2723" />

      {/* Sobrancelhas */}
      <path d="M 30 35 Q 35 32 40 35" fill="none" stroke="#3e2723" strokeWidth="4" strokeLinecap="round" className="transition-transform duration-100" style={{ transform: `translateY(${browOffset}px)` }} />
      <path d="M 60 35 Q 65 32 70 35" fill="none" stroke="#3e2723" strokeWidth="4" strokeLinecap="round" className="transition-transform duration-100" style={{ transform: `translateY(${browOffset}px)` }} />

      {/* Olhos */}
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '35px 42px' }}>
        <circle cx="35" cy="42" r="5" fill="#3e2723" />
        <circle cx="33.5" cy="40.5" r="1.5" fill="#fff" />
      </g>
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '65px 42px' }}>
        <circle cx="65" cy="42" r="5" fill="#3e2723" />
        <circle cx="63.5" cy="40.5" r="1.5" fill="#fff" />
      </g>

      {/* Boca 3 Camadas */}
      <g className="transition-all duration-100" style={{ transform: 'translateY(10px)' }}>
        <path d={mouth.lips} fill="#3e2723" />
        <path d={mouth.opening} fill="#1a0000" />
        <path d={mouth.tongue} fill="#e57373" />
      </g>
    </svg>
  );
};
