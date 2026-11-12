import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Search, X, BarChart3, Flame, Play 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';

/** Nomes curtos para dentro da capa (sem "Direito", max 2 linhas) */
const NOMES_CAPA: Record<string, string> = {
  'DIREITO PENAL': 'PENAL',
  'DIREITO CIVIL': 'CIVIL',
  'DIREITO CONSTITUCIONAL': 'CONSTI-\nTUCIONAL',
  'DIREITO ADMINISTRATIVO': 'ADMINIS-\nTRATIVO',
  'DIREITO DO TRABALHO': 'TRABALHO',
  'DIREITO PROCESSUAL CIVIL': 'PROC.\nCIVIL',
  'DIREITO PROCESSUAL PENAL': 'PROC.\nPENAL',
  'DIREITO TRIBUTÁRIO': 'TRIBUTÁRIO',
  'DIREITO EMPRESARIAL': 'EMPRE-\nSARIAL',
  'DIREITO AMBIENTAL': 'AMBIENTAL',
  'DIREITO PREVIDENCIÁRIO': 'PREVIDEN-\nCIÁRIO',
  'DIREITO PROCESSUAL DO TRABALHO': 'PROC. DO\nTRABALHO',
  'DIREITO FINANCEIRO': 'FINANCEIRO',
  'DIREITO INTERNACIONAL PRIVADO': 'INT.\nPRIVADO',
  'DIREITO URBANÍSTICO': 'URBANÍS-\nTICO',
  'DIREITOS HUMANOS': 'DIREITOS\nHUMANOS',
  'LEI PENAL ESPECIAL': 'LEIS\nESPECIAIS',
  'TEORIA E FILOSOFIA DO DIREITO': 'FILOSOFIA\nDO DIREITO',
  'DIREITO DESPORTIVO': 'DESPORTIVO',
  'POLÍTICAS PÚBLICAS': 'POLÍTICAS\nPÚBLICAS',
  'PORTUGUÊS JURÍDICO': 'PORTUGUÊS\nJURÍDICO',
  'FORMAÇÃO COMPLEMENTAR': 'FORMAÇÃO',
};

interface AulasCoverflowHomeProps {
  disciplinasFiltradas: DisciplinaItem[];
  loopedDisciplinas: DisciplinaItem[];
  activeCarouselIndex: number;
  onSelectCurrent: () => void;
  onSelectDisciplina?: (disciplinaId: string) => void;
  onCardClick: (disc: DisciplinaItem, idx: number) => void;
  onIniciarAula?: (aula: AulaItem) => void;
  calcularProgressoCiclo?: (aula: AulaItem) => {
    etapaAtual: number;
    totalEtapas: number;
    aulaTerminada: boolean;
    fcOk: boolean;
    questoesOk: boolean;
    cicloCompleto: boolean;
    porcentagemTotal: number;
  };
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
  onSelectDisciplina,
  onCardClick,
  onIniciarAula,
  calcularProgressoCiclo,
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
  const activeDisc = disciplinasFiltradas[safeIdx];
  const activeTheme = activeDisc ? getDisciplinaVisualTheme(activeDisc.id) : null;
  const activeCorTema = activeTheme?.primary || activeDisc?.corDestaque || '#f59e0b';
  const activeCorHighlight = activeTheme?.highlight || '#fef08a';

  const ultimaAulaAndamento = useMemo(() => {
    if (!calcularProgressoCiclo) return null;
    const emAndamento = aulasCatalogo.filter(a => {
      const p = calcularProgressoCiclo(a);
      return p.porcentagemTotal > 0 && p.porcentagemTotal < 100;
    });
    return emAndamento[0] || null;
  }, [aulasCatalogo, calcularProgressoCiclo]);

