import { ChevronRight, ArrowLeft, Timer } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  totalSimuladosDisponiveis: number;
  totalQuestoesBanco: number;
  totalResolvidos: number;
  onBack?: () => void;
  onOpenHistorico?: () => void;
  onOpenDesempenho?: () => void;
  onOpenProvas?: () => void;
}

export const SimuladosHero = ({
  totalSimuladosDisponiveis,
  totalQuestoesBanco,
  totalResolvidos,
  onBack,
  onOpenHistorico,
  onOpenDesempenho,
  onOpenProvas,
}: Props) => {
  return (
    <div className="flex flex-col rounded-b-3xl overflow-hidden shadow-2xl">
      {/* ── Cabeçalho Nativo ───────────────── */}
      <div className="bg-zinc-950 px-4 pb-4 pt-safe-header flex items-center justify-between border-b border-white/5">
        <button
          onClick={() => {
            try { haptic.selection(); } catch {}
            onBack?.();
          }}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:opacity-70 cursor-pointer"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
        <h1 className="font-display text-[18px] font-black uppercase tracking-widest text-white text-center flex-1 pr-11">
          SIMULADOS
        </h1>
      </div>

      {/* ── Painel Principal de Simulados (Roxo Oficial #7c3aed) ───────────────── */}
      <section
        className="relative isolate overflow-hidden"
        aria-label="Painel Principal de Simulados"
      >
        {/* Fundo Roxo Oficial do Card Treino Real */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] -z-10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.28),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.35),transparent_65%)]" />

        {/* Marca d'água de cronômetro no fundo */}
        <Timer
          className="absolute -right-4 -bottom-4 w-36 h-36 text-white/[0.12] pointer-events-none"
          strokeWidth={1.2}
        />

        {/* Personagem 3D Oficial dos Simulados (o mesmo do card Treino Real) */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[44%] sm:w-[35%] overflow-hidden flex items-end justify-end z-0"
          aria-hidden="true"
        >
          <img
            src="/assets/praticar-simulados.webp"
            alt="Simulados Treino Real"
            className="h-[105%] w-auto object-contain object-bottom drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] transform translate-y-1.5"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#7c3aed] to-transparent pointer-events-none" />
        </div>

        {/* Conteúdo do Hero */}
        <div className="relative z-10 px-5 pt-5 pb-4">
          <div className="flex items-center gap-4">
            {/* Selo Oficial do Simulado à esquerda */}
            <div className="relative flex shrink-0 items-center justify-center">
              <div className="w-[72px] h-[72px] rounded-2xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm">
                <Timer className="w-7 h-7 text-white mb-0.5 drop-shadow-sm" strokeWidth={2} />
                <span className="text-[9px] font-black uppercase tracking-wider text-purple-200">
                  OFICIAL
                </span>
              </div>
            </div>

            {/* Textos */}
            <div className="flex-1 min-w-0 pr-12 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-200 backdrop-blur-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HORA DE PRATICAR ⏱️
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide mt-1 drop-shadow-sm leading-tight">
                SIMULADOS <span className="font-light not-italic text-purple-200">TREINO REAL</span>
              </h2>
              <p className="text-xs text-white/90 line-clamp-1 mt-0.5">
                Resolva no tempo real da prova e fixe com a IA.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3 Métricas na Barra Inferior: SIMULADOS, QUESTÕES, RESOLVIDOS ───────────────── */}
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/40 backdrop-blur-md">
          {/* 1. Quantidade de Simulados Disponíveis */}
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenProvas?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>SIMULADOS</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {totalSimuladosDisponiveis}
            </div>
          </button>

          {/* 2. Total de Questões */}
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenProvas?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>QUESTÕES</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {totalQuestoesBanco.toLocaleString('pt-BR')}
            </div>
          </button>

          {/* 3. Resolvidos */}
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenHistorico?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>RESOLVIDOS</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {totalResolvidos}
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
export default SimuladosHero;
