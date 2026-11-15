import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Search, X, BarChart3, History, Bookmark, Flame, Play, ChevronRight 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { AulaItem, AULAS_CATALOGO_COMPLETO } from '@/data/aulasInterativasCatalogoCompleto';
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';
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
      {/* ── FUNDO GRÉCIA ANTIGA COM FILÓSOFOS (RESTABELECIDO CONFORME PEDIDO DO USUÁRIO) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#120b08]">
        <img
          src={greciaFilosofosFundo}
          alt="Grécia Antiga e Filósofos"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter blur-[1.5px] brightness-[0.92] contrast-[1.08]"
        />
        {/* Vinheta atmosférica suave preservando os detalhes dos templos e filósofos */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/85 pointer-events-none" />
      </div>

      {/* ── CONTAINER PRINCIPAL COM ROLAGEM VERTICAL FLUIDA E ELEMENTOS RESPONSIVOS ── */}
      <div className="relative z-10 w-full min-h-screen flex flex-col pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-[calc(4rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] overflow-x-hidden">
        
        {/* ── 1. CABEÇALHO SUPERIOR (VOLTAR + TÍTULO COM BADGE + BUSCA) ── */}
        <header className="w-full max-w-5xl lg:max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 mb-2 z-20 shrink-0">
          <div className="w-full flex items-center justify-between gap-2 mb-1 xs:mb-1.5">
            {/* Botão Voltar Circular Padrão Premium */}
            <button
              type="button"
              onClick={handleVoltar}
              className="w-11 h-11 xs:w-12 xs:h-12 sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center bg-black/60 border border-white/20 text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-lg shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5.5 h-5.5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-white stroke-[2.4]" />
            </button>

            {/* Título Imperial Centralizado */}
            <div className="text-center px-2 flex-1 min-w-0">
              <h1 className="inline-flex items-center justify-center gap-1.5 xs:gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-xl text-[10.5px] xs:text-xs sm:text-sm font-mono font-black text-amber-300 bg-black/80 border border-amber-500/50 shadow-inner tracking-wider">
                  {totalAulas > 0 ? totalAulas.toLocaleString('pt-BR') : '3.192'}
                </span>
                <span className="text-lg xs:text-xl sm:text-2xl font-serif font-black tracking-wide text-[#fff1f2] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  Aulas em Trilha
                </span>
              </h1>
              <p className="text-[10px] xs:text-[11px] sm:text-xs font-serif italic text-zinc-300/85 mt-0.5 truncate">
                Metodologia ativa cronológica • 106 módulos • 22 matérias
              </p>
            </div>

            {/* Botão de Pesquisa Rápida */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setBuscaAberta(!buscaAberta);
              }}
              className={cn(
                "w-11 h-11 xs:w-12 xs:h-12 sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-lg cursor-pointer shrink-0",
                buscaAberta || buscaTermo
                  ? "bg-teal-600/30 border-teal-400/60 text-[#2dd4bf]"
                  : "bg-black/60 text-white/90 border-white/20 hover:bg-black/80"
              )}
              aria-label="Pesquisar"
            >
              <Search className="w-5.5 h-5.5 xs:w-6 xs:h-6 stroke-[2.2]" />
            </button>
          </div>

          {/* Campo Expansível de Pesquisa */}
          {(buscaAberta || buscaTermo) && (
            <div className="w-full max-w-md sm:max-w-xl mx-auto px-1 mt-1 mb-2 animate-in fade-in duration-200">
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/90 pointer-events-none">
                  <Search className="w-4 h-4 stroke-[2.2]" />
                </div>
                <input
                  type="text"
                  value={buscaTermo}
                  onChange={(e) => setBuscaTermo(e.target.value)}
                  placeholder="Buscar área ou matéria (ex: Penal, Civil)..."
                  className="w-full h-10 xs:h-11 pl-10 pr-10 rounded-full text-xs xs:text-sm text-white placeholder:text-zinc-400 bg-black/80 backdrop-blur-md border border-white/20 focus:border-amber-400/60 focus:outline-none shadow-inner"
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
        </header>

        {/* ── 2. PAINEL FLUTUANTE DE FUNÇÕES (RECENTES, FAVORITOS, EM ALTA, DESEMPENHO) ── */}
        <div className="w-full max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 mb-3 z-20 shrink-0">
          <div className="rounded-[32px] sm:rounded-[36px] bg-black/75 border border-white/15 backdrop-blur-xl shadow-2xl p-1.5 xs:p-2 sm:p-2.5 flex items-center justify-between gap-1 xs:gap-1.5">
            {/* Recentes */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setRecentesModalOpen(true);
              }}
              className="flex-1 min-w-0 group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center cursor-pointer min-h-[54px] sm:min-h-[58px]"
              aria-label="Aulas Recentes"
            >
              <div className="relative inline-flex items-center justify-center">
                <History className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-[#2dd4bf] group-hover:scale-110 transition-transform" strokeWidth={2} />
                {totalEmAndamento > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full text-[8.5px] font-mono font-bold bg-[#0d9488] text-white">
                    {totalEmAndamento}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 group-hover:text-white truncate">
                Recentes
              </span>
            </button>

            {/* Favoritos (Ícone Bookmark, conforme diretriz do usuário) */}
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setAbaAtiva('favoritos');
              }}
              className="flex-1 min-w-0 group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center cursor-pointer min-h-[54px] sm:min-h-[58px]"
              aria-label="Aulas Favoritas"
            >
              <div className="relative inline-flex items-center justify-center">
                <Bookmark className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-[#2dd4bf] group-hover:scale-110 transition-transform" strokeWidth={2} />
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
                setEmAltaModalOpen(true);
              }}
              className="flex-1 min-w-0 group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center cursor-pointer min-h-[54px] sm:min-h-[58px]"
              aria-label="Aulas Em Alta"
            >
              <div className="relative inline-flex items-center justify-center">
                <Flame className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-[#2dd4bf] group-hover:scale-110 transition-transform" strokeWidth={2} />
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
                setAbaAtiva('estatisticas');
              }}
              className="flex-1 min-w-0 group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center cursor-pointer min-h-[54px] sm:min-h-[58px]"
              aria-label="Desempenho e Estatísticas"
            >
              <div className="relative inline-flex items-center justify-center">
                <BarChart3 className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-[#2dd4bf] group-hover:scale-110 transition-transform" strokeWidth={2} />
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
            <div className="rounded-2xl bg-zinc-900/90 border border-teal-500/40 p-3 flex items-center justify-between gap-3 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                {faseAtiva.capaUrl ? (
                  <img
                    src={faseAtiva.capaUrl}
                    alt={faseAtiva.nome}
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/20 shadow"
                  />
                ) : (
                  <div 
                    className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center text-white font-mono font-bold text-xs shadow"
                    style={{ background: faseAtiva.gradientBg }}
                  >
                    #{faseAtiva.faseNumero}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-mono font-black text-[#2dd4bf] uppercase tracking-wider">
                      Módulo {faseAtiva.faseNumero} Ativo
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      • {faseAtiva.totalAulas || 30} aulas
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-serif font-bold text-white truncate">
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
                  className="px-2.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow"
                >
                  <span>Ver Aulas</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. CARROSSEL DAS ÁREAS EM COVERFLOW COM CAPAS (RESTABELECIDO A PEDIDO DO USUÁRIO) ── */}
        <section className="w-full max-w-5xl lg:max-w-7xl mx-auto px-3 sm:px-6 mb-6 flex flex-col items-center z-20">
          {/* Cabeçalho da Seção de Áreas */}
          <div className="w-full flex items-center justify-between gap-2 mb-2 px-1">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-white text-[15px] sm:text-[16.5px] font-bold flex items-center gap-2 uppercase tracking-widest">
                <span className="w-[3px] sm:w-[3.5px] h-4.5 sm:h-5 rounded-full bg-gradient-to-b from-[#5eead4] via-[#0d9488] to-[#042f2e] shadow-[0_0_8px_rgba(45,212,191,0.6)] shrink-0" />
                <span>
                  {faseAtiva ? `Áreas • Módulo ${faseAtiva.faseNumero}` : 'Áreas do Direito'}
                </span>
              </h2>
              <p className="font-sans text-zinc-400 text-[11px] sm:text-[11.5px] leading-snug ml-3.5 truncate">
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
                className="text-[10px] sm:text-[10.5px] font-mono font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-[#2dd4bf] hover:bg-teal-500/30 border border-teal-500/30 transition-all cursor-pointer"
              >
                Todas ({disciplinasFiltradas.length})
              </button>
            )}
          </div>

          {/* Área do Carrossel Coverflow com Balança Sutil de Fundo */}
          {totalDisciplinas === 0 ? (
            <div className="py-10 text-center w-full max-w-md rounded-2xl bg-black/60 border border-white/10 p-6 my-4">
              <p className="text-zinc-400 text-sm">Nenhuma disciplina encontrada para "{buscaTermo}".</p>
              <button
                type="button"
                onClick={() => {
                  setBuscaTermo('');
                  setFaseSelecionadaId(null);
                }}
                className="mt-3 px-4 py-1.5 rounded-full bg-teal-600/30 text-[#2dd4bf] border border-teal-500/40 text-xs font-semibold hover:bg-teal-600/40 transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="relative w-full mx-auto flex items-center justify-center px-0 my-auto py-1 select-none overflow-hidden">
              {/* Balança da Justiça sutil em marca d'água */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[48%] pointer-events-none z-0 select-none opacity-20 transform rotate-[-2deg]">
                <svg width="280" height="280" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] drop-shadow-[0_12px_40px_rgba(251,191,36,0.2)]">
                  <rect x="248" y="70" width="16" height="350" rx="5" fill="#f59e0b"/>
                  <rect x="170" y="405" width="172" height="22" rx="11" fill="#d97706"/>
                  <rect x="200" y="392" width="112" height="18" rx="5" fill="#f59e0b"/>
                  <circle cx="256" cy="72" r="20" fill="#fbbf24"/>
                  <rect x="70" y="64" width="372" height="14" rx="7" fill="#fbbf24"/>
                  <line x1="105" y1="78" x2="105" y2="200" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="9 4.5"/>
                  <line x1="407" y1="78" x2="407" y2="200" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="9 4.5"/>
                  <ellipse cx="105" cy="208" rx="65" ry="16" fill="#fbbf24"/>
                  <path d="M40 208 Q50 245 105 250 Q160 245 170 208" fill="none" stroke="#d97706" strokeWidth="3.5"/>
                  <ellipse cx="407" cy="208" rx="65" ry="16" fill="#fbbf24"/>
                  <path d="M342 208 Q352 245 407 250 Q462 245 472 208" fill="none" stroke="#d97706" strokeWidth="3.5"/>
                </svg>
              </div>

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
                      ? "w-5 xs:w-6 h-1.5 xs:h-2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]" 
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
