import React, { memo } from 'react';

/**
 * PilulasHeroWave
 * Onda hiper-realista em cetim/seda pura 3D com a cor extraída diretamente
 * do céu dourado ao pôr do sol da foto da estudante nos jardins do tribunal.
 * 
 * Paleta Pôr do Sol Dourado (Golden Amber & Honey Silk):
 * - Degradê de seda em tons de âmbar dourado, mel, ocre solar e sombras em bronze profundo.
 * - Crista especular com brilho de ouro puro reluzente e reflexos prateados.
 * - 100% GPU-accelerated (120fps contínuo, sem solavancos, ciclo de 1440px).
 */
export const VideoaulasHeroWave: React.FC = memo(function VideoaulasHeroWave() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Resplendor Volumétrico e Bloom no Tom Dourado do Pôr do Sol ── */}
      <div 
        className="absolute -bottom-14 -left-10 w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-amber-500/35 via-yellow-950/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'pilulasGoldGlowPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-10 right-0 w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-yellow-500/35 via-amber-900/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'pilulasGoldGlowPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade Absoluta dos Textos ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[62%] sm:w-[46%] bg-gradient-to-r from-black/90 via-black/45 to-transparent pointer-events-none z-[6]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Bronze/Âmbar Profundo
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[142px] sm:h-[178px] pointer-events-none transform-gpu"
          style={{
            animation: 'pilulasGoldWaveBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="goldDeepVelvet" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#1c0b02" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#4d1e05" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#291003" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#5c2606" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#1c0b02" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="goldBackCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#fde68a" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#fde68a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill="url(#goldDeepVelvet)"
          />

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke="url(#goldBackCrest)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim Âmbar Dourado (Céu Pôr do Sol da Foto)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[130px] sm:h-[162px] pointer-events-none transform-gpu"
          style={{
            animation: 'pilulasGoldWaveMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -10px 24px rgba(245, 158, 11, 0.55)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            {/* Gradiente Fiel ao Pôr do Sol da Foto (Bronze, mel, ouro e âmbar) */}
            <linearGradient id="goldSatinLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#2e1203" />
              <stop offset="12%" stopColor="#7c3308" />
              <stop offset="25%" stopColor="#b45309" />
              <stop offset="38%" stopColor="#f59e0b" />
              <stop offset="48%" stopColor="#fbbf24" />
              <stop offset="62%" stopColor="#d97706" />
              <stop offset="76%" stopColor="#fde68a" />
              <stop offset="88%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#2e1203" />
            </linearGradient>

            {/* Crista Especular Ouro Solar / Alva Reluzente */}
            <linearGradient id="goldCrestGleam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="30%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="80%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>

            {/* Halo de Brilho Dourado */}
            <linearGradient id="goldCrestHalo" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Estrias de Reflexão Anisotrópica */}
            <linearGradient id="goldTextureStreak" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Fita Mestra Esculpida */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185 L 2880,400 L 0,400 Z"
            fill="url(#goldSatinLustre)"
          />

          {/* Estria Textural de Seda */}
          <path
            d="M 0,205 C 220,115 500,100 720,180 C 940,260 1220,270 1440,205 C 1660,115 1940,100 2160,180 C 2380,260 2660,270 2880,205"
            fill="none"
            stroke="url(#goldTextureStreak)"
            strokeWidth="1.8"
            strokeDasharray="16 8"
          />

          {/* Crista de Luz Brilhante */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke="url(#goldCrestGleam)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Halo Translúcido da Crista */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke="url(#goldCrestHalo)"
            strokeWidth="6.5"
            strokeOpacity="0.45"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Frontal Esculpida (Dobra em Primeiro Plano)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-95">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[102px] sm:h-[130px] pointer-events-none transform-gpu"
          style={{
            animation: 'pilulasGoldWaveFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 -7px 18px rgba(0, 0, 0, 0.88)) drop-shadow(0 0 22px rgba(245, 158, 11, 0.45))',
          }}
        >
          <defs>
            <linearGradient id="goldFrontGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a1c04" stopOpacity="0.96" />
              <stop offset="20%" stopColor="#b45309" stopOpacity="0.98" />
              <stop offset="44%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="66%" stopColor="#fbbf24" stopOpacity="0.98" />
              <stop offset="85%" stopColor="#92400e" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#4a1c04" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="goldFrontCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="58%" stopColor="#fef08a" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Fita Frontal */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240 L 2880,400 L 0,400 Z"
            fill="url(#goldFrontGrad)"
          />

          {/* Crista Frontal */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240"
            fill="none"
            stroke="url(#goldFrontCrest)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── 4. Glints e Micro-Brilhos Diamantinos na Crista ── */}
      <div 
        className="absolute bottom-16 sm:bottom-22 left-[26%] sm:left-[32%] w-3 h-3 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 16px 4px rgba(255, 255, 255, 0.98), 0 0 30px 10px rgba(251, 191, 36, 0.85)',
          animation: 'pilulasGoldSparkle 5.5s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute bottom-14 sm:bottom-18 right-[22%] sm:right-[30%] w-2.5 h-2.5 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 14px 3px rgba(255, 255, 255, 0.92), 0 0 26px 8px rgba(245, 158, 11, 0.8)',
          animation: 'pilulasGoldSparkle 7.5s ease-in-out infinite 2.5s',
        }}
      />

      {/* ── 5. Keyframes Orgânicos a 120fps (Sem solavancos) ── */}
      <style>{`
        @keyframes pilulasGoldWaveMainSlide {
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

        @keyframes pilulasGoldWaveBackSlide {
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

        @keyframes pilulasGoldWaveFrontSlide {
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

        @keyframes pilulasGoldGlowPulse {
          0% {
            opacity: 0.5;
            transform: scale(0.96);
          }
          100% {
            opacity: 0.95;
            transform: scale(1.06);
          }
        }

        @keyframes pilulasGoldSparkle {
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
          .hero-animated-wave * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
});

export default VideoaulasHeroWave;
