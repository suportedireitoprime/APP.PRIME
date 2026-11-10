import { ArrowLeft, BookOpen, ChevronRight, Star, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { useLeiSecaResumoGlobal } from '@/hooks/useLeiSecaResumoGlobal';
import { haptic } from '@/lib/nativeHaptics';

interface LeiSecaHeroProps {
  pctGlobal: number;
  totalMaterias: number;
  totalTrilhas: number;
  resumo?: ReturnType<typeof useLeiSecaResumoGlobal>['data'];
  onBack?: () => void;
  onOpenRanking?: () => void;
}

/** Painel Oficial de Lições (Lei Seca) com personagem 3D e bordas arredondadas embaixo */
export function LeiSecaHero({
  pctGlobal,
  totalMaterias,
  totalTrilhas,
  resumo,
  onBack,
  onOpenRanking,
}: LeiSecaHeroProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    try { haptic.selection(); } catch {}
    if (onBack) {
      onBack();
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="flex flex-col rounded-b-3xl overflow-hidden shadow-2xl">
      {/* ── Cabeçalho Nativo ───────────────── */}
      <div className="bg-zinc-950 px-4 pb-4 pt-safe-header flex items-center justify-between border-b border-white/5 relative">
        <button
          type="button"
          onClick={handleBack}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:opacity-70 cursor-pointer"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
        <h1 className="font-display text-[18px] font-black uppercase tracking-widest text-white text-center flex-1 pr-11">
          LIÇÕES
        </h1>
        {onOpenRanking && (
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenRanking();
            }}
            className="absolute right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-[11px] uppercase tracking-wider transition cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 fill-amber-400/30 text-amber-300" />
            Ranking
          </button>
        )}
      </div>

      {/* ── Painel Principal de Lições (Laranja Vibrante Oficial #ea580c) ───────────────── */}
      <section
        className="relative isolate overflow-hidden"
        aria-label="Painel Principal de Lições"
      >
        {/* Fundo Laranja Vibrante Oficial */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#7c2d12] -z-10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.28),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.35),transparent_65%)]" />

        {/* Marca d'água de livro no fundo */}
        <BookOpen
          className="absolute -right-4 -bottom-4 w-36 h-36 text-white/[0.12] pointer-events-none"
          strokeWidth={1.2}
        />

        {/* Personagem 3D Oficial de Lições */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[44%] sm:w-[35%] overflow-hidden flex items-end justify-end z-0"
          aria-hidden="true"
        >
          <img
            src="/assets/praticar-licoes.webp"
            alt="Lições de Lei Seca"
            className="h-[105%] w-auto object-contain object-bottom drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] transform translate-y-1.5"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#ea580c] to-transparent pointer-events-none" />
        </div>

        {/* Conteúdo do Hero */}
        <div className="relative z-10 px-5 pt-5 pb-4">
          <div className="flex items-center gap-4">
            {/* Selo / Rosca de Progresso à esquerda */}
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
                    strokeDashoffset={(2 * Math.PI * 22) - (pctGlobal / 100) * (2 * Math.PI * 22)}
                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-sm font-black leading-none text-white">{pctGlobal}%</span>
                  <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-orange-200">Progresso</span>
                </div>
              </div>
            </div>

            {/* Textos */}
            <div className="flex-1 min-w-0 pr-12 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-200 backdrop-blur-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HORA DE APRENDER 📖
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide mt-1 drop-shadow-sm leading-tight">
                LIÇÕES <span className="font-light not-italic text-orange-200">LEI SECA</span>
              </h2>
              <p className="text-xs text-white/90 line-clamp-1 mt-0.5">
                Artigo por artigo com desafios rápidos e IA.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3 Métricas na Barra Inferior: LEIS, PROGRESSO, ESTRELAS ───────────────── */}
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/40 backdrop-blur-md">
          {/* 1. Leis */}
          <div className="py-3 px-2 text-center group">
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>LEIS</span>
            </div>
            <div className="font-display text-base sm:text-lg font-black text-white mt-0.5">
              {totalTrilhas}
            </div>
          </div>

          {/* 2. Progresso */}
          <div className="py-3 px-2 text-center group">
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>PROGRESSO</span>
            </div>
            <div className="font-display text-base sm:text-lg font-black text-emerald-300 mt-0.5">
              {pctGlobal}%
            </div>
          </div>

          {/* 3. Estrelas */}
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenRanking?.();
            }}
            className="py-3 px-2 text-center group cursor-pointer hover:bg-white/5 active:bg-white/10 transition"
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/75">
              <span>ESTRELAS</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="font-display text-base sm:text-lg font-black text-amber-300 mt-0.5 flex items-center justify-center gap-1">
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
              <span>{resumo?.totalEstrelas ?? 0}</span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}

export default LeiSecaHero;
