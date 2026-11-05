import { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import q1 from '@/assets/questoes-hero/q-1.webp';
import q2 from '@/assets/questoes-hero/q-2.webp';
import q3 from '@/assets/questoes-hero/q-3.webp';

const FIGURAS = [q1, q2, q3];

interface Props {
  pct: number;
  totalResolvidos: number;
  totalQuestoesBanco: number;
  onBack?: () => void;
  onOpenHistorico?: () => void;
  onOpenDesempenho?: () => void;
  onOpenProvas?: () => void;
}

export const SimuladosHero = ({
  pct,
  totalResolvidos,
  totalQuestoesBanco,
  onBack,
  onOpenHistorico,
  onOpenDesempenho,
  onOpenProvas,
}: Props) => {
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setHeroIdx((i) => (i + 1) % FIGURAS.length), 4500);
    return () => clearInterval(id);
  }, []);

  const size = 72;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c - (pct / 100) * c;

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

      {/* ── Painel Principal de Simulados ───────────────── */}
      <section
        className="relative isolate overflow-hidden"
        aria-label="Painel Principal de Simulados"
      >
        <div className="absolute inset-0 bg-hero-panel -z-10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.28),transparent_65%)]" />

        {/* Silhueta no fundo */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] overflow-hidden sm:w-[34%]" aria-hidden="true">
          {FIGURAS.map((url, i) => (
            <img
              key={url}
              src={url}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="absolute inset-y-0 right-0 h-full w-auto object-contain object-right transition-opacity duration-[1400ms] ease-in-out"
              style={{
                opacity: i === heroIdx ? 1 : 0,
                filter: 'brightness(0) invert(1)',
                mixBlendMode: 'soft-light',
              }}
            />
          ))}
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[hsl(350_74%_42%)] via-[hsl(350_74%_42%)]/60 to-transparent" />
        </div>

        {/* Conteúdo do Hero */}
        <div className="relative px-5 pt-5 pb-4">
          <div className="flex items-center gap-4">
            {/* Medidor circular */}
            <div className="relative flex shrink-0 items-center justify-center">
              <svg className="h-[72px] w-[72px] -rotate-90">
                <circle
                  cx="36"
                  cy="36"
                  r={r}
                  className="stroke-white/20"
                  strokeWidth={stroke}
                  fill="transparent"
                />
                <circle
                  cx="36"
                  cy="36"
                  r={r}
                  className="stroke-white transition-all duration-1000 ease-out"
                  strokeWidth={stroke}
                  fill="transparent"
                  strokeDasharray={c}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-[17px] font-black leading-none text-white">
                  {pct}%
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-white/80">
                  Acerto
                </span>
              </div>
            </div>

            {/* Textos */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-200 backdrop-blur-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HORA DE PRATICAR 🛡️
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide mt-1 drop-shadow-sm">
                SIMULADOS <span className="font-light not-italic text-rose-200">COMENTADOS</span>
              </h2>
              <p className="text-xs text-white/85 line-clamp-1 mt-0.5">
                Resolva no tempo real da prova e fixe com a IA.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3 Métricas na Barra Inferior ───────────────── */}
        <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/35 backdrop-blur-md">
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenHistorico?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/70">
              <span>RESOLVIDOS</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {totalResolvidos}
            </div>
          </button>

          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenDesempenho?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/70">
              <span>TAXA DE ACERTO</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {pct}%
            </div>
          </button>

          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenProvas?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/70">
              <span>BANCO TOTAL</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {totalQuestoesBanco.toLocaleString('pt-BR')}
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
export default SimuladosHero;
