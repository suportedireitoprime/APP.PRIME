import React, { useState } from 'react';
import { 
  ArrowLeft, Search, BarChart3, History, Bookmark, Flame, X 
} from 'lucide-react';
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
  onRecentes: () => void;
  onFavoritos: () => void;
  onEmAlta: () => void;
  onDesempenho: () => void;
  badgeRecentes?: number;
  badgeFavoritos?: number;
}

export const AulasInterativasHero: React.FC<AulasInterativasHeroProps> = React.memo(
  function AulasInterativasHero({
    onVoltar,
    buscaTermo,
    setBuscaTermo,
    totalAulas,
    totalMaterias,
    porcentagemGeral,
    onRecentes,
    onFavoritos,
    onEmAlta,
    onDesempenho,
    badgeRecentes = 0,
    badgeFavoritos = 0,
  }) {
    const [buscaAberta, setBuscaAberta] = useState(false);

    return (
      <div className="relative mb-5">
        {/* Shell unificado idêntico ao início do app e Áudio Aulas */}
        <div
          className="relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[300px] xs:min-h-[320px] sm:min-h-[340px]"
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

          {/* Imagem de Capa Oficial */}
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

          {/* Cabeçalho Superior Transparente (Botão Voltar e Busca) */}
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

              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setBuscaAberta(!buscaAberta);
                }}
                aria-label="Pesquisar matéria ou aula"
                className={`grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full border text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg ${
                  buscaAberta || buscaTermo
                    ? 'bg-teal-600/30 border-teal-400/60 text-[#2dd4bf]'
                    : 'bg-black/40 border-white/10 hover:bg-black/60'
                }`}
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </button>
            </div>
          </header>

          {/* Conteúdo: Tipografia de Marca Minimalista */}
          <div className="relative z-10 pt-5 sm:pt-6 flex-1 flex flex-col justify-start min-h-[125px] sm:min-h-[135px]">
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

          {/* Barra de Pesquisa Expansível */}
          {(buscaAberta || buscaTermo) && (
            <div className="relative z-10 px-4 pb-2.5 pt-1">
              <div className="relative w-full max-w-md mx-auto">
                <input
                  type="text"
                  value={buscaTermo}
                  onChange={(e) => setBuscaTermo(e.target.value)}
                  placeholder="Filtrar matérias por nome..."
                  autoFocus
                  className="w-full h-11 pl-10 pr-10 rounded-full text-xs sm:text-sm text-white placeholder:text-zinc-400 focus:outline-none shadow-lg bg-black/85 backdrop-blur-md border border-white/20 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40"
                />
                <Search className="w-4 h-4 text-[#2dd4bf] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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

          {/* ══════════════════════════════════════════════════════════════════════════
              PAINEL DE FUNÇÕES RÁPIDAS (RECENTES, FAVORITOS, EM ALTA, DESEMPENHO)
              ══════════════════════════════════════════════════════════════════════════ */}
          <div className="relative z-10 px-4 sm:px-6 pt-2.5 pb-5 sm:pb-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mx-auto max-w-md bg-black/60 backdrop-blur-md border border-white/15 rounded-[32px] sm:rounded-[36px] py-2.5 sm:py-3 px-3.5 sm:px-4 shadow-2xl">
              {/* Recentes */}
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  onRecentes();
                }}
                className="flex-1 min-w-0 group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center cursor-pointer min-h-[54px] sm:min-h-[58px]"
                aria-label="Aulas Recentes"
              >
                <div className="relative inline-flex items-center justify-center">
                  <History className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] text-[#2dd4bf] group-hover:scale-110 transition-transform" strokeWidth={2} />
                  {badgeRecentes > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 rounded-full text-[8.5px] font-mono font-bold bg-[#0d9488] text-white">
                      {badgeRecentes}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 group-hover:text-white truncate">
                  Recentes
                </span>
              </button>

              {/* Favoritos */}
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  onFavoritos();
                }}
                className="flex-1 min-w-0 group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center cursor-pointer min-h-[54px] sm:min-h-[58px]"
                aria-label="Aulas Favoritas"
              >
                <div className="relative inline-flex items-center justify-center">
                  <Bookmark className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] text-[#2dd4bf] group-hover:scale-110 transition-transform" strokeWidth={2} />
                  {badgeFavoritos > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 rounded-full text-[8.5px] font-mono font-bold bg-[#0d9488] text-white">
                      {badgeFavoritos}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 group-hover:text-white truncate">
                  Favoritos
                </span>
              </button>

              {/* Em Alta */}
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  onEmAlta();
                }}
                className="flex-1 min-w-0 group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center cursor-pointer min-h-[54px] sm:min-h-[58px]"
                aria-label="Aulas Em Alta"
              >
                <div className="relative inline-flex items-center justify-center">
                  <Flame className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] text-[#2dd4bf] group-hover:scale-110 transition-transform" strokeWidth={2} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 group-hover:text-white truncate">
                  Em Alta
                </span>
              </button>

              {/* Desempenho */}
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  onDesempenho();
                }}
                className="flex-1 min-w-0 group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center cursor-pointer min-h-[54px] sm:min-h-[58px]"
                aria-label="Desempenho e Estatísticas"
              >
                <div className="relative inline-flex items-center justify-center">
                  <BarChart3 className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] text-[#2dd4bf] group-hover:scale-110 transition-transform" strokeWidth={2} />
                  {porcentagemGeral > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 rounded-full text-[8.5px] font-mono font-bold bg-[#0d9488] text-white">
                      {porcentagemGeral}%
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 group-hover:text-white truncate">
                  Desempenho
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
