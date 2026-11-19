import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Search, X, BarChart3, History, Bookmark, Flame, Play, ChevronRight 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { AulaItem, AULAS_CATALOGO_COMPLETO } from '@/data/aulasInterativasCatalogoCompleto';
import { 
  TRILHAS_CRONOLOGICAS, 
  TRILHAS_MODULOS_OFICIAIS,
  TrilhaModuloAula,
  getDisciplinasDaFase 
} from '@/data/aulasTrilhasCronologicas';
import { AulasContinuarAulaBanner } from './AulasContinuarAulaBanner';
import { AulasTrilhasCarousel } from './AulasTrilhasCarousel';
import { AulasRecentesModal } from './AulasRecentesModal';
import { AulasEmAltaModal } from './AulasEmAltaModal';
import { AulasTrilhasListaModal } from './AulasTrilhasListaModal';
import AulasHeroWave from './AulasHeroWave';

/** Nomes curtos para dentro da capa — sem quebras manuais nem hífens */
const NOMES_CAPA: Record<string, string> = {
  'DIREITO PENAL': 'PENAL',
  'DIREITO CIVIL': 'CIVIL',
  'DIREITO CONSTITUCIONAL': 'CONSTITUCIONAL',
  'DIREITO ADMINISTRATIVO': 'ADMINISTRATIVO',
  'DIREITO DO TRABALHO': 'TRABALHO',
  'DIREITO PROCESSUAL CIVIL': 'PROC. CIVIL',
  'DIREITO PROCESSUAL PENAL': 'PROC. PENAL',
  'DIREITO TRIBUTÁRIO': 'TRIBUTÁRIO',
  'DIREITO EMPRESARIAL': 'EMPRESARIAL',
  'DIREITO AMBIENTAL': 'AMBIENTAL',
  'DIREITO PREVIDENCIÁRIO': 'PREVIDENCIÁRIO',
  'DIREITO PROCESSUAL DO TRABALHO': 'PROC. TRABALHO',
  'DIREITO FINANCEIRO': 'FINANCEIRO',
  'DIREITO INTERNACIONAL PRIVADO': 'INT. PRIVADO',
  'DIREITO URBANÍSTICO': 'URBANÍSTICO',
  'DIREITOS HUMANOS': 'DIR. HUMANOS',
  'LEI PENAL ESPECIAL': 'LEIS ESPECIAIS',
  'TEORIA E FILOSOFIA DO DIREITO': 'FILOSOFIA',
  'DIREITO DESPORTIVO': 'DESPORTIVO',
  'POLÍTICAS PÚBLICAS': 'POL. PÚBLICAS',
  'PORTUGUÊS JURÍDICO': 'PORTUGUÊS JUR.',
  'FORMAÇÃO COMPLEMENTAR': 'FORMAÇÃO',
};

interface AulasCoverflowHomeProps {
  disciplinasFiltradas: DisciplinaItem[];
  loopedDisciplinas?: DisciplinaItem[];
  activeCarouselIndex?: number;
  onSelectCurrent?: () => void;
  onSelectDisciplina?: (disciplinaId: string) => void;
  onCardClick?: (disc: DisciplinaItem, idx: number) => void;
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
  carouselScrollerRef?: React.RefObject<HTMLDivElement | null>;
  handleCarouselScroll?: () => void;
  handlePointerDown?: (e: React.PointerEvent) => void;
  handlePointerMove?: (e: React.PointerEvent) => void;
  handlePointerUp?: (e: React.PointerEvent) => void;
  handlePrev?: () => void;
  handleNext?: () => void;
  scrollCarouselToIndex?: (idx: number) => void;
}

