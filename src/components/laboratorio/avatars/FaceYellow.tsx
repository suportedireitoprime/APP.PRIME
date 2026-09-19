import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceYellow = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 1.5;
  const browOffset = mouth.openAmount * -5;
  const bounce = volume * 3;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
      <defs>
        <radialGradient id="skinYellow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#ffeb3b" />
          <stop offset="100%" stopColor="#fbc02d" />
        </radialGradient>
      </defs>
      
      <g style={{ transform: `translateY(${bounce}px)`, transition: 'transform 0.1s' }}>
        <circle cx="50" cy="50" r="45" fill="url(#skinYellow)" />
        
        {/* Chapéu de Formatura (Capelo) */}
        <g className="transition-transform duration-100" style={{ transform: 'translateY(-30px)' }}>
          {/* Base cilíndrica */}
          <path d="M 35 40 Q 50 45 65 40 L 65 30 Q 50 35 35 30 Z" fill="#212121" />
          {/* Topo do chapéu (losango) */}
          <polygon points="50,15 85,25 50,35 15,25" fill="#424242" />
          {/* Botão central */}
          <circle cx="50" cy="25" r="3" fill="#ffb300" />
          {/* Franja/Tassel */}
          <path d="M 50 25 Q 70 25 80 40 L 82 45 L 78 45 Z" fill="#ffb300" />
        </g>

        {/* Sobrancelhas */}
        <path d="M 28 33 Q 35 28 42 33" fill="none" stroke="#f57f17" strokeWidth="3" strokeLinecap="round" className="transition-all duration-100" style={{ transform: `translateY(${browOffset}px)` }} />
        <path d="M 58 33 Q 65 28 72 33" fill="none" stroke="#f57f17" strokeWidth="3" strokeLinecap="round" className="transition-all duration-100" style={{ transform: `translateY(${browOffset}px)` }} />

        {/* Olhos */}
        <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '35px 40px' }}>
          <ellipse cx="35" cy="40" rx="4.5" ry="8.5" fill="#3e2723" />
          <circle cx="34" cy="36" r="2" fill="#fff" />
        </g>
        <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '65px 40px' }}>
          <ellipse cx="65" cy="40" rx="4.5" ry="8.5" fill="#3e2723" />
          <circle cx="64" cy="36" r="2" fill="#fff" />
        </g>
        
        {/* Boca 3 Camadas */}
        <g className="transition-all duration-100">
          <path d={mouth.lips} fill="#3e2723" />
          <path d={mouth.opening} fill="#1a0000" />
          <path d={mouth.tongue} fill="#e57373" />
        </g>
      </g>
    </svg>
  );
};
