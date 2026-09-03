import React from 'react';
import { ChevronDown } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { srcOf } from '@/lib/assetUrl';
import hero1 from '@/assets/aprender-hero/hero-1.webp.asset.json';
import hero2 from '@/assets/aprender-hero/hero-2.webp.asset.json';
import hero3 from '@/assets/aprender-hero/hero-3.webp.asset.json';
import hero4 from '@/assets/aprender-hero/hero-4.webp.asset.json';
import hero5 from '@/assets/aprender-hero/hero-5.webp.asset.json';
import hero6 from '@/assets/aprender-hero/hero-6.webp.asset.json';
import type { ResumoVideoaulas } from '@/lib/videoaulasResumo';

const HERO_ILLUSTRATIONS = [srcOf(hero1), srcOf(hero2), srcOf(hero3), srcOf(hero4), srcOf(hero5), srcOf(hero6)];

interface VideoaulasHeroProps {
  data: ResumoVideoaulas;
  heroIdx: number;
  emAndamentoCount: number;
  areasDireitoLength: number;
  setShowDesempenho: (v: boolean) => void;
  horasAssistidas: number;
  c: number;
  dash: number;
}

export const VideoaulasHero = React.memo(function VideoaulasHero({
  data,
  heroIdx,
  areasDireitoLength,
  setShowDesempenho,
  horasAssistidas,
  c,
  dash
}: VideoaulasHeroProps) {
  return (
    <section
      className="bg-primary relative isolate overflow-hidden border-b border-black/10 lg:rounded-3xl lg:border lg:border-black/10 lg:shadow-xl"
      aria-label="Seu progresso em videoaulas"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.18),transparent_65%)]" />

      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[42%] sm:w-[34%] overflow-hidden"
        aria-hidden="true"
      >
        {HERO_ILLUSTRATIONS.map((url, i) => (
          <img
            key={url}
            src={url}
            alt=""
            className={cn(
              'absolute inset-0 h-full w-full object-cover object-left opacity-[0.12] sm:opacity-[0.18] transition-opacity duration-[2000ms] ease-in-out',
              i === heroIdx ? 'opacity-100' : 'opacity-0',
            )}
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.18),transparent_65%)]" />

      <div className="relative p-4 sm:p-5 lg:flex lg:items-center lg:gap-10 lg:p-8">
        <div className="flex items-start gap-3 lg:min-w-0 lg:flex-1 lg:items-center lg:gap-6">
          <div
              className="relative h-[72px] w-[72px] sm:h-20 sm:w-20 lg:h-24 lg:w-24 shrink-0 active:scale-95 transition-transform cursor-pointer"
              onClick={() => { haptic.selection(); setShowDesempenho(true); }}
            >
              <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  className="text-white/20"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={c}
                  strokeDashoffset={dash}
                  style={{ transition: 'stroke-dashoffset 600ms ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                <span className="font-display text-[22px] font-black leading-none text-white">{horasAssistidas}h</span>
                <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-white/70">
                  Assistidas
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/50 mt-0.5" />
              </div>
            </div>

          <div className="min-w-0 max-w-[58%] lg:max-w-none lg:flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Sua trilha</p>
            <h1 className="mt-0.5 font-display text-[22px] font-black leading-tight text-white sm:text-[28px] lg:text-[38px]">
              Videoaulas
              <span className="ml-2 font-display text-[15px] font-semibold italic text-white/80 sm:text-[20px]">
                em trilhas
              </span>
            </h1>
            <p
              className="mt-0.5 text-[12px] leading-snug text-white/80 sm:text-[13px]"
              style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
            >
              Aulas em vídeo com ferramentas de estudo por área.
            </p>
          </div>
        </div>

        <div className="relative mt-3 rounded-xl lg:mt-0 lg:w-[440px] lg:shrink-0 bg-black/85 text-white ring-1 ring-black/20 shadow-lg">
          <div className="grid grid-cols-3 divide-x divide-white/10 lg:py-2">
            <div className="flex flex-col items-center justify-center px-2 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Áreas</span>
              <span className="mt-0.5 font-display text-base font-black leading-none">{areasDireitoLength}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Aulas</span>
              <span className="mt-0.5 font-display text-base font-black leading-none">{data.totalAulas}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Assistidas</span>
              <span className="mt-0.5 font-display text-base font-black leading-none text-[hsl(var(--aprender-accent))]">
                {data.totalConcluidas}
                <span className="text-white/50">/{data.totalAulas}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
