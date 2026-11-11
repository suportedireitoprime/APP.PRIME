import React, { memo, useMemo } from 'react';

interface SymbolConfig {
  id: number;
  left: number;
  duration: number;
  delay: number;
  swayDuration: number;
  driftX: number;
  swayX: number;
  swayRot: number;
  rotEnd: number;
  size: number;
  opacity: number;
  type: 'balanca' | 'martelo' | 'livro' | 'pergaminho' | 'pilar';
}

// ── 1. BALANÇA DA JUSTIÇA HELÊNICA (SVG DOURADO) ──
const SvgBalanca = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Haste Central */}
    <path d="M24 6 V38" stroke="url(#legalGold)" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="24" cy="5" r="2.5" fill="url(#legalGoldLight)" />
    {/* Base Firme */}
    <path d="M16 41 H32" stroke="url(#legalGold)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M19 38 H29" stroke="url(#legalGold)" strokeWidth="2" strokeLinecap="round" />
    {/* Travessão Superior */}
    <path d="M10 13 H38" stroke="url(#legalGoldLight)" strokeWidth="2.4" strokeLinecap="round" />
    {/* Cordas do Prato Esquerdo */}
    <path d="M10 13 L6 25 M10 13 L14 25" stroke="url(#legalGold)" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
    {/* Prato Esquerdo */}
    <path d="M5 25 C5 29 15 29 15 25 Z" fill="url(#legalGoldLight)" stroke="url(#legalGold)" strokeWidth="1.2" />
    {/* Cordas do Prato Direito */}
    <path d="M38 13 L34 25 M38 13 L42 25" stroke="url(#legalGold)" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
    {/* Prato Direito */}
    <path d="M33 25 C33 29 43 29 43 25 Z" fill="url(#legalGoldLight)" stroke="url(#legalGold)" strokeWidth="1.2" />
  </svg>
);

// ── 2. MARTELO DA JUSTIÇA (MALHETE CLÁSSICO) ──
const SvgMartelo = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Cabo de Madeira Nobre e Ouro */}
    <path d="M16 32 L34 14" stroke="url(#legalGold)" strokeWidth="3.2" strokeLinecap="round" />
    <circle cx="15" cy="33" r="2.2" fill="url(#legalGoldLight)" />
    {/* Cabeça do Martelo / Malhete */}
    <g transform="rotate(45 32 12)">
      <rect x="25" y="8" width="14" height="8" rx="2" fill="url(#legalGoldLight)" stroke="url(#legalGold)" strokeWidth="1.5" />
      <rect x="23" y="7" width="3" height="10" rx="1" fill="url(#legalGold)" />
      <rect x="38" y="7" width="3" height="10" rx="1" fill="url(#legalGold)" />
    </g>
  </svg>
);

// ── 3. LIVRO DA LEI (VADE MECUM ABERTO) ──
const SvgLivro = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Páginas do Livro Aberto */}
    <path 
      d="M24 14 C20 10 11 11 7 13 V36 C11 34 20 33 24 37 C28 33 37 34 41 36 V13 C37 11 28 10 24 14 Z" 
      fill="url(#legalGoldLight)" 
      stroke="url(#legalGold)" 
      strokeWidth="2" 
    />
    <path d="M24 14 V37" stroke="url(#legalGoldDark)" strokeWidth="2" strokeLinecap="round" />
    {/* Linhas de Escrita Dourada */}
    <line x1="11" y1="18" x2="20" y2="17" stroke="url(#legalGoldDark)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="11" y1="23" x2="20" y2="22" stroke="url(#legalGoldDark)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="11" y1="28" x2="19" y2="27" stroke="url(#legalGoldDark)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="28" y1="17" x2="37" y2="18" stroke="url(#legalGoldDark)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="28" y1="22" x2="37" y2="23" stroke="url(#legalGoldDark)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="29" y1="27" x2="37" y2="28" stroke="url(#legalGoldDark)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// ── 4. PERGAMINHO HELÊNICO (ROLOS DE LEIS) ──
const SvgPergaminho = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Rolo Superior */}
    <ellipse cx="14" cy="11" rx="5" ry="3.5" fill="url(#legalGoldLight)" stroke="url(#legalGold)" strokeWidth="1.2" />
    <path d="M14 8 H36 C39 8 41 9.5 41 11 C41 12.5 39 14 36 14 H14" stroke="url(#legalGold)" strokeWidth="1.5" fill="url(#legalGoldLight)" />
    {/* Corpo do Pergaminho */}
    <path d="M11 11 V34 C11 37 13 39 16 39 H38 V14" stroke="url(#legalGold)" strokeWidth="1.8" fill="url(#legalGoldLight)" />
    {/* Rolo Inferior */}
    <ellipse cx="38" cy="37" rx="5" ry="3.5" fill="url(#legalGoldLight)" stroke="url(#legalGold)" strokeWidth="1.2" />
    {/* Linhas Jurídicas */}
    <line x1="16" y1="19" x2="32" y2="19" stroke="url(#legalGoldDark)" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    <line x1="16" y1="24" x2="30" y2="24" stroke="url(#legalGoldDark)" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    <line x1="16" y1="29" x2="27" y2="29" stroke="url(#legalGoldDark)" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// ── 5. PILAR / COLUNA HELÊNICA DÓRICA ──
