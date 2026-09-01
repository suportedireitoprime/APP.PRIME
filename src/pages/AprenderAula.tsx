import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  List,
  MessageCircle,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useGoBack } from '@/hooks/useGoBack';

import { iconePorTipo, isBlocoTexto, rotuloPorTipo } from '@/lib/aprenderUtils';
import { useAprenderAula } from '@/hooks/domain/useAprenderAula';
import { BlocoView } from '@/components/aprender/BlocoView';
import { AulaConcluidaScreen } from '@/components/aprender/AulaConcluidaScreen';
import { HorusContextualSheet } from '@/components/aprender/HorusContextualSheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AulaSettingsSheet } from '@/components/aprender/AulaSettingsSheet';
import { AulaPreviaScreen, type PreviaAula } from '@/components/aprender/AulaPreviaScreen';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);

  const isFirstRender = useRef(true);

  // Auto-scroll para o topo e reprodução do som de passar página
  useEffect(() => {
    if (!mostrarPrevia) {
      if (!isFirstRender.current) {
        playSwooshSound();
      } else {
        isFirstRender.current = false;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Scroll da timeline para centralizar o item ativo
      setTimeout(() => {
        const el = document.getElementById(`timeline-item-${currentIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 100);
    }
  }, [currentIdx, mostrarPrevia, playSwooshSound]);

  const prevIdxRef = useRef<number>(currentIdx);
  const direction = currentIdx >= prevIdxRef.current ? 1 : -1;
  useEffect(() => {
    prevIdxRef.current = currentIdx;
  }, [currentIdx]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
          <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!aula || total === 0) {
    return (
      <div className="min-h-screen bg-background p-6 text-center">
        <p className="text-muted-foreground">Aula não encontrada ou sem conteúdo.</p>
        <button onClick={() => navigate('/aprender')} className="mt-4 text-primary underline">
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

  const atual = blocos[currentIdx] || blocos[0];
  const idx = currentIdx; // alias para compatibilidade com o sumário e cabeçalho
  const isExercicioDedicado = atual && ['pergunta', 'flashcard', 'conexao'].includes(atual.tipo);

  return (
    <div className="flex min-h-dvh flex-col bg-background theme-aprender lg:pl-[19rem]">
      {/* Sidebar desktop — sumário da aula + próximas aulas */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[19rem] flex-col border-r border-border bg-card/40 lg:flex">
        <div className="border-b border-border px-5 py-5">
          <button
            onClick={() => goBack()}
            className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Aprender
          </button>
          <p className="font-display text-base font-bold leading-snug text-foreground">{aula.titulo}</p>
          <p className="mt-1 text-xs text-muted-foreground">{idx + 1} de {total} etapas</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(((idx + 1) / total) * 100)}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nesta aula</p>
          <div className="space-y-1">
            {blocos.map((b, i) => {
              const Icon = iconePorTipo(b.tipo);
              const isAtual = i === idx;
              const titulo = b.payload?.titulo || b.payload?.enunciado || b.payload?.frente || rotuloPorTipo(b.tipo);
              return (
                <button
                  key={b.id}
                  onClick={() => {
                     if (i > maxRevealedIdx) return;
                     setCurrentIdx(i);
                     setSumarioOpen(false);
                  }}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    i <= maxRevealedIdx ? 'hover:bg-accent/50' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${i <= idx ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`line-clamp-2 text-[13px] leading-snug ${isAtual ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {i + 1}. {titulo}
                  </span>
                </button>
              );
            })}
          </div>

          {proximasAulas.length > 0 && (
            <>
              <p className="px-2 pb-2 pt-6 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Próximas aulas</p>
              <div className="space-y-1">
                {proximasAulas.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/aprender/aula/${p.id}`)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-accent/50"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="line-clamp-2 text-[13px] leading-snug text-muted-foreground">{p.titulo}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Top Header */}
      {isExercicioDedicado ? (
        <header
          className="sticky top-0 z-20 border-b border-white/5 bg-background/95 backdrop-blur-md"
          style={{ paddingTop: 'calc(var(--sai-top) + 0.5rem)' }}
        >
          <div
            className="mx-auto flex items-center justify-between py-3 max-w-3xl lg:max-w-[74ch] xl:max-w-[80ch]"
            style={{ paddingLeft: 'calc(1rem + var(--sai-left))', paddingRight: 'calc(1rem + var(--sai-right))' }}
          >
            <button
              onClick={() => goBack()}
              aria-label="Voltar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-transform text-white"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>

            <div className="flex flex-col items-center text-center">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
                {atual.tipo === 'pergunta' ? 'Desafio de Fixação' : atual.tipo === 'flashcard' ? 'Flashcard de Retenção' : 'Conexão de Conceitos'}
              </span>
              <span className="text-xs font-semibold text-neutral-400">
                Etapa {idx + 1} de {total}
              </span>
            </div>

            <button
              onClick={() => setSumarioOpen(true)}
              aria-label="Sumário"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-transform text-white/70 hover:text-white"
            >
              <List className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* Barra de Progresso Fina */}
          <div className="h-1 w-full bg-white/5">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.round(((idx + 1) / total) * 100)}%` }}
            />
          </div>
        </header>
      ) : (
        <header
          className="sticky top-0 z-20 border-b border-white/5 bg-background/95 backdrop-blur-md"
          style={{ paddingTop: 'calc(var(--sai-top) + 0.5rem)' }}
        >
          <div
            className="mx-auto flex flex-col md:flex-row md:items-center gap-3 py-3 md:py-4 lg:max-w-none lg:px-10 2xl:px-16"
            style={{ paddingLeft: 'calc(1rem + var(--sai-left))', paddingRight: 'calc(1rem + var(--sai-right))' }}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={() => goBack()}
                aria-label="Voltar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-transform text-white lg:hidden mt-0.5"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
              <div className="flex-1 flex flex-col justify-center pl-1">
                <p className="font-sans text-[15px] font-medium text-white/90 lg:hidden leading-snug tracking-tight line-clamp-2">
                  {aula.titulo}
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto bg-card/40 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth border-y border-white/5">
            <div
              className="mx-auto flex max-w-3xl items-center lg:max-w-none lg:px-10 2xl:px-16"
              style={{ paddingLeft: 'calc(0.75rem + var(--sai-left))', paddingRight: 'calc(0.75rem + var(--sai-right))' }}
            >
              {blocos.map((b, i) => {
                const Icon = iconePorTipo(b.tipo);
                const isAtual = i === idx;
                const isFeito = i < idx;
                const respondida = b.tipo === 'pergunta' ? respostas[b.id] : undefined;
                const ok = respondida?.correta;
                const err = respondida && !respondida.correta;
                const isLast = i === blocos.length - 1;
                return (
                  <div key={b.id} id={`timeline-item-${i}`} className="relative flex shrink-0 items-center">
                    <button
                      onClick={() => {
                        if (i > maxRevealedIdx) return;
                        setCurrentIdx(i);
                      }}
                      aria-label={`${rotuloPorTipo(b.tipo)} ${i + 1}`}
                      className="relative flex h-11 w-11 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
                    >
                      {isAtual && (
                        <motion.span
                          layoutId="timeline-halo"
                          className="absolute inset-0 rounded-full border border-white/30 bg-white/5"
                          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                        />
                      )}
                      <Icon
                        className={`relative h-[22px] w-[22px] md:h-5 md:w-5 transition-colors ${
                          isAtual ? 'text-white' : isFeito ? 'text-neutral-400' : 'text-neutral-700'
                        }`}
                        strokeWidth={1.5}
                      />
                      {ok && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background shadow-md">
                          <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={2.5} />
                        </span>
                      )}
                      {err && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-2 ring-background shadow-md">
                          <XCircle className="h-3 w-3 text-white" strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                    {!isLast && (
                      <div className="relative mx-1 h-[3px] w-6 md:w-8 overflow-hidden rounded-full bg-muted/60">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary"
                          initial={false}
                          animate={{ width: isFeito ? '100%' : '0%' }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </header>
      )}

      {/* Conteúdo Principal do Slide / Aula */}
      <main className="relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth bg-background">
        <div className={`mx-auto w-full max-w-3xl px-5 md:px-8 lg:mx-0 lg:max-w-[74ch] xl:max-w-[80ch] lg:px-12 2xl:px-16 flex flex-col ${
          isExercicioDedicado
            ? 'pt-6 md:pt-10 pb-32 min-h-[calc(100dvh-130px)] justify-center'
            : 'pt-6 md:pt-8 pb-[calc(10rem+var(--sai-bottom))] lg:pt-10 lg:pb-32'
        }`}>
          <AnimatePresence mode="popLayout" initial={false}>
            {atual && (
              <motion.div
                key={atual.id}
                initial={{ opacity: 0, x: direction * 45 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 45 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="w-full relative"
              >
                <BlocoView
                  bloco={atual}
                  resposta={respostas[atual.id]}
                  onResponder={(escolha) => responderPergunta(atual, escolha)}
                  flipped={!!flipped[atual.id]}
                  onFlip={() => { playFlipSound(); setFlipped((f) => ({ ...f, [atual.id]: !f[atual.id] })); }}
                  onAvaliarFlash={(nivel) => avaliarFlashcard(atual, nivel)}
                  onAvancar={avancarIdx}
                  conexao={conexoes[atual.id]}
                  onConexao={async (map, done) => {
                    setConexoes((c) => ({ ...c, [atual.id]: map }));
                    if (done) {
                      const pares = atual.payload?.pares || [];
                      const acertou = pares.every((_: any, idx: number) => map[idx] === idx);
                      await salvarBloco(atual, { map }, acertou);
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-8" />
        </div>
      </main>

      {!isExercicioDedicado && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 pb-[calc(0.75rem+var(--sai-bottom))] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSumarioOpen(true)}
              className="flex items-center justify-center h-10 w-10 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Sumário"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center h-10 w-10 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Configurações"
            >
              <Settings2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMentorOpen(true)}
              className="flex items-center justify-center h-10 w-10 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Mentor IA"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none pb-[calc(var(--sai-bottom)/2)]">
            <span className="text-[13px] font-semibold tabular-nums text-neutral-400 tracking-wide">
              {idx + 1} <span className="text-neutral-600 font-medium">/ {total}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
             <button
               onClick={voltarIdx}
               disabled={idx === 0}
               className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               aria-label="Anterior"
             >
               <ChevronLeft className="h-5 w-5" />
             </button>
             
             {idx < total - 1 ? (
               <button
                  onClick={avancarIdx}
                  disabled={idx >= maxRevealedIdx}
                  className="flex h-10 items-center justify-center gap-2 rounded-full bg-white text-black px-5 font-bold hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               >
                  Próximo <ChevronRight className="h-[18px] w-[18px]" />
               </button>
             ) : (
               <button
                  onClick={concluirAula}
                  disabled={idx > maxRevealedIdx || maxRevealedIdx < total - 1}
                  className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 font-bold hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               >
                  <CheckCircle2 className="h-[18px] w-[18px]" /> Concluir
               </button>
             )}
          </div>
        </div>
      )}

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
                  onClick={() => {
                    setFeedbackPergunta(null);
                    avancarIdx();
                  }}
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

      <Sheet open={sumarioOpen} onOpenChange={setSumarioOpen}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="text-left">Sumário da aula</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto p-3">
            {blocos.map((b, i) => {
              const Icon = iconePorTipo(b.tipo);
              const titulo = b.payload?.titulo || b.payload?.enunciado || b.payload?.frente || rotuloPorTipo(b.tipo);
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSumarioOpen(false);
                      if (i > maxRevealedIdx) return;
                      setCurrentIdx(i);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors ${
                    i <= maxRevealedIdx ? 'hover:bg-accent/60' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: 'hsl(var(--primary))' }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {i + 1}. {rotuloPorTipo(b.tipo)}
                    </p>
                    <p className="truncate font-medium text-foreground">{titulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <AulaSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        blocoKey={atual.id}
        onAbrirSumario={() => setSumarioOpen(true)}
        textoBlocoAtual={(() => {
          const p = atual.payload || {};
          const flip = !!flipped[atual.id];
          switch (atual.tipo) {
            case 'intro':
            case 'conceito':
            case 'exemplo':
            case 'conclusao':
            case 'leitura':
            case 'texto':
              return `${p.titulo ? p.titulo + '.\n\n' : ''}${p.conteudo || p.texto || ''}`;
            case 'citacao':
              return `Citação. ${p.texto || ''}${p.fonte ? `. Fonte: ${p.fonte}.` : ''}`;
            case 'artigo_lei':
              return `${p.lei || 'Artigo de lei'}${p.numero ? `, artigo ${p.numero}` : ''}.\n\n${p.texto || ''}`;
            case 'destaque':
              return `${p.titulo || 'Destaque'}. ${p.texto || ''}`;
            case 'pergunta': {
              const opcs = (p.opcoes || []).map((o: any) => `Alternativa ${String(o.id).toUpperCase()}: ${o.texto}.`).join(' ');
              return `Pergunta. ${p.enunciado || ''}\n\n${opcs}`;
            }
            case 'flashcard':
              return flip
                ? `Resposta. ${p.verso || ''}. ${p.explicacao || ''}. Exemplo prático: ${p.exemplo || ''}. Aplicando: ${p.aplicando || ''}.`
                : `Pergunta do flashcard. ${p.frente || ''}`;
            case 'conexao': {
              const pares = (p.pares || []).map((par: any) => `${par.termo}: ${par.definicao}.`).join('\n');
              return `Associe cada termo à sua definição.\n\n${pares}`;
            }
            case 'tabela':
              return `${p.titulo || 'Tabela'}. Colunas: ${(p.colunas || []).join(', ')}.`;
            case 'mapa_mental':
              return `Mapa mental. ${p.raiz || ''}. ${p.definicao_raiz || ''}. ${(p.ramos || [])
                .map((r: any) => `${r.titulo}: ${(r.itens || [])
                  .map((it: any) => typeof it === 'string' ? it : `${it.termo}, ${it.definicao}`)
                  .join(', ')}.`)
                .join(' ')}`;
            case 'fluxograma':
              return `Fluxograma. ${p.titulo || ''}. ${(p.etapas || []).map((et: any) => `Etapa ${et.n}: ${et.titulo}. ${et.descricao || ''}`).join(' ')}`;
            case 'mapa_conceitual':
              return `Mapa conceitual. ${(p.nos || []).map((n: any) => `${n.rotulo}${n.definicao ? ': ' + n.definicao : ''}`).join('. ')}. Relações: ${(p.arestas || []).map((a: any) => `${a.de} ${a.relacao} ${a.para}`).join('; ')}.`;
            case 'ordenacao':
              return `${p.titulo || 'Coloque em ordem'}. ${p.instrucao || ''}. Itens: ${(p.itens || []).map((it: any) => it.texto).join('; ')}.`;
            case 'cena_animada':
              return `${p.titulo || 'Cena animada'}. ${(p.cenas || []).map((c: any) => `Cena ${c.n}: ${c.titulo}. ${c.narracao}`).join(' ')}. ${p.moral ? 'Regra: ' + p.moral : ''}`;
            case 'linha_tempo':
              return `${p.titulo || 'Linha do tempo'}. ${(p.eventos || []).map((e: any) => `${e.marco}, ${e.titulo}. ${e.descricao || ''}`).join(' ')}`;
            case 'infografico':
              return `${p.titulo || 'Infográfico'}. ${(p.itens || []).map((it: any) => `${it.numero || ''} ${it.titulo}. ${it.descricao || ''}`).join(' ')}`;
            default:
              return p.titulo || p.texto || rotuloPorTipo(atual.tipo);
          }
        })()}
      />

      <HorusContextualSheet
        hideFab
        open={mentorOpen}
        onOpenChange={setMentorOpen}
        contexto={{
          aula_titulo: aula.titulo,
          bloco_tipo: atual.tipo,
          bloco_texto: (() => {
            const p = atual.payload || {};
            if (isBlocoTexto(atual.tipo)) return `${p.titulo || ''}\n\n${p.conteudo || ''}`;
            if (atual.tipo === 'pergunta') return `${p.enunciado || ''}\n\nOpções: ${JSON.stringify(p.opcoes || [])}`;
            if (atual.tipo === 'flashcard') return `${p.frente || ''} → ${p.verso || ''}`;
            if (atual.tipo === 'conexao') return `Pares: ${JSON.stringify(p.pares || [])}`;
            return JSON.stringify(p);
          })(),
          termos: atual.payload?.termos || [],
        }}
      />
    </div>
  );
};

export default AprenderAula;
