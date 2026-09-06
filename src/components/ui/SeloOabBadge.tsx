import React, { useId } from 'react';

interface SeloOabBadgeProps {
  size?: number;
  className?: string;
  title?: string;
}

/**
 * SeloOabBadge - Selo Vetorial Oficial da OAB / Aprovação (Item 99)
 * Renderiza um brasão vetorial com gradiente dourado metálico,
 * balança da justiça e louros, otimizado para monitores de altíssima densidade.
 */
export const SeloOabBadge: React.FC<SeloOabBadgeProps> = ({
  size = 26,
  className = '',
  title = 'Padrão Exame de Ordem OAB & Concursos',
}) => {
  const uid = useId();
  const goldId = `oab-gold-${uid}`;
  const darkGoldId = `oab-darkgold-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-[0_2px_10px_rgba(217,119,6,0.4)] ${className}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={goldId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id={darkGoldId} x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
      </defs>

      {/* Escudo Exterior */}
      <path
        d="M24 4L38 10V22C38 31.5 32 40 24 44C16 40 10 31.5 10 22V10L24 4Z"
        fill="#0D0D0D"
        stroke={`url(#${goldId})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Friso Interno do Escudo */}
      <path
        d="M24 8L34 12.5V21.5C34 28.5 29.8 35 24 38.5C18.2 35 14 28.5 14 21.5V12.5L24 8Z"
        fill={`url(#${darkGoldId})`}
        fillOpacity="0.45"
        stroke={`url(#${goldId})`}
        strokeWidth="0.8"
      />

      {/* Balança da Justiça Central */}
      <path d="M24 13V31" stroke={`url(#${goldId})`} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 17H31" stroke={`url(#${goldId})`} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 31H28" stroke={`url(#${goldId})`} strokeWidth="1.8" strokeLinecap="round" />

      {/* Pratos da balança */}
      <path d="M17 17L14 23H20L17 17Z" fill={`url(#${goldId})`} fillOpacity="0.6" stroke={`url(#${goldId})`} strokeWidth="0.8" />
      <path d="M31 17L28 23H34L31 17Z" fill={`url(#${goldId})`} fillOpacity="0.6" stroke={`url(#${goldId})`} strokeWidth="0.8" />

      {/* Estrela no topo */}
      <circle cx="24" cy="13" r="1.5" fill={`url(#${goldId})`} />
    </svg>
  );
};

export default SeloOabBadge;
