import React, { useState } from 'react';
import { ArrowLeft, Search, BarChart3, Flame, Play, X } from 'lucide-react';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { haptic } from '@/lib/nativeHaptics';
import aulasHeroCover from '@/assets/aulas-interativas-hero-cover.jpg';
import { AulasHeroWave } from './AulasHeroWave';

interface AulasInterativasHeroProps {
  onVoltar: () => void;
  buscaTermo: string;
  setBuscaTermo: (val: string) => void;
  totalAulas: number;
  totalMaterias: number;
  porcentagemGeral: number;
  onAbrirEstatisticas: () => void;
  ultimaAulaAndamento: AulaItem | null;
  onIniciarAula?: (aula: AulaItem) => void;
  calcularProgressoCiclo?: (aula: AulaItem) => {
    etapaAtual: number;
    porcentagemTotal: number;
  };
}

export const AulasInterativasHero: React.FC<AulasInterativasHeroProps> = React.memo(
  function AulasInterativasHero({
    onVoltar,
    buscaTermo,
    setBuscaTermo,
    totalAulas,
    totalMaterias,
    porcentagemGeral,
    onAbrirEstatisticas,
    ultimaAulaAndamento,
    onIniciarAula,
    calcularProgressoCiclo,
  }) {
    const [buscaAberta, setBuscaAberta] = useState(false);

    return (
      <div className="relative mb-6">
        {/* Shell unificado idêntico ao modelo de Áudio Aulas e início do app */}
        <div
          className="relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[310px] xs:min-h-[330px] sm:min-h-[355px]"
          style={{
            transform: 'translateZ(0)',
            backgroundColor: '#050505',
          }}
        >
          {/* Blindagem de overscroll superior */}
          <div
            className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
            style={{ backgroundColor: '#050505' }}
            aria-hidden="true"
          />

          {/* Imagem de Capa Oficial (Mulher trabalhadora na indústria com centelhas e tons petróleo/teal) */}
          <img
            src={aulasHeroCover}
            alt="Estudo com Aulas Interativas"
            aria-hidden="true"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-[center_32%] md:object-[center_25%] z-0 pointer-events-none transform-gpu will-change-transform brightness-[0.92] contrast-[1.05]"
          />

          {/* Onda Hiper-Realista 3D em Verde Petróleo / Esmeralda / Teal */}
          <AulasHeroWave />

          {/* Cabeçalho Superior Transparente (Botão de Voltar, Busca e Estatísticas) */}
          <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
            <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  onVoltar();
                }}
                aria-label="Voltar"
                className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95 cursor-pointer shadow-lg"
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4]" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setBuscaAberta(!buscaAberta);
                  }}
                  aria-label="Pesquisar matéria ou aula"
                  className={`grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full border text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg ${
                    buscaAberta || buscaTermo
                      ? 'bg-emerald-600/30 border-emerald-400/60 text-emerald-300'
                      : 'bg-black/40 border-white/10 hover:bg-black/60'
                  }`}
                >
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    onAbrirEstatisticas();
                  }}
                  aria-label="Ver Desempenho e Estatísticas"
                  className="relative grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95 cursor-pointer shadow-lg"
                >
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] text-amber-400" />
                  {porcentagemGeral > 0 && (
                    <span className="absolute -bottom-1 -right-1 text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded-full text-black bg-amber-400 border border-amber-300 shadow">
                      {porcentagemGeral}%
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Conteúdo: Tipografia de Marca Minimalista */}
          <div className="relative z-10 pt-5 sm:pt-6 flex-1 flex flex-col justify-start min-h-[135px] sm:min-h-[150px]">
            <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-4 sm:ml-6 max-w-[290px]">
              {/* Espaçador para o botão de voltar */}
              <div className="h-[46px] sm:h-[50px] mb-1 shrink-0 w-full" aria-hidden="true" />

              {/* Tipografia de Marca */}
              <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
                <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
                  Aulas Interativas
                </span>
                <span className="font-serif italic text-[24px] sm:text-[28px] font-semibold text-[#2dd4bf] block drop-shadow-[0_2px_14px_rgba(45,212,191,0.65)] -mt-0.5">
                  Estudo em Trilha
                </span>
              </h1>

              {/* Traço vertical petróleo/teal e slogan */}
              <div className="mt-2 flex items-start text-left gap-2">
                <div className="w-[3px] h-8 bg-gradient-to-b from-[#5eead4] via-[#0d9488] to-[#042f2e] rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(45,212,191,0.6)]" />
                <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  Metodologia ativa cronológica.
                  <br />
                  {totalAulas > 0 ? totalAulas.toLocaleString('pt-BR') : '3.003'} aulas • {totalMaterias} matérias.
                </p>
              </div>
            </div>
          </div>

          {/* Barra de Pesquisa Expansível ou Campo de Busca */}
          {(buscaAberta || buscaTermo) && (
            <div className="relative z-10 px-4 pb-3 pt-1">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={buscaTermo}
                  onChange={(e) => setBuscaTermo(e.target.value)}
                  placeholder="Filtrar matérias por nome..."
                  autoFocus
                  className="w-full h-11 pl-10 pr-10 rounded-full text-xs sm:text-sm text-white placeholder:text-zinc-400 focus:outline-none shadow-lg bg-black/85 backdrop-blur-md border border-white/20 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40"
                />
                <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {buscaTermo && (
                  <button
                    type="button"
                    onClick={() => setBuscaTermo('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Banner Opcional de Continuar Aula de onde parou */}
          {ultimaAulaAndamento && onIniciarAula && (
            <div className="relative z-10 px-4 pb-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  try { haptic.impact('medium'); } catch {}
                  onIniciarAula(ultimaAulaAndamento);
                }}
                className="w-full max-w-md py-2 px-3.5 rounded-2xl bg-black/80 hover:bg-black/95 border border-emerald-500/40 text-left flex items-center justify-between gap-2.5 shadow-xl active:scale-[0.98] transition-all cursor-pointer backdrop-blur-md group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                    <Flame className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase font-black tracking-wider text-emerald-400 block truncate leading-none mb-0.5">
                      Continuar de Onde Parou
                    </span>
                    <h4 className="text-xs font-serif font-black text-white truncate group-hover:text-emerald-200">
                      {ultimaAulaAndamento.titulo}
                    </h4>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 pl-2 border-l border-white/10">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    Etapa {calcularProgressoCiclo ? (calcularProgressoCiclo(ultimaAulaAndamento).etapaAtual || 1) : 1}
                  </span>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);
