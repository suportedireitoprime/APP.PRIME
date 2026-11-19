import React, { memo } from 'react';

/**
 * AulasHeroWave
 * Onda e listras fluidas de cetim e luz com paleta nobre Imperial Ruby & Rose Gold.
 * 100% acelerada por GPU (120fps) com estrias de reflexão de luz e cristas luminosas.
 * Utiliza ciclo relativo (-50%) para loop contínuo e infinito em qualquer largura de tela.
 */
export const AulasHeroWave: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5] select-none">
      {/* ── 1. Resplendor Volumétrico e Bloom Rubro Imperial ── */}
      <div 
        className="absolute -bottom-14 -left-10 w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-rose-600/35 via-red-950/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'aulasRubyGlowPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-10 right-0 w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-red-600/30 via-rose-950/20 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'aulasRubyGlowPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Vinho / Rubi Profundo com Listras
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80 z-[2]">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[155px] sm:h-[195px] pointer-events-none transform-gpu"
          style={{
            animation: 'aulasRubyWaveBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="rubyDeepVelvet" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#150206" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#4c0519" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#2a030d" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#5a0820" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#150206" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="rubyBackCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#fecdd3" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#fda4af" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill="url(#rubyDeepVelvet)"
          />

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke="url(#rubyBackCrest)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim com Listras de Seda & Crista de Luz
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform z-[3]">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[142px] sm:h-[178px] pointer-events-none transform-gpu"
          style={{
            animation: 'aulasRubyWaveMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -10px 24px rgba(225, 29, 72, 0.45)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="rubySatinLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#28040d" />
              <stop offset="12%" stopColor="#50071c" />
              <stop offset="25%" stopColor="#881337" />
              <stop offset="38%" stopColor="#be123c" />
              <stop offset="48%" stopColor="#e11d48" />
              <stop offset="62%" stopColor="#9f1239" />
              <stop offset="76%" stopColor="#fb7185" />
              <stop offset="88%" stopColor="#670b23" />
              <stop offset="100%" stopColor="#28040d" />
            </linearGradient>

            <linearGradient id="rubyCrestGleam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#fecdd3" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#fecdd3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>

            {/* Listras de Textura e Reflexão de Seda */}
            <linearGradient id="rubyTextureStreak" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Fita Mestra Esculpida */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185 L 2880,400 L 0,400 Z"
            fill="url(#rubySatinLustre)"
          />

          {/* Listras / Estrias Texturais de Seda */}
          <path
            d="M 0,205 C 220,115 500,100 720,180 C 940,260 1220,270 1440,205 C 1660,115 1940,100 2160,180 C 2380,260 2660,270 2880,205"
            fill="none"
            stroke="url(#rubyTextureStreak)"
            strokeWidth="2.2"
            strokeDasharray="18 8"
          />

          {/* Segunda Estria de Listra Fina */}
          <path
            d="M 0,195 C 220,105 500,90 720,170 C 940,250 1220,260 1440,195 C 1660,105 1940,90 2160,170 C 2380,250 2660,260 2880,195"
            fill="none"
            stroke="url(#rubyTextureStreak)"
            strokeWidth="1.2"
            strokeDasharray="10 6"
          />

          {/* Crista de Luz Brilhante */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke="url(#rubyCrestGleam)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Frontal Esculpida com Listras Luminosas
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-95 z-[4]">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[118px] sm:h-[148px] pointer-events-none transform-gpu"
          style={{
            animation: 'aulasRubyWaveFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 -7px 18px rgba(0, 0, 0, 0.88)) drop-shadow(0 0 20px rgba(225, 29, 72, 0.4))',
          }}
        >
          <defs>
            <linearGradient id="rubyFrontGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b0412" stopOpacity="0.96" />
              <stop offset="20%" stopColor="#881337" stopOpacity="0.98" />
              <stop offset="44%" stopColor="#be123c" stopOpacity="1" />
              <stop offset="66%" stopColor="#e11d48" stopOpacity="0.98" />
              <stop offset="85%" stopColor="#fb7185" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#3b0412" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="rubyFrontCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="58%" stopColor="#fecdd3" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Fita Frontal */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240 L 2880,400 L 0,400 Z"
            fill="url(#rubyFrontGrad)"
          />

          {/* Listra Frontal em Linha */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240"
            fill="none"
            stroke="url(#rubyFrontCrest)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Estilos das Animações GPU em Ciclo Relativo (-50%) */}
      <style>{`
        @keyframes aulasRubyWaveMainSlide {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes aulasRubyWaveBackSlide {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes aulasRubyWaveFrontSlide {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-25%, 3px, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes aulasRubyGlowPulse {
          0% { opacity: 0.45; transform: scale(1); }
          100% { opacity: 0.85; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default memo(AulasHeroWave);
