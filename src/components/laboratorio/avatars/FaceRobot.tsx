import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceRobot = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 2;
  const antennaGlow = volume > 0.1 ? '#00e5ff' : '#006064';
  const antennaOffset = mouth.openAmount * -3;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      {/* Antena */}
      <path d="M 50 20 L 50 10" stroke="#90a4ae" strokeWidth="4" />
      <circle cx="50" cy="8" r="4" fill={antennaGlow} className="transition-colors duration-100" style={{ transform: `translateY(${antennaOffset}px)` }} />
      
      {/* Cabeça */}
      <rect x="20" y="20" width="60" height="60" rx="12" fill="#eceff1" stroke="#b0bec5" strokeWidth="3" />
      <rect x="15" y="45" width="5" height="15" fill="#90a4ae" rx="2" />
      <rect x="80" y="45" width="5" height="15" fill="#90a4ae" rx="2" />

      {/* Olhos (Telas de LED) */}
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.2, eyeScale)})`, transformOrigin: '37px 40px' }}>
        <rect x="30" y="35" width="15" height="10" rx="3" fill="#00e5ff" />
        <rect x="32" y="37" width="4" height="3" fill="#fff" opacity="0.6" />
      </g>
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.2, eyeScale)})`, transformOrigin: '62px 40px' }}>
        <rect x="55" y="35" width="15" height="10" rx="3" fill="#00e5ff" />
        <rect x="57" y="37" width="4" height="3" fill="#fff" opacity="0.6" />
      </g>

      {/* Painel da Boca */}
      <rect x="25" y="55" width="50" height="20" rx="5" fill="#263238" />

      {/* Boca Mecânica Animada (3 camadas usando a cor do LED) */}
      <g className="transition-all duration-100" style={{ transform: 'translateY(-2px)' }}>
        <path d={mouth.lips} fill="#00b8d4" opacity="0.8" />
        <path d={mouth.opening} fill="#000000" />
        <path d={mouth.tongue} fill="#84ffff" opacity="0.5" />
      </g>
    </svg>
  );
};
