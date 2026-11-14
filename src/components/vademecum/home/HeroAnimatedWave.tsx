import React, { memo } from 'react';

export interface HeroAnimatedWaveProps {
  colorScheme?: 'red' | 'green';
}

/**
 * HeroAnimatedWave
 * Onda hiper-realista em cetim/seda pura 3D com caimento calibrado,
 * efeitos visuais avançados e detalhismo cinematográfico na base do cabeçalho.
 * 
 * Suporta variantes:
 * - 'red': Carmesim rubi acetinado (#E61942) - Padrão Início do App
 * - 'green': Esmeralda seda Brasil (#10B981 / #059669) com cristas douradas e verdes - Vade Mecum Constitucional
 */
export const HeroAnimatedWave: React.FC<HeroAnimatedWaveProps> = ({
  colorScheme = 'red',
}) => {
  const isGreen = colorScheme === 'green';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Resplendor Volumétrico e Bloom ── */}
      <div 
        className={`absolute -bottom-12 -left-10 w-[60%] h-[45%] rounded-full blur-3xl pointer-events-none transform-gpu ${
          isGreen 
            ? 'bg-gradient-to-tr from-[#059669]/40 via-[#022c22]/30 to-transparent' 
            : 'bg-gradient-to-tr from-[#e61942]/35 via-[#3d050f]/25 to-transparent'
        }`}
        style={{ animation: 'heroSilkAmbientPulse 8s ease-in-out infinite alternate' }}
      />
      <div 
        className={`absolute -bottom-8 right-0 w-[55%] h-[50%] rounded-full blur-3xl pointer-events-none transform-gpu ${
          isGreen
            ? 'bg-gradient-to-tl from-[#10b981]/40 via-[#064e3b]/30 to-transparent'
            : 'bg-gradient-to-tl from-[#e61942]/40 via-[#540715]/25 to-transparent'
        }`}
        style={{ animation: 'heroSilkAmbientPulse 10s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade Absoluta do Logo ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[62%] sm:w-[46%] bg-gradient-to-r from-black/88 via-black/40 to-transparent pointer-events-none z-[6]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Profundo (Profundidade e Sombra 3D)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[140px] sm:h-[175px] pointer-events-none transform-gpu"
          style={{
            animation: 'heroSilkBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id={`silkDeepShadowGrad_${colorScheme}`} x1="0%" y1="0%" x2="100%" y2="50%">
              {isGreen ? (
                <>
                  <stop offset="0%" stopColor="#011b14" stopOpacity="0.98" />
                  <stop offset="20%" stopColor="#023b2c" stopOpacity="0.94" />
                  <stop offset="40%" stopColor="#01241a" stopOpacity="0.98" />
                  <stop offset="60%" stopColor="#04523e" stopOpacity="0.92" />
                  <stop offset="80%" stopColor="#023326" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#011b14" stopOpacity="0.98" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#1f0207" stopOpacity="0.98" />
                  <stop offset="20%" stopColor="#4a0512" stopOpacity="0.94" />
                  <stop offset="40%" stopColor="#260309" stopOpacity="0.98" />
                  <stop offset="60%" stopColor="#5e0717" stopOpacity="0.92" />
                  <stop offset="80%" stopColor="#2e040b" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#1f0207" stopOpacity="0.98" />
                </>
              )}
            </linearGradient>

            <linearGradient id={`silkBackCrestSheen_${colorScheme}`} x1="0%" y1="0%" x2="100%" y2="0%">
              {isGreen ? (
                <>
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="25%" stopColor="#34d399" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="75%" stopColor="#6ee7b7" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="25%" stopColor="#f4728f" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="75%" stopColor="#f4728f" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Massa Sombreada Traseira */}
          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210 L 2880,400 L 0,400 Z"
            fill={`url(#silkDeepShadowGrad_${colorScheme})`}
          />

          {/* Crista Traseira com Brilho Acetinado */}
          <path
            d="M 0,210 C 260,120 520,135 720,205 C 940,285 1200,270 1440,210 C 1700,120 1960,135 2160,205 C 2380,285 2640,270 2880,210"
            fill="none"
            stroke={`url(#silkBackCrestSheen_${colorScheme})`}
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[128px] sm:h-[160px] pointer-events-none transform-gpu"
          style={{
            animation: 'heroSilkMainSlide 16s linear infinite',
            filter: isGreen 
              ? 'drop-shadow(0 -10px 24px rgba(16, 185, 129, 0.65)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))'
              : 'drop-shadow(0 -10px 24px rgba(230, 25, 66, 0.6)) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id={`silkMasterSatinGrad_${colorScheme}`} x1="0%" y1="0%" x2="100%" y2="70%">
              {isGreen ? (
                <>
                  <stop offset="0%" stopColor="#022c22" />
                  <stop offset="10%" stopColor="#064e3b" />
                  <stop offset="22%" stopColor="#047857" />
                  <stop offset="35%" stopColor="#10b981" />
                  <stop offset="45%" stopColor="#059669" />
                  <stop offset="58%" stopColor="#10b981" />
                  <stop offset="72%" stopColor="#34d399" />
                  <stop offset="85%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#022c22" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#2a0309" />
                  <stop offset="10%" stopColor="#690718" />
                  <stop offset="22%" stopColor="#b30f30" />
                  <stop offset="35%" stopColor="#f22c55" />
                  <stop offset="45%" stopColor="#870a20" />
                  <stop offset="58%" stopColor="#e61942" />
                  <stop offset="72%" stopColor="#eb4768" />
                  <stop offset="85%" stopColor="#75081b" />
                  <stop offset="100%" stopColor="#2a0309" />
                </>
              )}
            </linearGradient>

            {/* Crista de Alto Brilho Especular (Gloss Esmaltado) */}
            <linearGradient id={`silkCrestGlossFine_${colorScheme}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="28%" stopColor={isGreen ? "#a7f3d0" : "#fecdd3"} stopOpacity="0.85" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="78%" stopColor={isGreen ? "#facc15" : "#fecdd3"} stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>

            {/* Halo de Brilho Translúcido sobre a Crista */}
            <linearGradient id={`silkCrestHaloFine_${colorScheme}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="35%" stopColor={isGreen ? "#10b981" : "#e61942"} stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Estrias de Reflexão Anisotrópica (Trama de Tecido) */}
            <linearGradient id={`silkTextureStreak_${colorScheme}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
            </linearGradient>

            {/* Segunda Estria de Relevo */}
            <linearGradient id={`silkSecondaryStreak_${colorScheme}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isGreen ? "#34d399" : "#f4728f"} stopOpacity="0.1" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="60%" stopColor={isGreen ? "#34d399" : "#f4728f"} stopOpacity="0.1" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="0.38" />
              <stop offset="100%" stopColor={isGreen ? "#34d399" : "#f4728f"} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Tecido Esculpido da Fita Principal */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185 L 2880,400 L 0,400 Z"
            fill={`url(#silkMasterSatinGrad_${colorScheme})`}
          />

          {/* Estria Textural de Seda (Trama de Luz) */}
          <path
            d="M 0,205 C 220,115 500,100 720,180 C 940,260 1220,270 1440,205 C 1660,115 1940,100 2160,180 C 2380,260 2660,270 2880,205"
            fill="none"
            stroke={`url(#silkTextureStreak_${colorScheme})`}
            strokeWidth="1.8"
            strokeDasharray="16 8"
          />

          {/* Segunda Estria de Profundidade */}
          <path
            d="M 0,225 C 220,135 500,120 720,200 C 940,280 1220,290 1440,225 C 1660,135 1940,120 2160,200 C 2380,280 2660,290 2880,225"
            fill="none"
            stroke={`url(#silkSecondaryStreak_${colorScheme})`}
            strokeWidth="1.4"
            strokeDasharray="24 10"
          />

          {/* Crista Especular Brilhante */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke={`url(#silkCrestGlossFine_${colorScheme})`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Halo Translúcido da Crista */}
          <path
            d="M 0,185 C 220,95 500,80 720,160 C 940,240 1220,250 1440,185 C 1660,95 1940,80 2160,160 C 2380,240 2660,250 2880,185"
            fill="none"
            stroke={`url(#silkCrestHaloFine_${colorScheme})`}
            strokeWidth="6.5"
            strokeOpacity="0.45"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Frontal Esculpida (Dobra em Primeiro Plano com Sombreamento)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-95">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[102px] sm:h-[130px] pointer-events-none transform-gpu"
          style={{
            animation: 'heroSilkFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: isGreen
              ? 'drop-shadow(0 -7px 18px rgba(0, 0, 0, 0.88)) drop-shadow(0 0 22px rgba(16, 185, 129, 0.55))'
              : 'drop-shadow(0 -7px 18px rgba(0, 0, 0, 0.88)) drop-shadow(0 0 22px rgba(230, 25, 66, 0.52))',
          }}
        >
          <defs>
            <linearGradient id={`silkFrontFoldSmall_${colorScheme}`} x1="0%" y1="100%" x2="100%" y2="0%">
              {isGreen ? (
                <>
                  <stop offset="0%" stopColor="#01241a" stopOpacity="0.96" />
                  <stop offset="20%" stopColor="#045a44" stopOpacity="0.98" />
                  <stop offset="44%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="66%" stopColor="#34d399" stopOpacity="0.98" />
                  <stop offset="85%" stopColor="#064e3b" stopOpacity="0.96" />
                  <stop offset="100%" stopColor="#01241a" stopOpacity="0.96" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#3d030c" stopOpacity="0.96" />
                  <stop offset="20%" stopColor="#9e0c29" stopOpacity="0.98" />
                  <stop offset="44%" stopColor="#e61942" stopOpacity="1" />
                  <stop offset="66%" stopColor="#eb4768" stopOpacity="0.98" />
                  <stop offset="85%" stopColor="#70071c" stopOpacity="0.96" />
                  <stop offset="100%" stopColor="#3d030c" stopOpacity="0.96" />
                </>
              )}
            </linearGradient>

            <linearGradient id={`silkFrontCrestSmall_${colorScheme}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="58%" stopColor={isGreen ? "#a7f3d0" : "#fecdd3"} stopOpacity="0.82" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Fita Frontal da Base */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240 L 2880,400 L 0,400 Z"
            fill={`url(#silkFrontFoldSmall_${colorScheme})`}
          />

          {/* Crista Frontal */}
          <path
            d="M 0,240 C 260,160 540,165 720,230 C 940,300 1200,305 1440,240 C 1700,160 1980,165 2160,230 C 2380,300 2640,305 2880,240"
            fill="none"
            stroke={`url(#silkFrontCrestSmall_${colorScheme})`}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── 4. Glints e Pontos de Reflexo Especular Diamantinos (Micro-brilhos) ── */}
      <div 
        className="absolute bottom-16 sm:bottom-22 left-[26%] sm:left-[32%] w-3 h-3 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: isGreen 
            ? '0 0 16px 4px rgba(255, 255, 255, 0.98), 0 0 30px 10px rgba(16, 185, 129, 0.9)'
            : '0 0 16px 4px rgba(255, 255, 255, 0.98), 0 0 30px 10px rgba(230, 25, 66, 0.88)',
          animation: 'heroSilkSparkle 5.5s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute bottom-14 sm:bottom-18 right-[22%] sm:right-[30%] w-2.5 h-2.5 rounded-full bg-white blur-[0.8px] pointer-events-none transform-gpu"
        style={{
          boxShadow: isGreen
            ? '0 0 14px 3px rgba(255, 255, 255, 0.92), 0 0 26px 8px rgba(16, 185, 129, 0.85)'
            : '0 0 14px 3px rgba(255, 255, 255, 0.92), 0 0 26px 8px rgba(230, 25, 66, 0.8)',
          animation: 'heroSilkSparkle 7.5s ease-in-out infinite 2.5s',
        }}
      />
      <div 
        className="absolute bottom-20 sm:bottom-28 right-[10%] sm:right-[15%] w-2 h-2 rounded-full bg-white blur-[0.6px] pointer-events-none transform-gpu"
        style={{
          boxShadow: isGreen
            ? '0 0 12px 3px rgba(255, 255, 255, 0.9), 0 0 20px 6px rgba(16, 185, 129, 0.8)'
            : '0 0 12px 3px rgba(255, 255, 255, 0.9), 0 0 20px 6px rgba(230, 25, 66, 0.75)',
          animation: 'heroSilkSparkle 6.5s ease-in-out infinite 4s',
        }}
      />

      {/* ── 5. Keyframes Orgânicos a 120fps (Sem solavanco, ciclo contínuo) ── */}
      <style>{`
        @keyframes heroSilkMainSlide {
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

        @keyframes heroSilkBackSlide {
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

        @keyframes heroSilkFrontSlide {
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
};

export default memo(HeroAnimatedWave);