  return (
    <>
      {/* ── Fundo Grécia Antiga com Filósofos (Mesmo Fundo Oficial do Flashcards Home) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#1c120c]">
        <img
          src={greciaFilosofosFundo}
          alt="Grécia Antiga e Filósofos"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter blur-[1.5px] brightness-[0.95] contrast-[1.06]"
        />
        {/* Vinheta atmosférica suave preservando os detalhes dos templos e filósofos */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/70 pointer-events-none" />
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
                setAbaAtiva(abaAtiva === 'estatisticas' || abaAtiva === 'progresso' ? 'trilhas' : 'estatisticas');
              }}
              className={cn(
                "relative w-11 h-11 xs:w-12 xs:h-12 sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-lg cursor-pointer shrink-0",
                abaAtiva === 'estatisticas' || abaAtiva === 'progresso'
                  ? "bg-black/90 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                  : "bg-black/60 text-white/90 border-white/20 hover:bg-black/80"
              )}
              title="Estatísticas e Desempenho das Aulas"
              aria-label="Ver Estatísticas das Aulas"
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
              {/* ⚖️ Balança da Justiça caindo/descendo com dignidade por trás das capas */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[48%] pointer-events-none z-0 select-none opacity-25 transform rotate-[-2deg] transition-transform duration-700">
                <svg width="320" height="320" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[220px] h-[220px] xs:w-[260px] xs:h-[260px] sm:w-[320px] sm:h-[320px] drop-shadow-[0_12px_40px_rgba(251,191,36,0.25)]">
                  {/* Pilar central */}
                  <rect x="248" y="70" width="16" height="350" rx="5" fill="#f59e0b"/>
                  {/* Base esculpida */}
                  <rect x="170" y="405" width="172" height="22" rx="11" fill="#d97706"/>
                  <rect x="200" y="392" width="112" height="18" rx="5" fill="#f59e0b"/>
                  {/* Topo cúpula */}
                  <circle cx="256" cy="72" r="20" fill="#fbbf24"/>
                  {/* Braço horizontal principal da balança */}
                  <rect x="70" y="64" width="372" height="14" rx="7" fill="#fbbf24"/>
                  {/* Correntes douradas esquerda */}
                  <line x1="105" y1="78" x2="105" y2="200" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="9 4.5"/>
                  {/* Correntes douradas direita */}
                  <line x1="407" y1="78" x2="407" y2="200" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="9 4.5"/>
                  {/* Prato esquerdo */}
                  <ellipse cx="105" cy="208" rx="65" ry="16" fill="#fbbf24"/>
                  <path d="M40 208 Q50 245 105 250 Q160 245 170 208" fill="none" stroke="#d97706" strokeWidth="3.5"/>
                  {/* Prato direito */}
                  <ellipse cx="407" cy="208" rx="65" ry="16" fill="#fbbf24"/>
                  <path d="M342 208 Q352 245 407 250 Q462 245 472 208" fill="none" stroke="#d97706" strokeWidth="3.5"/>
                </svg>
              </div>

              {/* Spotlight direcional sutil */}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] xs:w-[250px] sm:w-[320px] h-[300px] xs:h-[340px] sm:h-[400px] rounded-full pointer-events-none z-10 transition-opacity duration-500 opacity-70"
                style={{
                  background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(251, 191, 36, 0.10) 0%, rgba(217, 119, 6, 0.03) 50%, transparent 75%)',
                  filter: 'blur(20px)',
                }}
              />

              {/* Scroller Horizontal de Capas */}
              <div
                ref={carouselScrollerRef}
                onScroll={handleCarouselScroll}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative w-full flex items-center gap-3.5 xs:gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none touch-pan-x px-[calc(50vw-82px)] xs:px-[calc(50vw-92px)] sm:px-[calc(50vw-107px)] md:px-[calc(50vw-125px)]"
              >
                {loopedDisciplinas.map((disc, idx) => {
                  const isActive = idx === activeCarouselIndex;
                  const discTheme = getDisciplinaVisualTheme(disc.id);
                  const discAulas = aulasCatalogo.filter(a => a.disciplinaId === disc.id);
                  const capaUrl = discTheme.fundoAssetUrl;
                  const corTema = discTheme.primary || disc.corDestaque || '#f59e0b';
                  const corTemaHighlight = discTheme.highlight || '#fef08a';

                  return (
                    <div
                      key={`${disc.id}-${idx}`}
                      onClick={() => {
                        if (idx === activeCarouselIndex) {
                          if (onSelectDisciplina) {
                            onSelectDisciplina(disc.id);
                          } else {
                            onCardClick(disc, idx);
                          }
                        } else {
                          onCardClick(disc, idx);
                        }
                      }}
                      className="snap-center shrink-0 w-[165px] xs:w-[185px] sm:w-[215px] md:w-[250px] flex flex-col items-center cursor-pointer transition-all duration-300 ease-out will-change-transform"
                    >
                      {/* ── QUANTIDADE DE AULAS ACIMA DA CAPA ── */}
                      <div className="mb-1.5 xs:mb-2 flex items-center justify-center select-none">
                        <div 
                          className={cn(
                            "inline-flex items-center justify-center font-mono font-black tracking-wider uppercase rounded-full transition-all duration-300 shadow-md",
                            isActive
                              ? "px-2.5 py-0.5 xs:px-3 xs:py-0.5 text-[9px] xs:text-[10px] sm:text-xs bg-black/85 border shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                              : "px-2 py-0.5 text-[7.5px] xs:text-[8.5px] sm:text-[9px] text-zinc-400 bg-black/75 border border-white/10 opacity-70"
                          )}
                          style={isActive ? {
                            color: corTemaHighlight,
                            borderColor: `${corTema}60`,
                          } : undefined}
                        >
                          <span>{discAulas.length} AULAS</span>
                        </div>
                      </div>

                      {/* ── CARD (CAPA COM TÍTULO INTERIOR E CONTORNO NA COR DO TEMA) ── */}
                      <div
                        className={cn(
                          "relative aspect-[3/4] max-h-[35vh] xs:max-h-[38vh] sm:max-h-[42vh] md:max-h-[46vh] w-full rounded-2xl overflow-hidden bg-zinc-950 border-2 transform-gpu transition-all duration-300 ease-out will-change-transform",
                          isActive
                            ? "shadow-2xl scale-[1.04] opacity-100 ring-1 ring-white/10"
                            : "shadow-xl scale-[0.88] opacity-55 hover:opacity-75"
                        )}
                        style={{
                          borderColor: isActive ? corTema : `${corTema}40`,
                          boxShadow: isActive
                            ? `0 24px 48px -6px rgba(0, 0, 0, 0.95), 0 0 22px ${corTema}45, inset 0 1.5px 0.5px rgba(255, 255, 255, 0.4)`
                            : `0 12px 24px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.12)`,
                        }}
                      >
                        {/* Imagem da Capa de Alta Resolução do Drive */}
                        <img
                          src={capaUrl}
                          alt={disc.nome}
                          loading={idx < 6 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={isActive ? "high" : "auto"}
                          className={cn(
                            "w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-400 ease-out rounded-2xl",
                            isActive 
                              ? "scale-105 filter brightness-110 contrast-105 saturate-105" 
                              : "scale-100 filter brightness-95 contrast-100 saturate-100"
                          )}
                        />

                        {/* ── NOME DA DISCIPLINA DENTRO DA CAPA (OVERLAY INFERIOR COM TIPOGRAFIA DISPLAY) ── */}
                        <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none">
                          <div 
                            className="px-2 xs:px-2.5 sm:px-3 pb-2.5 xs:pb-3 sm:pb-3.5 pt-8 xs:pt-10 sm:pt-12"
                            style={{
                              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.70) 40%, rgba(0,0,0,0.25) 75%, transparent 100%)',
                            }}
                          >
                            <h2 
                              className={cn(
                                "font-serif font-black uppercase leading-[1.1] text-center whitespace-pre-line transition-all duration-300",
                                isActive 
                                  ? "text-[13px] xs:text-[14.5px] sm:text-[17px] md:text-[19px] tracking-[0.06em]" 
                                  : "text-[10px] xs:text-[11px] sm:text-[13px] tracking-[0.04em]"
                              )}
                              style={{ 
                                color: '#fff',
                                textShadow: `0 2px 12px rgba(0,0,0,0.95), 0 0 20px ${corTema}50`,
                              }}
                            >
                              {NOMES_CAPA[disc.nome] || disc.nome}
                            </h2>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 4 PONTOS INDICADORES DO CARROSSEL ── */}
          <div className="flex items-center justify-center gap-1.5 mt-1.5 mb-2 xs:mt-2 xs:mb-2.5 z-20 shrink-0">
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

          {/* ── BOTÃO CONTINUAR AULA DE ONDE PAROU (SE HOUVER AULA EM ANDAMENTO) ── */}
          {ultimaAulaAndamento && onIniciarAula && (
            <div className="w-full max-w-[280px] xs:max-w-[310px] sm:max-w-[340px] mx-auto px-4 mb-2 z-20 shrink-0">
              <button
                type="button"
                onClick={() => {
                  try { haptic.impact('medium'); } catch {}
                  onIniciarAula(ultimaAulaAndamento);
                }}
                className="w-full py-2 px-3 rounded-2xl bg-black/85 hover:bg-black/95 border border-amber-500/50 text-left flex items-center justify-between gap-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.85)] active:scale-95 transition-all cursor-pointer backdrop-blur-md group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase font-black tracking-wider text-amber-400 block truncate">
                      Continuar Aula
                    </span>
                    <h4 className="text-xs font-serif font-black text-white truncate group-hover:text-amber-200">
                      {ultimaAulaAndamento.titulo}
                    </h4>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 pl-2 border-l border-white/10">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    Etapa {calcularProgressoCiclo ? (calcularProgressoCiclo(ultimaAulaAndamento).etapaAtual || 1) : 1}
                  </span>
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
                </div>
              </button>
            </div>
          )}

          {/* ── BOTÃO ACESSAR FORA DA CAPA (ELEVADO NA ZONA DO POLEGAR COM TIPOGRAFIA MODERNA) ── */}
          <div className="w-full max-w-[240px] xs:max-w-[260px] sm:max-w-[290px] mx-auto px-4 mb-3 xs:mb-4 sm:mb-5 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] z-20 shrink-0">
            <button
              type="button"
              onClick={() => {
                try { haptic.impact('medium'); } catch {}
                if (activeDisc && onSelectDisciplina) {
                  onSelectDisciplina(activeDisc.id);
                } else {
                  onSelectCurrent();
                }
              }}
              className="w-full h-11 xs:h-11.5 sm:h-12 rounded-full flex items-center justify-center font-sans font-black text-xs xs:text-[13px] sm:text-sm tracking-[0.22em] uppercase text-zinc-950 shadow-[0_8px_24px_rgba(0,0,0,0.85),inset_0_1.5px_1px_rgba(255,255,255,0.7)] active:scale-95 hover:brightness-105 transition-all cursor-pointer border border-white/50"
              style={{
                background: `linear-gradient(135deg, ${activeCorHighlight} 0%, ${activeCorTema} 100%)`,
                boxShadow: `0 8px 24px -4px ${activeCorTema}80, 0 12px 30px rgba(0,0,0,0.9), inset 0 1.5px 1px rgba(255,255,255,0.65)`,
              }}
            >
              <span>Acessar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

