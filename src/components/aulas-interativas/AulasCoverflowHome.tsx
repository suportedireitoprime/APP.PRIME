import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { 
  TRILHAS_CRONOLOGICAS, 
  getDisciplinasDaFase 
} from '@/data/aulasTrilhasCronologicas';
import { AulasInterativasHero } from './AulasInterativasHero';
import { AulasTrilhasCarousel } from './AulasTrilhasCarousel';
import { AulasMateriaCard } from './AulasMateriaCard';
import { haptic } from '@/lib/nativeHaptics';

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
  onSelectCurrent,
  onSelectDisciplina,
  onCardClick,
  onIniciarAula,
  calcularProgressoCiclo,
  handleVoltar,
  buscaTermo,
  setBuscaTermo,
  setAbaAtiva,
  porcentagemGeral,
  totalAulas,
  aulasCatalogo,
}) => {
  const [faseSelecionadaId, setFaseSelecionadaId] = useState<string | null>(null);

  // Procura aula em andamento para o botão rápido do Hero
  const ultimaAulaAndamento = useMemo(() => {
    if (!calcularProgressoCiclo) return null;
    const emAndamento = aulasCatalogo.filter((a) => {
      const p = calcularProgressoCiclo(a);
      return p.porcentagemTotal > 0 && p.porcentagemTotal < 100;
    });
    return emAndamento[0] || null;
  }, [aulasCatalogo, calcularProgressoCiclo]);

  // Lista de matérias filtrada por fase e por termo de busca
  const materiasExibidas = useMemo(() => {
    let base = disciplinasFiltradas;
    if (faseSelecionadaId) {
      base = getDisciplinasDaFase(faseSelecionadaId, base);
    }
    return base;
  }, [disciplinasFiltradas, faseSelecionadaId]);

  const faseAtiva = useMemo(() => {
    if (!faseSelecionadaId) return null;
    return TRILHAS_CRONOLOGICAS.find((t) => t.id === faseSelecionadaId) || null;
  }, [faseSelecionadaId]);

  const handleMateriaClick = (disc: DisciplinaItem, index: number) => {
    if (onSelectDisciplina) {
      onSelectDisciplina(disc.id);
    } else if (onCardClick) {
      onCardClick(disc, index);
    } else if (onSelectCurrent) {
      onSelectCurrent();
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col relative z-10">
      {/* ── 1. PAINEL DE TOPO (HERO COM ONDA VERDE ESMERALDA / PETRÓLEO) ── */}
      <AulasInterativasHero
        onVoltar={handleVoltar}
        buscaTermo={buscaTermo}
        setBuscaTermo={setBuscaTermo}
        totalAulas={totalAulas}
        totalMaterias={disciplinasFiltradas.length}
        porcentagemGeral={porcentagemGeral}
        onAbrirEstatisticas={() => setAbaAtiva('estatisticas')}
        ultimaAulaAndamento={ultimaAulaAndamento}
        onIniciarAula={onIniciarAula}
        calcularProgressoCiclo={calcularProgressoCiclo}
      />

      {/* ── 2. CARROSSEL DE TRILHAS DE PROGRESSO EM ORDEM CRONOLÓGICA ── */}
      <div className="w-full max-w-5xl lg:max-w-7xl mx-auto">
        <AulasTrilhasCarousel
          disciplinas={disciplinasFiltradas}
          aulas={aulasCatalogo}
          faseSelecionadaId={faseSelecionadaId}
          onSelectFase={setFaseSelecionadaId}
          calcularProgressoCiclo={calcularProgressoCiclo}
        />
      </div>

      {/* ── 3. LISTA DE MATÉRIAS NORMAIS COM CAPAS IGUAL ÁUDIO AULAS ── */}
      <section className="w-full max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 mt-4 pb-28">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-white text-[16px] sm:text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
              <span className="w-1.5 h-5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.7)] shrink-0" />
              <span>
                {faseAtiva ? `Matérias • ${faseAtiva.nome}` : 'Todas as Matérias'}
              </span>
            </h2>
            <p className="font-sans text-zinc-400 text-[12px] sm:text-[12.5px] leading-snug ml-3.5 mt-0.5">
              {faseAtiva
                ? `Mostrando ${materiasExibidas.length} matérias desta fase cronológica`
                : 'Toque em uma matéria para acessar suas aulas e atividades'}
            </p>
          </div>

          {/* Filtros em Pílula */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setFaseSelecionadaId(null);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                faseSelecionadaId === null
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Todas ({disciplinasFiltradas.length})
            </button>
            {TRILHAS_CRONOLOGICAS.map((fase) => {
              const isSelected = faseSelecionadaId === fase.id;
              return (
                <button
                  key={fase.id}
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFaseSelecionadaId(isSelected ? null : fase.id);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                  style={isSelected ? {
                    backgroundColor: fase.accentColor,
                    color: '#fff',
                    boxShadow: `0 4px 14px ${fase.accentColor}50`,
                  } : undefined}
                >
                  Fase {fase.faseNumero} ({fase.disciplinasIds.length})
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Matérias */}
        {materiasExibidas.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-8 my-4">
            <p className="text-zinc-400 text-sm">Nenhuma matéria encontrada para a busca.</p>
            <button
              type="button"
              onClick={() => {
                setBuscaTermo('');
                setFaseSelecionadaId(null);
              }}
              className="mt-3 px-4 py-1.5 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-600/30 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {materiasExibidas.map((disc, index) => {
              const discAulas = aulasCatalogo.filter((a) => a.disciplinaId === disc.id);
              let concluidas = 0;
              if (calcularProgressoCiclo && discAulas.length > 0) {
                concluidas = discAulas.filter((a) => {
                  const p = calcularProgressoCiclo(a);
                  return p.aulaTerminada || p.porcentagemTotal >= 100;
                }).length;
              }
              const pct = discAulas.length > 0 ? Math.round((concluidas / discAulas.length) * 100) : 0;

              return (
                <AulasMateriaCard
                  key={disc.id}
                  disciplina={disc}
                  totalAulas={discAulas.length}
                  concluidas={concluidas}
                  pct={pct}
                  index={index}
                  onClick={() => handleMateriaClick(disc, index)}
                />
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
};
export default AulasCoverflowHome;
