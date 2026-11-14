import React, { memo } from 'react';

/**
 * VideoaulasHeroWave
 * Onda idêntica à de BibliotecaHeroWave com translação porcentual (-50%)
 * garantindo animação contínua e visibilidade perfeita sobre a capa de videoaulas.
 * Harmonizada com tons âmbar/dourado/mogno da cena.
 */
export const VideoaulasHeroWave: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Resplendor Volumétrico e Bloom no Tom Âmbar Suave ── */}
      <div 
        className="absolute -bottom-14 -left-10 w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-[#d97706]/30 via-[#451a03]/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'videoaulasWaveGlowPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-10 right-0 w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-[#fbbf24]/25 via-[#3b1908]/20 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'videoaulasWaveGlowPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade dos Textos ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[70%] sm:w-[55%] bg-gradient-to-r from-black/95 via-black/60 to-transparent pointer-events-none z-[6]" 
      />

      {/* ════ CAMADA 1: Fita Traseira de Veludo Mogno Escuro ════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[140px] sm:h-[175px] pointer-events-none transform-gpu"
          style={{
            animation: 'videoaulasWaveBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="videoaulasDeepMogno" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#1a0c06" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#2e1408" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#1f0e06" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#3b1908" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#1a0c06" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="videoaulasBackCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill="url(#videoaulasDeepMogno)"
          />

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke="url(#videoaulasBackCrest)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ════ CAMADA 2: Fita Mestra de Seda Âmbar / Ouro Acobreado ════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[128px] sm:h-[160px] pointer-events-none transform-gpu"
          style={{
            animation: 'videoaulasWaveMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -10px 24px rgba(217, 119, 6, 0.4)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="videoaulasSatinLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#241006" />
              <stop offset="12%" stopColor="#451a03" />
              <stop offset="25%" stopColor="#78350f" />
              <stop offset="38%" stopColor="#92400e" />
              <stop offset="48%" stopColor="#d97706" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="74%" stopColor="#b45309" />
              <stop offset="86%" stopColor="#542106" />
              <stop offset="100%" stopColor="#241006" />
            </linearGradient>

            <linearGradient id="videoaulasCrestGleam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="30%" stopColor="#fef3c7" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="80%" stopColor="#fef3c7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>

            <linearGradient id="videoaulasCrestHalo" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="videoaulasTextureStreak" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185 L 2880,400 L 0,400 Z"
            fill="url(#videoaulasSatinLustre)"
          />

          <path
            d="M 0,205 C 220,115 500,100 720,180 C 940,260 1220,270 1440,205 C 1660,115 1940,100 2160,180 C 2380,260 2660,270 2880,205"
            fill="none"
            stroke="url(#videoaulasTextureStreak)"
            strokeWidth="1.8"
            strokeDasharray="16 8"
          />

          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke="url(#videoaulasCrestGleam)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke="url(#videoaulasCrestHalo)"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ════ CAMADA 3: Fita Dianteira de Seda e Crista Fina ════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-95">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[102px] sm:h-[130px] pointer-events-none transform-gpu"
          style={{
            animation: 'videoaulasWaveFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 -7px 18px rgba(0, 0, 0, 0.88)) drop-shadow(0 0 22px rgba(245, 158, 11, 0.35))',
          }}
        >
          <defs>
            <linearGradient id="videoaulasFrontSilk" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b1908" stopOpacity="0.96" />
              <stop offset="20%" stopColor="#78350f" stopOpacity="0.98" />
              <stop offset="44%" stopColor="#d97706" stopOpacity="1" />
              <stop offset="66%" stopColor="#fbbf24" stopOpacity="0.98" />
              <stop offset="85%" stopColor="#b45309" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#3b1908" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="videoaulasFrontCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="58%" stopColor="#fef3c7" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240 L 2880,400 L 0,400 Z"
            fill="url(#videoaulasFrontSilk)"
          />

          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240"
            fill="none"
            stroke="url(#videoaulasFrontCrest)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── 4. Glints e Micro-Brilhos na Crista ── */}
      <div 
        className="absolute bottom-16 sm:bottom-22 left-[26%] sm:left-[32%] w-3 h-3 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 16px 4px rgba(255, 255, 255, 0.98), 0 0 30px 10px rgba(245, 158, 11, 0.75)',
          animation: 'videoaulasSparkle 5.5s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute bottom-14 sm:bottom-18 right-[22%] sm:right-[30%] w-2.5 h-2.5 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 14px 3px rgba(255, 255, 255, 0.92), 0 0 26px 8px rgba(251, 191, 36, 0.7)',
          animation: 'videoaulasSparkle 7.5s ease-in-out infinite 2.5s',
        }}
      />

      {/* ── 5. Keyframes Orgânicos a 120fps (Sem solavancos, idênticos a Biblioteca) ── */}
      <style>{`
        @keyframes videoaulasWaveMainSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(-25%, -6px, 0) scaleY(1.05);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(1);
          }
        }

        @keyframes videoaulasWaveBackSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(0.97);
          }
          50% {
            transform: translate3d(-25%, 6px, 0) scaleY(1.06);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(0.97);
          }
        }

        @keyframes videoaulasWaveFrontSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(-25%, -7px, 0) scaleY(1.06);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(1);
          }
        }

        @keyframes videoaulasWaveGlowPulse {
          0% {
            opacity: 0.55;
            transform: scale(0.96);
          }
          100% {
            opacity: 0.95;
            transform: scale(1.06);
          }
        }

        @keyframes videoaulasSparkle {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.7);
          }
          50% {
            opacity: 1;
            transform: scale(1.35);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .videoaulas-hero-wave * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(VideoaulasHeroWave);
