import React, { useState, useEffect } from 'react';
import hero1 from '@/assets/aprender-hero/hero-1.webp.asset.json';
import hero2 from '@/assets/aprender-hero/hero-2.webp.asset.json';
import hero3 from '@/assets/aprender-hero/hero-3.webp.asset.json';
import hero4 from '@/assets/aprender-hero/hero-4.webp.asset.json';
import hero5 from '@/assets/aprender-hero/hero-5.webp.asset.json';
import hero6 from '@/assets/aprender-hero/hero-6.webp.asset.json';
import { srcOf } from '@/lib/assetUrl';

const HERO_ILLUSTRATIONS = [
  srcOf(hero1),
  srcOf(hero2),
  srcOf(hero3),
  srcOf(hero4),
  srcOf(hero5),
  srcOf(hero6),
];

export interface DisciplinaItem {
  id: string;
  nome: string;
  subtitulo?: string;
  descricao?: string;
  capaHeroUrl?: string;
  corDestaque?: string;
  corGradientRing?: [string, string];
  corFundoCard?: string;
  corBorda?: string;
  textAccentClass?: string;
}

interface MetricaHero {
  label: string;
  valor: string | number;
}

interface AulasHeroPanelProps {
  subtitulo?: string;
  titulo: string;
  tituloDestaque?: string;
  descricao?: string;
  porcentagem: number;
  corDestaque?: string;
  corFundo?: string;
  capaUrl?: string;
  metricas: MetricaHero[];
}

export const AulasHeroPanel: React.FC<AulasHeroPanelProps> = ({
  subtitulo = 'SUA TRILHA DE APRENDIZADO',
  titulo,
  tituloDestaque,
  descricao,
  porcentagem,
  corDestaque = '#fbbf24',
  corFundo,
  capaUrl,
  metricas
}) => {
  const [heroIdx, setHeroIdx] = useState(0);

  // Pré-aquecimento em memória de todas as ilustrações do Hero
  useEffect(() => {
    HERO_ILLUSTRATIONS.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Se não tiver capa única especificada, rotaciona as ilustrações dinâmicas
  useEffect(() => {
    if (capaUrl) return;
    const interval = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_ILLUSTRATIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [capaUrl]);

  const fundoEstilo = corFundo || 'linear-gradient(135deg, #1f1a0b 0%, #171206 55%, #0d0a02 100%)';

  return (
    <section
      className="relative isolate overflow-hidden rounded-2xl border shadow-xl transition-all"
      style={{
        background: fundoEstilo,
        borderColor: `${corDestaque}40`
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_65%)]" />

      {/* Ilustração ou Capa Temática no Canto Direito */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] sm:w-[34%] overflow-hidden" aria-hidden="true">
        {capaUrl ? (
          <img
            src={capaUrl}
            alt=""
            loading="eager"
            decoding="async"
            className="absolute inset-y-0 right-0 h-full w-auto object-cover object-center opacity-85 transition-all duration-700 ease-out group-hover:scale-105 group-hover:-translate-x-1"
          />
        ) : (
          HERO_ILLUSTRATIONS.map((url, i) => (
            <img
              key={url}
              src={url}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="absolute inset-y-0 right-0 h-full w-auto object-contain object-right transition-opacity duration-[1400ms] ease-in-out"
              style={{ opacity: i === heroIdx ? 1 : 0 }}
            />
          ))
        )}
        <div 
          className="absolute inset-0 opacity-60 mix-blend-overlay" 
          style={{ background: `linear-gradient(135deg, ${corDestaque}50 0%, transparent 100%)` }} 
        />
        <div 
          className="absolute inset-y-0 left-0 w-2/3" 
          style={{ background: 'linear-gradient(to right, #0d0f12, transparent)' }} 
        />
      </div>

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          {/* Anel Circular de Progresso SVG */}
          <div className="relative shrink-0 w-[72px] h-[72px]">
            <svg width={72} height={72} className="-rotate-90">
              <circle cx={36} cy={36} r={32.5} stroke="rgba(255,255,255,0.15)" strokeWidth={7} fill="none" />
              <circle
                cx={36}
                cy={36}
                r={32.5}
                stroke={corDestaque}
                strokeWidth={7}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={204.2}
                strokeDashoffset={204.2 - (204.2 * Math.min(100, Math.max(0, porcentagem))) / 100}
                style={{ transition: 'stroke-dashoffset 600ms ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-black text-white leading-none">{porcentagem}%</span>
              <span 
                className="text-[8px] uppercase tracking-wider font-bold leading-none mt-0.5"
                style={{ color: corDestaque }}
              >
                PROGRESSO
              </span>
            </div>
          </div>

          {/* Textos Informativos */}
          <div className="min-w-0 flex-1 pr-16 sm:pr-24">
            <span 
              className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest block"
              style={{ color: corDestaque }}
            >
              {subtitulo}
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight font-sans tracking-wide mt-0.5">
              {titulo} {tituloDestaque && <span className="italic" style={{ color: corDestaque }}>{tituloDestaque}</span>}
            </h2>
            {descricao && (
              <p className="text-xs text-zinc-300 mt-1 line-clamp-2 max-w-md leading-relaxed">
                {descricao}
              </p>
            )}
          </div>
        </div>

        {/* Métricas do Rodapé do Hero */}
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
          {metricas.map((m, idx) => (
            <div 
              key={m.label} 
              className={`flex flex-col ${idx === 1 ? 'border-x border-white/10' : ''}`}
            >
              <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {m.label}
              </span>
              <span 
                className="text-sm sm:text-base font-black mt-0.5"
                style={{ color: idx === 2 ? corDestaque : '#ffffff' }}
              >
                {m.valor}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

