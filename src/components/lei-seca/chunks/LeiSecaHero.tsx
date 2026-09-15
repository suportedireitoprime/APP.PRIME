import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, Star, BookOpen, ChevronRight, ArrowLeft } from "lucide-react";
import type { useLeiSecaResumoGlobal } from "@/hooks/useLeiSecaResumoGlobal";
import { haptic } from "@/lib/nativeHaptics";
import heroJusticaImg from "@/assets/covers/hero-leiseca-justica.webp";

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
    <div className="rounded-xl bg-black/50 border border-white/10 px-2.5 py-2 backdrop-blur-md shadow-lg shadow-black/40">
      <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-purple-200/70">
        {icon} {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span className="font-black text-base tabular-nums leading-none text-white">{valor}</span>
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
  const ringGradId = React.useId();

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
      className="relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] flex flex-col z-20 pb-6 text-white"
      style={{
        transform: "translateZ(0)",
        backgroundColor: "#070514",
      }}
    >
      {/* Blindagem de overscroll superior contra vazamento do fundo */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: "#070514" }}
        aria-hidden="true"
      />

      {/* Imagem de Capa do Painel: Escultura da Justiça no lado direito */}
      <img
        src={heroJusticaImg}
        alt="Deusa da Justiça"
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[72%_center] md:object-[82%_center] z-0 pointer-events-none"
      />

      {/* Overlay com corte diagonal idêntico ao painel do início (HomeHeaderHero), em tonalidade roxa profunda */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          filter:
            "drop-shadow(25px 0 25px rgba(0,0,0,0.85)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))",
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: "polygon(0 0, 54% 0, 39% 100%, 0% 100%)" }}
        >
          {/* Degradês roxos profundos (sem vermelho) */}
          <div className="absolute inset-0 bg-[#0c071e]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#3b0764]/95 via-[#240846]/90 to-[#0c071e]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(192,132,252,0.25),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.6),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

          {/* Grid pontilhado sutil */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
      </div>

      {/* Degradê na base para transição perfeita com o restante da página */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#070514] via-[#070514]/75 to-transparent z-[2] pointer-events-none" />

      {/* Conteúdo principal */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 w-full">
        {/* Barra superior com botão de voltar e badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Voltar para tela inicial"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/45 hover:bg-black/65 border border-white/15 text-white backdrop-blur-md flex items-center justify-center active:scale-95 transition-all shadow-lg"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-purple-400/20 backdrop-blur-md text-xs font-semibold tracking-wide text-purple-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Trilhas da Lei Seca
            </div>

            {recentePrincipal && (
              <button
                onClick={() => {
                  haptic.selection();
                  navigate(`/lei-seca/${recentePrincipal.slug}`);
                }}
                className="text-xs font-semibold text-purple-200 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg bg-black/30 hover:bg-black/50 border border-white/10"
              >
                Continuar
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-purple-300/80 mb-1">
          <Sparkles className="h-3 w-3" /> Lei Seca · seu painel
        </div>

        {/* Título & Subtítulo */}
        <div className="mb-5 max-w-md sm:max-w-lg">
          <h1 className="font-body text-xl sm:text-2xl md:text-[26px] font-black uppercase tracking-wider text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Estudo Esquematizado & Guiado
          </h1>
          <p className="font-body text-xs sm:text-sm text-purple-100/85 mt-1.5 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            Percorra os artigos divididos em partes pedagógicas. Marque como lido, resolva questões e acompanhe seu progresso real.
          </p>
        </div>

        {/* Linha de métricas: Rosca de % + Mini-stats (sem nenhum vermelho) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-white/10 max-w-2xl">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            {/* Gráfico circular de progresso */}
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="presentation" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="9"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={`url(#${ringGradId})`}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${(2 * Math.PI * 42 * pctGlobal) / 100} ${2 * Math.PI * 42}`}
                  className="transition-[stroke-dasharray] duration-700"
                />
                <defs>
                  <linearGradient id={ringGradId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#9333ea" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                {pctGlobal === 100 ? (
                  <Trophy className="h-7 w-7 text-amber-300 drop-shadow" />
                ) : (
                  <div className="leading-none">
                    <p className="font-black text-[22px] tabular-nums text-white">
                      {pctGlobal}
                      <span className="text-[10px] align-top ml-0.5 opacity-80">%</span>
                    </p>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-purple-200/80 font-bold mt-0.5">Progresso</p>
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
            <div className="w-full sm:w-auto mt-2 sm:mt-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  navigate(`/lei-seca/${recentePrincipal.slug}`);
                }}
                className="w-full flex items-center justify-between gap-3 p-3 min-h-[52px] rounded-2xl bg-black/50 hover:bg-black/70 border border-white/15 backdrop-blur-md active:scale-[0.99] transition-all text-left touch-manipulation shadow-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-amber-300 font-bold shrink-0">
                    <BookOpen className="h-5 w-5 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200/70">
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
      </div>
    </section>
  );
}

