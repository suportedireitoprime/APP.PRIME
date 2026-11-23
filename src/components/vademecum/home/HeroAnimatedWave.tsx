import React, { memo, useState, useEffect } from 'react';

export interface HeroAnimatedWaveProps {
  colorScheme?: 'red' | 'green';
  themeColor?: string; // Cor customizada da lei (ex: '#2563EB', '#059669', etc.)
  waveHeight?: 'standard' | 'tall';
}

function shadeHex(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * HeroAnimatedWave
 * Onda hiper-realista em cetim/seda pura 3D com caimento calibrado,
 * iluminação física suave, paralaxe de 3 camadas e fluidez contínua a 120fps.
 * 
 * Suporta variantes:
 * - 'red': Carmesim rubi acetinado (#E61942) - Padrão Início do App
 * - 'green': Esmeralda seda Brasil (#10B981 / #059669) - Vade Mecum Constitucional
 * - themeColor: Qualquer cor hex temática da lei (ex: #2563EB Código Civil, #DC2626 Código Penal, etc.)
 */
export const HeroAnimatedWave: React.FC<HeroAnimatedWaveProps> = ({
  colorScheme = 'red',
  themeColor,
  waveHeight = 'standard',
}) => {
  const [isPaused, setIsPaused] = useState(false);

  // Otimização de bateria e GPU: pausa animações contínuas quando o app/aba estiver em background
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const isCustom = Boolean(themeColor);
  const isGreen = !isCustom && colorScheme === 'green';
  const c = themeColor || (isGreen ? '#059669' : '#e61942');
  const schemeKey = isCustom ? `c_${themeColor!.replace('#', '')}` : colorScheme;

  const isTall = waveHeight === 'tall';
  const c1HeightClass = isTall ? 'h-[135px] sm:h-[165px]' : 'h-[105px] sm:h-[130px]';
  const c2HeightClass = isTall ? 'h-[120px] sm:h-[150px]' : 'h-[92px] sm:h-[115px]';
  const c3HeightClass = isTall ? 'h-[90px] sm:h-[115px]' : 'h-[72px] sm:h-[90px]';

  // Cores dinâmicas para tema customizado
  const deep0 = isCustom ? shadeHex(c, -0.88) : isGreen ? '#011b14' : '#1f0207';
  const deep20 = isCustom ? shadeHex(c, -0.65) : isGreen ? '#023b2c' : '#4a0512';
  const deep40 = isCustom ? shadeHex(c, -0.80) : isGreen ? '#01241a' : '#260309';
  const deep60 = isCustom ? shadeHex(c, -0.55) : isGreen ? '#04523e' : '#5e0717';
  const deep80 = isCustom ? shadeHex(c, -0.75) : isGreen ? '#023326' : '#2e040b';

  const crest25 = isCustom ? shadeHex(c, 0.45) : isGreen ? '#34d399' : '#f4728f';
  const crest75 = isCustom ? shadeHex(c, 0.65) : isGreen ? '#6ee7b7' : '#f4728f';

  const satin0 = isCustom ? shadeHex(c, -0.85) : isGreen ? '#022c22' : '#2a0309';
  const satin10 = isCustom ? shadeHex(c, -0.60) : isGreen ? '#064e3b' : '#690718';
  const satin22 = isCustom ? shadeHex(c, -0.30) : isGreen ? '#047857' : '#b30f30';
  const satin35 = isCustom ? shadeHex(c, 0.20) : isGreen ? '#10b981' : '#f22c55';
  const satin45 = isCustom ? c : isGreen ? '#059669' : '#870a20';
  const satin58 = isCustom ? shadeHex(c, 0.15) : isGreen ? '#10b981' : '#e61942';
  const satin72 = isCustom ? shadeHex(c, 0.45) : isGreen ? '#34d399' : '#eb4768';
  const satin85 = isCustom ? shadeHex(c, -0.35) : isGreen ? '#047857' : '#75081b';

  const glossColor = isCustom ? shadeHex(c, 0.7) : isGreen ? '#a7f3d0' : '#fecdd3';
  const glossColor2 = isCustom ? shadeHex(c, 0.6) : isGreen ? '#facc15' : '#fecdd3';
  const haloColor = c;

  const streakSec = isCustom ? shadeHex(c, 0.5) : isGreen ? '#34d399' : '#f4728f';

  const front0 = isCustom ? shadeHex(c, -0.85) : isGreen ? '#01241a' : '#3d030c';
  const front20 = isCustom ? shadeHex(c, -0.45) : isGreen ? '#045a44' : '#9e0c29';
  const front44 = isCustom ? c : isGreen ? '#10b981' : '#e61942';
  const front66 = isCustom ? shadeHex(c, 0.35) : isGreen ? '#34d399' : '#eb4768';
  const front85 = isCustom ? shadeHex(c, -0.60) : isGreen ? '#064e3b' : '#70071c';

  const frontCrestColor = isCustom ? shadeHex(c, 0.65) : isGreen ? '#a7f3d0' : '#fecdd3';

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-[5] ${isPaused ? 'hero-silk-paused' : ''}`}>
      {/* ── 1. Resplendor Volumétrico e Bloom Suave ── */}
      <div 
        className={`absolute -bottom-12 -left-10 w-[60%] h-[45%] rounded-full blur-3xl pointer-events-none transform-gpu ${
          isGreen 
            ? 'bg-gradient-to-tr from-[#059669]/30 via-[#022c22]/20 to-transparent' 
            : 'bg-gradient-to-tr from-[#e61942]/25 via-[#3d050f]/15 to-transparent'
        }`}
        style={{
          background: isCustom
            ? `radial-gradient(circle at center, ${c}4D 0%, ${shadeHex(c, -0.7)}33 50%, transparent 100%)`
            : undefined,
          animation: 'heroSilkAmbientPulse 8s ease-in-out infinite alternate',
        }}
      />
      <div 
        className={`absolute -bottom-8 right-0 w-[55%] h-[50%] rounded-full blur-3xl pointer-events-none transform-gpu ${
          isGreen
            ? 'bg-gradient-to-tl from-[#10b981]/25 via-[#043d2f]/15 to-transparent'
            : 'bg-gradient-to-tl from-[#e61942]/25 via-[#4a0512]/15 to-transparent'
        }`}
        style={{
          background: isCustom
            ? `radial-gradient(circle at center, ${c}4D 0%, ${shadeHex(c, -0.7)}33 50%, transparent 100%)`
            : undefined,
          animation: 'heroSilkAmbientPulse 10s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* ── 2. Gradiente Lateral no Topo para Legibilidade do Título ── */}
      <div 
        className="absolute top-0 left-0 w-[55%] sm:w-[42%] h-[60%] bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none z-[2]" 
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 1: Fita Traseira de Veludo Profundo (Profundidade e Oclusão 3D)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-90 z-[4]">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className={`absolute -bottom-1 left-0 w-[200%] ${c1HeightClass} pointer-events-none transform-gpu hero-silk-layer`}
          style={{
            animation: 'heroSilkBackSlide 24s linear infinite',
            filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.85))',
          }}
        >
          <defs>
            <linearGradient id={`silkDeepShadowGrad_${schemeKey}`} x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor={deep0} stopOpacity="0.98" />
              <stop offset="20%" stopColor={deep20} stopOpacity="0.96" />
              <stop offset="40%" stopColor={deep40} stopOpacity="0.98" />
              <stop offset="60%" stopColor={deep60} stopOpacity="0.95" />
              <stop offset="80%" stopColor={deep80} stopOpacity="0.98" />
              <stop offset="100%" stopColor={deep0} stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id={`silkBackCrestSheen_${schemeKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="25%" stopColor={crest25} stopOpacity="0.75" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="75%" stopColor={crest75} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Massa Sombreada Traseira com continuidade C1 perfeita nas emendas */}
          <path
            d="M 0,200 C 260,130 480,120 720,185 C 960,250 1180,260 1440,200 C 1700,130 1920,120 2160,185 C 2400,250 2620,260 2880,200 L 2880,400 L 0,400 Z"
            fill={`url(#silkDeepShadowGrad_${schemeKey})`}
          />

          {/* Crista Traseira suave */}
          <path
            d="M 0,200 C 260,130 480,120 720,185 C 960,250 1180,260 1440,200 C 1700,130 1920,120 2160,185 C 2400,250 2620,260 2880,200"
            fill="none"
            stroke={`url(#silkBackCrestSheen_${schemeKey})`}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 2: Fita Mestra de Seda e Cetim (Luminosidade e Caimento Principal)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform z-[5]">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className={`absolute -bottom-1 left-0 w-[200%] ${c2HeightClass} pointer-events-none transform-gpu hero-silk-layer`}
          style={{
            animation: 'heroSilkMainSlide 16s linear infinite',
            filter: `drop-shadow(0 -4px 14px ${c}55)`,
          }}
        >
          <defs>
            <linearGradient id={`silkMasterSatinGrad_${schemeKey}`} x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor={satin0} />
              <stop offset="10%" stopColor={satin10} />
              <stop offset="22%" stopColor={satin22} />
              <stop offset="35%" stopColor={satin35} />
              <stop offset="45%" stopColor={satin45} />
              <stop offset="58%" stopColor={satin58} />
              <stop offset="72%" stopColor={satin72} />
              <stop offset="85%" stopColor={satin85} />
              <stop offset="100%" stopColor={satin0} />
            </linearGradient>

            {/* Crista Especular Contínua de Alto Brilho (Gloss da Seda) */}
            <linearGradient id={`silkCrestGlossFine_${schemeKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="28%" stopColor={glossColor} stopOpacity="0.85" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="78%" stopColor={glossColor2} stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
            </linearGradient>

            {/* Halo Translúcido da Crista */}
            <linearGradient id={`silkCrestHaloFine_${schemeKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="35%" stopColor={haloColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Estria Contínua de Seda (Sem tracejados artificiais) */}
            <linearGradient id={`silkTextureStreak_${schemeKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="22%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="72%" stopColor="#ffffff" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
            </linearGradient>

            {/* Relevo Suave Secundário */}
            <linearGradient id={`silkSecondaryStreak_${schemeKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={streakSec} stopOpacity="0.1" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="60%" stopColor={streakSec} stopOpacity="0.1" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="100%" stopColor={streakSec} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Tecido Esculpido da Fita Principal com Tangentes C1 Idênticas nas Emendas */}
          <path
            d="M 0,165 C 220,85 480,75 720,150 C 960,225 1220,235 1440,165 C 1660,85 1920,75 2160,150 C 2400,225 2660,235 2880,165 L 2880,400 L 0,400 Z"
            fill={`url(#silkMasterSatinGrad_${schemeKey})`}
          />

          {/* Estria Textural Suave de Seda Contínua (Sem cortes/pontilhados) */}
          <path
            d="M 0,185 C 220,105 480,95 720,170 C 960,245 1220,255 1440,185 C 1660,105 1920,95 2160,170 C 2400,245 2660,255 2880,185"
            fill="none"
            stroke={`url(#silkTextureStreak_${schemeKey})`}
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Segunda Estria de Profundidade Contínua */}
          <path
            d="M 0,205 C 220,125 480,115 720,190 C 960,265 1220,275 1440,205 C 1660,125 1920,115 2160,190 C 2400,265 2660,275 2880,205"
            fill="none"
            stroke={`url(#silkSecondaryStreak_${schemeKey})`}
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Crista Especular Brilhante (Glow de Seda Pura) */}
          <path
            d="M 0,165 C 220,85 480,75 720,150 C 960,225 1220,235 1440,165 C 1660,85 1920,75 2160,150 C 2400,225 2660,235 2880,165"
            fill="none"
            stroke={`url(#silkCrestGlossFine_${schemeKey})`}
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Halo Translúcido da Crista */}
          <path
            d="M 0,165 C 220,85 480,75 720,150 C 960,225 1220,235 1440,165 C 1660,85 1920,75 2160,150 C 2400,225 2660,235 2880,165"
            fill="none"
            stroke={`url(#silkCrestHaloFine_${schemeKey})`}
            strokeWidth="5"
            strokeOpacity="0.6"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMADA 3: Fita Frontal Esculpida (Dobra em Primeiro Plano com Sombreamento)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden transform-gpu will-change-transform opacity-95 z-[6]">
        <svg
          viewBox="0 0 2880 400"
          preserveAspectRatio="none"
          className={`absolute -bottom-1 left-0 w-[200%] ${c3HeightClass} pointer-events-none transform-gpu hero-silk-layer`}
          style={{
            animation: 'heroSilkFrontSlide 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            filter: 'drop-shadow(0 -4px 10px rgba(0, 0, 0, 0.7))',
          }}
        >
          <defs>
            <linearGradient id={`silkFrontFoldSmall_${schemeKey}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={front0} stopOpacity="0.96" />
              <stop offset="20%" stopColor={front20} stopOpacity="0.98" />
              <stop offset="44%" stopColor={front44} stopOpacity="1" />
              <stop offset="66%" stopColor={front66} stopOpacity="0.98" />
              <stop offset="85%" stopColor={front85} stopOpacity="0.96" />
              <stop offset="100%" stopColor={front0} stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id={`silkFrontCrestSmall_${schemeKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="58%" stopColor={frontCrestColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Fita Frontal da Base com Tangentes Suaves */}
          <path
            d="M 0,225 C 240,150 520,155 720,215 C 920,275 1200,280 1440,225 C 1680,150 1960,155 2160,215 C 2360,275 2640,280 2880,225 L 2880,400 L 0,400 Z"
            fill={`url(#silkFrontFoldSmall_${schemeKey})`}
          />

          {/* Crista Frontal Suave */}
          <path
            d="M 0,225 C 240,150 520,155 720,215 C 920,275 1200,280 1440,225 C 1680,150 1960,155 2160,215 C 2360,275 2640,280 2880,225"
            fill="none"
            stroke={`url(#silkFrontCrestSmall_${schemeKey})`}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── 4. Keyframes Orgânicos a 120fps com Ancoragem na Base (Sem descolamento) ── */}
      <style>{`
        .hero-silk-layer {
          transform-origin: bottom center;
          will-change: transform;
          contain: layout paint;
          backface-visibility: hidden;
        }

        .hero-silk-paused .hero-silk-layer,
        .hero-silk-paused div {
          animation-play-state: paused !important;
        }

        @keyframes heroSilkMainSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(-25%, 0, 0) scaleY(1.03);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(1);
          }
        }

        @keyframes heroSilkBackSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(0.98);
          }
          50% {
            transform: translate3d(-25%, 0, 0) scaleY(1.04);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(0.98);
          }
        }

        @keyframes heroSilkFrontSlide {
          0% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(-25%, 0, 0) scaleY(1.03);
          }
          100% {
            transform: translate3d(-50%, 0, 0) scaleY(1);
          }
        }

        @keyframes heroSilkAmbientPulse {
          0% {
            opacity: 0.55;
            transform: scale(0.97);
          }
          100% {
            opacity: 0.9;
            transform: scale(1.04);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-silk-layer,
          .hero-animated-wave * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(HeroAnimatedWave);
