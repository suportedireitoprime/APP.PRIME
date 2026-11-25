import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  BarChart3,
  History,
  Bookmark,
  Flame,
  ChevronRight,
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
import { AulasRecentesModal } from './AulasRecentesModal';
import { AulasEmAltaModal } from './AulasEmAltaModal';
import { AulasTrilhasListaModal } from './AulasTrilhasListaModal';

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

  const totalEmAndamento = useMemo(() => {
    if (!calcularProgressoCiclo) return 0;
    return aulasCatalogo.filter((a) => calcularProgressoCiclo(a).porcentagemTotal > 0).length;
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
    const counts = new Map<string, number>();
    for (const a of aulasCatalogo) {
      counts.set(a.disciplinaId, (counts.get(a.disciplinaId) || 0) + 1);
    }
    return counts;
  }, [aulasCatalogo]);

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
    <div className="relative z-10 w-full min-h-screen flex flex-col pb-[calc(5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] overflow-x-hidden">
      {/* Header Minimalista e Compacto */}
      <header className="sticky top-0 z-30 bg-[#0D0F12]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(0.65rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
        <div className="max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 pb-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleVoltar}
                className="w-11 h-11 shrink-0 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors active:scale-95 cursor-pointer"
                aria-label="Voltar para o início"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-base sm:text-lg font-semibold text-white tracking-tight truncate">
                  Aulas em Trilha
                </h1>
                <p className="font-body text-xs text-white/50 truncate">
                  {totalAulas > 0 ? totalAulas.toLocaleString('pt-BR') : '3.003'} aulas · 106 módulos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                try { haptic.light(); } catch {}
                setBuscaAberta((prev) => !prev);
              }}
              className={`w-11 h-11 shrink-0 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                buscaAberta || buscaTermo
                  ? 'bg-white text-zinc-950 border-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
              }`}
              aria-label="Buscar área ou matéria"
            >
              {buscaAberta ? <X className="w-5 h-5" strokeWidth={1.8} /> : <Search className="w-5 h-5" strokeWidth={1.8} />}
            </button>
          </div>

          {(buscaAberta || buscaTermo) && (
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
                placeholder="Buscar disciplina ou aula..."
                className="w-full h-11 pl-10 pr-10 rounded-xl text-sm text-white placeholder:text-white/35 bg-white/[0.04] border border-white/10 focus:border-white/30 focus:outline-none"
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
          )}

          {/* Barra Minimalista de 4 Ações Rápidas */}
          <div className="grid grid-cols-4 gap-1.5 bg-white/[0.04] border border-white/10 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setRecentesModalOpen(true);
              }}
              className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-white/75 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              <History className="w-4 h-4" strokeWidth={1.7} />
              <span className="text-[10.5px] font-medium truncate">
                Recentes{totalEmAndamento > 0 ? ` (${totalEmAndamento})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setAbaAtiva('favoritos');
              }}
              className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-white/75 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              <Bookmark className="w-4 h-4" strokeWidth={1.7} />
              <span className="text-[10.5px] font-medium truncate">Favoritos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setEmAltaModalOpen(true);
              }}
              className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-white/75 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4" strokeWidth={1.7} />
              <span className="text-[10.5px] font-medium truncate">Em Alta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setAbaAtiva('estatisticas');
              }}
              className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-white/75 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" strokeWidth={1.7} />
              <span className="text-[10.5px] font-medium truncate">
                Progresso{porcentagemGeral > 0 ? ` ${porcentagemGeral}%` : ''}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal Minimalista */}
      <main className="w-full max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
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
          <div className="flex items-center justify-between gap-2 px-1">
            <div>
              <h2 className="font-display text-sm font-semibold text-white uppercase tracking-wider">
                {faseAtiva ? `Áreas · Módulo ${faseAtiva.faseNumero}` : 'Áreas do Direito'}
              </h2>
              <p className="font-body text-xs text-white/45 mt-0.5">
                {disciplinasExibidas.length} {disciplinasExibidas.length === 1 ? 'disciplina' : 'disciplinas'} disponíveis
              </p>
            </div>
            {faseSelecionadaId && (
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setFaseSelecionadaId(null);
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/15 cursor-pointer"
              >
                Ver todas ({disciplinasFiltradas.length})
              </button>
            )}
          </div>

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
                const qtdAulas = aulasPorDisciplina.get(disc.id) || 0;
                const capaUrl = discTheme.fundoAssetUrl || disc.capaHeroUrl;
                const nomeExibicao = NOMES_DISCIPLINA[disc.nome] || disc.nome;

                return (
                  <button
                    key={disc.id}
                    type="button"
                    onClick={() => handleOpenDisciplina(disc.id)}
                    className="w-full min-h-[68px] flex items-center gap-3 rounded-2xl bg-zinc-900/75 hover:bg-zinc-900 border border-white/10 hover:border-white/20 px-3.5 py-3 text-left active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-zinc-950 border border-white/10">
                      <img
                        src={capaUrl}
                        alt={nomeExibicao}
                        loading={idx < 9 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans text-sm font-semibold text-white truncate">
                        {nomeExibicao}
                      </h3>
                      <p className="font-mono text-xs text-white/45 mt-0.5">
                        {qtdAulas} aulas
                      </p>
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
    </div>
  );
};

export default AulasCoverflowHome;
