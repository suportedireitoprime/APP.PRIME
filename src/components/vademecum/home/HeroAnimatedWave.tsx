import React, { memo } from 'react';

/**
 * HeroAnimatedWave
 * Onda vermelha hiper-realista em cetim/seda pura 3D com caimento dinâmico e acabamento de alta costura.
 * 
 * Capricho e Detalhismo Extremo:
 * 1. Fitas de Cetim com Dobra 3D (Face superior iluminada + Reverso sombreado em veludo bordô)
 * 2. Curvatura Cinematográfica:
 *    - Elevação suave e elegante na lateral esquerda
 *    - Caimento orgânico ao centro, aninhando a barra de atalhos
 *    - Swoop majestoso e esvoaçante na lateral direita, emoldurando a cena
 * 3. Crista Especular de Alto Lustro: fio de brilho acetinado reluzente e halos de reflexão
 * 4. Textura Anisotrópica com Estrias de Luz e Sombra: simula o comportamento óptico da seda real
 * 5. Pontos de Luz Diamantinos (Specular Glints): micro-brilhos sutis que cintilam na crista
 * 6. Animação 100% fluida em GPU (120fps) com oscilação orgânica periódica contínua
 */
export const HeroAnimatedWave: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* ── 1. Iluminação Ambiente e Bloom Volumétrico Carmesim ── */}
      <div 
        className="absolute -bottom-20 -left-12 w-[70%] h-[60%] rounded-full bg-gradient-to-tr from-red-600/40 via-red-950/25 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'heroSilkAmbientPulse 9s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute bottom-2 right-0 w-[60%] h-[70%] rounded-full bg-gradient-to-tl from-red-600/45 via-red-900/30 to-transparent blur-3xl pointer-events-none transform-gpu"
        style={{ animation: 'heroSilkAmbientPulse 11s ease-in-out infinite alternate-reverse' }}
      />

      {/* ── 2. Gradiente Lateral de Contraste para Legibilidade Absoluta do Logo e Textos ── */}
      <div 
        className="absolute inset-y-0 left-0 w-[65%] sm:w-[50%] bg-gradient-to-r from-black/90 via-black/45 to-transparent pointer-events-none z-[6]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Bordô (Profundidade e Oclusão 3D)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-80">
        <svg
          viewBox="0 0 2880 620"
          preserveAspectRatio="none"
          className="absolute -bottom-2 left-0 w-[200%] h-[245px] sm:h-[310px] pointer-events-none transform-gpu"
          style={{
            animation: 'heroSilkBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            <linearGradient id="silkDeepShadowGrad" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#150003" stopOpacity="0.98" />
              <stop offset="22%" stopColor="#450108" stopOpacity="0.94" />
              <stop offset="45%" stopColor="#200004" stopOpacity="0.98" />
              <stop offset="68%" stopColor="#5e030d" stopOpacity="0.92" />
              <stop offset="85%" stopColor="#250005" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#150003" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="silkBackCrestSheen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#ff7b88" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="75%" stopColor="#ff7b88" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Massa da Fita Traseira */}
          <path
            d="M 0,350 C 260,210 520,230 720,340 C 940,460 1200,440 1440,350 C 1700,210 1960,230 2160,340 C 2380,460 2640,440 2880,350 L 2880,620 L 0,620 Z"
            fill="url(#silkDeepShadowGrad)"
          />

          {/* Crista Sutil Traseira */}
          <path
            d="M 0,350 C 260,210 520,230 720,340 C 940,460 1200,440 1440,350 C 1700,210 1960,230 2160,340 C 2380,460 2640,440 2880,350"
            fill="none"
            stroke="url(#silkBackCrestSheen)"
            strokeWidth="2.2"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Cetim Carmesim (Volume, Crista de Luz e Estrias)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform">
        <svg
          viewBox="0 0 2880 620"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[235px] sm:h-[295px] pointer-events-none transform-gpu"
          style={{
            animation: 'heroSilkMainSlide 16s linear infinite',
            filter: 'drop-shadow(0 -14px 30px rgba(229, 9, 20, 0.65)) drop-shadow(0 24px 45px rgba(0, 0, 0, 0.98))',
          }}
        >
          <defs>
            {/* Gradiente de Seda Carmesim Real com Variação Óptica de Cetim */}
            <linearGradient id="silkMasterLustre" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#250004" />
              <stop offset="10%" stopColor="#78020e" />
              <stop offset="22%" stopColor="#cf0d1e" />
              <stop offset="35%" stopColor="#ff2a3c" />
              <stop offset="44%" stopColor="#9b0513" />
              <stop offset="58%" stopColor="#e50914" />
              <stop offset="72%" stopColor="#ff4557" />
              <stop offset="85%" stopColor="#870410" />
              <stop offset="100%" stopColor="#250004" />
            </linearGradient>

            {/* Crista Especular de Alto Brilho (High Gloss Crest) */}
            <linearGradient id="silkMasterCrestGleam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="28%" stopColor="#fca5a5" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="78%" stopColor="#fca5a5" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>

            {/* Halo Suave de Reflexo ao Redor da Crista */}
            <linearGradient id="silkMasterCrestHalo" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#ff3348" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Estrias de Textura Anisotrópica de Seda */}
            <linearGradient id="silkAnisotropicGleam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Corpo da Fita Mestra */}
          <path
            d="M 0,315 C 220,185 500,165 720,275 C 940,385 1220,395 1440,315 C 1660,185 1940,165 2160,275 C 2380,385 2660,395 2880,315 L 2880,620 L 0,620 Z"
            fill="url(#silkMasterLustre)"
          />

          {/* Linha de Estria de Textura da Seda */}
          <path
            d="M 0,340 C 220,210 500,190 720,300 C 940,410 1220,420 1440,340 C 1660,210 1940,190 2160,300 C 2380,410 2660,420 2880,340"
            fill="none"
            stroke="url(#silkAnisotropicGleam)"
            strokeWidth="2"
            strokeDasharray="16 8"
          />

          {/* Crista Especular com Alto Brilho */}
          <path
            d="M 0,315 C 220,185 500,165 720,275 C 940,385 1220,395 1440,315 C 1660,185 1940,165 2160,275 C 2380,385 2660,395 2880,315"
            fill="none"
            stroke="url(#silkMasterCrestGleam)"
            strokeWidth="3.8"
            strokeLinecap="round"
          />

          {/* Halo Translúcido de Resplendor da Crista */}
          <path
            d="M 0,315 C 220,185 500,165 720,275 C 940,385 1220,395 1440,315 C 1660,185 1940,165 2160,275 C 2380,385 2660,395 2880,315"
            fill="none"
            stroke="url(#silkMasterCrestHalo)"
            strokeWidth="8"
            strokeOpacity="0.45"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Frontal Esculpida (Dobra em Primeiro Plano)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-95">
        <svg
          viewBox="0 0 2880 620"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 w-[200%] h-[180px] sm:h-[230px] pointer-events-none transform-gpu"
          style={{
            animation: 'heroSilkFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 -9px 22px rgba(0, 0, 0, 0.88)) drop-shadow(0 0 26px rgba(229, 9, 20, 0.52))',
          }}
        >
          <defs>
            <linearGradient id="silkFrontFoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a0108" stopOpacity="0.96" />
              <stop offset="20%" stopColor="#b10816" stopOpacity="0.98" />
              <stop offset="44%" stopColor="#e50914" stopOpacity="1" />
              <stop offset="66%" stopColor="#ff3348" stopOpacity="0.98" />
              <stop offset="85%" stopColor="#820410" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#4a0108" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="silkFrontFoldCrest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="58%" stopColor="#fca5a5" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Fita Frontal */}
          <path
            d="M 0,390 C 260,270 540,280 720,370 C 940,470 1200,480 1440,390 C 1700,270 1980,280 2160,370 C 2380,470 2640,480 2880,390 L 2880,620 L 0,620 Z"
            fill="url(#silkFrontFoldGrad)"
          />

          {/* Crista Frontal */}
          <path
            d="M 0,390 C 260,270 540,280 720,370 C 940,470 1200,480 1440,390 C 1700,270 1980,280 2160,370 C 2380,470 2640,480 2880,390"
            fill="none"
            stroke="url(#silkFrontFoldCrest)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── 4. Glints e Pontos de Reflexo Especular Diamantinos (Micro-brilhos) ── */}
      <div 
        className="absolute bottom-24 sm:bottom-32 left-[25%] sm:left-[32%] w-3.5 h-3.5 rounded-full bg-white blur-[1px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 18px 5px rgba(255, 255, 255, 0.98), 0 0 36px 12px rgba(229, 9, 20, 0.88)',
          animation: 'heroSilkSparkle 5.5s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute bottom-18 sm:bottom-26 right-[20%] sm:right-[28%] w-3 h-3 rounded-full bg-white blur-[1px] pointer-events-none transform-gpu"
        style={{
          boxShadow: '0 0 16px 4px rgba(255, 255, 255, 0.95), 0 0 32px 10px rgba(229, 9, 20, 0.8)',
          animation: 'heroSilkSparkle 7.5s ease-in-out infinite 2.5s',
        }}
      />

      {/* ── 5. Keyframes com Ondulação Orgânica a 120fps (Zero solavanco) ── */}
      <style>{`
        @keyframes heroSilkMainSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(-25%, -8px, 0) scaleY(1.06);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(1);
          }
        }

        @keyframes heroSilkBackSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(0.96);
          }
          50% {
            transform: translate3d(-25%, 8px, 0) scaleY(1.07);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(0.96);
          }
        }

        @keyframes heroSilkFrontSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(-25%, -9px, 0) scaleY(1.08);
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
            transform: scale(1.08);
          }
        }

        @keyframes heroSilkSparkle {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.65);
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
