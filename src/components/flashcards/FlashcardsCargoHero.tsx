import { ArrowLeft, ChevronRight, Layers, Flame } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  /** % de retenção ou progresso na meta */
  pct?: number;
  /** cards revisados no total */
  total?: number;
  /** cards hoje */
  hoje?: number;
  /** total na meta */
  meta?: number;
  /** cards para hoje / total */
  disponiveis?: number;
  /** ofensiva em dias */
  streak?: number;
  /** Função de voltar (cabeçalho) */
  onBack?: () => void;
  /** Callbacks das métricas */
  onOpenHoje?: () => void;
  onOpenRevisados?: () => void;
  onOpenTotal?: () => void;
}

/** Painel Oficial de Flashcards com personagem 3D e bordas arredondadas embaixo */
export const FlashcardsCargoHero = ({
  pct = 0,
  total = 0,
  hoje = 0,
  meta = 100,
  disponiveis = 0,
  streak = 0,
  onBack,
  onOpenHoje,
  onOpenRevisados,
  onOpenTotal,
}: Props) => {
  return (
    <div className="flex flex-col rounded-b-3xl overflow-hidden shadow-2xl">
      {/* ── Cabeçalho Nativo ───────────────── */}
      {onBack && (
        <div className="bg-zinc-950 px-4 pb-4 pt-safe-header flex items-center justify-between border-b border-white/5">
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              onBack();
            }}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:opacity-70 cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
          <h1 className="font-display text-[18px] font-black uppercase tracking-widest text-white text-center flex-1 pr-11">
            FLASHCARDS
          </h1>
        </div>
      )}

      {/* ── Painel Principal de Flashcards (Azul Oficial #2563eb) ───────────────── */}
      <section
        className="relative isolate overflow-hidden"
        aria-label="Painel Principal de Flashcards"
      >
        {/* Fundo Azul Oficial */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] -z-10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.28),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.35),transparent_65%)]" />

        {/* Marca d'água de layers/cards no fundo */}
        <Layers
          className="absolute -right-4 -bottom-4 w-36 h-36 text-white/[0.12] pointer-events-none"
          strokeWidth={1.2}
        />

        {/* Personagem 3D Oficial dos Flashcards */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[44%] sm:w-[35%] overflow-hidden flex items-end justify-end z-0"
          aria-hidden="true"
        >
          <img
            src="/assets/praticar-flashcards.webp"
            alt="Flashcards Inteligentes"
            className="h-[105%] w-auto object-contain object-bottom drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] transform translate-y-1.5"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#2563eb] to-transparent pointer-events-none" />
        </div>

        {/* Conteúdo do Hero */}
        <div className="relative z-10 px-5 pt-5 pb-4">
          <div className="flex items-center gap-4">
            {/* Selo / Rosca de Retenção à esquerda */}
            <div className="relative flex shrink-0 items-center justify-center">
              <div className="w-[72px] h-[72px] rounded-2xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm relative">
                <svg width={56} height={56} className="-rotate-90">
                  <circle cx={28} cy={28} r={22} stroke="rgba(255,255,255,0.2)" strokeWidth={4.5} fill="none" />
                  <circle
                    cx={28}
                    cy={28}
                    r={22}
                    stroke="#fff"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={(2 * Math.PI * 22) - (pct / 100) * (2 * Math.PI * 22)}
                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-sm font-black leading-none text-white">{pct}%</span>
                  <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-blue-200">Retenção</span>
                </div>
              </div>
            </div>

            {/* Textos */}
            <div className="flex-1 min-w-0 pr-12 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-200 backdrop-blur-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                HORA DE REVISAR 🧠
                {streak > 0 && (
                  <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.2 rounded bg-orange-500/30 text-orange-300 font-black text-[9px]">
                    <Flame className="w-2.5 h-2.5 text-orange-400 fill-current" />
                    {streak}d
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide mt-1 drop-shadow-sm leading-tight">
                FLASHCARDS <span className="font-light not-italic text-blue-200">INTELIGENTES</span>
              </h2>
              <p className="text-xs text-white/90 line-clamp-1 mt-0.5">
                Repetição espaçada com IA focada no seu edital.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3 Métricas na Barra Inferior: HOJE, REVISADOS, TOTAL ───────────────── */}
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/40 backdrop-blur-md">
          {/* 1. Hoje */}
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenHoje?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>HOJE</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {hoje.toLocaleString('pt-BR')}
            </div>
          </button>

          {/* 2. Revisados */}
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenRevisados?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>REVISADOS</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-blue-300 mt-0.5">
              {total.toLocaleString('pt-BR')}
            </div>
          </button>

          {/* 3. Total */}
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenTotal?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>TOTAL</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {disponiveis > 0 ? disponiveis.toLocaleString('pt-BR') : '78.000+'}
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default FlashcardsCargoHero;
