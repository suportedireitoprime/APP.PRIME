import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { AlertCircle, Lock, Play, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { assetUrl } from '@/lib/assetUrl';

// Catálogo e Tipos
import { DISCIPLINAS_CATALOGO, DisciplinaItem } from '@/data/disciplinasAulasCatalogo';
import { 
  MATERIAS_CATALOGO_COMPLETO, 
  AULAS_CATALOGO_COMPLETO,
  MateriaItem,
  AulaItem
} from '@/data/aulasInterativasCatalogoCompleto';
import { CONTEUDO_AULAS } from '@/data/aulasInterativasConteudo';

// Hooks Especializados
import { useAulasProgresso } from '@/hooks/useAulasProgresso';
import { useAulasCoverflow } from '@/hooks/useAulasCoverflow';

// Componentes Modulares por Nível
import { AulasCoverflowHome } from '@/components/aulas-interativas/AulasCoverflowHome';
import { AulasTrilhaMateriaView } from '@/components/aulas-interativas/AulasTrilhaMateriaView';
import { AulasMateriaSheet } from '@/components/aulas-interativas/AulasMateriaSheet';
import { AulasDetalheSheet } from '@/components/aulas-interativas/AulasDetalheSheet';

// Abas Analíticas Secundárias
import { AulasTabProgresso } from '@/components/aulas-interativas/AulasTabProgresso';
import { AulasTabFavoritos } from '@/components/aulas-interativas/AulasTabFavoritos';
import { AulasTabEstatisticas } from '@/components/aulas-interativas/AulasTabEstatisticas';

// Code Splitting (Lazy Loading sob Demanda) para Componentes Pesados
const PlayerAulaNativo = lazy(() => 
  import('@/components/aulas-interativas/PlayerAulaNativo').then(m => ({ default: m.PlayerAulaNativo }))
);
const ModalRevisarFlashcards = lazy(() => 
  import('@/components/aulas-interativas/ModalRevisarFlashcards').then(m => ({ default: m.ModalRevisarFlashcards }))
);
const ModalPraticarQuestoes = lazy(() => 
  import('@/components/aulas-interativas/ModalPraticarQuestoes').then(m => ({ default: m.ModalPraticarQuestoes }))
);

const MATERIAS_CATALOGO: MateriaItem[] = MATERIAS_CATALOGO_COMPLETO;
const AULAS_CATALOGO: AulaItem[] = AULAS_CATALOGO_COMPLETO;

export default function AdminAulasInterativas() {
  const navigate = useNavigate();

  // Estados de Navegação Hierárquica
  const [disciplinaSelecionadaId, setDisciplinaSelecionadaId] = useState<string | null>(null);
  const [materiaSelecionadaId, setMateriaSelecionadaId] = useState<string | null>(null);
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);
  const [aulaSheetDetalhe, setAulaSheetDetalhe] = useState<AulaItem | null>(null);

  // Estados de Busca e Abas
  const [buscaTermo, setBuscaTermo] = useState('');
  const [buscaTermoAulas, setBuscaTermoAulas] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'trilhas' | 'progresso' | 'favoritos' | 'estatisticas'>('trilhas');

  // Estados dos Modais Secundários
  const [modalFlashcardsAula, setModalFlashcardsAula] = useState<AulaItem | null>(null);
  const [modalQuestoesAula, setModalQuestoesAula] = useState<AulaItem | null>(null);
  const [modalBloqueioAula, setModalBloqueioAula] = useState<{ aula: AulaItem; motivo: 'revisar' | 'praticar' } | null>(null);
  const [aulaPendenteModal, setAulaPendenteModal] = useState<AulaItem | null>(null);
  const [modoLivreTeste] = useState(false);

  // Hook de Progresso e Estatísticas (Supabase Single Source of Truth + Cache 0ms)
  const {
    progressoMap,
    setProgressoMap,
    flashcardsConcluidos,
    questoesConcluidas,
    acertosMap,
    favoritosIds,
    toastAviso,
    setToastAviso,
    calcularProgressoCiclo,
    porcentagemGeral,
    registrarInicioAula,
    atualizarEtapaManual,
    concluirAulaManual,
    concluirFlashcards,
    concluirQuestoes,
    alternarFavorito,
  } = useAulasProgresso(AULAS_CATALOGO);

  const resetScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  // Filtragem Dinâmica das Disciplinas
  const termoBuscaNorm = buscaTermo.toLowerCase().trim();
  const disciplinasFiltradas = useMemo(() => {
    return DISCIPLINAS_CATALOGO.filter(disc => {
      if (!termoBuscaNorm) return true;
      const matchNome = disc.nome.toLowerCase().includes(termoBuscaNorm);
      const matchMateria = MATERIAS_CATALOGO.some(m => m.disciplinaId === disc.id && ((m as any).nome || m.titulo || "").toLowerCase().includes(termoBuscaNorm));
      const matchAula = AULAS_CATALOGO.some(a => a.disciplinaId === disc.id && a.titulo.toLowerCase().includes(termoBuscaNorm));
      return matchNome || matchMateria || matchAula;
    });
  }, [termoBuscaNorm]);

  const loopedDisciplinas = useMemo(() => {
    if (disciplinasFiltradas.length <= 1) return disciplinasFiltradas;
    return [
      ...disciplinasFiltradas,
      ...disciplinasFiltradas,
      ...disciplinasFiltradas,
    ];
  }, [disciplinasFiltradas]);

  const disciplinaAtual = useMemo(() => {
    return DISCIPLINAS_CATALOGO.find(d => d.id === disciplinaSelecionadaId) || null;
  }, [disciplinaSelecionadaId]);

  const materiaAtual = useMemo(() => {
    return MATERIAS_CATALOGO.find(m => m.id === materiaSelecionadaId) || null;
  }, [materiaSelecionadaId]);

  // Seleção direta de disciplina: 100% precisa e sem dependência de índices voláteis
  const handleSelectDisciplina = useCallback((discId: string) => {
    try { haptic.impact('medium'); } catch {}
    setDisciplinaSelecionadaId(discId);
    setMateriaSelecionadaId(null);
    resetScrollToTop();
  }, []);

  // Índice inicial no bloco do meio para rotação contínua e capa centralizada a 0ms
  const initialCoverflowIndex = useMemo(() => {
    const N = disciplinasFiltradas.length;
    return N > 1 ? N : 0;
  }, [disciplinasFiltradas.length]);

  // Hook da Física do Coverflow 3D a 120fps
  const coverflow = useAulasCoverflow({
    totalItems: disciplinasFiltradas.length,
    initialIndex: initialCoverflowIndex,
    enabled: !disciplinaSelecionadaId && abaAtiva === 'trilhas',
    onSelectCurrent: () => {
      if (disciplinasFiltradas.length === 0) return;
      const safeIdx = ((coverflow.activeCarouselIndex % disciplinasFiltradas.length) + disciplinasFiltradas.length) % disciplinasFiltradas.length;
      const target = disciplinasFiltradas[safeIdx] || disciplinasFiltradas[0];
      if (target) handleSelectDisciplina(target.id);
    },
  });

  const handleSelectCurrent = useCallback((targetDiscId?: string) => {
    if (targetDiscId) {
      handleSelectDisciplina(targetDiscId);
      return;
    }
    if (disciplinasFiltradas.length === 0) return;
    const safeIdx = ((coverflow.activeCarouselIndex % disciplinasFiltradas.length) + disciplinasFiltradas.length) % disciplinasFiltradas.length;
    const target = disciplinasFiltradas[safeIdx] || disciplinasFiltradas[0];
    if (target) {
      handleSelectDisciplina(target.id);
    }
  }, [coverflow.activeCarouselIndex, disciplinasFiltradas, handleSelectDisciplina]);

  // Botão voltar com hierarquia de níveis
  const handleVoltar = useCallback(() => {
    setBuscaTermo('');
    setBuscaTermoAulas('');
    if (aulaAtiva) {
      setAulaAtiva(null);
    } else if (aulaSheetDetalhe) {
      setAulaSheetDetalhe(null);
    } else if (materiaSelecionadaId) {
      setMateriaSelecionadaId(null);
    } else if (disciplinaSelecionadaId) {
      setDisciplinaSelecionadaId(null);
    } else {
      navigate('/admin-funcoes');
    }
    resetScrollToTop();
  }, [aulaAtiva, aulaSheetDetalhe, disciplinaSelecionadaId, materiaSelecionadaId, navigate]);

  // Iniciar Aula Interativa
  const handleIniciarAula = useCallback((aula: AulaItem) => {
    registrarInicioAula(aula);
    setAulaAtiva(aula);
    resetScrollToTop();
  }, [registrarInicioAula]);

  // Abrir Modal de Flashcards com checagem de trava
  const handleAbrirFlashcards = useCallback((aula: AulaItem) => {
    const prog = calcularProgressoCiclo(aula);
    const liberado = prog.aulaTerminada || modoLivreTeste;
    if (!liberado) {
      setToastAviso('Complete a aula interativa primeiro para liberar a revisão com Flashcards!');
      return;
    }
    setModalFlashcardsAula(aula);
  }, [calcularProgressoCiclo, modoLivreTeste, setToastAviso]);

  // Abrir Modal de Questões com checagem de trava
  const handleAbrirQuestoes = useCallback((aula: AulaItem) => {
    const prog = calcularProgressoCiclo(aula);
    const liberado = (prog.aulaTerminada && prog.fcOk) || modoLivreTeste;
    if (!liberado) {
      setToastAviso('Conclua os Flashcards de revisão primeiro para liberar as Questões práticas!');
      return;
    }
    setModalQuestoesAula(aula);
  }, [calcularProgressoCiclo, modoLivreTeste, setToastAviso]);

  const handleCardClick = useCallback((disc: DisciplinaItem, idx: number) => {
    if (coverflow.isDraggingRef.current) return;
    try { haptic.selection(); } catch {}
    if (idx !== coverflow.activeCarouselIndex) {
      coverflow.playPageTurnSound();
      coverflow.scrollCarouselToIndex(idx);
    } else {
      handleSelectDisciplina(disc.id);
    }
  }, [coverflow, handleSelectDisciplina]);

  // Pré-aquecimento de capas na seleção de disciplinas
  useEffect(() => {
    if (!disciplinaSelecionadaId) return;
    const mats = MATERIAS_CATALOGO.filter((m) => m.disciplinaId === disciplinaSelecionadaId);
    mats.forEach((m) => {
      if (m.capaUrl) {
        const img = new Image();
        img.src = m.capaUrl;
      }
    });
    const aulas = AULAS_CATALOGO.filter((a) => a.disciplinaId === disciplinaSelecionadaId).slice(0, 30);
    aulas.forEach((a) => {
      if (a.capaUrl) {
        const img = new Image();
        img.src = a.capaUrl;
      }
    });
  }, [disciplinaSelecionadaId]);

  // ══════════════════════════════════════════════════════════════════════════
  // NÍVEL 4: TELA CHEIA DA AULA INTERATIVA (PLAYER NATIVO COM CODE SPLITTING)
  // ══════════════════════════════════════════════════════════════════════════
  if (aulaAtiva) {
    const discAtual = DISCIPLINAS_CATALOGO.find(d => d.id === aulaAtiva.disciplinaId) || DISCIPLINAS_CATALOGO[0];
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-[#0D0D0D] flex items-center justify-center text-white font-sans text-sm">Carregando aula interativa...</div>}>
        <PlayerAulaNativo
          aula={aulaAtiva}
          disciplinaNome={discAtual.nome}
          corDestaque={discAtual.corDestaque}
          onVoltar={() => setAulaAtiva(null)}
          onConcluir={(totalEtapas) => {
            concluirAulaManual(aulaAtiva.id, totalEtapas);
            setAulaAtiva(null);
          }}
          onProgresso={(etapaAtual) => {
            atualizarEtapaManual(aulaAtiva.id, etapaAtual);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-[calc(7.5rem+env(safe-area-inset-bottom,24px))] relative overflow-x-hidden">
      {/* Fundo ShapeGrid Dinâmico */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0D0D0D]">
        <ShapeGrid
          key={disciplinaAtual ? disciplinaAtual.id : 'home'}
          speed={0.6}
          squareSize={40}
          direction="diagonal"
          borderColor={disciplinaAtual ? `${disciplinaAtual.corDestaque}28` : "rgba(255, 255, 255, 0.04)"}
          hoverFillColor={disciplinaAtual ? `${disciplinaAtual.corDestaque}40` : "rgba(255, 255, 255, 0.08)"}
          shape="square"
          hoverTrailAmount={6}
        />
      </div>

      {/* Glow Atmosférico Temático da Disciplina */}
      {disciplinaAtual && (
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 opacity-20"
          style={{
            background: `radial-gradient(ellipse 90% 55% at 50% 15%, ${disciplinaAtual.corDestaque}45, transparent 75%)`
          }}
        />
      )}

      {/* Toast Flutuante de Alerta */}
      {toastAviso && (
        <div className="fixed top-5 inset-x-4 max-w-md mx-auto z-[150] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="rounded-2xl bg-black/90 backdrop-blur-md border border-white/20 p-3.5 shadow-2xl flex items-center gap-3 text-white">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs font-medium leading-snug flex-1">{toastAviso}</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          NÍVEL 1: HOME GERAL DE AULAS INTERATIVAS (CARROSSEL COVERFLOW 3D)
         ══════════════════════════════════════════════════════════════════════════ */}
      {!disciplinaSelecionadaId && (
        <>
          {abaAtiva === 'trilhas' && (
            <AulasCoverflowHome
              disciplinasFiltradas={disciplinasFiltradas}
              loopedDisciplinas={loopedDisciplinas}
              activeCarouselIndex={coverflow.activeCarouselIndex}
              onSelectCurrent={handleSelectCurrent}
              onSelectDisciplina={handleSelectDisciplina}
              onCardClick={handleCardClick}
              handleVoltar={handleVoltar}
              buscaTermo={buscaTermo}
              setBuscaTermo={setBuscaTermo}
              abaAtiva={abaAtiva}
              setAbaAtiva={setAbaAtiva}
              porcentagemGeral={porcentagemGeral}
              totalAulas={AULAS_CATALOGO.length}
              aulasCatalogo={AULAS_CATALOGO}
              carouselScrollerRef={coverflow.carouselScrollerRef}
              handleCarouselScroll={coverflow.handleCarouselScroll}
              handlePointerDown={coverflow.handlePointerDown}
              handlePointerMove={coverflow.handlePointerMove}
              handlePointerUp={coverflow.handlePointerUp}
              handlePrev={coverflow.handlePrev}
              handleNext={coverflow.handleNext}
              scrollCarouselToIndex={coverflow.scrollCarouselToIndex}
            />
          )}

          {/* Abas Analíticas Secundárias */}
          {abaAtiva === 'progresso' && (
            <div className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto my-2 px-2 pt-16">
              <AulasTabProgresso
                materias={MATERIAS_CATALOGO}
                aulas={AULAS_CATALOGO}
                calcularProgressoCiclo={calcularProgressoCiclo}
                onIniciarAula={handleIniciarAula}
                onSelecionarMateria={(matId) => {
                  const mat = MATERIAS_CATALOGO.find(m => m.id === matId);
                  if (mat) {
                    setDisciplinaSelecionadaId(mat.disciplinaId);
                    setMateriaSelecionadaId(mat.id);
                    setAbaAtiva('trilhas');
                    resetScrollToTop();
                  }
                }}
                corDestaque="#f59e0b"
              />
            </div>
          )}

          {abaAtiva === 'favoritos' && (
            <div className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto my-2 px-2 pt-16">
              <AulasTabFavoritos
                aulasFavoritas={AULAS_CATALOGO.filter(a => favoritosIds.has(a.id))}
                onIniciarAula={handleIniciarAula}
                onAlternarFavorito={alternarFavorito}
                corDestaque="#f59e0b"
                onVoltarParaTrilhas={() => setAbaAtiva('trilhas')}
              />
            </div>
          )}

          {abaAtiva === 'estatisticas' && (
            <div className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto my-2 px-2 pt-16">
              <AulasTabEstatisticas
                materias={MATERIAS_CATALOGO}
                aulas={AULAS_CATALOGO}
                calcularProgressoCiclo={calcularProgressoCiclo}
                acertosMap={acertosMap}
                corDestaque="#f59e0b"
                onSelecionarMateria={(matId) => {
                  const mat = MATERIAS_CATALOGO.find(m => m.id === matId);
                  if (mat) {
                    setDisciplinaSelecionadaId(mat.disciplinaId);
                    setMateriaSelecionadaId(mat.id);
                    setAbaAtiva('trilhas');
                    resetScrollToTop();
                  }
                }}
              />
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          NÍVEL 2: TRILHA DE MATÉRIAS DA DISCIPLINA SELECIONADA
         ══════════════════════════════════════════════════════════════════════════ */}
      {disciplinaSelecionadaId && disciplinaAtual && (
        <AulasTrilhaMateriaView
          disciplinaAtual={disciplinaAtual}
          materiasDaDisc={MATERIAS_CATALOGO.filter(m => m.disciplinaId === disciplinaAtual.id)}
          aulasCatalogo={AULAS_CATALOGO}
          buscaTermo={buscaTermo}
          setBuscaTermo={setBuscaTermo}
          handleVoltar={handleVoltar}
          onSelecionarMateria={(matId) => {
            setMateriaSelecionadaId(matId);
            setAulaSheetDetalhe(null);
            setBuscaTermoAulas('');
            resetScrollToTop();
          }}
          calcularProgressoCiclo={calcularProgressoCiclo}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          NÍVEIS 3 & 4: SHEETS DESLIZANTES
         ══════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {disciplinaSelecionadaId && materiaSelecionadaId && materiaAtual && disciplinaAtual && (
          <AulasMateriaSheet
            disciplinaAtual={disciplinaAtual}
            materiaAtual={materiaAtual}
            matsDaDisc={MATERIAS_CATALOGO.filter(m => m.disciplinaId === disciplinaAtual.id)}
            aulasDaMateria={AULAS_CATALOGO.filter(a => a.materiaId === materiaAtual.id)}
            buscaTermoAulas={buscaTermoAulas}
            setBuscaTermoAulas={setBuscaTermoAulas}
            onFechar={() => {
              setAulaSheetDetalhe(null);
              setMateriaSelecionadaId(null);
              setBuscaTermoAulas('');
            }}
            onSelecionarAula={(aula) => setAulaSheetDetalhe(aula)}
            calcularProgressoCiclo={calcularProgressoCiclo}
          />
        )}

        {aulaSheetDetalhe && disciplinaAtual && (
          <AulasDetalheSheet
            aula={aulaSheetDetalhe}
            disciplinaAtual={disciplinaAtual}
            onFechar={() => setAulaSheetDetalhe(null)}
            onIniciarAula={handleIniciarAula}
            onAbrirFlashcards={handleAbrirFlashcards}
            onAbrirQuestoes={handleAbrirQuestoes}
            onBloqueio={(aula, motivo) => setModalBloqueioAula({ aula, motivo })}
            calcularProgressoCiclo={calcularProgressoCiclo}
            modoLivreTeste={modoLivreTeste}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAIS SECUNDÁRIOS COM LAZY LOADING
         ══════════════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={null}>
        {modalFlashcardsAula && CONTEUDO_AULAS[modalFlashcardsAula.id] && (
          <ModalRevisarFlashcards
            tituloAula={`${modalFlashcardsAula.numeroAula} · ${modalFlashcardsAula.titulo}`}
            flashcards={CONTEUDO_AULAS[modalFlashcardsAula.id].flashcards}
            onFechar={() => setModalFlashcardsAula(null)}
            onConcluir={() => {
              concluirFlashcards(modalFlashcardsAula.id);
              setModalFlashcardsAula(null);
            }}
          />
        )}

        {modalQuestoesAula && CONTEUDO_AULAS[modalQuestoesAula.id] && (
          <ModalPraticarQuestoes
            tituloAula={`${modalQuestoesAula.numeroAula} · ${modalQuestoesAula.titulo}`}
            questoes={CONTEUDO_AULAS[modalQuestoesAula.id].questoes}
            onFechar={() => setModalQuestoesAula(null)}
            onConcluir={() => {
              concluirQuestoes(modalQuestoesAula.id);
              setModalQuestoesAula(null);
            }}
          />
        )}
      </Suspense>

      {/* Modal Centralizado de Etapa Bloqueada */}
      {modalBloqueioAula && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setModalBloqueioAula(null)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl border border-white/20 bg-zinc-950 p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-950/50">
              <Lock className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
              Etapa Bloqueada
            </h3>

            <p className="text-sm text-zinc-300 leading-relaxed mb-6">
              Você precisa terminar a aula interativa primeiro para poder revisar e praticar!
            </p>

            <div className="flex flex-col w-full gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const aula = modalBloqueioAula.aula;
                  setModalBloqueioAula(null);
                  handleIniciarAula(aula);
                }}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 active:scale-95 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Aula Agora</span>
              </button>

              <button
                type="button"
                onClick={() => setModalBloqueioAula(null)}
                className="w-full h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs uppercase tracking-wider border border-white/10 active:scale-95 transition cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Aula em Produção / Em Breve */}
      {aulaPendenteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#131318] border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 bg-black/40 border border-white/10">
              <img 
                src={assetUrl(aulaPendenteModal.capaUrl) || assetUrl(disciplinaAtual?.capaHeroUrl)} 
                alt={aulaPendenteModal.titulo}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = assetUrl(disciplinaAtual?.capaHeroUrl || 'direito-penal.webp');
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131318] via-transparent to-transparent" />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/20 text-white">
                {aulaPendenteModal.numeroAula}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Em Produção Multimídia
              </span>
            </div>

            <h3 className="text-lg font-black text-white leading-tight mb-2">
              {aulaPendenteModal.titulo}
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Esta aula está em processo de sincronização e gravação de áudio e interações. As Aulas 01 e 02 das matérias base já estão 100% disponíveis para estudo com narração ativa agora!
            </p>

            <button
              type="button"
              onClick={() => setAulaPendenteModal(null)}
              className="w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-950/50 active:scale-95 transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
