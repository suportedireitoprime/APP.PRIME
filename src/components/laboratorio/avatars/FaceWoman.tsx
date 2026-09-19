import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceWoman = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  // Animações expressivas
  const eyeScale = 1 + volume * 1.5;
  const browOffset = mouth.openAmount * -5;
  const hairBounce = volume * 2;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="skinWoman" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8d6c0" />
          <stop offset="100%" stopColor="#e3ba9f" />
        </linearGradient>
      </defs>
      
      {/* Cabelo Fundo */}
      <path d="M 10 50 Q 10 90 30 100 L 70 100 Q 90 90 90 50 Z" fill="#2c1d11" className="transition-all duration-75" style={{ transform: `translateY(${hairBounce}px)` }} />
      
      {/* Rosto */}
      <circle cx="50" cy="50" r="35" fill="url(#skinWoman)" />
      
      {/* Sobrancelhas */}
      <path d="M 28 38 Q 35 34 42 38" fill="none" stroke="#2c1d11" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-100" style={{ transform: `translateY(${browOffset}px)` }} />
      <path d="M 58 38 Q 65 34 72 38" fill="none" stroke="#2c1d11" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-100" style={{ transform: `translateY(${browOffset}px)` }} />
      
      {/* Olhos Expressivos */}
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '35px 45px' }}>
        <circle cx="35" cy="45" r="5.5" fill="#4e342e" />
        <circle cx="33.5" cy="43.5" r="2" fill="#fff" />
      </g>
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '65px 45px' }}>
        <circle cx="65" cy="45" r="5.5" fill="#4e342e" />
        <circle cx="63.5" cy="43.5" r="2" fill="#fff" />
      </g>

      {/* Cabelo Frente */}
      <path d="M 15 50 Q 25 20 50 15 Q 75 20 85 50 Q 70 25 50 25 Q 30 25 15 50 Z" fill="#3e2723" />
      
      {/* Nariz */}
      <path d="M 50 50 Q 52 55 50 55" fill="none" stroke="#a1887f" strokeWidth="2" strokeLinecap="round" />
      
      {/* Boca 3 Camadas */}
      <g className="transition-all duration-100">
        <path d={mouth.lips} fill="#d81b60" />
        <path d={mouth.opening} fill="#4a0000" />
        <path d={mouth.tongue} fill="#ff8a80" />
      </g>
    </svg>
  );
};
