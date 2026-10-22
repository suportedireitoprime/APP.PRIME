import React, { useId, useMemo } from 'react';
import { getMouthShape } from './VisemeDictionary';

type Status = 'conectando' | 'ouvindo' | 'falando' | string;

interface Props {
  viseme: string;
  volume: number;
  status?: Status;
}

/**
 * Professor Prime — avatar SVG animado.
 * A peruca é uma peça sólida desenhada sobre a cabeça (sem recortes),
 * então nunca aparece fundo entre o cabelo e o rosto.
 */
export const FaceYellow = ({ viseme, volume, status = 'falando' }: Props) => {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${n}-${uid}`;
  const mouth = getMouthShape(viseme);
  const v = Math.max(0, Math.min(1, volume || 0));

  const falando = status === 'falando';
  const conectando = status === 'conectando';
  const ouvindo = status === 'ouvindo';

  // olhar: ouvindo = olha para frente; conectando = pensativo (para cima)
  const eyeY = conectando ? -3 : 0;
  const browY = (falando ? mouth.openAmount * -4 - v * 2 : 0) + (conectando ? -2 : 0) + (ouvindo ? -1 : 0);
  const headTilt = falando ? Math.sin(v * 6) * 2.5 : ouvindo ? 3 : 0;
  const bounce = falando ? v * 2.5 : 0;
  // martelo só bate em picos
  const malho = falando && v > 0.45 ? -28 : 0;

  // atrasos aleatórios por instância para piscadas não robóticas
  const blinkDelay = useMemo(() => `${(Math.random() * 3).toFixed(2)}s`, []);

  const outline = '#3a2a12';
  const sw = 1.4;

  return (
    <svg
      viewBox="-10 -40 120 170"
      preserveAspectRatio="xMidYMax slice"
      className="w-full h-full drop-shadow-2xl overflow-visible"
      role="img"
      aria-label="Professor Prime"
    >
      <defs>
        <radialGradient id={id('skin')} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff59d" />
          <stop offset="55%" stopColor="#ffe03a" />
          <stop offset="100%" stopColor="#f2a91c" />
        </radialGradient>
        <linearGradient id={id('wig')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dcdcdc" />
        </linearGradient>
        <radialGradient id={id('curl')} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cfcfcf" />
        </radialGradient>
        <linearGradient id={id('robe')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#111" />
          <stop offset="50%" stopColor="#2b2b2b" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
        <style>{`
          .pp-breathe-${uid} { animation: ppBreathe 4.2s ease-in-out infinite; transform-origin: 50px 180px; }
          .pp-blink-${uid} { animation: ppBlink 5.3s infinite; animation-delay: ${blinkDelay}; transform-box: fill-box; transform-origin: center; }
          .pp-look-${uid} { animation: ppLook 9s ease-in-out infinite; }
          .pp-smooth { transition: transform 140ms ease-out; }
          @keyframes ppBreathe { 0%,100% { transform: translateY(0) scale(1,1); } 50% { transform: translateY(-1px) scale(1,1.012); } }
          @keyframes ppBlink { 0%,93%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.08); } 97% { transform: scaleY(1); } }
          @keyframes ppLook { 0%,30% { transform: translateX(0); } 38%,52% { transform: translateX(-2px); } 60%,78% { transform: translateX(2px); } 86%,100% { transform: translateX(0); } }
          @media (prefers-reduced-motion: reduce) {
            .pp-breathe-${uid}, .pp-blink-${uid}, .pp-look-${uid} { animation: none; }
            .pp-smooth { transition: none; }
          }
        `}</style>
      </defs>

      {/* Ondas de voz */}
      {falando && (
        <>
          <circle cx="50" cy="50" r="47" fill="none" stroke="#fbc02d" strokeWidth="1.5"
            style={{ transform: `scale(${1 + v * 0.5})`, opacity: Math.max(0, 0.6 - v * 0.5), transformOrigin: '50px 50px', transition: 'transform 120ms, opacity 120ms' }} />
          <circle cx="50" cy="50" r="47" fill="none" stroke="#ffeb3b" strokeWidth="3"
            style={{ transform: `scale(${1 + v * 0.25})`, opacity: Math.max(0, 0.45 - v * 0.3), transformOrigin: '50px 50px', transition: 'transform 120ms, opacity 120ms' }} />
        </>
      )}

      <g className={`pp-breathe-${uid}`}>
        {/* Braço esquerdo */}
        <g className="pp-smooth" style={{ transform: `rotate(${v * 4}deg)`, transformOrigin: '35px 100px' }}>
          <path d="M 35 92 Q 16 110 20 133" fill="none" stroke="#1a1a1a" strokeWidth="16" strokeLinecap="round" />
          <g transform="translate(20, 138) rotate(-15)">
            <ellipse cx="0" cy="-7" rx="12" ry="5" fill="#e6e6e6" stroke={outline} strokeWidth={0.8} />
            <circle cx="0" cy="3" r="10" fill="#fff" stroke={outline} strokeWidth={0.8} />
            <rect x="-8.5" y="7" width="6" height="12" rx="3" fill="#fff" stroke={outline} strokeWidth={0.6} transform="rotate(12 -8.5 7)" />
            <rect x="-3" y="9" width="6.5" height="13" rx="3.2" fill="#fff" stroke={outline} strokeWidth={0.6} />
            <rect x="3" y="7" width="6" height="12" rx="3" fill="#fff" stroke={outline} strokeWidth={0.6} transform="rotate(-12 3 7)" />
          </g>
        </g>

        {/* Braço direito com martelo */}
        <g className="pp-smooth" style={{ transform: `rotate(${-v * 6}deg)`, transformOrigin: '65px 100px' }}>
          <path d="M 65 96 Q 98 96 90 124" fill="none" stroke="#1a1a1a" strokeWidth="17" strokeLinecap="round" />
          <g style={{ transform: `rotate(${malho}deg)`, transformOrigin: '90px 126px', transition: 'transform 160ms cubic-bezier(.3,1.6,.5,1)' }}>
            <g transform="rotate(15 89 112)">
              <rect x="86" y="88" width="6" height="44" rx="3" fill="#8d5a3b" stroke={outline} strokeWidth={0.8} />
              <rect x="74" y="82" width="30" height="14" rx="3" fill="#6d4330" stroke={outline} strokeWidth={0.9} />
              <rect x="74" y="86" width="30" height="3" fill="#a06b48" opacity="0.7" />
            </g>
            <circle cx="90" cy="126" r="9.5" fill="#fff" stroke={outline} strokeWidth={0.8} />
            <path d="M 82 121 Q 90 118 98 123 M 82 126 Q 90 123 98 128 M 83 131 Q 90 128 97 133" fill="none" stroke="#c9c9c9" strokeWidth="1" strokeLinecap="round" />
            <ellipse cx="90" cy="137" rx="12" ry="5" fill="#e6e6e6" stroke={outline} strokeWidth={0.8} transform="rotate(15 90 137)" />
          </g>
        </g>

        {/* Toga */}
        <path d="M 34 88 Q 19 130 14 180 L 86 180 Q 81 130 66 88 Z" fill={`url(#${id('robe')})`} stroke="#000" strokeWidth={sw} />
        <path d="M 30 120 Q 28 150 26 180 M 70 120 Q 72 150 74 180" stroke="#3a3a3a" strokeWidth="1" fill="none" />
        {/* Jabot */}
        <path d="M 40 88 L 60 88 L 56 106 L 50 114 L 44 106 Z" fill="#fff" stroke={outline} strokeWidth={0.9} strokeLinejoin="round" />
        <path d="M 43 96 Q 50 100 57 96 M 44 103 Q 50 107 56 103" fill="none" stroke="#d6d6d6" strokeWidth="1" />
        <path d="M 50 114 L 50 180" stroke="#000" strokeWidth="2.5" />

        {/* Cabeça */}
        <g className="pp-smooth" style={{ transform: `translateY(${bounce}px) rotate(${headTilt}deg) scale(${1 + v * 0.04}, ${1 - v * 0.04})`, transformOrigin: '50px 92px' }}>
          {/* Peruca de magistrado: cachos em fileiras horizontais atrás das orelhas */}
          {[44, 54, 64, 74, 84].map((cy, i) => (
            <g key={cy}>
              <rect x={-1 - i * 0.6} y={cy - 5} width="16" height="10" rx="5" fill={`url(#${id('curl')})`} stroke="#a8a8a8" strokeWidth="0.8" />
              <rect x={85 + i * 0.6} y={cy - 5} width="16" height="10" rx="5" fill={`url(#${id('curl')})`} stroke="#a8a8a8" strokeWidth="0.8" />
              <path d={`M ${2 - i * 0.6} ${cy} q 5 -3 10 0`} fill="none" stroke="#bdbdbd" strokeWidth="0.8" />
              <path d={`M ${88 + i * 0.6} ${cy} q 5 -3 10 0`} fill="none" stroke="#bdbdbd" strokeWidth="0.8" />
            </g>
          ))}

          <circle cx="50" cy="50" r="45" fill={`url(#${id('skin')})`} stroke={outline} strokeWidth={sw} />
          {/* brilho */}
          <ellipse cx="34" cy="22" rx="12" ry="6" fill="#fff" opacity="0.35" transform="rotate(-25 34 22)" />
          {/* bochechas */}
          <ellipse cx="24" cy="60" rx="7" ry="4" fill="#ff8a65" opacity="0.35" />
          <ellipse cx="76" cy="60" rx="7" ry="4" fill="#ff8a65" opacity="0.35" />

          {/* Peruca: topo liso e sólido, colado à cabeça, com rolos horizontais elegantes */}
          <path
            d="M 6 50 C 2 16 24 -4 50 -4 C 76 -4 98 16 94 50 C 92 40 88 33 82 29 C 72 24 62 23 50 23 C 38 23 28 24 18 29 C 12 33 8 40 6 50 Z"
            fill={`url(#${id('wig')})`}
            stroke="#a8a8a8"
            strokeWidth="1"
          />
          {/* rolos horizontais do topo */}
          {[[6, 26, 74], [13, 18, 82], [20, 14, 86]].map(([y, x1, x2], i) => (
            <path key={i} d={`M ${x1} ${y} Q 50 ${y - 7} ${x2} ${y}`} fill="none" stroke="#c4c4c4" strokeWidth="1.3" strokeLinecap="round" />
          ))}
          {/* rolo frontal que arremata a testa */}
          <path d="M 16 31 C 28 24 40 22 50 22 C 60 22 72 24 84 31" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
          <path d="M 16 31 C 28 24 40 22 50 22 C 60 22 72 24 84 31" fill="none" stroke="#b0b0b0" strokeWidth="0.8" transform="translate(0 2.6)" />
          {/* sombra suave sobre a testa */}
          <path d="M 20 36 C 32 30 68 30 80 36" fill="none" stroke="#c99a1a" strokeWidth="2" opacity="0.25" />

          {/* Sobrancelhas */}
          <g className="pp-smooth" style={{ transform: `translateY(${browY}px)` }}>
            <path d="M 27 34 Q 35 29 43 33" fill="none" stroke="#a05a00" strokeWidth="3" strokeLinecap="round" />
            <path d="M 57 33 Q 65 29 73 34" fill="none" stroke="#a05a00" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Olhos */}
          <g className="pp-smooth" style={{ transform: `translateY(${eyeY}px)` }}>
            <g className={ouvindo ? '' : `pp-look-${uid}`}>
              {[35, 65].map((cx) => (
                <g key={cx} className={`pp-blink-${uid}`}>
                  <ellipse cx={cx} cy="45" rx="4.6" ry="7.6" fill="#2b1a10" />
                  <circle cx={cx - 1.4} cy="41.8" r="1.7" fill="#fff" />
                  <circle cx={cx + 1.3} cy="48" r="0.7" fill="#fff" opacity="0.7" />
                </g>
              ))}
            </g>
          </g>

          {/* Boca */}
          <g style={{ transition: 'opacity 80ms' }}>
            <path d={mouth.lips} fill="#5a2e14" stroke={outline} strokeWidth="0.6" />
            <path d={mouth.opening} fill="#2a0505" />
            <path d={mouth.tongue} fill="#e57373" />
          </g>
        </g>
      </g>
    </svg>
  );
};
