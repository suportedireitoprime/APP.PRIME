import React, { useId } from 'react';

interface SeloVerificadoBadgeProps {
  size?: number;
  className?: string;
  title?: string;
}

/**
 * SeloVerificadoBadge - Selo Vetorial Oficial de Alta Resolução (Item 99)
 * Renderiza um medalhão facetado de 12 pontas com gradiente metálico dourado
 * e ícone de verificado, garantindo nitidez absoluta em 4K e telas Retina.
 */
export const SeloVerificadoBadge: React.FC<SeloVerificadoBadgeProps> = ({
  size = 24,
  className = '',
  title = 'Conteúdo Verificado e Auditado',
}) => {
  const uid = useId();
  const gradId = `selo-gold-${uid}`;
  const rimGradId = `selo-rim-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 drop-shadow-[0_2px_8px_rgba(217,119,6,0.35)] ${className}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="25%" stopColor="#F59E0B" />
          <stop offset="60%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={rimGradId} x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#78350F" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Medalhão Estrela de 12 Pontas */}
      <path
        d="M24 2L28.5 7.8L35.8 6.4L37.8 13.5L44.8 16.1L43.8 23.5L48 29.5L42.5 34.5L43.2 41.9L36 43.5L33.3 50.4L26.3 47.9L24 53L21.7 47.9L14.7 50.4L12 43.5L4.8 41.9L5.5 34.5L0 29.5L4.2 23.5L3.2 16.1L10.2 13.5L12.2 6.4L19.5 7.8L24 2Z"
        fill={`url(#${gradId})`}
        stroke={`url(#${rimGradId})`}
        strokeWidth="1.2"
        transform="scale(0.85) translate(4, 1)"
      />

      {/* Círculo Central com Borda */}
      <circle cx="24" cy="24" r="14" fill="#0D0D0D" stroke={`url(#${gradId})`} strokeWidth="1.5" />

      {/* Ícone de Verificado (Checkmark) em Ouro */}
      <path
        d="M17.5 24.2L21.8 28.5L30.5 19.5"
        stroke={`url(#${gradId})`}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SeloVerificadoBadge;