const SvgPilar = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Capitel / Topo */}
    <rect x="10" y="8" width="28" height="4" rx="1.5" fill="url(#legalGoldLight)" stroke="url(#legalGold)" strokeWidth="1.5" />
    <path d="M14 12 H34 L32 15 H16 Z" fill="url(#legalGold)" />
    {/* Fuste / Colunas Caneladas */}
    <line x1="17" y1="15" x2="17" y2="34" stroke="url(#legalGoldLight)" strokeWidth="2" strokeLinecap="round" />
    <line x1="21.5" y1="15" x2="21.5" y2="34" stroke="url(#legalGoldLight)" strokeWidth="2" strokeLinecap="round" />
    <line x1="26.5" y1="15" x2="26.5" y2="34" stroke="url(#legalGoldLight)" strokeWidth="2" strokeLinecap="round" />
    <line x1="31" y1="15" x2="31" y2="34" stroke="url(#legalGoldLight)" strokeWidth="2" strokeLinecap="round" />
    {/* Base Dórica */}
    <path d="M16 34 H32 L34 37 H14 Z" fill="url(#legalGold)" />
    <rect x="10" y="37" width="28" height="4" rx="1.5" fill="url(#legalGoldLight)" stroke="url(#legalGold)" strokeWidth="1.5" />
  </svg>
);

export const FallingLotusPetals = memo(() => {
  // Símbolos jurídicos distribuídos com rotação suave e velocidade natural
  const symbols: SymbolConfig[] = useMemo(() => [
    { id: 1, left: 10, duration: 15, delay: -2, swayDuration: 4.5, driftX: 30, swayX: 20, swayRot: 22, rotEnd: 240, size: 30, opacity: 0.85, type: 'balanca' },
    { id: 2, left: 26, duration: 13, delay: -7, swayDuration: 3.8, driftX: -26, swayX: -18, swayRot: -20, rotEnd: 190, size: 28, opacity: 0.8, type: 'martelo' },
    { id: 3, left: 44, duration: 17, delay: -3.5, swayDuration: 5.2, driftX: 36, swayX: 24, swayRot: 25, rotEnd: 310, size: 32, opacity: 0.88, type: 'livro' },
    { id: 4, left: 64, duration: 14, delay: -10, swayDuration: 4.2, driftX: -30, swayX: -20, swayRot: -22, rotEnd: 220, size: 29, opacity: 0.82, type: 'pergaminho' },
    { id: 5, left: 80, duration: 16.5, delay: -5, swayDuration: 4.8, driftX: 32, swayX: 22, swayRot: 20, rotEnd: 260, size: 31, opacity: 0.86, type: 'pilar' },
    { id: 6, left: 92, duration: 12.5, delay: -12, swayDuration: 3.9, driftX: -22, swayX: -16, swayRot: -18, rotEnd: 180, size: 27, opacity: 0.75, type: 'balanca' },
    { id: 7, left: 35, duration: 18, delay: -8.5, swayDuration: 5.0, driftX: 28, swayX: 19, swayRot: 22, rotEnd: 290, size: 29, opacity: 0.82, type: 'livro' },
  ], []);

  const renderIcon = (type: SymbolConfig['type']) => {
    switch (type) {
      case 'balanca': return <SvgBalanca />;
      case 'martelo': return <SvgMartelo />;
      case 'livro': return <SvgLivro />;
      case 'pergaminho': return <SvgPergaminho />;
      case 'pilar': return <SvgPilar />;
    }
  };

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="legalGoldLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="40%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="legalGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="60%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="legalGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
        </defs>
      </svg>

      <style>{`
        @keyframes legalSymbolFall {
          0% {
            transform: translate3d(0, -8vh, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--s-opacity, 0.85);
          }
          90% {
            opacity: var(--s-opacity, 0.85);
          }
          100% {
            transform: translate3d(var(--s-drift, 30px), 110vh, 0) rotate(var(--s-rot, 260deg));
            opacity: 0;
          }
        }
        @keyframes legalSymbolSway {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(var(--s-sway-x, 20px), 0, 0) rotate(var(--s-sway-rot, 20deg));
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
        }
      `}</style>

      <div 
        aria-hidden="true" 
        className="fixed inset-0 pointer-events-none z-[1] overflow-hidden select-none"
      >
        {symbols.map((s) => (
          <div
            key={s.id}
            className="absolute top-0 will-change-transform"
            style={{
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animation: `legalSymbolFall ${s.duration}s linear infinite`,
              animationDelay: `${s.delay}s`,
              ['--s-opacity' as any]: s.opacity,
              ['--s-drift' as any]: `${s.driftX}px`,
              ['--s-rot' as any]: `${s.rotEnd}deg`,
            }}
          >
            <div
              className="w-full h-full will-change-transform drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
              style={{
                animation: `legalSymbolSway ${s.swayDuration}s ease-in-out infinite`,
                animationDelay: `${s.delay * 0.35}s`,
                ['--s-sway-x' as any]: `${s.swayX}px`,
                ['--s-sway-rot' as any]: `${s.swayRot}deg`,
              }}
            >
              {renderIcon(s.type)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
});

FallingLotusPetals.displayName = 'FallingLotusPetals';
