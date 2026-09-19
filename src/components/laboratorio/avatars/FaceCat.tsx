import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceCat = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 1.5;
  const earOffset = mouth.openAmount * 4;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      {/* Orelhas */}
      <path d="M 20 40 L 15 15 L 40 25 Z" fill="#FF9800" className="transition-transform duration-100" style={{ transform: `rotate(${-earOffset}deg)`, transformOrigin: '20px 40px' }} />
      <path d="M 80 40 L 85 15 L 60 25 Z" fill="#FF9800" className="transition-transform duration-100" style={{ transform: `rotate(${earOffset}deg)`, transformOrigin: '80px 40px' }} />
      
      {/* Rosto */}
      <ellipse cx="50" cy="55" rx="42" ry="38" fill="#FFB74D" />
      <path d="M 50 55 Q 30 70 15 60 Q 50 90 85 60 Q 70 70 50 55" fill="#FFE0B2" />
      
      {/* Olhos Felinos */}
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '35px 45px' }}>
        <ellipse cx="35" cy="45" rx="6" ry="10" fill="#FFF" />
        <ellipse cx="35" cy="45" rx="2.5" ry="8" fill="#1A1A1A" />
      </g>
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '65px 45px' }}>
        <ellipse cx="65" cy="45" rx="6" ry="10" fill="#FFF" />
        <ellipse cx="65" cy="45" rx="2.5" ry="8" fill="#1A1A1A" />
      </g>

      {/* Nariz */}
      <path d="M 45 52 L 55 52 L 50 56 Z" fill="#F48FB1" />
      
      {/* Boca 3 Camadas */}
      <g className="transition-all duration-100">
        <path d={mouth.lips} fill="#4E342E" />
        <path d={mouth.opening} fill="#212121" />
        <path d={mouth.tongue} fill="#F06292" />
      </g>
    </svg>
  );
};
