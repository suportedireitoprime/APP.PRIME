import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceYellow = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 1.5;
  const browOffset = mouth.openAmount * -5;
  const bounce = volume * 3;

  return (
    <svg viewBox="-10 -35 120 165" preserveAspectRatio="xMidYMax slice" className="w-full h-full drop-shadow-2xl overflow-visible">
      <defs>
        <radialGradient id="skinYellow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#ffeb3b" />
          <stop offset="100%" stopColor="#fbc02d" />
        </radialGradient>
      </defs>
      
      {/* Ondas Sonoras no Fundo (movidas levemente para cobrir o corpo todo se precisar, ou só a cabeça) */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="#fbc02d" strokeWidth="2" className="transition-all duration-100" style={{ transform: `scale(${1 + volume * 0.8})`, opacity: Math.max(0, 0.8 - volume), transformOrigin: '50px 50px' }} />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#ffeb3b" strokeWidth="4" className="transition-all duration-100" style={{ transform: `scale(${1 + volume * 0.4})`, opacity: Math.max(0, 0.6 - volume), transformOrigin: '50px 50px' }} />

      {/* Braço Esquerdo (Descansando) */}
      <g className="transition-transform duration-100" style={{ transform: `rotate(${volume * 5}deg)`, transformOrigin: '35px 100px' }}>
        <path d="M 35 90 Q 5 110 15 140" fill="none" stroke="#212121" strokeWidth="14" strokeLinecap="round" />
        {/* Luva esquerda recolhida */}
        <ellipse cx="15" cy="140" rx="10" ry="14" fill="#ffffff" transform="rotate(-30 15 140)" />
        <ellipse cx="15" cy="132" rx="12" ry="4" fill="#e0e0e0" transform="rotate(-30 15 132)" />
      </g>

      {/* Braço Direito (Explicando / Animado) */}
      <g className="transition-transform duration-100" style={{ transform: `rotate(${-volume * 25}deg)`, transformOrigin: '65px 100px' }}>
        <path d="M 65 90 Q 95 100 85 130" fill="none" stroke="#212121" strokeWidth="14" strokeLinecap="round" />
        
        {/* Luva (estilo cartoon) */}
        <g style={{ transform: `translateY(${-volume * 5}px)`, transition: 'transform 0.1s' }}>
          {/* Borda do pulso da luva */}
          <ellipse cx="85" cy="126" rx="13" ry="5" fill="#e0e0e0" transform="rotate(15 85 126)" />
          <ellipse cx="85" cy="123" rx="13" ry="5" fill="#ffffff" transform="rotate(15 85 123)" />
          
          {/* Corpo da luva (Palma) */}
          <circle cx="82" cy="110" r="12" fill="#ffffff" />
          
          {/* Dedo indicador (apontando para cima/explicando) */}
          <g className="transition-transform duration-100" style={{ transform: `rotate(${volume * 15}deg)`, transformOrigin: '85px 105px' }}>
            <path d="M 85 105 L 88 85 Q 90 82 92 85 L 90 105" fill="#ffffff" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 85 105 L 88 85 Q 90 82 92 85" stroke="#e0e0e0" strokeWidth="1" fill="none" />
          </g>

          {/* Outros dedos curvados */}
          <circle cx="72" cy="108" r="4.5" fill="#ffffff" />
          <circle cx="94" cy="108" r="4.5" fill="#ffffff" />
          <circle cx="96" cy="115" r="4" fill="#ffffff" />
          
          {/* Linhas da luva (detalhes cartoon) */}
          <path d="M 78 112 Q 79 118 78 120" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 84 112 Q 83 118 84 120" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      </g>

      {/* Corpo (Beca de formatura) */}
      <g className="transition-transform duration-100" style={{ transform: `scale(1, ${1 + volume * 0.02})`, transformOrigin: '50px 180px' }}>
        <path d="M 35 90 Q 20 130 15 180 L 85 180 Q 80 130 65 90 Z" fill="#212121" />
        {/* Detalhe da gola da beca */}
        <path d="M 35 90 L 50 115 L 65 90" fill="#424242" />
        <path d="M 50 115 L 50 180" stroke="#424242" strokeWidth="3" />
      </g>

      {/* Cabeça e Efeito de amassar (squash & stretch) */}
      <g style={{ transform: `translateY(${bounce}px) scale(${1 + volume * 0.08}, ${1 - volume * 0.08})`, transformOrigin: '50px 95px', transition: 'transform 0.1s' }}>
        <circle cx="50" cy="50" r="45" fill="url(#skinYellow)" />
        
        {/* Chapéu de Formatura (Capelo) - Maior e Animado */}
        <g className="transition-transform duration-100" style={{ transform: `translateY(${-35 + volume * 4}px) scale(1.35) rotate(${volume * 8}deg)`, transformOrigin: '50px 30px' }}>
          {/* Base cilíndrica */}
          <path d="M 35 40 Q 50 45 65 40 L 65 30 Q 50 35 35 30 Z" fill="#212121" />
          {/* Topo do chapéu (losango) */}
          <polygon points="50,15 85,25 50,35 15,25" fill="#424242" />
          {/* Botão central */}
          <circle cx="50" cy="25" r="3" fill="#ffb300" />
          {/* Franja/Tassel animada (balança com a fala) */}
          <path d="M 50 25 Q 70 25 80 40 L 82 45 L 78 45 Z" fill="#ffb300" className="transition-transform duration-100" style={{ transform: `rotate(${-volume * 20}deg)`, transformOrigin: '50px 25px' }} />
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
