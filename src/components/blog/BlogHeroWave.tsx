import React, { memo } from 'react';

/**
 * BlogHeroWave
 * Onda hiper-realista em cetim 3D em tons Azul Celeste / Azul Claro Céu Mediterrâneo,
 * perfeitamente harmonizada com a iluminação do céu de Roma Antiga da capa.
 * 100% GPU-accelerated (120fps contínuo, sem engasgos, ciclo de 1440px).
 */
export const BlogHeroWave: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Resplendor Volumétrico e Bloom no Tom Azul Claro Celeste ── */}
      <div 
        className="absolute -bottom-14 -left-10 w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-[#0ea5e9]/35 via-[#0369a1]/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'blogSkyGlowPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-10 right-0 w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-[#38bdf8]/30 via-[#075985]/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'blogSkyGlowPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade dos Textos ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[60%] sm:w-[50%] bg-gradient-to-r from-black/90 via-black/55 to-transparent pointer-events-none z-[6]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Azul Profundo
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[142px] sm:h-[178px] pointer-events-none transform-gpu"
          style={{
            animation: 'blogSkyWaveBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="blogSkyDeepVelvet" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#041d2d" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#0c324c" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#062539" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#0e4366" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#041d2d" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="blogSkyBackCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#7dd3fc" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill="url(#blogSkyDeepVelvet)"
          />

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke="url(#blogSkyBackCrest)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim Azul Claro Luminoso
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[130px] sm:h-[162px] pointer-events-none transform-gpu"
          style={{
            animation: 'blogSkyWaveMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -8px 20px rgba(14, 165, 233, 0.45)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="blogSkySatinLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#075985" />
              <stop offset="12%" stopColor="#0284c7" />
              <stop offset="25%" stopColor="#0369a1" />
              <stop offset="38%" stopColor="#0284c7" />
              <stop offset="48%" stopColor="#38bdf8" />
              <stop offset="62%" stopColor="#0ea5e9" />
              <stop offset="76%" stopColor="#7dd3fc" />
              <stop offset="88%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>

            <linearGradient id="blogSkyMainCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#bae6fd" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="85%" stopColor="#7dd3fc" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          <path
            d="M 0,240 C 320,150 580,165 720,230 C 900,315 1160,310 1440,240 C 1760,150 2020,165 2160,230 C 2340,315 2600,310 2880,240 L 2880,400 L 0,400 Z"
            fill="url(#blogSkySatinLustre)"
          />

          <path
            d="M 0,240 C 320,150 580,165 720,230 C 900,315 1160,310 1440,240 C 1760,150 2020,165 2160,230 C 2340,315 2600,310 2880,240"
            fill="none"
            stroke="url(#blogSkyMainCrest)"
            strokeWidth="3.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Filamento Frontal Translúcido de Alta Refração
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-90">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[110px] sm:h-[138px] pointer-events-none transform-gpu"
          style={{
            animation: 'blogSkyWaveFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.8))',
          }}
        >
          <defs>
            <linearGradient id="blogSkyFrontTranslucent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.88" />
              <stop offset="25%" stopColor="#0284c7" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="65%" stopColor="#0369a1" stopOpacity="0.75" />
              <stop offset="85%" stopColor="#0ea5e9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.88" />
            </linearGradient>

            <linearGradient id="blogSkyFrontCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="28%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.4" />
              <stop offset="78%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          <path
            d="M 0,270 C 300,195 560,205 720,265 C 920,335 1180,330 1440,270 C 1740,195 2000,205 2160,265 C 2360,335 2620,330 2880,270 L 2880,400 L 0,400 Z"
            fill="url(#blogSkyFrontTranslucent)"
          />

          <path
            d="M 0,270 C 300,195 560,205 720,265 C 920,335 1180,330 1440,270 C 1740,195 2000,205 2160,265 C 2360,335 2620,330 2880,270"
            fill="none"
            stroke="url(#blogSkyFrontCrest)"
            strokeWidth="2.4"
          />
        </svg>
      </div>

      {/* ── Keyframes Fluidos a 120fps (GPU pura) ── */}
      <style>{`
        @keyframes blogSkyWaveMainSlide {
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

        @keyframes blogSkyWaveBackSlide {
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

        @keyframes blogSkyWaveFrontSlide {
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

        @keyframes blogSkyGlowPulse {
          0% {
            opacity: 0.45;
            transform: scale(0.96);
          }
          100% {
            opacity: 0.85;
            transform: scale(1.06);
          }
        }
      `}</style>
    </div>
  );
};

export default memo(BlogHeroWave);
