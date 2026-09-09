import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  List,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useGoBack } from '@/hooks/useGoBack';

import { iconePorTipo, rotuloPorTipo } from '@/lib/aprenderUtils';
import { useAprenderAula } from '@/hooks/domain/useAprenderAula';
import { BlocoView } from '@/components/aprender/BlocoView';
import { AulaConcluidaScreen } from '@/components/aprender/AulaConcluidaScreen';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AulaPreviaScreen, type PreviaAula } from '@/components/aprender/AulaPreviaScreen';
import { haptic } from '@/lib/nativeHaptics';

const AprenderAula = () => {
  useTrackArea("aprender_aula_iniciada");
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { aulaId } = useParams<{ aulaId: string }>();
  const { user } = useAuth();

  const {
    aula, blocos, loading, proximaAula, total,
    currentIdx, setCurrentIdx, respostas, flipped, setFlipped, conexoes, setConexoes,
    finalizada, mostrarPrevia, progressoSalvo,
    feedbackPergunta, setFeedbackPergunta,
    maxRevealedIdx, acertos, perguntas,
    playFlipSound,
    avaliarFlashcard, responderPergunta, concluirAula, salvarBloco,
    refazerAula, comecarAula, continuarAula,
  } = useAprenderAula(aulaId, user);

  const [sumarioOpen, setSumarioOpen] = useState(false);
  const [highestVisible, setHighestVisible] = useState(0);
  const [direction, setDirection] = useState(1);
  const cardScrollRef = useRef<HTMLDivElement>(null);

  // Referências para detecção de gestos (Swipe Touch + Drag Mouse)
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const mouseStartX = useRef<number>(0);
  const mouseStartY = useRef<number>(0);
  const isMouseDown = useRef<boolean>(false);
  const hasMouseDragged = useRef<boolean>(false);

  const goToPage = useCallback((newIdx: number) => {
    haptic.selection();
    const clamped = Math.max(0, Math.min(total - 1, newIdx));
    setDirection(clamped >= currentIdx ? 1 : -1);
    setCurrentIdx(clamped);
    setHighestVisible((prev) => Math.max(prev, clamped));
    if (cardScrollRef.current) {
      cardScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [total, currentIdx, setCurrentIdx]);

  // Gestos Touch (Mobile / Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchStartX.current - touchEndX;
    const dy = touchStartY.current - touchEndY;

    // Apenas dispara se o deslize horizontal for preponderante (evita conflito com scroll vertical)
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx > 0 && currentIdx < total - 1) {
        goToPage(currentIdx + 1);
      } else if (dx < 0 && currentIdx > 0) {
        goToPage(currentIdx - 1);
      }
    }
  };

  // Gestos Mouse (Desktop / Laptop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) {
      return;
    }
    isMouseDown.current = true;
    hasMouseDragged.current = false;
    mouseStartX.current = e.clientX;
    mouseStartY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 8) {
      hasMouseDragged.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    if (hasMouseDragged.current) {
      const dx = mouseStartX.current - e.clientX;
      const dy = mouseStartY.current - e.clientY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && currentIdx < total - 1) {
          goToPage(currentIdx + 1);
        } else if (dx < 0 && currentIdx > 0) {
          goToPage(currentIdx - 1);
        }
      }
    }
    hasMouseDragged.current = false;
  };

  const handleMouseLeave = () => {
    isMouseDown.current = false;
    hasMouseDragged.current = false;
  };

  // Navegação por teclado (Setas Esquerda e Direita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedbackPergunta || sumarioOpen) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentIdx < total - 1) goToPage(currentIdx + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentIdx > 0) goToPage(currentIdx - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, total, goToPage, feedbackPergunta, sumarioOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] p-6">
        <div className="mx-auto max-w-2xl space-y-6 pt-20">
          <div className="h-6 w-48 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-white/5 animate-pulse" />
          <div className="h-40 rounded-2xl bg-white/5 animate-pulse mt-8" />
        </div>
      </div>
    );
  }

  if (!aula || total === 0) {
    return (
      <div className="min-h-screen bg-[#0f1115] p-6 text-center flex items-center justify-center flex-col gap-4">
        <BookOpen className="w-12 h-12 text-white/20" />
        <p className="text-neutral-400 text-lg">Aula não encontrada ou sem conteúdo.</p>
        <button onClick={() => navigate('/aprender')} className="text-primary underline text-sm">
          Voltar
        </button>
      </div>
    );
  }

  if (mostrarPrevia && !finalizada) {
    const previaFallback: PreviaAula | null = aula.previa ?? (aula.objetivo ? { porque_importa: aula.objetivo } : null);
    const continuarDe = Math.min(Math.max(progressoSalvo, 0), total - 1);
    const pctProgresso = total > 0 ? Math.round((Math.min(progressoSalvo, total) / total) * 100) : 0;

    return (
      <AulaPreviaScreen
        titulo={aula.titulo}
        objetivo={aula.objetivo}
        duracaoMin={aula.duracao_est_min || 10}
        previa={previaFallback}
        progressoPct={pctProgresso}
        podeContinuar={continuarDe > 0 && pctProgresso < 100}
        onVoltar={() => goBack()}
        onComecar={comecarAula}
        onContinuar={() => continuarAula(continuarDe)}
      />
    );
  }

  if (finalizada) {
    return (
      <AulaConcluidaScreen
        aula={aula}
        total={total}
        perguntas={perguntas}
        acertos={acertos}
        proximaAula={proximaAula}
        onRefazer={refazerAula}
      />
    );
  }

  const blocoAtual = blocos[currentIdx] || blocos[0];
  const canFinish = currentIdx >= total - 1 || highestVisible >= total - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-[#0f1115] text-neutral-100 selection:bg-primary/30">
      {/* ── Header editorial com Linha do Tempo no topo ── */}
      <header
        className="sticky top-0 z-30 bg-[#14161f]/95 backdrop-blur-xl border-b border-white/[0.08]"
        style={{ paddingTop: 'calc(var(--sai-top) + 0.25rem)' }}
      >
        {/* ── Linha do Tempo na parte superior (Timeline de Páginas) ── */}
        <div
          className="max-w-4xl mx-auto px-4 pt-2.5 pb-1"
          role="navigation"
          aria-label="Linha do tempo das páginas da aula"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 w-full">
            {blocos.map((b, i) => {
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={b.id}
                  onClick={() => goToPage(i)}
                  className="group relative flex-1 py-2 -my-2 cursor-pointer focus:outline-none"
                  aria-label={`Ir para página ${i + 1} de ${total}: ${rotuloPorTipo(b.tipo)}`}
                  title={`Página ${i + 1} de ${total} • ${rotuloPorTipo(b.tipo)}`}
                >
                  <div
                    className={`h-[3.5px] sm:h-1 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]'
                        : isCurrent
                        ? 'bg-primary shadow-[0_0_12px_hsl(var(--primary))] scale-y-125'
                        : 'bg-white/15 group-hover:bg-white/25'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Linha de navegação e título */}
        <div
          className="flex items-center justify-between py-2 max-w-4xl mx-auto"
          style={{
            paddingLeft: 'calc(1rem + var(--sai-left))',
            paddingRight: 'calc(1rem + var(--sai-right))',
          }}
        >
          <button
            onClick={() => {
              haptic.impact('light');
              goBack();
            }}
            aria-label="Voltar"
            className="flex w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] active:scale-95 transition-all text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="flex flex-col items-center text-center flex-1 min-w-0 px-4">
            <p className="text-[14px] sm:text-[15px] font-bold text-white truncate max-w-[280px] sm:max-w-none leading-tight font-display">
              {aula.titulo}
            </p>
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mt-0.5">
              Página {currentIdx + 1} de {total} • {rotuloPorTipo(blocoAtual.tipo)}
            </p>
          </div>

          <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0" />
        </div>
      </header>

      {/* ── Corpo da aula paginado — estética editorial tipo blog ── */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 py-4 sm:py-6 overflow-hidden max-w-4xl w-full mx-auto pb-24 relative">
        {/* Setas Flutuantes Laterais para Navegação Rápida em Telas Maiores */}
        {currentIdx > 0 && (
          <button
            onClick={() => goToPage(currentIdx - 1)}
            aria-label="Página anterior"
            className="hidden lg:flex absolute -left-5 xl:-left-7 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-[#181a26] border border-white/10 text-white/70 hover:text-white hover:bg-[#222536] hover:scale-110 shadow-xl transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIdx < total - 1 && (
          <button
            onClick={() => goToPage(currentIdx + 1)}
            aria-label="Próxima página"
            className="hidden lg:flex absolute -right-5 xl:-right-7 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-[#181a26] border border-white/10 text-white/70 hover:text-white hover:bg-[#222536] hover:scale-110 shadow-xl transition-all cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full flex-1 flex flex-col bg-[#161822] border border-white/[0.08] rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl shadow-black/40 overflow-hidden relative select-none md:cursor-grab md:active:cursor-grabbing"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={blocoAtual.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 35 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 35 }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              className="flex-1 flex flex-col overflow-hidden select-text"
            >
              {/* Conteúdo com scroll interno delimitado à página atual */}
              <div
                ref={cardScrollRef}
                className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4"
              >
                <BlocoView
                  bloco={blocoAtual}
                  resposta={respostas[blocoAtual.id]}
                  onResponder={(escolha) => responderPergunta(blocoAtual, escolha)}
                  flipped={!!flipped[blocoAtual.id]}
                  onFlip={() => {
                    playFlipSound();
                    setFlipped((f) => ({ ...f, [blocoAtual.id]: !f[blocoAtual.id] }));
                  }}
                  onAvaliarFlash={(nivel) => avaliarFlashcard(blocoAtual, nivel)}
                  conexao={conexoes[blocoAtual.id]}
                  onConexao={async (map, done) => {
                    setConexoes((c) => ({ ...c, [blocoAtual.id]: map }));
                    if (done) {
                      const pares = blocoAtual.payload?.pares || [];
                      const acertou = pares.every((_: any, i: number) => map[i] === i);
                      await salvarBloco(blocoAtual, { map }, acertou);
                    }
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dica sutil de navegação por gesto */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 select-none pt-2">
          <span>Deslize</span>
          <span className="inline-flex items-center text-primary font-bold">← →</span>
          <span>para navegar</span>
        </div>
      </main>

      {/* ── Barra inferior: APENAS sumário + quantas páginas tem + navegação ── */}
      <nav
        aria-label="Navegação da aula"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#14161f]/95 backdrop-blur-xl flex items-center justify-between"
        style={{
          paddingBottom: 'calc(0.75rem + var(--sai-bottom))',
          paddingLeft: 'calc(1.25rem + var(--sai-left))',
          paddingRight: 'calc(1.25rem + var(--sai-right))',
          paddingTop: '0.75rem',
        }}
      >
        <button
          onClick={() => {
            haptic.selection();
            setSumarioOpen(true);
          }}
          className="flex items-center gap-2.5 h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all shadow-sm"
          aria-label="Abrir sumário da aula"
        >
          <List className="h-5 w-5 text-primary" />
          <span className="text-[14px] font-semibold tracking-wide">Sumário</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-xl bg-white/[0.05] border border-white/[0.08] p-0.5">
            <button
              onClick={() => goToPage(currentIdx - 1)}
              disabled={currentIdx <= 0}
              aria-label="Página anterior"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-[13px] font-semibold tabular-nums text-neutral-300 px-3 min-w-[90px] text-center select-none">
              {currentIdx + 1} de {total}
            </span>

            <button
              onClick={() => goToPage(currentIdx + 1)}
              disabled={currentIdx >= total - 1}
              aria-label="Próxima página"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {canFinish && (
            <button
              onClick={() => {
                haptic.impact('medium');
                concluirAula();
              }}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 text-[13px] font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/25"
            >
              Concluir <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </nav>

      {/* Modal de Feedback de Questão */}
      <AnimatePresence>
        {feedbackPergunta && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setFeedbackPergunta(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-h-[85vh] rounded-t-[2.5rem] border-t border-white/10 bg-[#161822] p-6 sm:p-8 pb-[calc(2rem+var(--sai-bottom))] shadow-2xl flex flex-col text-neutral-100"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3.5">
                  {feedbackPergunta.correta ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50">
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50">
                      <XCircle className="h-7 w-7 text-rose-400" />
                    </div>
                  )}
                  <div>
                    <h3 className={`font-display text-xl font-bold tracking-tight ${feedbackPergunta.correta ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {feedbackPergunta.correta ? 'Você acertou!' : 'Você errou'}
                    </h3>
                    <p className="text-sm text-neutral-300">
                      {feedbackPergunta.correta ? 'Excelente raciocínio!' : 'Revise o comentário do professor e continue.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFeedbackPergunta(null)}
                  aria-label="Fechar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-2 pb-6 flex-1">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary mb-2">Comentário do Professor</p>
                <div className="rounded-2xl border border-white/10 bg-[#12141c] p-5 text-[15px] leading-relaxed text-neutral-100 whitespace-pre-wrap shadow-inner">
                  {feedbackPergunta.explicacao || 'Nenhum comentário disponível para esta questão.'}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setFeedbackPergunta(null);
                    if (currentIdx < total - 1) {
                      goToPage(currentIdx + 1);
                    }
                  }}
                  className={`w-full rounded-2xl px-6 py-4 text-[16px] font-extrabold text-white shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                    feedbackPergunta.correta ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {currentIdx < total - 1 ? 'Próxima Página' : 'Concluir'} <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sheet do Sumário da aula ── */}
      <Sheet open={sumarioOpen} onOpenChange={setSumarioOpen}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-[2rem] p-0 bg-[#161822] border-t border-white/10 text-white">
          <SheetHeader className="border-b border-white/5 p-5">
            <SheetTitle className="text-left text-lg font-bold text-white flex items-center gap-2.5">
              <List className="w-5 h-5 text-primary" />
              Sumário da aula
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto p-4 space-y-1.5 max-h-[calc(75vh-80px)]">
            {blocos.map((b, i) => {
              const Icon = iconePorTipo(b.tipo);
              const titulo = b.payload?.titulo || b.payload?.enunciado || b.payload?.frente || rotuloPorTipo(b.tipo);
              const isCurrent = i === currentIdx;
              const isPassed = i <= highestVisible;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSumarioOpen(false);
                    goToPage(i);
                  }}
                  className={`flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-all active:scale-[0.99] ${
                    isCurrent ? 'bg-white/10 border border-primary/40' : 'hover:bg-white/[0.05]'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                        : isPassed
                        ? 'bg-primary/30 text-primary-foreground'
                        : 'bg-white/5 text-neutral-400 border border-white/5'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                      Página {i + 1} de {total} • {rotuloPorTipo(b.tipo)}
                    </p>
                    <p className="truncate font-semibold text-white/95 text-[14px]">{titulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AprenderAula;
