import React, { memo } from 'react';

/**
 * MapasMentaisHeroWave
 * Onda hiper-realista em cetim/seda 3D em paleta Imperial Purple, Ametista e Orquídea.
 * 100% acelerada por GPU (120fps) com estrias de reflexão de luz e cristas luminosas.
 * Utiliza ciclo relativo (-50%) para loop contínuo e infinito sem interrupções em qualquer tela.
 */
export const MapasMentaisHeroWave: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5] select-none">
      {/* ── 1. Resplendor Volumétrico e Bloom no Tom Púrpura Imperial ── */}
      <div 
        className="absolute -bottom-14 -left-10 w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-purple-600/35 via-violet-950/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'mapasPurpleGlowPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-10 right-0 w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-fuchsia-600/25 via-purple-950/20 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'mapasPurpleGlowPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Violeta Profundo com Listras
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80 z-[2]">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[155px] sm:h-[195px] pointer-events-none transform-gpu"
          style={{
            animation: 'mapasPurpleWaveBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="purpleDeepVelvet" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#150324" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#3b0764" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#22043a" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#4c1d95" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#150324" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="purpleBackCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#d8b4fe" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#e9d5ff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill="url(#purpleDeepVelvet)"
          />

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke="url(#purpleBackCrest)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim Imperial com Estrias de Luz e Seda
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform z-[3]">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[142px] sm:h-[178px] pointer-events-none transform-gpu"
          style={{
            animation: 'mapasPurpleWaveMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -10px 24px rgba(168, 85, 247, 0.45)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="purpleSatinLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#1e0436" />
              <stop offset="12%" stopColor="#3b0764" />
              <stop offset="25%" stopColor="#581c87" />
              <stop offset="38%" stopColor="#7e22ce" />
              <stop offset="48%" stopColor="#9333ea" />
              <stop offset="62%" stopColor="#a855f7" />
              <stop offset="76%" stopColor="#c084fc" />
              <stop offset="88%" stopColor="#6b21a8" />
              <stop offset="100%" stopColor="#1e0436" />
            </linearGradient>

            <linearGradient id="purpleCrestGleam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#e9d5ff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#d8b4fe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>

            {/* Listras de Textura e Reflexão de Seda */}
            <linearGradient id="purpleTextureStreak" x1="0%" y1="0%" x2="100%" y2="0%">
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
            fill="url(#purpleSatinLustre)"
          />

          {/* Listras / Estrias Texturais de Seda */}
          <path
            d="M 0,205 C 220,115 500,100 720,180 C 940,260 1220,270 1440,205 C 1660,115 1940,100 2160,180 C 2380,260 2660,270 2880,205"
            fill="none"
            stroke="url(#purpleTextureStreak)"
            strokeWidth="2.2"
            strokeDasharray="18 8"
          />

          {/* Segunda Estria de Listra Fina */}
          <path
            d="M 0,195 C 220,105 500,90 720,170 C 940,250 1220,260 1440,195 C 1660,105 1940,90 2160,170 C 2380,250 2660,260 2880,195"
            fill="none"
            stroke="url(#purpleTextureStreak)"
            strokeWidth="1.2"
            strokeDasharray="10 6"
          />

          {/* Crista de Luz Brilhante */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke="url(#purpleCrestGleam)"
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
            animation: 'mapasPurpleWaveFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 -7px 18px rgba(0, 0, 0, 0.88)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))',
          }}
        >
          <defs>
            <linearGradient id="purpleFrontGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2e0854" stopOpacity="0.96" />
              <stop offset="20%" stopColor="#581c87" stopOpacity="0.98" />
              <stop offset="44%" stopColor="#7e22ce" stopOpacity="1" />
              <stop offset="66%" stopColor="#9333ea" stopOpacity="0.98" />
              <stop offset="85%" stopColor="#c084fc" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#2e0854" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="purpleFrontCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="58%" stopColor="#e9d5ff" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Fita Frontal */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240 L 2880,400 L 0,400 Z"
            fill="url(#purpleFrontGrad)"
          />

          {/* Listra Frontal em Linha */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240"
            fill="none"
            stroke="url(#purpleFrontCrest)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Estilos das Animações GPU em Ciclo Relativo (-50%) */}
      <style>{`
        @keyframes mapasPurpleWaveMainSlide {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes mapasPurpleWaveBackSlide {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes mapasPurpleWaveFrontSlide {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-25%, 3px, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes mapasPurpleGlowPulse {
          0% { opacity: 0.45; transform: scale(1); }
          100% { opacity: 0.85; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default memo(MapasMentaisHeroWave);
