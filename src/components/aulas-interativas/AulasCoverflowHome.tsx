import React, { useState, useMemo, lazy, Suspense } from 'react';
import {
  ChevronRight,
  X,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { AulaItem, AULAS_CATALOGO_COMPLETO } from '@/data/aulasInterativasCatalogoCompleto';
import {
  TRILHAS_CRONOLOGICAS,
  TrilhaModuloAula,
  getDisciplinasDaFase,
} from '@/data/aulasTrilhasCronologicas';
import { AulasContinuarAulaBanner } from './AulasContinuarAulaBanner';
import { AulasTrilhasCarousel } from './AulasTrilhasCarousel';
import { AulasHero } from './AulasHero';
import HomeSectionHeader from '@/components/vademecum/home/sections/HomeSectionHeader';

const AulasRecentesModal = lazy(() =>
  import('./AulasRecentesModal').then((m) => ({ default: m.AulasRecentesModal })),
);
const AulasEmAltaModal = lazy(() =>
  import('./AulasEmAltaModal').then((m) => ({ default: m.AulasEmAltaModal })),
);
const AulasTrilhasListaModal = lazy(() =>
  import('./AulasTrilhasListaModal').then((m) => ({ default: m.AulasTrilhasListaModal })),
);

const NOMES_DISCIPLINA: Record<string, string> = {
  'DIREITO PENAL': 'Direito Penal',
  'DIREITO CIVIL': 'Direito Civil',
  'DIREITO CONSTITUCIONAL': 'Direito Constitucional',
  'DIREITO ADMINISTRATIVO': 'Direito Administrativo',
  'DIREITO DO TRABALHO': 'Direito do Trabalho',
  'DIREITO PROCESSUAL CIVIL': 'Processo Civil',
  'DIREITO PROCESSUAL PENAL': 'Processo Penal',
  'DIREITO TRIBUTÁRIO': 'Direito Tributário',
  'DIREITO EMPRESARIAL': 'Direito Empresarial',
  'DIREITO AMBIENTAL': 'Direito Ambiental',
  'DIREITO PREVIDENCIÁRIO': 'Direito Previdenciário',
  'DIREITO PROCESSUAL DO TRABALHO': 'Processo do Trabalho',
  'DIREITO FINANCEIRO': 'Direito Financeiro',
  'DIREITO INTERNACIONAL PRIVADO': 'Internacional Privado',
  'DIREITO URBANÍSTICO': 'Direito Urbanístico',
  'DIREITOS HUMANOS': 'Direitos Humanos',
  'LEI PENAL ESPECIAL': 'Lei Penal Especial',
  'TEORIA E FILOSOFIA DO DIREITO': 'Teoria e Filosofia',
  'DIREITO DESPORTIVO': 'Direito Desportivo',
  'POLÍTICAS PÚBLICAS': 'Políticas Públicas',
  'PORTUGUÊS JURÍDICO': 'Português Jurídico',
  'FORMAÇÃO COMPLEMENTAR': 'Formação Complementar',
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
  onSelectCurrent,
  onSelectDisciplina,
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
  const [recentesModalOpen, setRecentesModalOpen] = useState(false);
  const [emAltaModalOpen, setEmAltaModalOpen] = useState(false);
  const [trilhasListaModalOpen, setTrilhasListaModalOpen] = useState(false);
  const [moduloInicialAbertoId, setModuloInicialAbertoId] = useState<string | null>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);

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

  const { totalEmAndamento, totalConcluidas } = useMemo(() => {
    if (!calcularProgressoCiclo) return { totalEmAndamento: 0, totalConcluidas: 0 };
    let andamento = 0;
    let concluidas = 0;
    for (const a of aulasCatalogo) {
      const p = calcularProgressoCiclo(a);
      if (p.cicloCompleto || p.porcentagemTotal >= 100) concluidas++;
      else if (p.porcentagemTotal > 0) andamento++;
    }
    return { totalEmAndamento: andamento, totalConcluidas: concluidas };
  }, [aulasCatalogo, calcularProgressoCiclo]);

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

  const aulasPorDisciplina = useMemo(() => {
    const stats = new Map<string, { total: number; somaPct: number }>();
    for (const a of aulasCatalogo) {
      const cur = stats.get(a.disciplinaId) || { total: 0, somaPct: 0 };
      cur.total += 1;
      if (calcularProgressoCiclo) {
        cur.somaPct += calcularProgressoCiclo(a).porcentagemTotal;
      }
      stats.set(a.disciplinaId, cur);
    }
    return stats;
  }, [aulasCatalogo, calcularProgressoCiclo]);

  const handleOpenDisciplina = (discId: string) => {
    try { haptic.selection(); } catch {}
    if (onSelectDisciplina) {
      onSelectDisciplina(discId);
    } else if (onSelectCurrent) {
      onSelectCurrent();
    }
  };

  const handleIniciarAulaSegura = (aula: AulaItem) => {
    if (onIniciarAula) onIniciarAula(aula);
  };

  return (
    <div className="relative z-10 w-full min-h-screen flex flex-col pb-[calc(5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] lg:pb-10 overflow-x-hidden">
      {/* Painel Principal estilo Questões com as 4 funções integradas */}
      <AulasHero
        porcentagemGeral={porcentagemGeral}
        totalEmAndamento={totalEmAndamento}
        totalAulas={totalAulas}
        buscaAberta={buscaAberta}
        buscaTermo={buscaTermo}
        onToggleBusca={() => setBuscaAberta((prev) => !prev)}
        setBuscaTermo={setBuscaTermo}
        onBack={handleVoltar}
        onOpenRecentes={() => setRecentesModalOpen(true)}
        onOpenFavoritos={() => setAbaAtiva('favoritos')}
        onOpenEmAlta={() => setEmAltaModalOpen(true)}
        onOpenProgresso={() => setAbaAtiva('estatisticas')}
      />

      {/* Conteúdo Principal Minimalista */}
      <main className="w-full max-w-5xl lg:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 space-y-6">
        {aulaParaContinuar && (
          <AulasContinuarAulaBanner
            aula={aulaParaContinuar}
            onIniciarAula={handleIniciarAulaSegura}
            calcularProgressoCiclo={calcularProgressoCiclo}
          />
        )}

        {faseAtiva && (
          <div className="rounded-2xl bg-zinc-900/80 border border-white/15 p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                Módulo {faseAtiva.faseNumero} · {faseAtiva.totalAulas || 30} aulas
              </p>
              <h4 className="text-sm font-semibold text-white truncate mt-0.5">
                {faseAtiva.nome}
              </h4>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setModuloInicialAbertoId(faseAtiva.id);
                  setTrilhasListaModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
              >
                <span>Ver Aulas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFaseSelecionadaId(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 cursor-pointer"
                aria-label="Limpar módulo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Grid Minimalista de Disciplinas (substitui o Coverflow 3D) */}
        <section className="space-y-3">
          <HomeSectionHeader
            title={faseAtiva ? `ÁREAS · MÓDULO ${faseAtiva.faseNumero}` : 'ÁREAS DO DIREITO'}
            subtitle={`${disciplinasExibidas.length} ${disciplinasExibidas.length === 1 ? 'disciplina' : 'disciplinas'} disponíveis`}
            actionLabel={faseSelecionadaId ? `Ver todas (${disciplinasFiltradas.length})` : undefined}
            onAction={
              faseSelecionadaId
                ? () => {
                    try { haptic.selection(); } catch {}
                    setFaseSelecionadaId(null);
                  }
                : undefined
            }
          />

          {disciplinasExibidas.length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-zinc-900/60 border border-white/10 p-6">
              <p className="text-white/60 text-sm">Nenhuma disciplina encontrada para "{buscaTermo}".</p>
              <button
                type="button"
                onClick={() => {
                  setBuscaTermo('');
                  setFaseSelecionadaId(null);
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {disciplinasExibidas.map((disc, idx) => {
                const discTheme = getDisciplinaVisualTheme(disc.id);
                const discStats = aulasPorDisciplina.get(disc.id) || { total: 0, somaPct: 0 };
                const qtdAulas = discStats.total;
                const pctDisc = qtdAulas > 0 ? Math.round(discStats.somaPct / qtdAulas) : 0;
                const capaUrl = discTheme.fundoAssetUrl || disc.capaHeroUrl;
                const nomeExibicao = NOMES_DISCIPLINA[disc.nome] || disc.nome;

                return (
                  <button
                    key={disc.id}
                    type="button"
                    onClick={() => handleOpenDisciplina(disc.id)}
                    className="w-full min-h-[80px] flex items-center gap-3.5 rounded-2xl bg-zinc-900/75 hover:bg-zinc-900 border border-white/10 hover:border-white/20 px-4 py-3.5 text-left active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-950 border border-white/10">
                      <img
                        src={capaUrl}
                        alt={nomeExibicao}
                        loading={idx < 9 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-sans text-sm font-semibold text-white truncate">
                          {nomeExibicao}
                        </h3>
                        <span className="font-mono text-[11px] font-semibold text-white/60 tabular-nums shrink-0">
                          {pctDisc}%
                        </span>
                      </div>
                      <p className="font-mono text-xs text-white/45 mt-0.5">
                        {qtdAulas} aulas
                      </p>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pctDisc >= 100 ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pctDisc}%` }}
                        />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/35 group-hover:text-white/70 shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Lista de Módulos Oficiais */}
        <section className="pt-2">
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
        </section>
      </main>

      <Suspense fallback={null}>
        {recentesModalOpen && (
          <AulasRecentesModal
            isOpen={recentesModalOpen}
            onClose={() => setRecentesModalOpen(false)}
            aulas={aulasCatalogo}
            calcularProgressoCiclo={calcularProgressoCiclo}
            onIniciarAula={handleIniciarAulaSegura}
          />
        )}

        {emAltaModalOpen && (
          <AulasEmAltaModal
            isOpen={emAltaModalOpen}
            onClose={() => setEmAltaModalOpen(false)}
            aulas={aulasCatalogo}
            onIniciarAula={handleIniciarAulaSegura}
          />
        )}

        {trilhasListaModalOpen && (
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
              const aulaItemReal =
                (aulasCatalogo && aulasCatalogo.find((a) => a.id === item.id)) ||
                AULAS_CATALOGO_COMPLETO.find((a) => a.id === item.id);
              if (aulaItemReal) {
                handleIniciarAulaSegura(aulaItemReal);
                return;
              }

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
        )}
      </Suspense>
    </div>
  );
};

export default AulasCoverflowHome;
