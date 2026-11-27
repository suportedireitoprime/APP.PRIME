import React from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Flame,
  GraduationCap,
  History,
  Search,
  X,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface AulasHeroProps {
  porcentagemGeral: number;
  totalEmAndamento: number;
  totalAulas: number;
  buscaAberta: boolean;
  buscaTermo: string;
  onToggleBusca: () => void;
  setBuscaTermo: (val: string) => void;
  onBack: () => void;
  onOpenRecentes: () => void;
  onOpenFavoritos: () => void;
  onOpenEmAlta: () => void;
  onOpenProgresso: () => void;
}

export const AulasHero: React.FC<AulasHeroProps> = ({
  porcentagemGeral,
  totalEmAndamento,
  totalAulas,
  buscaAberta,
  buscaTermo,
  onToggleBusca,
  setBuscaTermo,
  onBack,
  onOpenRecentes,
  onOpenFavoritos,
  onOpenEmAlta,
  onOpenProgresso,
}) => {
  const pct = Math.max(0, Math.min(100, Math.round(porcentagemGeral)));
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col rounded-b-3xl overflow-hidden shadow-2xl">
      {/* Cabeçalho Nativo */}
      <div className="bg-zinc-950 px-4 pb-3 pt-[calc(0.65rem+var(--sai-top,env(safe-area-inset-top,0px)))] flex items-center justify-between border-b border-white/5 gap-3">
        <button
          type="button"
          onClick={() => {
            try { haptic.selection(); } catch {}
            onBack();
          }}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:opacity-70 cursor-pointer"
          aria-label="Voltar para o início"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>

        <h1 className="font-display text-[18px] font-black uppercase tracking-widest text-white text-center flex-1 truncate">
          AULAS
        </h1>

        <button
          type="button"
          onClick={() => {
            try { haptic.light(); } catch {}
            onToggleBusca();
          }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors cursor-pointer ${
            buscaAberta || buscaTermo
              ? 'bg-white text-zinc-950 border-white'
              : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
          }`}
          aria-label="Buscar disciplina ou aula"
        >
          {buscaAberta ? <X className="h-5 w-5" strokeWidth={2.2} /> : <Search className="h-5 w-5" strokeWidth={2.2} />}
        </button>
      </div>

      {/* Busca expansível */}
      {(buscaAberta || buscaTermo) && (
        <div className="bg-zinc-950 px-4 pb-3 border-b border-white/10">
          <div className="relative max-w-5xl mx-auto">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={buscaTermo}
              onChange={(e) => setBuscaTermo(e.target.value)}
              placeholder="Buscar disciplina ou aula..."
              className="w-full h-11 pl-10 pr-10 rounded-xl text-sm text-white placeholder:text-white/40 bg-white/[0.06] border border-white/10 focus:border-white/30 focus:outline-none"
              autoFocus
            />
            {buscaTermo && (
              <button
                type="button"
                onClick={() => setBuscaTermo('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-white/50 hover:text-white cursor-pointer"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Painel Principal Vermelho (idêntico ao de Questões) */}
      <section className="relative isolate overflow-hidden" aria-label="Painel Principal de Aulas">
        <div className="absolute inset-0 bg-hero-panel -z-10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.28),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.35),transparent_65%)]" />

        {/* Marca d'água de Aulas */}
        <GraduationCap
          className="absolute right-2 -bottom-4 w-36 h-36 text-white/[0.14] pointer-events-none"
          strokeWidth={1.2}
        />

        <div className="relative z-10 px-5 pt-5 pb-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Rosca de Progresso */}
            <div className="relative flex shrink-0 items-center justify-center">
              <div className="w-[72px] h-[72px] rounded-2xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm relative">
                <svg width={56} height={56} className="-rotate-90">
                  <circle cx={28} cy={28} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={4.5} fill="none" />
                  <circle
                    cx={28}
                    cy={28}
                    r={r}
                    stroke="#fff"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (pct / 100) * circ}
                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-sm font-black leading-none text-white">{pct}%</span>
                  <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-rose-200">Feito</span>
                </div>
              </div>
            </div>

            {/* Textos */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-200 backdrop-blur-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {totalAulas > 0 ? `${totalAulas.toLocaleString('pt-BR')} AULAS` : 'TRILHAS DE ESTUDO'}
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide mt-1 drop-shadow-sm leading-tight">
                AULAS <span className="font-light not-italic text-rose-200">INTERATIVAS</span>
              </h2>
              <p className="text-xs text-white/90 line-clamp-1 mt-0.5">
                Aprenda por etapas com teoria, flashcards e questões.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Funções Rápidas integradas na barra inferior do painel */}
        <div className="relative z-10 grid grid-cols-4 divide-x divide-white/10 border-t border-white/10 bg-black/40 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenRecentes();
            }}
            className="min-h-[54px] py-2.5 px-1.5 flex flex-col items-center justify-center gap-1 text-white/85 hover:text-white hover:bg-white/5 active:bg-white/10 transition cursor-pointer"
          >
            <History className="w-4 h-4" strokeWidth={1.9} />
            <span className="text-[10.5px] font-semibold tracking-wide truncate max-w-full">
              Recentes{totalEmAndamento > 0 ? ` (${totalEmAndamento})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenFavoritos();
            }}
            className="min-h-[54px] py-2.5 px-1.5 flex flex-col items-center justify-center gap-1 text-white/85 hover:text-white hover:bg-white/5 active:bg-white/10 transition cursor-pointer"
          >
            <Bookmark className="w-4 h-4" strokeWidth={1.9} />
            <span className="text-[10.5px] font-semibold tracking-wide truncate max-w-full">
              Favoritos
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenEmAlta();
            }}
            className="min-h-[54px] py-2.5 px-1.5 flex flex-col items-center justify-center gap-1 text-white/85 hover:text-white hover:bg-white/5 active:bg-white/10 transition cursor-pointer"
          >
            <Flame className="w-4 h-4" strokeWidth={1.9} />
            <span className="text-[10.5px] font-semibold tracking-wide truncate max-w-full">
              Em Alta
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              onOpenProgresso();
            }}
            className="min-h-[54px] py-2.5 px-1.5 flex flex-col items-center justify-center gap-1 text-white/85 hover:text-white hover:bg-white/5 active:bg-white/10 transition cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" strokeWidth={1.9} />
            <span className="text-[10.5px] font-semibold tracking-wide truncate max-w-full">
              Progresso{pct > 0 ? ` ${pct}%` : ''}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};
