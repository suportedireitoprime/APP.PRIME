import React from 'react';
import { ChevronDown, Video, BookOpen, Clock, Award } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { ResumoVideoaulas } from '@/lib/videoaulasResumo';

interface VideoaulasHeroProps {
  data: ResumoVideoaulas;
  heroIdx?: number;
  emAndamentoCount?: number;
  areasDireitoLength: number;
  setShowDesempenho: (v: boolean) => void;
  horasAssistidas: number;
  c: number;
  dash: number;
}

export const VideoaulasHero = React.memo(function VideoaulasHero({
  data,
  areasDireitoLength,
  setShowDesempenho,
  horasAssistidas,
  c,
  dash,
}: VideoaulasHeroProps) {
  return (
    <section
      className="relative z-10 w-full px-4 sm:px-6 pt-2 pb-1"
      aria-label="Seu progresso em videoaulas"
    >
      {/* Container Neutro Minimalista (Grafite Escuro / Zinc Puro - Sem Cores Rosas/Vermelhas) */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900/90 border border-white/10 p-4 sm:p-5 backdrop-blur-xl shadow-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          {/* Lado Esquerdo: Progresso Circular & Textos */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
            {/* Anel de Progresso Circular Interativo */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setShowDesempenho(true);
              }}
              className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-full flex items-center justify-center group cursor-pointer focus-visible:outline-none touch-manipulation active:scale-95 transition-transform bg-black/40 border border-white/10"
              title="Ver painel detalhado de desempenho"
              aria-label="Ver desempenho"
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  className="text-white/10"
                  strokeWidth="7"
                  stroke="currentColor"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-white transition-all duration-700 ease-out"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={c}
                  strokeDashoffset={dash}
                />
              </svg>
              <div className="relative flex flex-col items-center justify-center text-center">
                <span className="font-sans text-lg sm:text-xl font-black text-white leading-none">
                  {horasAssistidas}h
                </span>
                <span className="text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5 font-sans">
                  Tempo
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
            </button>

            {/* Títulos e Contexto */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-sans">
                  Grade Completa
                </p>
              </div>

              <h1 className="font-sans text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight truncate">
                Videoaulas em Trilhas
              </h1>

              <p className="font-sans text-xs sm:text-[13px] text-zinc-400 leading-snug mt-0.5 line-clamp-1">
                Aulas organizadas por área jurídica com ferramentas de estudo.
              </p>
            </div>
          </div>

          {/* Lado Direito: Métricas Rápidas em Pílulas Minimalistas Monocromáticas */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-white/10 md:pl-6 shrink-0">
            {/* Áreas */}
            <div className="flex flex-col items-center justify-center py-2 px-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-sans flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-zinc-400" />
                Áreas
              </span>
              <span className="font-sans text-base sm:text-lg font-black text-white mt-0.5">
                {areasDireitoLength}
              </span>
            </div>

            {/* Aulas */}
            <div className="flex flex-col items-center justify-center py-2 px-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-sans flex items-center gap-1">
                <Video className="w-3 h-3 text-zinc-400" />
                Aulas
              </span>
              <span className="font-sans text-base sm:text-lg font-black text-white mt-0.5">
                {data.totalAulas}
              </span>
            </div>

            {/* Assistidas */}
            <div className="flex flex-col items-center justify-center py-2 px-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-sans flex items-center gap-1">
                <Award className="w-3 h-3 text-zinc-300" />
                Feitas
              </span>
              <span className="font-sans text-base sm:text-lg font-black text-white mt-0.5">
                {data.totalConcluidas}
                <span className="text-zinc-500 text-xs font-semibold">/{data.totalAulas}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
