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

      {/* Braço Direito (Explicando / Animado) */}
      <g className="transition-transform duration-100" style={{ transform: `rotate(${-volume * 20}deg)`, transformOrigin: '65px 100px' }}>
        {/* Manga */}
        <path d="M 65 90 Q 90 100 82 125" fill="none" stroke="#212121" strokeWidth="16" strokeLinecap="round" />
        
        {/* Luva Direita (apontando) com expressão no pulso */}
        <g style={{ transform: `translateY(${-volume * 10}px) rotate(${volume * 40}deg)`, transition: 'transform 0.1s', transformOrigin: '80px 125px' }}>
          {/* Punho gordinho */}
          <ellipse cx="80" cy="125" rx="14" ry="5.5" fill="#e0e0e0" transform="rotate(-15 80 125)" />
          <ellipse cx="81" cy="122" rx="14" ry="5.5" fill="#ffffff" transform="rotate(-15 81 122)" />
          
          {/* Palma */}
          <circle cx="82" cy="112" r="11" fill="#ffffff" />
          
          {/* Dedo indicador grosso apontando para cima (com balanço extra) */}
          <g className="transition-transform duration-100" style={{ transform: `rotate(${volume * 20}deg)`, transformOrigin: '82px 105px' }}>
            <rect x="77.5" y="85" width="9" height="25" rx="4.5" fill="#ffffff" />
          </g>

          {/* Outros dedos dobrados contra a palma */}
          <g className="transition-transform duration-100" style={{ transform: `translateX(${volume * 2}px)` }}>
            <rect x="84" y="103" width="13" height="7.5" rx="3.75" fill="#ffffff" transform="rotate(15 84 103)" />
            <rect x="85" y="111" width="11" height="7" rx="3.5" fill="#ffffff" transform="rotate(20 85 111)" />
            <rect x="84" y="118" width="10" height="6" rx="3" fill="#ffffff" transform="rotate(25 84 118)" />
          </g>

          {/* Polegar sobreposto na frente */}
          <ellipse cx="75" cy="110" rx="4.5" ry="8.5" fill="#ffffff" transform="rotate(-30 75 110)" />

          {/* Sombras/Linhas separando os dedos dobrados */}
          <g className="transition-transform duration-100" style={{ transform: `translateX(${volume * 2}px)` }}>
            <path d="M 85 110 Q 90 110 94 112" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 86 117 Q 89 117 92 119" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
          <path d="M 74 115 Q 77 110 80 108" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
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
          {/* Franja/Tassel animada para o LADO ESQUERDO */}
          <path d="M 50 25 Q 30 25 20 40 L 18 45 L 22 45 Z" fill="#ffb300" className="transition-transform duration-100" style={{ transform: `rotate(${volume * 20}deg)`, transformOrigin: '50px 25px' }} />
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
