import React from 'react';
import { getMouthShape } from './VisemeDictionary';

export const FaceNinja = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouth = getMouthShape(viseme);
  
  const eyeScale = 1 + volume * 1.5;
  const browOffset = mouth.openAmount * -8;
  const maskBounce = volume * -2;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="ninjaMask" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#424242" />
          <stop offset="100%" stopColor="#212121" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="45" fill="url(#ninjaMask)" />
      
      {/* Fenda da mácara mostrando a pele */}
      <path d="M 15 40 Q 50 30 85 40 Q 80 55 50 55 Q 20 55 15 40 Z" fill="#ffe0bd" />
      
      {/* Detalhe da faixa na testa */}
      <path d="M 15 25 Q 50 35 85 25 L 80 20 Q 50 30 20 20 Z" fill="#b71c1c" />

      {/* Sobrancelhas bravas */}
      <path d="M 25 40 Q 35 38 43 42" fill="none" stroke="#212121" strokeWidth="3" strokeLinecap="round" className="transition-transform duration-100" style={{ transform: `translateY(${browOffset}px)` }} />
      <path d="M 75 40 Q 65 38 57 42" fill="none" stroke="#212121" strokeWidth="3" strokeLinecap="round" className="transition-transform duration-100" style={{ transform: `translateY(${browOffset}px)` }} />

      {/* Olhos penetrantes */}
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '35px 45px' }}>
        <circle cx="35" cy="45" r="5" fill="#000" />
        <circle cx="34" cy="44" r="1.5" fill="#fff" />
      </g>
      <g className="transition-all duration-75" style={{ transform: `scale(1, ${Math.max(0.1, eyeScale)})`, transformOrigin: '65px 45px' }}>
        <circle cx="65" cy="45" r="5" fill="#000" />
        <circle cx="64" cy="44" r="1.5" fill="#fff" />
      </g>

      {/* A máscara de baixo abaixa levemente ao falar (imitando o movimento do queixo sob o tecido) */}
      <path d="M 15 55 Q 50 65 85 55 A 45 45 0 0 1 15 55 Z" fill="#212121" className="transition-transform duration-100" style={{ transform: `translateY(${-maskBounce}px)` }} />

      {/* Como o ninja está de máscara e a pele vai até Y=55, a boca precisa ficar ali! */}
      {/* Mas se redesenharmos a boca sob a máscara fica estranho. Vamos fazer a boca aparecer ATRAVÉS do tecido ou apenas o tecido se mover.
          Como a instrução é usar o Viseme, vou renderizar a boca e um véu translúcido, ou apenas a boca na parte inferior. */}
      {/* Vou fazer a fenda mais baixa para mostrar a boca! */}
      <path d="M 15 40 Q 50 30 85 40 Q 80 80 50 80 Q 20 80 15 40 Z" fill="#ffe0bd" />
      
      <g className="transition-all duration-100" style={{ transform: 'translateY(5px)' }}>
        <path d={mouth.lips} fill="#d81b60" />
        <path d={mouth.opening} fill="#4a0000" />
        <path d={mouth.tongue} fill="#ff8a80" />
      </g>

      {/* Máscara inferior real (Cobrindo só do queixo pra baixo ou estilo bandana) */}
      <path d="M 5 65 Q 50 55 95 65 A 45 45 0 0 1 5 65 Z" fill="url(#ninjaMask)" className="transition-transform duration-100" style={{ transform: `translateY(${mouth.openAmount * 8}px)` }} />
      <path d="M 5 65 Q 50 55 95 65" fill="none" stroke="#111" strokeWidth="2" className="transition-transform duration-100" style={{ transform: `translateY(${mouth.openAmount * 8}px)` }} />

    </svg>
  );
};
