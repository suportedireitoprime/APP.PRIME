import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceOwl = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 1.8;
  const browOffset = mouth.openAmount * -6;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <radialGradient id="skinOwl" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#8D6E63" />
          <stop offset="100%" stopColor="#5D4037" />
        </radialGradient>
      </defs>

      <ellipse cx="50" cy="50" rx="45" ry="40" fill="url(#skinOwl)" />
      
      {/* Tufos da coruja (Sobrancelhas) */}
      <path d="M 20 25 Q 35 15 45 30" fill="none" stroke="#4E342E" strokeWidth="6" strokeLinecap="round" className="transition-all duration-100" style={{ transform: `translateY(${browOffset}px)` }} />
      <path d="M 80 25 Q 65 15 55 30" fill="none" stroke="#4E342E" strokeWidth="6" strokeLinecap="round" className="transition-all duration-100" style={{ transform: `translateY(${browOffset}px)` }} />

      {/* Fundo do Olho */}
      <circle cx="35" cy="40" r="15" fill="#FFF" />
      <circle cx="65" cy="40" r="15" fill="#FFF" />
      
      {/* Pupilas Expressivas */}
      <g className="transition-all duration-75" style={{ transform: `scale(${Math.max(0.8, eyeScale)})`, transformOrigin: '35px 40px' }}>
        <circle cx="35" cy="40" r="6" fill="#1A1A1A" />
        <circle cx="33" cy="38" r="2" fill="#FFF" />
      </g>
      <g className="transition-all duration-75" style={{ transform: `scale(${Math.max(0.8, eyeScale)})`, transformOrigin: '65px 40px' }}>
        <circle cx="65" cy="40" r="6" fill="#1A1A1A" />
        <circle cx="63" cy="38" r="2" fill="#FFF" />
      </g>

      {/* Bico/Boca 3 Camadas */}
      <g className="transition-all duration-100" style={{ transform: 'translateY(5px)' }}>
        <path d={mouth.lips} fill="#FFB300" stroke="#FF8F00" strokeWidth="1.5" />
        <path d={mouth.opening} fill="#E65100" />
        <path d={mouth.tongue} fill="#FFCC80" />
      </g>
    </svg>
  );
};
