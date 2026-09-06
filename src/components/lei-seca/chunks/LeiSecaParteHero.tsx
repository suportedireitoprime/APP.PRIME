import React from "react";
import { ArrowLeft, Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";

interface ParteItem {
  slug: string;
  nome: string;
}

interface LeiSecaParteHeroProps {
  slug: string;
  parteAtual: string;
  sigla?: string;
  titulo: string;
  partes?: ParteItem[];
  tema: { from: string; solid: string; to: string };
  MateriaIcone?: React.ElementType;
  stats: {
    total: number;
    concluidas: number;
    estrelas: number;
    pct: number;
    maxEstrelas: number;
  };
  onBack: () => void;
  onSelectParte?: (parteSlug: string) => void;
  onPrefetchParte?: (parteSlug: string) => void;
}

function PainelBar({ label, valor, pct }: { label: string; valor: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10.5px] mb-0.5">
        <span className="text-white/85 font-medium">{label}</span>
        <span className="tabular-nums font-bold text-white">{valor}</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/30 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-white to-white/80 transition-[width] duration-700"
          style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

export function LeiSecaParteHero({
  slug: _slug,
  parteAtual,
  sigla,
  titulo,
  partes = [],
  tema,
  MateriaIcone,
  stats,
  onBack,
  onSelectParte,
  onPrefetchParte,
}: LeiSecaParteHeroProps) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (stats.pct / 100) * circ;

  return (
    <section
      className="relative overflow-hidden rounded-b-3xl text-white shadow-2xl shadow-black/40 ring-1 ring-black/20"
      style={{
        background: `linear-gradient(160deg, ${tema.from} 0%, ${tema.solid} 55%, ${tema.to} 100%)`,
      }}
    >
      <div className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-black/30 blur-3xl pointer-events-none" />
      {MateriaIcone && (
        <div aria-hidden className="pointer-events-none absolute -right-6 -bottom-8 z-0 opacity-[0.13]">
          <MateriaIcone className="h-52 w-52 text-white" strokeWidth={0.9} />
        </div>
      )}
      {MateriaIcone && (
        <div aria-hidden className="pointer-events-none absolute right-24 top-2 z-0 opacity-[0.07] rotate-12">
          <MateriaIcone className="h-24 w-24 text-white" strokeWidth={0.8} />
        </div>
      )}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[55%] overflow-hidden z-0">
        <div className="absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[18deg] animate-pulse" />
      </div>

      <div className="relative z-10 px-5 pt-[calc(1.25rem+var(--sai-top))] pb-5">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onBack();
          }}
          aria-label="Voltar para leis"
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full touch-manipulation bg-white/15 ring-1 ring-white/25 backdrop-blur-sm flex items-center justify-center text-white mb-3 active:scale-95 transition-all duration-[80ms]"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>

        <p className="text-white/70 text-[10px] uppercase tracking-[0.22em] font-semibold mb-1">
          {sigla ?? "Lei Seca"} · Seu painel
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-body font-bold text-[22px] sm:text-2xl tracking-[0.01em] leading-[1.2] drop-shadow">
            {titulo}
          </h1>
          {stats.pct === 100 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 text-emerald-100 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 border border-emerald-300/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Check className="h-3 w-3" strokeWidth={4} /> Concluído
            </span>
          )}
        </div>

        <p className="mt-1 text-[12px] text-white/80 leading-snug">
          {stats.total} lição{stats.total === 1 ? "" : "ões"} · {stats.estrelas}/{stats.maxEstrelas} estrelas
        </p>

        {partes.length > 1 && (
          <div className="mt-3 inline-flex p-1 rounded-full bg-black/30 ring-1 ring-white/10 backdrop-blur-sm max-w-full overflow-x-auto no-scrollbar">
            {partes.map((p) => {
              const ativa = p.slug === parteAtual;
              return (
                <button
                  key={p.slug}
                  type="button"
                  onPointerDown={() => onPrefetchParte?.(p.slug)}
                  onMouseEnter={() => onPrefetchParte?.(p.slug)}
                  onTouchStart={() => onPrefetchParte?.(p.slug)}
                  onClick={() => {
                    haptic.selection();
                    onSelectParte?.(p.slug);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 min-h-[36px] rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-[80ms] active:scale-[0.97] touch-manipulation",
                    ativa ? "bg-white text-black shadow" : "text-white/75 hover:text-white"
                  )}
                >
                  {p.nome}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center gap-4">
          <div className="relative shrink-0">
            <svg
              width="84"
              height="84"
              viewBox="0 0 84 84"
              className="-rotate-90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
            >
              <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(0,0,0,0.30)" strokeWidth="7" />
              <circle
                cx="42"
                cy="42"
                r={r}
                fill="none"
                stroke="url(#gradPainelLS)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)" }}
              />
              <defs>
                <linearGradient id="gradPainelLS" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              {stats.pct === 100 ? (
                <Trophy className="h-6 w-6 text-amber-300 drop-shadow" />
              ) : (
                <div className="leading-none">
                  <p className="font-black text-[18px] tabular-nums">
                    {stats.pct}
                    <span className="text-[9px] align-top ml-0.5 opacity-80">%</span>
                  </p>
                  <p className="text-[7px] uppercase tracking-[0.18em] text-white/70 font-bold mt-0.5">
                    Progresso
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <PainelBar
              label="Lições concluídas"
              valor={`${stats.concluidas}/${stats.total}`}
              pct={stats.pct}
            />
            <PainelBar
              label="Estrelas conquistadas"
              valor={`${stats.estrelas}/${stats.maxEstrelas}`}
              pct={stats.maxEstrelas ? Math.round((stats.estrelas / stats.maxEstrelas) * 100) : 0}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
