import React, { memo } from 'react';

/**
 * AudioaulasHeroWave
 * Onda hiper-realista em cetim/seda 3D em tom Laranja Salmão / Coral Clássico,
 * perfeitamente harmonizada com a iluminação do pôr do sol da capa do ônibus.
 * 100% GPU-accelerated (120fps contínuo, sem engasgos, ciclo de 1440px).
 */
export const AudioaulasHeroWave: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Resplendor Volumétrico e Bloom no Tom Laranja Salmão ── */}
      <div 
        className="absolute -bottom-14 -left-10 w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-[#ff6b4a]/35 via-[#7a2616]/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'audioOrangeGlowPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-10 right-0 w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-[#ffa285]/30 via-[#5a1d13]/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'audioOrangeGlowPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade dos Textos ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[55%] sm:w-[45%] bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none z-[6]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Laranja Salmão Profundo
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[142px] sm:h-[178px] pointer-events-none transform-gpu"
          style={{
            animation: 'audioOrangeWaveBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="audioOrangeDeepVelvet" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#240a05" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#4a150c" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#2d0c07" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#5c1c10" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#240a05" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="audioOrangeBackCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#ffa285" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#ffa285" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill="url(#audioOrangeDeepVelvet)"
          />

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke="url(#audioOrangeBackCrest)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim Laranja Salmão Luminoso
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[130px] sm:h-[162px] pointer-events-none transform-gpu"
          style={{
            animation: 'audioOrangeWaveMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -8px 20px rgba(255, 110, 74, 0.4)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="audioOrangeSatinLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#3d120a" />
              <stop offset="12%" stopColor="#692013" />
              <stop offset="25%" stopColor="#962e1c" />
              <stop offset="38%" stopColor="#c74229" />
              <stop offset="48%" stopColor="#fa6846" />
              <stop offset="62%" stopColor="#e04e2e" />
              <stop offset="76%" stopColor="#ffa285" />
              <stop offset="88%" stopColor="#802717" />
              <stop offset="100%" stopColor="#3d120a" />
            </linearGradient>

            <linearGradient id="audioOrangeMainCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7a2616" stopOpacity="0.4" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#ffd4c7" stopOpacity="1" />
              <stop offset="50%" stopColor="#ff8566" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#ffd4c7" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7a2616" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          <path
            d="M 0,240 C 240,150 480,165 720,235 C 960,310 1200,300 1440,240 C 1680,150 1920,165 2160,235 C 2400,310 2640,300 2880,240 L 2880,400 L 0,400 Z"
            fill="url(#audioOrangeSatinLustre)"
          />

          <path
            d="M 0,240 C 240,150 480,165 720,235 C 960,310 1200,300 1440,240 C 1680,150 1920,165 2160,235 C 2400,310 2640,300 2880,240"
            fill="none"
            stroke="url(#audioOrangeMainCrest)"
            strokeWidth="3.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Frontal Flutuante com Fios Especulares de Luz Salmão
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-90">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[112px] sm:h-[138px] pointer-events-none transform-gpu"
          style={{
            animation: 'audioOrangeWaveFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 -4px 14px rgba(255, 138, 101, 0.45))',
          }}
        >
          <defs>
            <linearGradient id="audioOrangeFrontCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#ffe6de" stopOpacity="1" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="80%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="audioOrangeFrontBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3d120a" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#7a2616" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#b33922" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#47150c" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          <path
            d="M 0,270 C 300,195 560,205 720,265 C 920,335 1180,330 1440,270 C 1740,195 2000,205 2160,265 C 2360,335 2620,330 2880,270 L 2880,400 L 0,400 Z"
            fill="url(#audioOrangeFrontBody)"
          />

          <path
            d="M 0,270 C 300,195 560,205 720,265 C 920,335 1180,330 1440,270 C 1740,195 2000,205 2160,265 C 2360,335 2620,330 2880,270"
            fill="none"
            stroke="url(#audioOrangeFrontCrest)"
            strokeWidth="2.4"
          />
        </svg>
      </div>

      {/* ── Keyframes Fluidos a 120fps (GPU pura) ── */}
      <style>{`
        @keyframes audioOrangeWaveMainSlide {
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

        @keyframes audioOrangeWaveBackSlide {
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

        @keyframes audioOrangeWaveFrontSlide {
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

        @keyframes audioOrangeGlowPulse {
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

export default memo(AudioaulasHeroWave);
