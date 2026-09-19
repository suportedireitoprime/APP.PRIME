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
        <style>{`
          .idle-blink {
            animation: blink 4s infinite;
          }
          .idle-look {
            animation: lookAround 8s infinite;
          }
          @keyframes blink {
            0%, 96% { transform: scale(1, 1); }
            98% { transform: scale(1, 0.1); }
            100% { transform: scale(1, 1); }
          }
          @keyframes lookAround {
            0%, 20% { transform: translateX(0px); }
            25%, 45% { transform: translateX(-3px); }
            50%, 70% { transform: translateX(3px); }
            75%, 100% { transform: translateX(0px); }
          }
        `}</style>
      </defs>
      
      {/* Ondas Sonoras no Fundo (movidas levemente para cobrir o corpo todo se precisar, ou só a cabeça) */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="#fbc02d" strokeWidth="2" className="transition-all duration-100" style={{ transform: `scale(${1 + volume * 0.8})`, opacity: Math.max(0, 0.8 - volume), transformOrigin: '50px 50px' }} />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#ffeb3b" strokeWidth="4" className="transition-all duration-100" style={{ transform: `scale(${1 + volume * 0.4})`, opacity: Math.max(0, 0.6 - volume), transformOrigin: '50px 50px' }} />

      {/* Braço Esquerdo (Descansando) */}
      <g className="transition-transform duration-100" style={{ transform: `rotate(${volume * 5}deg)`, transformOrigin: '35px 100px' }}>
        {/* Manga */}
        <path d="M 35 90 Q 15 110 20 135" fill="none" stroke="#212121" strokeWidth="16" strokeLinecap="round" />
        
        {/* Luva Esquerda */}
        <g transform="translate(20, 138) rotate(-15)">
          {/* Punho gordinho */}
          <ellipse cx="0" cy="-6" rx="13" ry="5" fill="#e0e0e0" />
          <ellipse cx="0" cy="-8" rx="13" ry="5" fill="#ffffff" />
          
          {/* Palma */}
          <circle cx="0" cy="2" r="10" fill="#ffffff" />
          
          {/* Dedos relaxados */}
          <rect x="-9" y="6" width="6.5" height="13" rx="3.25" fill="#ffffff" transform="rotate(15 -9 6)" />
          <rect x="-3.5" y="8" width="7" height="15" rx="3.5" fill="#ffffff" />
          <rect x="2.5" y="6" width="6.5" height="13" rx="3.25" fill="#ffffff" transform="rotate(-15 2.5 6)" />
          
          {/* Polegar */}
          <ellipse cx="8" cy="2" rx="4.5" ry="8" fill="#ffffff" transform="rotate(-45 8 2)" />
          
          {/* Linhas de contorno suaves */}
          <path d="M -3.5 12 L -3.5 20" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 3.5 10 L 3.5 17" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      </g>

      {/* Braço Direito (Segurando Martelo da Justiça de forma frontal) */}
      <g className="transition-transform duration-100" style={{ transform: `rotate(${-volume * 15}deg)`, transformOrigin: '65px 100px' }}>
        {/* Manga (Dobrada para frente) */}
        <path d="M 65 95 Q 100 95 90 125" fill="none" stroke="#212121" strokeWidth="18" strokeLinecap="round" />
        
        {/* Mão Direita e Martelo */}
        <g style={{ transform: `translateY(${-volume * 5}px) rotate(${volume * 30}deg)`, transition: 'transform 0.1s', transformOrigin: '90px 125px' }}>
          
          {/* Cabo do Martelo (em um ângulo mais natural) */}
          <rect x="85" y="90" width="8" height="45" rx="3" fill="#795548" transform="rotate(15 89 112)" />
          {/* Cabeça do Martelo */}
          <g transform="rotate(15 89 112)">
            <rect x="75" y="85" width="28" height="14" rx="3" fill="#5D4037" />
            <rect x="73" y="88" width="32" height="8" rx="2" fill="#4E342E" />
          </g>

          {/* Mão (Luva Branca) segurando o cabo pela frente */}
          <circle cx="90" cy="125" r="10" fill="#ffffff" />
          
          {/* Dedos dobrados na frente do cabo */}
          <rect x="82" y="118" width="14" height="6" rx="3" fill="#ffffff" transform="rotate(15 82 118)" />
          <rect x="83" y="124" width="14" height="6" rx="3" fill="#ffffff" transform="rotate(15 83 124)" />
          <rect x="85" y="130" width="14" height="6" rx="3" fill="#ffffff" transform="rotate(15 85 130)" />
          
          {/* Polegar fechando a pegada, cruzando o cabo */}
          <ellipse cx="96" cy="118" rx="4" ry="8" fill="#ffffff" transform="rotate(-30 96 118)" />
          
          {/* Punho */}
          <ellipse cx="90" cy="138" rx="13" ry="5.5" fill="#e0e0e0" transform="rotate(15 90 138)" />
          <ellipse cx="90" cy="135" rx="13" ry="5.5" fill="#ffffff" transform="rotate(15 90 135)" />
        </g>
      </g>

      {/* Corpo (Toga de Juiz) */}
      <g className="transition-transform duration-100" style={{ transform: `scale(1, ${1 + volume * 0.02})`, transformOrigin: '50px 180px' }}>
        <path d="M 35 90 Q 20 130 15 180 L 85 180 Q 80 130 65 90 Z" fill="#212121" />
        {/* Colarinho branco (jabot) típico de magistrados */}
        <path d="M 40 90 L 60 90 L 55 110 L 50 115 L 45 110 Z" fill="#ffffff" />
        {/* Linhas do jabot */}
        <path d="M 45 90 L 45 110" stroke="#eeeeee" strokeWidth="1" />
        <path d="M 50 90 L 50 115" stroke="#e0e0e0" strokeWidth="1.5" />
        <path d="M 55 90 L 55 110" stroke="#eeeeee" strokeWidth="1" />
        <path d="M 50 115 L 50 180" stroke="#111111" strokeWidth="4" />
      </g>

      {/* Cabeça e Efeito de amassar (squash & stretch) */}
      <g style={{ transform: `translateY(${bounce}px) scale(${1 + volume * 0.08}, ${1 - volume * 0.08})`, transformOrigin: '50px 95px', transition: 'transform 0.1s' }}>
        <circle cx="50" cy="50" r="45" fill="url(#skinYellow)" />
        
        {/* Peruca de Juiz (Magistrate Wig) */}
        <g className="transition-transform duration-100" style={{ transform: `translateY(${-35 + volume * 4}px) scale(1.15) rotate(${volume * 3}deg)`, transformOrigin: '50px 30px' }}>
          {/* Base da peruca */}
          <path d="M 15 50 Q 10 20 50 10 Q 90 20 85 50 Q 80 65 75 60 L 75 40 Q 50 25 25 40 L 25 60 Q 20 65 15 50 Z" fill="#f5f5f5" />
          {/* Rolos laterais esquerdos */}
          <circle cx="20" cy="45" r="7" fill="#eeeeee" stroke="#e0e0e0" strokeWidth="1" />
          <circle cx="22" cy="55" r="7" fill="#eeeeee" stroke="#e0e0e0" strokeWidth="1" />
          <circle cx="25" cy="65" r="7" fill="#eeeeee" stroke="#e0e0e0" strokeWidth="1" />
          {/* Rolos laterais direitos */}
          <circle cx="80" cy="45" r="7" fill="#eeeeee" stroke="#e0e0e0" strokeWidth="1" />
          <circle cx="78" cy="55" r="7" fill="#eeeeee" stroke="#e0e0e0" strokeWidth="1" />
          <circle cx="75" cy="65" r="7" fill="#eeeeee" stroke="#e0e0e0" strokeWidth="1" />
          {/* Linhas da peruca no topo */}
          <path d="M 30 20 Q 50 15 70 20" fill="none" stroke="#e0e0e0" strokeWidth="2" />
          <path d="M 35 25 Q 50 20 65 25" fill="none" stroke="#e0e0e0" strokeWidth="2" />
          <path d="M 40 30 Q 50 25 60 30" fill="none" stroke="#e0e0e0" strokeWidth="2" />
        </g>

        {/* Sobrancelhas */}
        <path d="M 28 33 Q 35 28 42 33" fill="none" stroke="#f57f17" strokeWidth="3" strokeLinecap="round" className="transition-all duration-100" style={{ transform: `translateY(${browOffset}px)` }} />
        <path d="M 58 33 Q 65 28 72 33" fill="none" stroke="#f57f17" strokeWidth="3" strokeLinecap="round" className="transition-all duration-100" style={{ transform: `translateY(${browOffset}px)` }} />

        {/* Olhos com animações Idle (piscar e olhar para os lados) misturadas com o scale do áudio */}
        <g className="idle-blink" style={{ transformOrigin: '35px 40px' }}>
          <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '35px 40px' }}>
            <g className="idle-look">
              <ellipse cx="35" cy="40" rx="4.5" ry="8.5" fill="#3e2723" />
              <circle cx="34" cy="36" r="2" fill="#fff" />
            </g>
          </g>
        </g>
        
        <g className="idle-blink" style={{ transformOrigin: '65px 40px' }}>
          <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '65px 40px' }}>
            <g className="idle-look">
              <ellipse cx="65" cy="40" rx="4.5" ry="8.5" fill="#3e2723" />
              <circle cx="64" cy="36" r="2" fill="#fff" />
            </g>
          </g>
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
