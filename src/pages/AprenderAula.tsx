import { useEffect, useRef, useState, useCallback } from 'react';
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
import { motion, AnimatePresence, useInView } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useGoBack } from '@/hooks/useGoBack';

import { iconePorTipo, rotuloPorTipo, type Bloco } from '@/lib/aprenderUtils';
import { useAprenderAula } from '@/hooks/domain/useAprenderAula';
import { BlocoView } from '@/components/aprender/BlocoView';
import { AulaConcluidaScreen } from '@/components/aprender/AulaConcluidaScreen';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AulaPreviaScreen, type PreviaAula } from '@/components/aprender/AulaPreviaScreen';
import { haptic } from '@/lib/nativeHaptics';

/* ── Bloco com reveal no scroll ── */
function ScrollRevealBloco({
  bloco,
  index,
  total,
  respostas,
  flipped,
  conexoes,
  onResponder,
  onFlip,
  onAvaliarFlash,
  onConexao,
  onBlocoVisible,
}: {
  bloco: Bloco;
  index: number;
  total: number;
  respostas: Record<string, { correta: boolean; escolha?: string }>;
  flipped: Record<string, boolean>;
  conexoes: Record<string, Record<number, number | null>>;
  onResponder: (escolha: string) => void;
  onFlip: () => void;
  onAvaliarFlash: (nivel: any) => void;
  onConexao: (map: Record<number, number | null>, done: boolean) => void;
  onBlocoVisible: (idx: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' });
  const isExercicio = ['pergunta', 'flashcard', 'conexao'].includes(bloco.tipo);

  useEffect(() => {
    if (isInView) onBlocoVisible(index);
  }, [isInView, index, onBlocoVisible]);

  return (
    <motion.div
      ref={ref}
      id={`bloco-${index}`}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="w-full"
    >
      {/* Separador visual entre blocos de exercício */}
      {isExercicio && (
        <div className="flex items-center gap-4 my-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/60">
            Pratique agora
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      )}

      <BlocoView
        bloco={bloco}
        resposta={respostas[bloco.id]}
        onResponder={onResponder}
        flipped={!!flipped[bloco.id]}
        onFlip={onFlip}
        onAvaliarFlash={onAvaliarFlash}
        conexao={conexoes[bloco.id]}
        onConexao={onConexao}
      />

      {/* Separador sutil entre blocos de leitura */}
      {!isExercicio && index < total - 1 && (
        <div className="my-6 flex justify-center">
          <div className="w-8 h-[2px] rounded-full bg-white/[0.06]" />
        </div>
      )}
    </motion.div>
  );
}

/* ────────────────────────────────────────── */

const AprenderAula = () => {
  useTrackArea("aprender_aula_iniciada");
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { aulaId } = useParams<{ aulaId: string }>();
  const { user } = useAuth();
  
  const {
    aula, blocos, loading, proximaAula, proximasAulas, total,
    currentIdx, setCurrentIdx, respostas, flipped, setFlipped, conexoes, setConexoes,
    finalizada, mostrarPrevia, progressoSalvo,
    feedbackPergunta, setFeedbackPergunta,
    maxRevealedIdx, acertos, perguntas,
    playFlipSound, playSwooshSound,
    avaliarFlashcard, responderPergunta, concluirAula, salvarBloco,
    refazerAula, comecarAula, continuarAula, avancarIdx, voltarIdx
  } = useAprenderAula(aulaId, user);

  const [sumarioOpen, setSumarioOpen] = useState(false);
  const [highestVisible, setHighestVisible] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll e detecção da página/bloco ativo para a Linha do Tempo
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight > 0) setScrollProgress(Math.min(scrollTop / scrollHeight, 1));

      const containerTop = el.getBoundingClientRect().top;
      const triggerY = containerTop + 140;

      let active = 0;
      for (let i = 0; i < total; i++) {
        const item = document.getElementById(`bloco-${i}`);
        if (item) {
          const rect = item.getBoundingClientRect();
          if (rect.top <= triggerY) {
            active = i;
          }
        }
      }
      setCurrentIdx(active);
      setHighestVisible(prev => Math.max(prev, active));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [loading, mostrarPrevia, finalizada, total, setCurrentIdx]);

  const scrollToBloco = useCallback((idx: number) => {
    haptic.selection();
    const targetIdx = Math.max(0, Math.min(total - 1, idx));
    const item = document.getElementById(`bloco-${targetIdx}`);
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentIdx(targetIdx);
      setHighestVisible(prev => Math.max(prev, targetIdx));
    }
  }, [total, setCurrentIdx]);

  const handleBlocoVisible = useCallback((idx: number) => {
    setHighestVisible(prev => Math.max(prev, idx));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] p-6">
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
      <div className="min-h-screen bg-[#0D0D0D] p-6 text-center flex items-center justify-center flex-col gap-4">
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

  const canFinish = highestVisible >= total - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-[#0D0D0D]">
      {/* ── Header fixo com Linha do Tempo no topo ── */}
      <header
        className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/[0.06]"
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
                  onClick={() => scrollToBloco(i)}
                  className="group relative flex-1 py-1.5 -my-1.5 cursor-pointer focus:outline-none"
                  aria-label={`Ir para página ${i + 1} de ${total}: ${rotuloPorTipo(b.tipo)}`}
                  title={`Página ${i + 1} de ${total} • ${rotuloPorTipo(b.tipo)}`}
                >
                  <div
                    className={`h-[3px] sm:h-1 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-primary'
                        : isCurrent
                        ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary))] scale-y-125'
                        : 'bg-white/10 group-hover:bg-white/20'
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
            className="flex w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] active:scale-95 transition-all text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          <div className="flex flex-col items-center text-center flex-1 min-w-0 px-4">
            <p className="text-[14px] font-bold text-white/95 truncate max-w-[260px] sm:max-w-none leading-tight">
              {aula.titulo}
            </p>
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mt-0.5">
              Página {currentIdx + 1} de {total} • {rotuloPorTipo(blocos[currentIdx]?.tipo || 'leitura')}
            </p>
          </div>

          <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0" />
        </div>
      </header>

      {/* ── Corpo da aula — scroll contínuo editorial ── */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        <div className="mx-auto w-full max-w-3xl px-5 md:px-8 lg:px-12 pt-8 md:pt-12 pb-40">
          {/* Cabeçalho editorial da aula */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 md:mb-16"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <span className="h-[3px] w-8 rounded-full bg-primary" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">
                Aula
              </span>
            </div>
            <h1 className="font-sans text-[28px] sm:text-[34px] md:text-[40px] font-black tracking-tight text-white leading-[1.15]">
              {aula.titulo}
            </h1>
            {aula.objetivo && (
              <p className="mt-4 text-[16px] md:text-[18px] leading-relaxed text-neutral-400 max-w-[60ch]">
                {aula.objetivo}
              </p>
            )}
            <div className="mt-6 flex items-center gap-4 text-neutral-500 text-[13px]">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {total} etapas
              </span>
              {aula.duracao_est_min && (
                <span>~{aula.duracao_est_min} min</span>
              )}
            </div>
          </motion.div>

          {/* Blocos da aula — scroll contínuo */}
          <div className="space-y-2">
            {blocos.map((bloco, idx) => (
              <ScrollRevealBloco
                key={bloco.id}
                bloco={bloco}
                index={idx}
                total={total}
                respostas={respostas}
                flipped={flipped}
                conexoes={conexoes}
                onResponder={(escolha) => responderPergunta(bloco, escolha)}
                onFlip={() => {
                  playFlipSound();
                  setFlipped((f) => ({ ...f, [bloco.id]: !f[bloco.id] }));
                }}
                onAvaliarFlash={(nivel) => avaliarFlashcard(bloco, nivel)}
                onConexao={async (map, done) => {
                  setConexoes((c) => ({ ...c, [bloco.id]: map }));
                  if (done) {
                    const pares = bloco.payload?.pares || [];
                    const acertou = pares.every((_: any, i: number) => map[i] === i);
                    await salvarBloco(bloco, { map }, acertou);
                  }
                }}
                onBlocoVisible={handleBlocoVisible}
              />
            ))}
          </div>

          {/* Botão de Concluir no final */}
          {canFinish && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
                <CheckCircle2 className="w-5 h-5 text-primary/60" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
              </div>
              <p className="text-neutral-400 text-sm">Você chegou ao final da aula</p>
              <button
                onClick={concluirAula}
                className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-primary text-primary-foreground px-10 font-bold text-lg hover:bg-primary/90 active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="h-5 w-5" />
                Concluir Aula
              </button>
            </motion.div>
          )}
        </div>
      </main>
      {/* ── Barra inferior: APENAS sumário + quantas páginas tem ── */}
      <nav
        aria-label="Navegação da aula"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#0D0D0D]/95 backdrop-blur-xl flex items-center justify-between"
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
          <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/[0.06] p-0.5">
            <button
              onClick={() => scrollToBloco(currentIdx - 1)}
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
              onClick={() => scrollToBloco(currentIdx + 1)}
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
              className="relative z-10 w-full max-h-[85vh] rounded-t-[2.5rem] border-t border-white/10 bg-[#121418] p-6 sm:p-8 pb-[calc(2rem+var(--sai-bottom))] shadow-2xl flex flex-col"
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
                      {feedbackPergunta.correta ? 'Excelente raciocínio!' : 'Revise o comentário e continue firme.'}
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
                <div className="rounded-2xl border border-white/10 bg-[#1a1d24] p-5 text-[15px] leading-relaxed text-neutral-100 whitespace-pre-wrap shadow-inner">
                  {feedbackPergunta.explicacao || 'Nenhum comentário disponível para esta questão.'}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setFeedbackPergunta(null)}
                  className={`w-full rounded-2xl px-6 py-4 text-[16px] font-extrabold text-white shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                    feedbackPergunta.correta ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  Continuar <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sheet do Sumário da aula ── */}
      <Sheet open={sumarioOpen} onOpenChange={setSumarioOpen}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-[2rem] p-0 bg-[#121418] border-t border-white/10 text-white">
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
              const isPassed = i <= highestVisible;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    haptic.selection();
                    setSumarioOpen(false);
                    const el = document.getElementById(`bloco-${i}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-all hover:bg-white/[0.05] active:scale-[0.99]"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isPassed ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-white/5 text-neutral-400 border border-white/5'
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