export const AulasCoverflowHome: React.FC<AulasCoverflowHomeProps> = ({
  disciplinasFiltradas,
  loopedDisciplinas,
  activeCarouselIndex = 0,
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
  scrollCarouselToIndex,
}) => {
  const [faseSelecionadaId, setFaseSelecionadaId] = useState<string | null>(null);
  const [recentesModalOpen, setRecentesModalOpen] = useState(false);
  const [emAltaModalOpen, setEmAltaModalOpen] = useState(false);
  const [trilhasListaModalOpen, setTrilhasListaModalOpen] = useState(false);
  const [moduloInicialAbertoId, setModuloInicialAbertoId] = useState<string | null>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);

  // Procura aula em andamento para o banner "Continuar de onde parou"
  const aulaParaContinuar = useMemo(() => {
    if (aulasCatalogo.length === 0) return null;
    if (calcularProgressoCiclo) {
      const emAndamento = aulasCatalogo.filter((a) => {
        const p = calcularProgressoCiclo(a);
        return p.porcentagemTotal > 0 && p.porcentagemTotal < 100;
      });
      if (emAndamento.length > 0) return emAndamento[0];
    }
    return aulasCatalogo[0] || null;
  }, [aulasCatalogo, calcularProgressoCiclo]);

  // Contagem de aulas em andamento para o badge de Recentes
  const totalEmAndamento = useMemo(() => {
    if (!calcularProgressoCiclo) return 0;
    return aulasCatalogo.filter((a) => {
      const p = calcularProgressoCiclo(a);
      return p.porcentagemTotal > 0;
    }).length;
  }, [aulasCatalogo, calcularProgressoCiclo]);

  // Matérias da fase selecionada ou todas as filtradas
  const disciplinasExibidas = useMemo(() => {
    if (faseSelecionadaId) {
      return getDisciplinasDaFase(faseSelecionadaId, disciplinasFiltradas);
    }
    return disciplinasFiltradas;
  }, [disciplinasFiltradas, faseSelecionadaId]);

  const faseAtiva = useMemo(() => {
    if (!faseSelecionadaId) return null;
    return TRILHAS_CRONOLOGICAS.find((t) => t.id === faseSelecionadaId) || null;
  }, [faseSelecionadaId]);

  // Lista de itens do carrossel (com looping para scroll contínuo e suave)
  const itensParaCarrossel = useMemo(() => {
    if (faseSelecionadaId) {
      if (disciplinasExibidas.length <= 1) return disciplinasExibidas;
      return [
        ...disciplinasExibidas,
        ...disciplinasExibidas,
        ...disciplinasExibidas,
      ];
    }
    if (loopedDisciplinas && loopedDisciplinas.length > 0) {
      return loopedDisciplinas;
    }
    if (disciplinasFiltradas.length <= 1) return disciplinasFiltradas;
    return [
      ...disciplinasFiltradas,
      ...disciplinasFiltradas,
      ...disciplinasFiltradas,
    ];
  }, [faseSelecionadaId, disciplinasExibidas, loopedDisciplinas, disciplinasFiltradas]);

  const totalDisciplinas = disciplinasExibidas.length;
  const safeIdx = totalDisciplinas > 0 
    ? ((activeCarouselIndex % totalDisciplinas) + totalDisciplinas) % totalDisciplinas
    : 0;
  const activeDisc = disciplinasExibidas[safeIdx] || disciplinasExibidas[0];
  const activeTheme = activeDisc ? getDisciplinaVisualTheme(activeDisc.id) : null;
  const activeCorTema = activeTheme?.primary || activeDisc?.corDestaque || '#f59e0b';
  const activeCorHighlight = activeTheme?.highlight || '#fef08a';

  const handleCardItemClick = (disc: DisciplinaItem, idx: number) => {
    if (onCardClick) {
      onCardClick(disc, idx);
    } else if (onSelectDisciplina) {
      onSelectDisciplina(disc.id);
    } else if (onSelectCurrent) {
      onSelectCurrent();
    }
  };

  const handleIniciarAulaSegura = (aula: AulaItem) => {
    if (onIniciarAula) {
      onIniciarAula(aula);
    }
  };

  return (
    <>
      {/* ── CONTAINER PRINCIPAL COM ROLAGEM VERTICAL FLUIDA E ELEMENTOS RESPONSIVOS ── */}
      <div className="relative z-10 w-full min-h-screen flex flex-col pb-[calc(4rem+var(--sai-bottom,env(safe-area-inset-top,0px)))] overflow-x-hidden">
        
        {/* ── PAINEL HERO SUPERIOR (ESTILO PÍLULAS COM PALETA RUBI NOBRE, LISTRAS E ATALHOS) ── */}
        <div 
          className="relative overflow-hidden rounded-b-[34px] sm:rounded-b-[38px] shadow-2xl shadow-black/80 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[285px] xs:min-h-[305px] sm:min-h-[325px] mb-4 bg-[#0e0306]"
        >
          {/* Ondas e listras fluidas de seda no tom Imperial Ruby & Rose Gold */}
          <AulasHeroWave />

          {/* Cabeçalho Superior Transparente (Voltar + Busca) */}
          <header className="relative z-20 px-3 xs:px-4 sm:px-6 pt-2 pb-1 flex items-center justify-between">
            <button
              type="button"
              onClick={handleVoltar}
              className="grid w-11 h-11 xs:w-12 xs:h-12 shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95 cursor-pointer shadow-md"
              aria-label="Voltar para o início"
            >
              <ArrowLeft className="w-5.5 h-5.5 xs:w-6 xs:h-6" strokeWidth={2.4} />
            </button>

            {/* Botão de Busca */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setBuscaAberta(!buscaAberta);
              }}
              className="grid w-11 h-11 xs:w-12 xs:h-12 shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95 cursor-pointer shadow-md"
              aria-label="Buscar matérias ou módulos"
            >
              <Search className="w-5 h-5" strokeWidth={2.4} />
            </button>
          </header>

          {/* Campo Expansível de Pesquisa */}
          {(buscaAberta || buscaTermo) && (
            <div className="relative z-30 w-full max-w-md sm:max-w-xl mx-auto px-4 mt-1 mb-2 animate-in fade-in duration-200">
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                  <Search className="w-4 h-4 stroke-[2.2]" />
                </div>
                <input
                  type="text"
                  value={buscaTermo}
                  onChange={(e) => setBuscaTermo(e.target.value)}
                  placeholder="Buscar área ou matéria (ex: Penal, Civil)..."
                  className="w-full h-10 pl-10 pr-10 rounded-xl text-xs xs:text-sm text-white placeholder:text-zinc-500 bg-black/80 backdrop-blur-md border border-white/15 focus:border-rose-500/50 focus:outline-none shadow-inner"
                  autoFocus
                />
                {buscaTermo && (
                  <button
                    type="button"
                    onClick={() => setBuscaTermo('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Conteúdo de Marca: Aulas (branco) + em Trilha (rubi reluzente) */}
          <div className="relative z-10 px-4 sm:px-6 pt-3 sm:pt-4 flex-1 flex flex-col justify-start">
            <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
              <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
                Aulas
              </span>
              <span className="font-serif italic text-[26px] sm:text-[30px] font-semibold text-rose-400 block drop-shadow-[0_2px_14px_rgba(225,29,72,0.65)] -mt-0.5">
                em Trilha
              </span>
            </h1>

            {/* Traço vertical e slogan */}
            <div className="mt-2 flex items-start text-left gap-2 max-w-[280px]">
              <div className="w-[3px] h-8 bg-gradient-to-b from-rose-400 via-red-500 to-rose-900 rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(225,29,72,0.6)]" />
              <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                Cronograma de alta precisão.
                <br />
                {totalAulas > 0 ? totalAulas.toLocaleString('pt-BR') : '3.003'} aulas • 106 módulos oficiais.
              </p>
            </div>
          </div>

          {/* 4 Atalhos Rápidos Integrados no Rodapé do Painel (Igual Pílulas) */}
          <div className="relative z-10 px-3 sm:px-5 pb-3 pt-2">
            <div className="flex items-center justify-between gap-1.5 bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-1.5 shadow-2xl">
              {/* Recentes */}
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setRecentesModalOpen(true);
                }}
                className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 gap-1 text-center cursor-pointer min-h-[48px]"
                aria-label="Aulas Recentes"
              >
                <div className="relative inline-flex items-center justify-center">
                  <History className="w-5 h-5 text-rose-400 group-hover:scale-105 transition-transform" strokeWidth={1.8} />
                  {totalEmAndamento > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 rounded-full text-[8.5px] font-mono font-bold bg-rose-500 text-white">
                      {totalEmAndamento}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 group-hover:text-white truncate">
                  Recentes
                </span>
              </button>

              {/* Favoritos */}
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setAbaAtiva('favoritos');
                }}
                className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 gap-1 text-center cursor-pointer min-h-[48px]"
                aria-label="Aulas Favoritas"
              >
                <div className="relative inline-flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-rose-400 group-hover:scale-105 transition-transform" strokeWidth={1.8} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 group-hover:text-white truncate">
                  Favoritos
                </span>
              </button>

              {/* Em Alta */}
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setEmAltaModalOpen(true);
                }}
                className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 gap-1 text-center cursor-pointer min-h-[48px]"
                aria-label="Aulas Em Alta"
              >
                <div className="relative inline-flex items-center justify-center">
                  <Flame className="w-5 h-5 text-rose-400 group-hover:scale-105 transition-transform" strokeWidth={1.8} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 group-hover:text-white truncate">
                  Em Alta
                </span>
              </button>

              {/* Desempenho */}
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setAbaAtiva('estatisticas');
                }}
                className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 gap-1 text-center cursor-pointer min-h-[48px]"
                aria-label="Desempenho e Estatísticas"
              >
                <div className="relative inline-flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-rose-400 group-hover:scale-105 transition-transform" strokeWidth={1.8} />
                  {porcentagemGeral > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 rounded-full text-[8.5px] font-mono font-bold bg-rose-500 text-white">
                      {porcentagemGeral}%
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 group-hover:text-white truncate">
                  Desempenho
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. BOTÃO CONTINUAR DE ONDE PAROU ABAIXO DO PAINEL ── */}
        {aulaParaContinuar && (
          <div className="w-full max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 mb-3 z-20 shrink-0">
            <AulasContinuarAulaBanner
              aula={aulaParaContinuar}
              onIniciarAula={handleIniciarAulaSegura}
              calcularProgressoCiclo={calcularProgressoCiclo}
            />
          </div>
        )}

        {/* ── 4. CARROSSEL DE TRILHAS (MÓDULOS CRONOLÓGICOS EM FORMATO 1:1) ── */}
        <div className="w-full max-w-5xl lg:max-w-7xl mx-auto mb-3 z-20 shrink-0">
          <AulasTrilhasCarousel
            disciplinas={disciplinasFiltradas}
            aulas={aulasCatalogo}
            faseSelecionadaId={faseSelecionadaId}
            onSelectFase={setFaseSelecionadaId}
            onOpenTodasTrilhas={() => {
              setModuloInicialAbertoId(null);
              setTrilhasListaModalOpen(true);
            }}
            onOpenModuloDedicado={(modId) => {
              setModuloInicialAbertoId(modId);
              setTrilhasListaModalOpen(true);
            }}
            calcularProgressoCiclo={calcularProgressoCiclo}
          />
        </div>

        {/* Banner de Destaque do Módulo Ativo Selecionado */}
        {faseAtiva && (
          <div className="w-full max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 mb-4 z-20 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-2xl bg-zinc-900/80 border border-white/10 p-3 flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                {faseAtiva.capaUrl ? (
                  <img
                    src={faseAtiva.capaUrl}
                    alt={faseAtiva.nome}
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10 shadow"
                  />
                ) : (
                  <div 
                    className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center text-white font-mono font-bold text-xs shadow bg-zinc-800"
                  >
                    #{faseAtiva.faseNumero}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-mono font-bold text-red-400 uppercase tracking-wider">
                      Módulo {faseAtiva.faseNumero} Ativo
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      • {faseAtiva.totalAulas || 30} aulas
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-sans font-bold text-white truncate">
                    {faseAtiva.nome}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModuloInicialAbertoId(faseAtiva.id);
                    setTrilhasListaModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow"
                >
                  <span>Ver Aulas</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. CARROSSEL DAS ÁREAS EM COVERFLOW MINIMALISTA ── */}
        <section className="w-full max-w-5xl lg:max-w-7xl mx-auto px-3 sm:px-6 mb-6 flex flex-col items-center z-20">
          {/* Cabeçalho da Seção de Áreas */}
          <div className="w-full flex items-center justify-between gap-2 mb-2 px-1">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-white text-[14px] sm:text-[15px] font-bold flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1 h-3.5 sm:h-4 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span>
                  {faseAtiva ? `Áreas • Módulo ${faseAtiva.faseNumero}` : 'Áreas do Direito'}
                </span>
              </h2>
              <p className="font-sans text-zinc-400 text-[11px] sm:text-xs leading-snug ml-3 truncate">
                {faseAtiva 
                  ? `${disciplinasExibidas.length} matérias selecionadas neste módulo`
                  : 'Navegue no carrossel e escolha a matéria para acessar'}
              </p>
            </div>

            {faseSelecionadaId && (
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setFaseSelecionadaId(null);
                }}
                className="text-[10px] sm:text-[10.5px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                Todas ({disciplinasFiltradas.length})
              </button>
            )}
          </div>

          {/* Área do Carrossel Coverflow */}
          {totalDisciplinas === 0 ? (
            <div className="py-10 text-center w-full max-w-md rounded-2xl bg-zinc-900/60 border border-white/10 p-6 my-4">
              <p className="text-zinc-400 text-sm">Nenhuma disciplina encontrada para "{buscaTermo}".</p>
              <button
                type="button"
                onClick={() => {
                  setBuscaTermo('');
                  setFaseSelecionadaId(null);
                }}
                className="mt-3 px-4 py-1.5 rounded-full bg-white/10 text-zinc-200 border border-white/10 text-xs font-semibold hover:bg-white/20 transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="relative w-full mx-auto flex items-center justify-center px-0 my-auto py-1 select-none overflow-hidden">
              {/* Scroller Horizontal de Capas */}
              <div
                ref={carouselScrollerRef}
                onScroll={handleCarouselScroll}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative w-full flex items-center gap-3.5 xs:gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none touch-manipulation px-[calc(50vw-82px)] xs:px-[calc(50vw-92px)] sm:px-[calc(50vw-107px)] md:px-[calc(50vw-125px)]"
              >
                {itensParaCarrossel.map((disc, idx) => {
                  const isActive = idx === activeCarouselIndex;
                  const discTheme = getDisciplinaVisualTheme(disc.id);
                  const discAulas = aulasCatalogo.filter((a) => a.disciplinaId === disc.id);
                  const capaUrl = discTheme.fundoAssetUrl;
                  const corTema = discTheme.primary || disc.corDestaque || '#f59e0b';
                  const corTemaHighlight = discTheme.highlight || '#fef08a';

                  return (
                    <div
                      key={`${disc.id}-${idx}`}
                      onClick={() => handleCardItemClick(disc, idx)}
                      className="snap-center shrink-0 w-[165px] xs:w-[185px] sm:w-[215px] md:w-[250px] flex flex-col items-center cursor-pointer transition-all duration-300 ease-out will-change-transform"
                    >
                      {/* Quantidade de aulas acima da capa */}
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

                      {/* Card da Capa em 3/4 */}
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

                        {/* Nome da disciplina dentro da capa */}
                        <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none">
                          <div 
                            className="px-2 xs:px-2.5 sm:px-3 pb-2.5 xs:pb-3 sm:pb-3.5 pt-8 xs:pt-10 sm:pt-12"
                            style={{
                              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.70) 40%, rgba(0,0,0,0.25) 75%, transparent 100%)',
                            }}
                          >
                            <h2 
                              className={cn(
                                "font-serif font-black uppercase leading-[1.1] text-center break-words transition-all duration-300",
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

          {/* 4 Pontos Indicadores do Carrossel */}
          <div className="flex items-center justify-center gap-1.5 mt-2 mb-3 z-20 shrink-0">
            {[0, 1, 2, 3].map((dotIdx) => {
              const isDotActive = dotIdx === (safeIdx % 4);
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    if (scrollCarouselToIndex) {
                      const currentBlock = Math.floor(activeCarouselIndex / (totalDisciplinas || 1));
                      const targetIdx = currentBlock * (totalDisciplinas || 1) + dotIdx;
                      scrollCarouselToIndex(targetIdx);
                    }
                  }}
                  className={cn(
                    "transition-all duration-300 rounded-full cursor-pointer",
                    isDotActive 
                      ? "w-5 xs:w-6 h-1.5 xs:h-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                      : "w-1.5 xs:w-2 h-1.5 xs:h-2 bg-white/20 hover:bg-white/40"
                  )}
                  aria-label={`Ir para área ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </section>

        {/* ── 6. MODAIS SECUNDÁRIOS RÁPIDOS ── */}
        <AulasRecentesModal
          isOpen={recentesModalOpen}
          onClose={() => setRecentesModalOpen(false)}
          aulas={aulasCatalogo}
          calcularProgressoCiclo={calcularProgressoCiclo}
          onIniciarAula={handleIniciarAulaSegura}
        />

        <AulasEmAltaModal
          isOpen={emAltaModalOpen}
          onClose={() => setEmAltaModalOpen(false)}
          aulas={aulasCatalogo}
          onIniciarAula={handleIniciarAulaSegura}
        />

        <AulasTrilhasListaModal
          isOpen={trilhasListaModalOpen}
          onClose={() => {
            setTrilhasListaModalOpen(false);
            setModuloInicialAbertoId(null);
          }}
          disciplinas={disciplinasFiltradas}
          aulas={aulasCatalogo}
          faseSelecionadaId={faseSelecionadaId}
          onSelectFase={setFaseSelecionadaId}
          onIniciarAula={(item) => {
            // Se for uma aula real direta do catálogo
            const aulaItemReal = (aulasCatalogo && aulasCatalogo.find(a => a.id === item.id))
              || AULAS_CATALOGO_COMPLETO.find(a => a.id === item.id);
            if (aulaItemReal) {
              handleIniciarAulaSegura(aulaItemReal);
              return;
            }

            // Se for TrilhaModuloAula com dados reais já linkados do R2
            const modAula = item as TrilhaModuloAula;
            const fullAula: AulaItem = {
              id: modAula.id,
              numeroAula: modAula.numeroAula || 'Aula 01',
              titulo: modAula.titulo || modAula.aulaNumeroOuTitulo,
              descricao: modAula.sobre || '',
              slug: modAula.id,
              etapas: modAula.etapas || 30,
              audioQtd: 1,
              imagensQtd: 1,
              urlHtmlR2: modAula.urlHtmlR2 || '',
              urlJsonR2: modAula.urlJsonR2,
              capaUrl: modAula.capaUrl || '',
              status: 'pronto',
              disciplinaId: modAula.disciplinaId || 'penal',
              materiaId: modAula.materiaId || 'mat-01',
            };
            handleIniciarAulaSegura(fullAula);
          }}
          moduloInicialId={moduloInicialAbertoId}
          calcularProgressoCiclo={calcularProgressoCiclo}
        />
      </div>
    </>
  );
};

export default AulasCoverflowHome;
