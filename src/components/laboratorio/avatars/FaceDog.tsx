import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceDog = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 1.5;
  const earBounce = volume * 5;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      {/* Orelhas de cachorro caídas (Golden Retriever) */}
      <path d="M 25 35 Q -10 60 15 80 Q 25 60 25 35 Z" fill="#bcaaa4" className="transition-transform duration-100" style={{ transform: `rotate(${earBounce}deg)`, transformOrigin: '25px 35px' }} />
      <path d="M 75 35 Q 110 60 85 80 Q 75 60 75 35 Z" fill="#bcaaa4" className="transition-transform duration-100" style={{ transform: `rotate(${-earBounce}deg)`, transformOrigin: '75px 35px' }} />

      {/* Rosto */}
      <circle cx="50" cy="50" r="40" fill="#d2b48c" />
      <path d="M 50 55 Q 30 75 25 60 Q 50 95 75 60 Q 70 75 50 55" fill="#fff8e1" />

      {/* Olhos dóceis */}
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '35px 40px' }}>
        <ellipse cx="35" cy="40" rx="5" ry="7" fill="#3e2723" />
        <circle cx="34" cy="38" r="2" fill="#fff" />
      </g>
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '65px 40px' }}>
        <ellipse cx="65" cy="40" rx="5" ry="7" fill="#3e2723" />
        <circle cx="64" cy="38" r="2" fill="#fff" />
      </g>

      {/* Focinho de cachorro grandão */}
      <ellipse cx="50" cy="52" rx="10" ry="6" fill="#3e2723" />
      
      {/* Boca 3 Camadas - Cachorro com língua aparente */}
      <g className="transition-all duration-100" style={{ transform: 'translateY(2px)' }}>
        <path d={mouth.lips} fill="#3e2723" />
        <path d={mouth.opening} fill="#1a0000" />
        <path d={mouth.tongue} fill="#ef5350" />
      </g>
    </svg>
  );
};
