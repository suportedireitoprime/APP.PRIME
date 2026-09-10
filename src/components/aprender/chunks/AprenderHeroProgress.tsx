import React, { memo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { HERO_ILLUSTRATIONS, onIdle } from './aprenderConstants';

interface AprenderHeroProgressProps {
  activeTab: 'aulas' | 'flashcards' | 'questoes';
  pct: number;
  metricLabel1: string;
  metricVal1: number;
  metricLabel2: string;
  metricVal2Display: React.ReactNode;
  metricLabel3: string;
  metricVal3: string | number;
  metricVal3Total: string | number;
}

export const AprenderHeroProgress: React.FC<AprenderHeroProgressProps> = memo(({
  activeTab,
  pct,
  metricLabel1,
  metricVal1,
  metricLabel2,
  metricVal2Display,
  metricLabel3,
  metricVal3,
  metricVal3Total,
}) => {
  const [heroIdx, setHeroIdx] = useState(0);

  // Rotação suave da ilustração após o primeiro paint
  useEffect(() => {
    let id: number | undefined;
    const start = onIdle(() => {
      id = window.setInterval(() => {
        setHeroIdx((i) => (i + 1) % HERO_ILLUSTRATIONS.length);
      }, 4500);
    }, 1200);
    return () => {
      if (id) clearInterval(id);
      const cancel: any = (window as any).cancelIdleCallback;
      if (cancel) cancel(start);
    };
  }, []);

  const isAulas = activeTab === 'aulas';
  const isFlashcards = activeTab === 'flashcards';
  const isQuestoes = activeTab === 'questoes';

  const tabTheme = isFlashcards
    ? {
        heroBg: 'linear-gradient(135deg, #0d2218 0%, #071710 55%, #050d09 100%)',
        heroBorder: 'rgba(52, 211, 153, 0.28)',
        glow: 'linear-gradient(135deg, rgba(52, 211, 153, 0.45) 0%, transparent 100%)',
        accent: '#34D399',
        badgeText: 'text-emerald-300',
        fadeBg: '#0d2218',
      }
    : isQuestoes
    ? {
        heroBg: 'linear-gradient(135deg, #0c1c2e 0%, #071220 55%, #050c14 100%)',
        heroBorder: 'rgba(56, 189, 248, 0.28)',
        glow: 'linear-gradient(135deg, rgba(56, 189, 248, 0.45) 0%, transparent 100%)',
        accent: '#38BDF8',
        badgeText: 'text-sky-300',
        fadeBg: '#0c1c2e',
      }
    : {
        heroBg: 'linear-gradient(135deg, #1f1215 0%, #150d10 55%, #0d0d0f 100%)',
        heroBorder: 'rgba(244, 63, 94, 0.25)',
        glow: 'linear-gradient(135deg, rgba(225, 29, 72, 0.45) 0%, transparent 100%)',
        accent: '#fb7185',
        badgeText: 'text-rose-300/90',
        fadeBg: '#1f1215',
      };

  const size = 72;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safePct = Math.min(100, Math.max(0, isNaN(Number(pct)) ? 0 : Math.round(Number(pct))));
  const dash = c - (safePct / 100) * c;

  return (
    <section
      className="relative isolate overflow-hidden -mx-3 sm:mx-0 rounded-none sm:rounded-2xl border-b sm:border shadow-xl transition-all duration-500 ease-in-out"
      style={{
        background: tabTheme.heroBg,
        borderColor: tabTheme.heroBorder,
      }}
      aria-label="Seu progresso em trilhas"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_65%)]" />

      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[42%] sm:w-[34%] overflow-hidden"
        aria-hidden="true"
      >
        {HERO_ILLUSTRATIONS.map((url, i) => (
          <img
            key={url}
            src={url}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-y-0 right-0 h-full w-auto object-contain object-right transition-opacity duration-[1400ms] ease-in-out"
            style={{ opacity: i === heroIdx ? 1 : 0 }}
          />
        ))}
        {/* Glow sutil atrás da ilustração */}
        <div
          className="absolute inset-0 opacity-60 mix-blend-overlay transition-all duration-500"
          style={{ background: tabTheme.glow }}
        />
        {/* Fade à esquerda para integrar com o fundo */}
        <div
          className="absolute inset-y-0 left-0 w-2/3 transition-all duration-500"
          style={{ background: `linear-gradient(to right, ${tabTheme.fadeBg}, transparent)` }}
        />
      </div>

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Anel de progresso SVG */}
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} fill="none" />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={tabTheme.accent}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={c}
                strokeDashoffset={dash}
                style={{ transition: 'stroke-dashoffset 600ms ease, stroke 500ms ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-base font-black leading-none text-white">{safePct}%</span>
              <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-white/80">
                Progresso
              </span>
            </div>
          </div>

          <div className="min-w-0 max-w-[58%] lg:max-w-[70%]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/90">Sua trilha de aprendizado</p>
            <h1 className="mt-0.5 font-display text-[22px] font-black leading-tight text-white sm:text-[26px]">
              {isAulas ? 'AULAS' : isFlashcards ? 'FLASHCARDS' : 'QUESTÕES'}
              <span className={cn("ml-2 font-display text-[15px] font-semibold italic sm:text-[18px]", tabTheme.badgeText)}>
                EM TRILHAS
              </span>
            </h1>
            <p
              className="mt-0.5 text-[12px] leading-snug text-white/85 sm:text-[13px]"
              style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
            >
              {isAulas ? 'Slides, flashcards e questões por matéria.' : isFlashcards ? 'Revise usando repetição espaçada ativa.' : 'Pratique com foco na banca (em breve).'}
            </p>
          </div>
        </div>

        {/* Régua com as 3 métricas */}
        <div className="relative mt-3 rounded-xl bg-background/85 backdrop-blur-md text-foreground border border-border/80 shadow-md">
          <div className="grid grid-cols-3 divide-x divide-border/60">
            <div className="flex flex-col items-center justify-center px-2 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{metricLabel1}</span>
              <span className="mt-0.5 font-display text-base font-black leading-none text-foreground">{metricVal1}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{metricLabel2}</span>
              <span className="mt-0.5 font-display text-base font-black leading-none text-foreground">{metricVal2Display}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{metricLabel3}</span>
              <span 
                className="mt-0.5 font-display text-base font-black leading-none"
                style={{ color: tabTheme.accent }}
              >
                {isQuestoes ? 'Em breve' : (
                  <>
                    {metricVal3}
                    <span className="text-muted-foreground/60 font-medium">/{metricVal3Total}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

AprenderHeroProgress.displayName = 'AprenderHeroProgress';
