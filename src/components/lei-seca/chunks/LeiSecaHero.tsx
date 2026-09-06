import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, Star, BookOpen, ChevronRight, ArrowLeft } from "lucide-react";
import type { useLeiSecaResumoGlobal } from "@/hooks/useLeiSecaResumoGlobal";
import { haptic } from "@/lib/nativeHaptics";

interface LeiSecaHeroProps {
  pctGlobal: number;
  totalMaterias: number;
  totalTrilhas: number;
  resumo?: ReturnType<typeof useLeiSecaResumoGlobal>["data"];
  recentePrincipal?: { slug: string; nome: string };
  onBack?: () => void;
}

function MiniStat({
  label,
  valor,
  sub,
  icon,
}: {
  label: string;
  valor: number | string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/[0.06] border border-white/10 px-2.5 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-white/65">
        {icon} {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span className="font-black text-base tabular-nums leading-none">{valor}</span>
        {sub && <span className="text-[10px] text-white/55 font-bold">{sub}</span>}
      </div>
    </div>
  );
}

export function LeiSecaHero({
  pctGlobal,
  totalMaterias,
  totalTrilhas,
  resumo,
  recentePrincipal,
  onBack,
}: LeiSecaHeroProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    haptic.selection();
    if (onBack) {
      onBack();
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <section
      className="w-full text-white px-4 pt-[calc(1.25rem+var(--sai-top))] pb-6 shadow-xl"
      style={{ background: "radial-gradient(120% 90% at 0% 0%, #4c1d95 0%, #2e1065 45%, #0f0a1f 100%)" }}
    >
      <div className="max-w-5xl mx-auto">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Voltar para tela inicial"
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full touch-manipulation bg-white/15 ring-1 ring-white/25 backdrop-blur-sm flex items-center justify-center text-white mb-3 active:scale-95 transition-all duration-[80ms]"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>

        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-1">
          <Sparkles className="h-3 w-3" /> Lei Seca · seu painel
        </div>

        <h1 className="font-semibold text-[22px] sm:text-2xl tracking-tight leading-[1.05] drop-shadow">
          Domine o texto da lei
        </h1>
        <p className="text-[12.5px] text-white/70 mt-0.5">
          {resumo
            ? `${resumo.totalConcluidas}/${resumo.totalLicoes} lições · ${resumo.totalEstrelas} estrelas`
            : "Carregando seu progresso…"}
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-[88px] w-[88px] shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#leiSecaRingHero)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${(2 * Math.PI * 42 * pctGlobal) / 100} ${2 * Math.PI * 42}`}
                className="transition-[stroke-dasharray] duration-700"
              />
              <defs>
                <linearGradient id="leiSecaRingHero" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              {pctGlobal === 100 ? (
                <Trophy className="h-7 w-7 text-amber-300 drop-shadow" />
              ) : (
                <div className="leading-none">
                  <p className="font-black text-[22px] tabular-nums">
                    {pctGlobal}
                    <span className="text-[10px] align-top ml-0.5 opacity-80">%</span>
                  </p>
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/70 font-bold mt-0.5">Progresso</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-2">
            <MiniStat label="Matérias" valor={totalMaterias} />
            <MiniStat label="Leis" valor={totalTrilhas} />
            <MiniStat
              label="Estrelas"
              valor={resumo?.totalEstrelas ?? 0}
              icon={<Star className="h-3 w-3 fill-amber-300 text-amber-300" />}
            />
          </div>
        </div>

        {recentePrincipal && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                navigate(`/lei-seca/${recentePrincipal.slug}`);
              }}
              className="w-full flex items-center justify-between gap-3 p-3 min-h-[52px] rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 active:scale-[0.99] transition-all duration-[80ms] text-left touch-manipulation"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-violet-400/20 flex items-center justify-center text-amber-300 font-bold shrink-0">
                  <BookOpen className="h-5 w-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">
                    Continuar estudo
                  </span>
                  <p className="font-bold text-[14px] text-white truncate">{recentePrincipal.nome}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/80 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
