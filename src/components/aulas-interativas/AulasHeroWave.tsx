import React from 'react';

/**
 * AulasHeroWave
 * Onda hiper-realista em cetim 3D em tons Verde Esmeralda / Petróleo / Teal com centelhas douradas,
 * perfeitamente harmonizada com a iluminação industrial e o uniforme da capa das Aulas Interativas.
 * 100% GPU-accelerated (120fps contínuo, sem repaints contínuos da CPU).
 */
export const AulasHeroWave: React.FC = React.memo(function AulasHeroWave() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Resplendor Volumétrico e Bloom no Tom Teal / Esmeralda & Centelhas Douradas ── */}
      <div 
        className="absolute -bottom-14 -left-10 w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-[#0d9488]/35 via-[#042f2e]/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'aulasTealGlowPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-10 right-0 w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-[#14b8a6]/25 via-[#f59e0b]/15 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'aulasTealGlowPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade dos Textos ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[55%] sm:w-[45%] bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none z-[6]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Petróleo Profundo
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[142px] sm:h-[178px] pointer-events-none transform-gpu"
          style={{
            animation: 'aulasTealWaveBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="aulasTealDeepVelvet" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#042f2e" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#0f766e" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#064e3b" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#115e59" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#042f2e" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="aulasTealBackCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#2dd4bf" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#fef08a" stopOpacity="0.25" />
              <stop offset="75%" stopColor="#5eead4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill="url(#aulasTealDeepVelvet)"
          />

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke="url(#aulasTealBackCrest)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim Esmeralda Luminoso
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[130px] sm:h-[162px] pointer-events-none transform-gpu"
          style={{
            animation: 'aulasTealWaveMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -8px 20px rgba(13, 148, 136, 0.4)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="aulasTealSatinLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#042f2e" />
              <stop offset="12%" stopColor="#0f766e" />
              <stop offset="25%" stopColor="#0d9488" />
              <stop offset="38%" stopColor="#14b8a6" />
              <stop offset="48%" stopColor="#2dd4bf" />
              <stop offset="62%" stopColor="#0d9488" />
              <stop offset="76%" stopColor="#5eead4" />
              <stop offset="88%" stopColor="#115e59" />
              <stop offset="100%" stopColor="#042f2e" />
            </linearGradient>

            <linearGradient id="aulasTealMainCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.4" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#5eead4" stopOpacity="1" />
              <stop offset="55%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#2dd4bf" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="aulasTealMainRibbonBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#0d9488" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#0f766e" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#042f2e" stopOpacity="1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,240 C 240,165 480,185 720,240 C 960,295 1200,285 1440,240 C 1680,165 1920,185 2160,240 C 2400,295 2640,285 2880,240 L 2880,400 L 0,400 Z"
            fill="url(#aulasTealMainRibbonBody)"
          />

          <path
            d="M 0,240 C 240,165 480,185 720,240 C 960,295 1200,285 1440,240 C 1680,165 1920,185 2160,240 C 2400,295 2640,285 2880,240"
            fill="none"
            stroke="url(#aulasTealMainCrest)"
            strokeWidth="3.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Dianteira de Crista com Toque Dourado
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-95">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[115px] sm:h-[145px] pointer-events-none transform-gpu"
          style={{
            animation: 'aulasTealWaveFrontSlide 11s linear infinite',
            filter: 'drop-shadow(0 -4px 12px rgba(94, 234, 212, 0.45))',
          }}
        >
          <defs>
            <linearGradient id="aulasTealFrontCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="25%" stopColor="#fde047" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#5eead4" stopOpacity="1" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="80%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="aulasTealFrontBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#042f2e" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#0f766e" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#0d9488" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#042f2e" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <path
            d="M 0,270 C 300,195 560,205 720,265 C 920,335 1180,330 1440,270 C 1740,195 2000,205 2160,265 C 2360,335 2620,330 2880,270 L 2880,400 L 0,400 Z"
            fill="url(#aulasTealFrontBody)"
          />

          <path
            d="M 0,270 C 300,195 560,205 720,265 C 920,335 1180,330 1440,270 C 1740,195 2000,205 2160,265 C 2360,335 2620,330 2880,270"
            fill="none"
            stroke="url(#aulasTealFrontCrest)"
            strokeWidth="2.4"
          />
        </svg>
      </div>

      {/* ── Keyframes Fluidos a 120fps (GPU pura) ── */}
      <style>{`
        @keyframes aulasTealWaveMainSlide {
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

        @keyframes aulasTealWaveBackSlide {
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

        @keyframes aulasTealWaveFrontSlide {
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

        @keyframes aulasTealGlowPulse {
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
});
