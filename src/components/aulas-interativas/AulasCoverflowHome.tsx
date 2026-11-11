import React from 'react';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Search, X, BarChart3, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import tribunalVermelhoTrilha from '@/assets/tribunal_vermelho_trilha.webp';

interface AulasCoverflowHomeProps {
  disciplinasFiltradas: DisciplinaItem[];
  loopedDisciplinas: DisciplinaItem[];
  activeCarouselIndex: number;
  onSelectCurrent: () => void;
  onCardClick: (disc: DisciplinaItem, idx: number) => void;
  handleVoltar: () => void;
  buscaTermo: string;
  setBuscaTermo: (val: string) => void;
  abaAtiva: 'trilhas' | 'progresso' | 'favoritos' | 'estatisticas';
  setAbaAtiva: (aba: 'trilhas' | 'progresso' | 'favoritos' | 'estatisticas') => void;
  porcentagemGeral: number;
  totalAulas: number;
  aulasCatalogo: AulaItem[];
  carouselScrollerRef: React.RefObject<HTMLDivElement | null>;
  handleCarouselScroll: () => void;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: (e: React.PointerEvent) => void;
  handlePrev: () => void;
  handleNext: () => void;
  scrollCarouselToIndex: (idx: number) => void;
}

export const AulasCoverflowHome: React.FC<AulasCoverflowHomeProps> = ({
  disciplinasFiltradas,
  loopedDisciplinas,
  activeCarouselIndex,
  onSelectCurrent,
  onCardClick,
  handleVoltar,
  buscaTermo,
  setBuscaTermo,
  abaAtiva,
  setAbaAtiva,
  porcentagemGeral,
  totalAulas,
  aulasCatalogo,
  carouselScrollerRef,
  handleCarouselScroll,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handlePrev,
  handleNext,
  scrollCarouselToIndex,
}) => {
  const totalDisciplinas = disciplinasFiltradas.length;
  const safeIdx = totalDisciplinas > 0 
    ? ((activeCarouselIndex % totalDisciplinas) + totalDisciplinas) % totalDisciplinas
    : 0;

  return (
    <>
      {/* ── Fundo Clássico Oficial (Palácio de Justiça / Tribunal Neoclássico com Louros) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#0a0503]">
        <img
          src={tribunalVermelhoTrilha}
          alt="Tribunal de Justiça"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter brightness-105 contrast-105"
        />
        {/* Vinheta atmosférica suave: topo nítido revelando as colunas e céu, centro transparente e base escura suave */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/25 pointer-events-none" />
      </div>

      {/* ── CONTAINER PRINCIPAL EM TELA CHEIA (SEM SCROLL VERTICAL, 100% RESPONSIVO E ADAPTÁVEL PARA CELULARES) ── */}
      <div className="fixed inset-0 z-20 w-full h-full max-h-screen overflow-hidden overscroll-none select-none flex flex-col justify-between pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-[calc(0.65rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] px-0 touch-pan-x">
        {/* ── CABEÇALHO RESPONSIVO PADRÃO FLASHCARDS (CENTRALIZADO) ── */}
        <div className="w-full max-w-lg sm:max-w-xl lg:max-w-3xl mx-auto flex flex-col items-center z-20 shrink-0 px-3 xs:px-4 sm:px-6">
          {/* Top Bar com Botão Voltar Circular Padrão Premium + Botão de Progresso */}
          <div className="w-full flex items-center justify-between mb-1 xs:mb-1.5">
            <button
              type="button"
              onClick={handleVoltar}
              className="w-11 h-11 xs:w-12 xs:h-12 sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center bg-black/60 border border-white/20 text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-lg shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5.5 h-5.5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-white stroke-[2.4]" />
            </button>

            {/* Botão de Progresso Padrão Premium no Canto Superior Direito */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setAbaAtiva(abaAtiva === 'progresso' ? 'trilhas' : 'progresso');
              }}
              className={cn(
                "relative w-11 h-11 xs:w-12 xs:h-12 sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-lg cursor-pointer shrink-0",
                abaAtiva === 'progresso'
                  ? "bg-black/90 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                  : "bg-black/60 text-white/90 border-white/20 hover:bg-black/80"
              )}
              title="Progresso Geral das Aulas"
              aria-label="Ver Progresso das Aulas"
            >
              <BarChart3 className="w-5.5 h-5.5 xs:w-6 xs:h-6 sm:w-6.5 sm:h-6.5 stroke-[2.4] text-amber-400" />
              {porcentagemGeral > 0 && (
                <span 
                  className="absolute -bottom-1 -right-1 text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full text-[#3d1a03] bg-amber-400 border border-amber-300 shadow"
                >
                  {porcentagemGeral}%
                </span>
              )}
            </button>
          </div>

          {/* Título Imperial Centralizado com Badge Dinâmica */}
          <div className="text-center mb-0.5 xs:mb-1 px-2">
            <h1 className="inline-flex items-center justify-center gap-1.5 xs:gap-2 flex-wrap">
              <span 
                className="px-2.5 py-0.5 rounded-xl text-[10.5px] xs:text-xs sm:text-sm font-mono font-black text-amber-300 bg-black/80 border border-amber-500/50 shadow-inner tracking-wider"
              >
                {totalAulas > 0 ? totalAulas.toLocaleString('pt-BR') : '3.003'}
              </span>
              <span className="text-lg xs:text-xl sm:text-2xl font-serif font-black tracking-wide text-[#fff1f2] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                Aulas em Trilha
              </span>
            </h1>
            <p className="text-[10px] xs:text-[11px] sm:text-xs font-serif italic text-zinc-300/85 mt-0.5">
              Escolha a área do direito para começar sua jornada.
            </p>
          </div>

          {/* ── BARRA DE PESQUISA RÁPIDA DAS ÁREAS (RESPONSIVA, COMPACTA E CONFORTÁVEL) ── */}
          <div className="w-full max-w-[320px] xs:max-w-[380px] sm:max-w-lg md:max-w-xl mx-auto px-2 mt-1 mb-1 xs:mt-1.5 xs:mb-1.5 z-20">
            <div className="relative w-full">
              <div 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 text-amber-400/90"
              >
                <Search className="w-4 h-4 xs:w-4.5 xs:h-4.5 stroke-[2.2]" />
              </div>
              <input
                type="text"
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
                placeholder="Buscar área ou matéria (ex: Penal)..."
                className="w-full h-10 xs:h-11 sm:h-12 pl-10 xs:pl-11 pr-10 xs:pr-11 rounded-full text-xs xs:text-sm text-white placeholder:text-zinc-400/80 focus:outline-none transition-all shadow-inner bg-black/75 backdrop-blur-md border border-white/20 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30"
              />
              {buscaTermo && (
                <button
                  type="button"
                  onClick={() => setBuscaTermo('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer z-10 transition-colors"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── CORPO: CARROSSEL AUDIOBOOKS COVERFLOW COM ZOOM NA CAPA CENTRAL ── */}
        <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center select-none px-0 my-auto">
          {totalDisciplinas === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
              <p className="text-zinc-400 text-sm">Nenhuma disciplina encontrada para "{buscaTermo}".</p>
            </div>
          ) : (
            <div className="relative w-full mx-auto flex items-center justify-center px-0 my-auto py-0.5 select-none overflow-hidden">
              {/* Spotlight direcional sutil em tom âmbar clássico atrás da capa central (10% de opacidade para profundidade 3D) */}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] xs:w-[250px] sm:w-[320px] h-[300px] xs:h-[340px] sm:h-[400px] rounded-full pointer-events-none z-10 transition-opacity duration-500 opacity-70"
                style={{
                  background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(251, 191, 36, 0.10) 0%, rgba(217, 119, 6, 0.03) 50%, transparent 75%)',
                  filter: 'blur(20px)',
                }}
              />

              {/* Botão Seta Esquerda */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-1 xs:left-2 sm:left-6 top-1/2 -translate-y-1/2 w-8.5 h-8.5 xs:w-9.5 xs:h-9.5 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-black/80 hover:bg-black text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.85)] z-30 shrink-0 backdrop-blur-md border border-white/20"
                aria-label="Área anterior"
              >
                <ChevronLeft className="w-4.5 h-4.5 xs:w-5 xs:h-5 stroke-[2.4]" />
              </button>

              {/* Scroller Horizontal de Capas */}
              <div
                ref={carouselScrollerRef}
                onScroll={handleCarouselScroll}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full flex items-center gap-2.5 xs:gap-3 sm:gap-4.5 overflow-x-auto snap-x snap-mandatory py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none touch-pan-x px-[calc(50vw-67px)] xs:px-[calc(50vw-76px)] sm:px-[calc(50vw-94px)] md:px-[calc(50vw-112.5px)]"
              >
                {loopedDisciplinas.map((disc, idx) => {
                  const isActive = idx === activeCarouselIndex;
                  const discTheme = getDisciplinaVisualTheme(disc.id);
                  const discAulas = aulasCatalogo.filter(a => a.disciplinaId === disc.id);
                  const capaUrl = discTheme.fundoAssetUrl;

                  return (
                    <div
                      key={`${disc.id}-${idx}`}
                      onClick={() => onCardClick(disc, idx)}
                      className="snap-center shrink-0 w-[134px] xs:w-[152px] sm:w-[188px] md:w-[225px] flex flex-col items-center cursor-pointer transition-all duration-300 ease-out will-change-transform"
                    >
                      {/* Card em Proporção 3:4 com Sombra Neutra Realista (Sem Sombra Colorida) */}
                      <div
                        className={cn(
                          "relative aspect-[3/4] max-h-[36vh] xs:max-h-[40vh] w-full rounded-2xl overflow-hidden bg-zinc-950 border transform-gpu transition-all duration-300 ease-out flex flex-col justify-end p-2 xs:p-2.5 sm:p-3 text-center will-change-transform",
                          isActive
                            ? "border-2 shadow-2xl ring-1 ring-white/20 scale-[1.03] opacity-100"
                            : "border-white/15 shadow-xl hover:border-white/30 scale-[0.88] opacity-55"
                        )}
                        style={
                          isActive ? {
                            borderColor: 'rgba(255, 255, 255, 0.45)',
                            boxShadow: '0 24px 48px -6px rgba(0, 0, 0, 0.95), 0 12px 24px rgba(0, 0, 0, 0.85), inset 0 1.5px 0.5px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(251, 191, 36, 0.15)',
                          } : {
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
                          }
                        }
                      >
                        {/* Imagem da Capa */}
                        <img
                          src={capaUrl}
                          alt={disc.nome}
                          loading={idx < 6 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={isActive ? "high" : "auto"}
                          className={cn(
                            "absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-400 ease-out rounded-2xl",
                            isActive 
                              ? "scale-105 filter brightness-115 contrast-105 saturate-105" 
                              : "scale-100 filter brightness-100 contrast-100 saturate-100"
                          )}
                        />

                        {/* Gradiente na Base */}
                        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none rounded-b-2xl z-10" />

                        {/* Título e Badge Pill de Aulas */}
                        <div className="relative z-20 w-full flex flex-col items-center">
                          <h3 
                            className={cn(
                              "font-serif font-black text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,1)] text-center break-words text-balance px-0.5 transition-all",
                              isActive 
                                ? "text-[11.5px] xs:text-[13px] sm:text-base" 
                                : "text-[10px] xs:text-[11px] sm:text-xs text-zinc-200"
                            )}
                          >
                            {disc.nome}
                          </h3>

                          <div 
                            className={cn(
                              "mt-1 xs:mt-1.5 inline-flex items-center justify-center font-mono font-black tracking-wider uppercase shadow-lg border rounded-full transition-all",
                              isActive
                                ? "px-2.5 py-0.5 xs:px-3 xs:py-0.5 text-[9.5px] xs:text-[10.5px] sm:text-xs text-amber-300 border-amber-400/40 bg-black/85"
                                : "px-2 py-0.5 text-[8px] xs:text-[9px] sm:text-[10px] text-zinc-300 border-white/20 bg-black/80 opacity-90"
                            )}
                            style={{
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.7)'
                            }}
                          >
                            <span>{discAulas.length} AULAS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão Seta Direita */}
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-1 xs:right-2 sm:right-6 top-1/2 -translate-y-1/2 w-8.5 h-8.5 xs:w-9.5 xs:h-9.5 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-black/80 hover:bg-black text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.85)] z-30 shrink-0 backdrop-blur-md border border-white/20"
                aria-label="Próxima área"
              >
                <ChevronRight className="w-4.5 h-4.5 xs:w-5 xs:h-5 stroke-[2.4]" />
              </button>
            </div>
          )}

          {/* ── 4 PONTOS INDICADORES DO CARROSSEL ── */}
          <div className="flex items-center justify-center gap-1.5 my-1 xs:my-1.5 z-20 shrink-0">
            {[0, 1, 2, 3].map((dotIdx) => {
              const isDotActive = dotIdx === (safeIdx % 4);
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    const currentBlock = Math.floor(activeCarouselIndex / (totalDisciplinas || 1));
                    const targetIdx = currentBlock * (totalDisciplinas || 1) + dotIdx;
                    scrollCarouselToIndex(targetIdx);
                  }}
                  className={cn(
                    "transition-all duration-300 rounded-full cursor-pointer",
                    isDotActive 
                      ? "w-5 xs:w-6 h-1.5 xs:h-2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]" 
                      : "w-1.5 xs:w-2 h-1.5 xs:h-2 bg-white/20 hover:bg-white/40"
                  )}
                  aria-label={`Ir para área ${dotIdx + 1}`}
                />
              );
            })}
          </div>

          {/* ── BOTÃO PRINCIPAL DE AÇÃO: SELECIONAR ÁREA → (DOURADO / ÂMBAR CLÁSSICO) ── */}
          <div className="w-full max-w-[270px] xs:max-w-[300px] mx-auto px-2 mb-0.5 xs:mb-1 z-20 shrink-0">
            <button
              type="button"
              onClick={onSelectCurrent}
              className="w-full h-10.5 xs:h-11 sm:h-12 rounded-full flex items-center justify-center gap-2 font-serif font-black text-xs xs:text-sm sm:text-base text-[#3d1a03] shadow-[0_8px_25px_rgba(245,158,11,0.45),inset_0_1px_2px_rgba(255,255,255,0.6)] active:scale-95 hover:brightness-105 transition-all cursor-pointer border border-amber-300/40"
              style={{
                background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%)',
              }}
            >
              <span className="tracking-wide">Selecionar Área</span>
              <span className="font-sans text-sm xs:text-base">→</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
