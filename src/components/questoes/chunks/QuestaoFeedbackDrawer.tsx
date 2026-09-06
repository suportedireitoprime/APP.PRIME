import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, X, RotateCw, ChevronRight, ChevronUp, Grid2X2, MessageSquare, ArrowRight,
} from 'lucide-react';
import { QuestaoAcoesBar } from '@/components/questoes/QuestaoAcoesBar';
import { cn } from '@/lib/utils';

interface QuestaoFeedbackDrawerProps {
  resp?: { escolha: string; acertou: boolean };
  correta: string;
  selecao: string | null;
  feedbackOculto: boolean;
  percentualAcerto: number;
  idx: number;
  totalQuestoes: number;
  atualId: string;
  onResponder: () => void;
  onOpenGrade: () => void;
  onHideFeedback: () => void;
  onShowFeedback: () => void;
  onOpenComentarios: () => void;
  onProximaQuestao: () => void;
  onNovoBloco: () => void;
}

export function QuestaoFeedbackDrawer({
  resp,
  correta,
  selecao,
  feedbackOculto,
  percentualAcerto,
  idx,
  totalQuestoes,
  atualId,
  onResponder,
  onOpenGrade,
  onHideFeedback,
  onShowFeedback,
  onOpenComentarios,
  onProximaQuestao,
  onNovoBloco,
}: QuestaoFeedbackDrawerProps) {
  return (
    <>
      <AnimatePresence>
        {resp && !feedbackOculto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
            onClick={onHideFeedback}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <div className="mx-auto w-full max-w-7xl lg:px-8">
          <AnimatePresence mode="wait">
            {!resp ? (
              selecao ? (
                <motion.div
                  key="selecao"
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
                  className="pointer-events-auto rounded-t-3xl border-t border-border/50 bg-background/80 px-4 pb-safe-nav pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl lg:rounded-2xl lg:border lg:mb-8 lg:max-w-[calc(100%-320px-2rem)]"
                >
                  <div className="mx-auto flex max-w-3xl items-center gap-2">
                    <button
                      onClick={onResponder}
                      disabled={!selecao}
                      className={cn(
                        'flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold shadow-lg transition-all active:scale-[0.97]',
                        selecao
                          ? 'bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90'
                          : 'bg-muted/50 text-muted-foreground cursor-not-allowed',
                      )}
                    >
                      Responder <CheckCircle2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={onOpenGrade}
                      aria-label="Abrir grade de respostas"
                      className="flex h-12 items-center justify-center rounded-xl bg-muted/50 px-4 text-foreground/60 transition-colors hover:bg-muted active:scale-[0.97] lg:hidden"
                    >
                      <Grid2X2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div key="botoes-auxiliares" className="absolute bottom-6 right-6 pointer-events-auto flex flex-col gap-3 lg:hidden">
                  <button
                    onClick={onOpenGrade}
                    aria-label="Abrir grade de respostas"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/80 text-foreground/70 shadow-lg backdrop-blur-md transition-all hover:bg-muted active:scale-[0.95] border border-border/50"
                  >
                    <Grid2X2 className="h-6 w-6" />
                  </button>
                </div>
              )
            ) : !feedbackOculto && (resp || (idx === totalQuestoes - 1 && selecao)) ? (
              <>
                <motion.div
                  key="feedback-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onHideFeedback}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                  style={{ zIndex: -1 }}
                />
                <motion.div
                  key="feedback"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                  className={cn(
                    'pointer-events-auto relative rounded-t-3xl border-t px-5 pb-safe-nav pt-7 shadow-2xl lg:rounded-2xl lg:border lg:mb-8 lg:max-w-[calc(100%-320px-2rem)]',
                    resp.acertou ? 'bg-[#0f1f14] border-green-500/30' : 'bg-[#1f0a0a] border-red-500/30',
                  )}
                >
                  <button
                    onClick={onHideFeedback}
                    aria-label="Ocultar feedback"
                    className={cn(
                      'absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full transition-colors',
                      resp.acertou ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
                    )}
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', resp.acertou ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-400')}>
                        {resp.acertou ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[22px] font-extrabold tracking-tight', resp.acertou ? 'text-green-500' : 'text-red-400')}>
                          {resp.acertou ? 'Resposta correta!' : 'Resposta incorreta'}
                        </p>
                        {resp.acertou ? (
                          <p className="text-[14px] font-medium text-green-500/80">
                            Você mandou bem.
                          </p>
                        ) : (
                          <p className="mt-1 text-[14.5px] font-medium text-red-400/80">
                            O gabarito é a <strong className="rounded bg-red-500/20 px-2 py-0.5 text-red-300">Alternativa {correta}</strong>
                          </p>
                        )}
                        <div className={cn('mt-2 text-[12px] font-medium flex items-center gap-1.5', resp.acertou ? 'text-green-500/70' : 'text-white/50')}>
                          <div className="h-1 flex-1 bg-black/20 rounded-full overflow-hidden max-w-[100px]">
                            <div
                              className={cn('h-full rounded-full transition-all duration-1000', resp.acertou ? 'bg-green-500' : 'bg-red-500/50')}
                              style={{ width: `${percentualAcerto}%` }}
                            />
                          </div>
                          {percentualAcerto}% acertaram
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 py-1">
                      <button
                        onClick={onOpenComentarios}
                        className={cn(
                          'relative overflow-hidden flex h-[60px] w-full items-center justify-between rounded-2xl border px-5 shadow-sm transition-all active:scale-[0.98]',
                          resp.acertou
                            ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20'
                            : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20',
                        )}
                      >
                        <motion.div
                          className="absolute inset-0 w-[40%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                          animate={{ x: ['-250%', '350%'] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', repeatDelay: 1 }}
                        />
                        <div className="flex items-center gap-3 relative z-10">
                          <MessageSquare className="h-6 w-6" />
                          <span className="text-[16px] font-bold">Ver comentário completo</span>
                        </div>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                          className="relative z-10"
                        >
                          <ArrowRight className="h-5 w-5 opacity-80" />
                        </motion.div>
                      </button>

                      <div className="w-full">
                        <QuestaoAcoesBar source={atualId} chaveRevisao={atualId} layout="grid" />
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      {idx === totalQuestoes - 1 ? (
                        <button
                          onClick={onNovoBloco}
                          className={cn(
                            'flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold text-white shadow-lg transition-all active:scale-[0.97]',
                            resp.acertou ? 'bg-green-600 hover:bg-green-500 shadow-green-600/25' : 'bg-red-600 hover:bg-red-500 shadow-red-600/25',
                          )}
                        >
                          <RotateCw className="h-5 w-5" /> Novo bloco
                        </button>
                      ) : (
                        <button
                          onClick={onProximaQuestao}
                          className={cn(
                            'flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold text-white shadow-lg transition-all active:scale-[0.97]',
                            resp.acertou ? 'bg-green-600 hover:bg-green-500 shadow-green-600/25' : 'bg-red-600 hover:bg-red-500 shadow-red-600/25',
                          )}
                        >
                          Próxima questão <ChevronRight className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={onOpenGrade}
                        aria-label="Abrir grade de respostas"
                        className="flex h-12 items-center justify-center rounded-xl bg-white/5 px-4 text-foreground/60 transition-colors hover:bg-white/10 active:scale-[0.97] lg:hidden"
                      >
                        <Grid2X2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : (
              <motion.div
                key="feedback-oculto"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
                className="pointer-events-auto rounded-t-3xl border-t border-border/50 bg-background/80 px-4 pb-safe-nav pt-4 shadow-2xl backdrop-blur-xl lg:rounded-2xl lg:border lg:mb-8 lg:max-w-[calc(100%-320px-2rem)]"
              >
                <div className="mx-auto flex max-w-3xl items-center gap-2">
                  <button
                    onClick={onShowFeedback}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-muted/50 px-4 text-[14px] font-semibold text-foreground/80 transition-colors hover:bg-muted active:scale-[0.97]"
                  >
                    <ChevronUp className="h-4 w-4" /> Feedback
                  </button>
                  {idx === totalQuestoes - 1 ? (
                    <button
                      onClick={onNovoBloco}
                      className={cn('flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold text-white shadow-lg', resp.acertou ? 'bg-green-600' : 'bg-red-600')}
                    >
                      <RotateCw className="h-5 w-5" /> Novo bloco
                    </button>
                  ) : (
                    <button
                      onClick={onProximaQuestao}
                      className={cn('flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold text-white shadow-lg', resp.acertou ? 'bg-green-600' : 'bg-red-600')}
                    >
                      Próxima questão <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
