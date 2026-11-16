import React, { memo } from 'react';

/**
 * AudiobooksHeroWave
 * Onda hiper-realista em cetim/seda 3D em tom Roxo Imperial / Violeta Nobre,
 * perfeitamente harmonizada com a estética clássica dos pensadores e filósofos do Direito.
 * 100% GPU-accelerated (120fps contínuo, sem engasgos, ciclo de 1440px).
 */
export const AudiobooksHeroWave: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Gradiente Lateral Suave de Contraste para Legibilidade dos Textos ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[60%] sm:w-[48%] bg-gradient-to-r from-black/85 via-black/50 to-transparent pointer-events-none z-[6]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Roxo Profundo
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[142px] sm:h-[178px] pointer-events-none transform-gpu"
          style={{
            animation: 'audiobooksPurpleWaveBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="audioPurpleDeepVelvet" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#1a0730" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#2e0854" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#1f0738" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#3b0a6b" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#1a0730" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="audioPurpleBackCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#c084fc" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#c084fc" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill="url(#audioPurpleDeepVelvet)"
          />

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke="url(#audioPurpleBackCrest)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim Roxo Violeta Luminoso
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[130px] sm:h-[162px] pointer-events-none transform-gpu"
          style={{
            animation: 'audiobooksPurpleWaveMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.95))',
          }}
        >
          <defs>
            <linearGradient id="audioPurpleSatinLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#2e0854" />
              <stop offset="12%" stopColor="#4c1d95" />
              <stop offset="25%" stopColor="#6d28d9" />
              <stop offset="38%" stopColor="#7c3aed" />
              <stop offset="48%" stopColor="#9333ea" />
              <stop offset="62%" stopColor="#a855f7" />
              <stop offset="76%" stopColor="#c084fc" />
              <stop offset="88%" stopColor="#581c87" />
              <stop offset="100%" stopColor="#2e0854" />
            </linearGradient>

            <linearGradient id="audioPurpleMainCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#581c87" stopOpacity="0.4" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#e9d5ff" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#a855f7" stopOpacity="0.5" />
              <stop offset="75%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#581c87" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          <path
            d="M 0,240 C 240,165 480,175 720,230 C 960,295 1200,290 1440,240 C 1680,165 1920,175 2160,230 C 2400,295 2640,290 2880,240 L 2880,400 L 0,400 Z"
            fill="url(#audioPurpleSatinLustre)"
          />

          <path
            d="M 0,240 C 240,165 480,175 720,230 C 960,295 1200,290 1440,240 C 1680,165 1920,175 2160,230 C 2400,295 2640,290 2880,240"
            fill="none"
            stroke="url(#audioPurpleMainCrest)"
            strokeWidth="3.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Frontal Translúcida com Crista Especular Fluida
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-75">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[122px] sm:h-[152px] pointer-events-none transform-gpu"
          style={{
            animation: 'audiobooksPurpleWaveFrontSlide 12s linear infinite',
            filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.9))',
          }}
        >
          <defs>
            <linearGradient id="audioPurpleFrontSilk" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#7e22ce" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="75%" stopColor="#6b21a8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="audioPurpleFrontCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#e9d5ff" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <path
            d="M 0,270 C 300,195 560,205 720,265 C 920,335 1180,330 1440,270 C 1740,195 2000,205 2160,265 C 2360,335 2620,330 2880,270 L 2880,400 L 0,400 Z"
            fill="url(#audioPurpleFrontSilk)"
          />

          <path
            d="M 0,270 C 300,195 560,205 720,265 C 920,335 1180,330 1440,270 C 1740,195 2000,205 2160,265 C 2360,335 2620,330 2880,270"
            fill="none"
            stroke="url(#audioPurpleFrontCrest)"
            strokeWidth="2.4"
          />
        </svg>
      </div>

      {/* ── Keyframes Fluidos a 120fps (GPU pura) ── */}
      <style>{`
        @keyframes audiobooksPurpleWaveMainSlide {
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

        @keyframes audiobooksPurpleWaveBackSlide {
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

        @keyframes audiobooksPurpleWaveFrontSlide {
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

        @keyframes audiobooksPurpleGlowPulse {
          0% {
            opacity: 0.45;
            transform: scale(0.96);
          }
          100% {
            opacity: 0.85;
            transform: scale(1.06);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .audiobooks-animated-wave * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(AudiobooksHeroWave);
