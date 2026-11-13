import React, { memo } from 'react';

/**
 * HeroAnimatedWave
 * Onda vermelha hiper-realista em cetim/seda pura 3D com caimento compacto,
 * detalhismo extremo de alta costura e acabamento elegante na base do cabeçalho.
 * 
 * Especificações de Capricho & Proporção:
 * - Altura contida e elegante (não toma o espaço da foto/logo): ~95px a 125px
 * - Fitas de cetim com dobras 3D: crista iluminada em alto brilho especular + reverso em veludo bordô
 * - Estrias anisotrópicas de reflexão simulando a trama óptica da seda pura
 * - Pontos de luz especulares discretos (glints diamantinos)
 * - 100% GPU-accelerated (120fps contínuo, sem solavancos, periodicidade perfeita a 1440px)
 */
export const HeroAnimatedWave: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Resplendor Volumétrico e Bloom Carmesim Sutil na Base ── */}
      <div 
        className="absolute -bottom-10 -left-8 w-[55%] h-[35%] rounded-full bg-gradient-to-tr from-red-600/30 via-red-950/20 to-transparent blur-2xl pointer-events-none transform-gpu"
        style={{ animation: 'heroSilkAmbientPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute -bottom-8 right-0 w-[50%] h-[40%] rounded-full bg-gradient-to-tl from-red-600/35 via-red-900/20 to-transparent blur-2xl pointer-events-none transform-gpu"
        style={{ animation: 'heroSilkAmbientPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade Absoluta do Logo ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[60%] sm:w-[45%] bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none z-[6]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Bordô (Profundidade e Sombra 3D)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-75">
        <svg
          viewBox="0 0 2880 320"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[105px] sm:h-[135px] pointer-events-none transform-gpu"
          style={{
            animation: 'heroSilkBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.95))',
          }}
        >
          <defs>
            <linearGradient id="silkDeepShadowSmall" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#140002" stopOpacity="0.98" />
              <stop offset="20%" stopColor="#400107" stopOpacity="0.94" />
              <stop offset="40%" stopColor="#1c0003" stopOpacity="0.98" />
              <stop offset="60%" stopColor="#58020c" stopOpacity="0.92" />
              <stop offset="80%" stopColor="#220004" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#140002" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="silkBackSheenSmall" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#ff7b88" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#ff7b88" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Massa Sombreada Traseira */}
          <path
            d="M 0,160 C 260,90 520,105 720,155 C 940,215 1200,205 1440,160 C 1700,90 1960,105 2160,155 C 2380,215 2640,205 2880,160 L 2880,320 L 0,320 Z"
            fill="url(#silkDeepShadowSmall)"
          />

          {/* Crista Traseira */}
          <path
            d="M 0,160 C 260,90 520,105 720,155 C 940,215 1200,205 1440,160 C 1700,90 1960,105 2160,155 C 2380,215 2640,205 2880,160"
            fill="none"
            stroke="url(#silkBackSheenSmall)"
            strokeWidth="1.8"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim Carmesim (Lustro Especular e Estrias 3D)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 320"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[95px] sm:h-[120px] pointer-events-none transform-gpu"
          style={{
            animation: 'heroSilkMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -8px 20px rgba(229, 9, 20, 0.55)) drop-shadow(0 15px 30px rgba(0, 0, 0, 0.95))',
          }}
        >
          <defs>
            {/* Gradiente de Seda Carmesim Realista */}
            <linearGradient id="silkMasterSatinGrad" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#240004" />
              <stop offset="10%" stopColor="#75020e" />
              <stop offset="22%" stopColor="#c80c1c" />
              <stop offset="35%" stopColor="#ff283a" />
              <stop offset="45%" stopColor="#960512" />
              <stop offset="58%" stopColor="#e50914" />
              <stop offset="72%" stopColor="#ff4557" />
              <stop offset="85%" stopColor="#82030f" />
              <stop offset="100%" stopColor="#240004" />
            </linearGradient>

            {/* Crista de Seda Especular com Alto Contraste (Gloss) */}
            <linearGradient id="silkCrestGlossFine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="28%" stopColor="#fca5a5" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="78%" stopColor="#fca5a5" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>

            {/* Halo Suave sobre a Crista */}
            <linearGradient id="silkCrestHaloFine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#ff3348" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Estrias de Textura Anisotrópica */}
            <linearGradient id="silkTextureStreak" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Tecido Esculpido da Fita Principal */}
          <path
            d="M 0,140 C 220,70 500,60 720,120 C 940,180 1220,185 1440,140 C 1660,70 1940,60 2160,120 C 2380,180 2660,185 2880,140 L 2880,320 L 0,320 Z"
            fill="url(#silkMasterSatinGrad)"
          />

          {/* Estria Textural de Seda (Trama de Tecido) */}
          <path
            d="M 0,155 C 220,85 500,75 720,135 C 940,195 1220,200 1440,155 C 1660,85 1940,75 2160,135 C 2380,195 2660,200 2880,155"
            fill="none"
            stroke="url(#silkTextureStreak)"
            strokeWidth="1.6"
            strokeDasharray="14 7"
          />

          {/* Crista Especular Brilhante */}
          <path
            d="M 0,140 C 220,70 500,60 720,120 C 940,180 1220,185 1440,140 C 1660,70 1940,60 2160,120 C 2380,180 2660,185 2880,140"
            fill="none"
            stroke="url(#silkCrestGlossFine)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Halo Translúcido da Crista */}
          <path
            d="M 0,140 C 220,70 500,60 720,120 C 940,180 1220,185 1440,140 C 1660,70 1940,60 2160,120 C 2380,180 2660,185 2880,140"
            fill="none"
            stroke="url(#silkCrestHaloFine)"
            strokeWidth="5.5"
            strokeOpacity="0.4"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Frontal Esculpida (Dobra de Primeiro Plano)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-95">
        <svg
          viewBox="0 0 2880 320"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[75px] sm:h-[95px] pointer-events-none transform-gpu"
          style={{
            animation: 'heroSilkFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 -6px 14px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 18px rgba(229, 9, 20, 0.45))',
          }}
        >
          <defs>
            <linearGradient id="silkFrontFoldSmall" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#440107" stopOpacity="0.96" />
              <stop offset="20%" stopColor="#ad0715" stopOpacity="0.98" />
              <stop offset="44%" stopColor="#e50914" stopOpacity="1" />
              <stop offset="66%" stopColor="#ff3348" stopOpacity="0.98" />
              <stop offset="85%" stopColor="#7e030f" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#440107" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="silkFrontCrestSmall" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="58%" stopColor="#fca5a5" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Fita Frontal da Base */}
          <path
            d="M 0,185 C 260,120 540,125 720,175 C 940,230 1200,235 1440,185 C 1700,120 1980,125 2160,175 C 2380,230 2640,235 2880,185 L 2880,320 L 0,320 Z"
            fill="url(#silkFrontFoldSmall)"
          />

          {/* Crista Frontal */}
          <path
            d="M 0,185 C 260,120 540,125 720,175 C 940,230 1200,235 1440,185 C 1700,120 1980,125 2160,175 C 2380,230 2640,235 2880,185"
            fill="none"
            stroke="url(#silkFrontCrestSmall)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── 4. Glints e Pontos de Reflexo Especular Diamantinos (Micro-brilhos) ── */}
      <div 
        className="absolute bottom-12 sm:bottom-16 left-[28%] sm:left-[34%] w-2.5 h-2.5 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 14px 4px rgba(255, 255, 255, 0.95), 0 0 26px 8px rgba(229, 9, 20, 0.85)',
          animation: 'heroSilkSparkle 5.5s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute bottom-10 sm:bottom-14 right-[24%] sm:right-[32%] w-2 h-2 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 12px 3px rgba(255, 255, 255, 0.9), 0 0 22px 6px rgba(229, 9, 20, 0.75)',
          animation: 'heroSilkSparkle 7.5s ease-in-out infinite 2.5s',
        }}
      />

      {/* ── 5. Keyframes Orgânicos a 120fps (Sem solavanco, ciclo contínuo) ── */}
      <style>{`
        @keyframes heroSilkMainSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(-25%, -5px, 0) scaleY(1.04);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(1);
          }
        }

        @keyframes heroSilkBackSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(0.97);
          }
          50% {
            transform: translate3d(-25%, 5px, 0) scaleY(1.05);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(0.97);
          }
        }

        @keyframes heroSilkFrontSlide {
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

        @keyframes heroSilkAmbientPulse {
          0% {
            opacity: 0.55;
            transform: scale(0.96);
          }
          100% {
            opacity: 0.95;
            transform: scale(1.06);
          }
        }

        @keyframes heroSilkSparkle {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.7);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
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
};

export default memo(HeroAnimatedWave);
