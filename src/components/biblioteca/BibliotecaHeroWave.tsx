import React, { memo } from 'react';

/**
 * BibliotecaHeroWave
 * Onda hiper-realista em cetim/seda pura 3D com caimento fluido na cor Púrpura Crepúsculo / Royal Violet.
 * Harmonizada esteticamente com a Capa da Biblioteca Clássica (Gótico & Crepúsculo).
 * 
 * Paleta Púrpura Crepúsculo & Ametista Real (Royal Violet & Twilight Amethyst):
 * - Tons nobres de ametista (#7C3AED), violeta vibrante (#8B5CF6), púrpura estelar (#A855F7), lilás luminoso (#C084FC) e sombra veludo profundo (#2E1065 / #150926).
 * - Crista especular com brilho diamante e reflexo lavanda puro.
 * - 100% GPU-accelerated (120fps contínuo, sem solavancos, ciclo de 1440px).
 */
export const BibliotecaHeroWave: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Resplendor Volumétrico e Bloom no Tom Púrpura Crepúsculo ── */}
      <div 
        className="absolute -bottom-14 -left-10 w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-[#7c3aed]/40 via-[#4c1d95]/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'bibliotecaVioletGlowPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-10 right-0 w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-[#a855f7]/35 via-[#581c87]/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'bibliotecaVioletGlowPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade Absoluta dos Textos ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[50%] sm:w-[42%] bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none z-[6]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Púrpura Noturno / Sombra Ametista
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[140px] sm:h-[175px] pointer-events-none transform-gpu"
          style={{
            animation: 'bibliotecaVioletWaveBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="biblioVioletDeepVelvet" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#150926" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#2b1055" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#1d0b38" stopOpacity="0.98" />
              <stop offset="75%" stopColor="#3b146e" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#150926" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="biblioVioletBackCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#c084fc" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#a855f7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill="url(#biblioVioletDeepVelvet)"
          />

          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke="url(#biblioVioletBackCrest)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Seda Pura Púrpura Real (Crepúsculo & Ametista)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[128px] sm:h-[160px] pointer-events-none transform-gpu"
          style={{
            animation: 'bibliotecaVioletWaveMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -10px 24px rgba(139, 92, 246, 0.45)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            {/* Gradiente de Seda Púrpura Crepúsculo */}
            <linearGradient id="biblioVioletSatinLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#240d3f" />
              <stop offset="12%" stopColor="#3b1368" />
              <stop offset="25%" stopColor="#581c87" />
              <stop offset="38%" stopColor="#7c3aed" />
              <stop offset="48%" stopColor="#9333ea" />
              <stop offset="60%" stopColor="#c084fc" />
              <stop offset="74%" stopColor="#a855f7" />
              <stop offset="86%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#240d3f" />
            </linearGradient>

            {/* Crista Especular Diamante / Lavanda Luminosa */}
            <linearGradient id="biblioVioletCrestGleam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="30%" stopColor="#f3e8ff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="80%" stopColor="#f3e8ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>

            {/* Halo de Brilho Violeta */}
            <linearGradient id="biblioVioletCrestHalo" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#a855f7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Estrias de Reflexão Anisotrópica */}
            <linearGradient id="biblioVioletTextureStreak" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Fita Mestra Esculpida */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185 L 2880,400 L 0,400 Z"
            fill="url(#biblioVioletSatinLustre)"
          />

          {/* Estria Textural de Seda */}
          <path
            d="M 0,205 C 220,115 500,100 720,180 C 940,260 1220,270 1440,205 C 1660,115 1940,100 2160,180 C 2380,260 2660,270 2880,205"
            fill="none"
            stroke="url(#biblioVioletTextureStreak)"
            strokeWidth="1.8"
            strokeDasharray="16 8"
          />

          {/* Crista de Luz Brilhante */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke="url(#biblioVioletCrestGleam)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Halo Translúcido da Crista */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke="url(#biblioVioletCrestHalo)"
            strokeWidth="6.5"
            strokeOpacity="0.45"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Frontal Esculpida (Dobra em Primeiro Plano Púrpura)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-95">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[102px] sm:h-[130px] pointer-events-none transform-gpu"
          style={{
            animation: 'bibliotecaVioletWaveFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 -7px 18px rgba(0, 0, 0, 0.88)) drop-shadow(0 0 24px rgba(168, 85, 247, 0.35))',
          }}
        >
          <defs>
            <linearGradient id="biblioVioletFrontGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2e1065" stopOpacity="0.96" />
              <stop offset="20%" stopColor="#581c87" stopOpacity="0.98" />
              <stop offset="44%" stopColor="#7c3aed" stopOpacity="1" />
              <stop offset="66%" stopColor="#c084fc" stopOpacity="0.98" />
              <stop offset="85%" stopColor="#6d28d9" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#2e1065" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="biblioVioletFrontCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="58%" stopColor="#f3e8ff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Fita Frontal */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240 L 2880,400 L 0,400 Z"
            fill="url(#biblioVioletFrontGrad)"
          />

          {/* Crista Frontal */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240"
            fill="none"
            stroke="url(#biblioVioletFrontCrest)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── 4. Glints e Micro-Brilhos Perolados na Crista ── */}
      <div 
        className="absolute bottom-16 sm:bottom-22 left-[26%] sm:left-[32%] w-3 h-3 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 16px 4px rgba(255, 255, 255, 0.98), 0 0 30px 10px rgba(168, 85, 247, 0.85)',
          animation: 'bibliotecaVioletSparkle 5.5s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute bottom-14 sm:bottom-18 right-[22%] sm:right-[30%] w-2.5 h-2.5 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 14px 3px rgba(255, 255, 255, 0.92), 0 0 26px 8px rgba(192, 132, 252, 0.75)',
          animation: 'bibliotecaVioletSparkle 7.5s ease-in-out infinite 2.5s',
        }}
      />

      {/* ── 5. Keyframes Orgânicos a 120fps (Sem solavancos) ── */}
      <style>{`
        @keyframes bibliotecaVioletWaveMainSlide {
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

        @keyframes bibliotecaVioletWaveBackSlide {
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

        @keyframes bibliotecaVioletWaveFrontSlide {
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

        @keyframes bibliotecaVioletGlowPulse {
          0% {
            opacity: 0.55;
            transform: scale(0.96);
          }
          100% {
            opacity: 0.95;
            transform: scale(1.06);
          }
        }

        @keyframes bibliotecaVioletSparkle {
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
          .biblioteca-hero-wave * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(BibliotecaHeroWave);
