import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X as XIcon, ChevronLeft, ChevronRight, Check, Brain, Layers, RotateCcw } from 'lucide-react';

export interface Questao { pergunta: string; alternativas: string[]; correta: number; comentario: string; }
export interface Flashcard { frente: string; verso: string; comentario: string; }

interface VideoaulaPraticarSheetProps {
  open: boolean;
  onClose: () => void;
  mode: null | 'questoes' | 'flashcards';
  setMode: (m: null | 'questoes' | 'flashcards') => void;
  openMode: (m: 'questoes' | 'flashcards') => void;
  questoes: Questao[];
  questoesLoading: boolean;
  flashcards: Flashcard[];
  flashcardsLoading: boolean;
  currentQIdx: number;
  setCurrentQIdx: (i: number) => void;
  selectedAlt: number | null;
  setSelectedAlt: (i: number | null) => void;
  answered: boolean;
  setAnswered: (b: boolean) => void;
  currentFcIdx: number;
  setCurrentFcIdx: (i: number) => void;
  flipped: boolean;
  setFlipped: (b: boolean) => void;
  handleResponder: () => void;
  handleNextQuestion: () => void;
  handleNextFc: () => void;
  handlePrevFc: () => void;
}

export const VideoaulaPraticarSheet = ({ open, onClose, mode, setMode, openMode, questoes, questoesLoading, flashcards, flashcardsLoading, currentQIdx, selectedAlt, setSelectedAlt, answered, currentFcIdx, flipped, setFlipped, handleResponder, handleNextQuestion, handleNextFc, handlePrevFc }: VideoaulaPraticarSheetProps) => {
  const currentQ = questoes[currentQIdx];
  const currentFc = flashcards[currentFcIdx];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10040]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-[10041] bg-card border-t border-border rounded-t-3xl shadow-2xl pb-safe max-h-[92vh] mx-auto max-w-lg flex flex-col md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-none md:w-[min(30rem,92vw)] md:max-w-none md:rounded-none md:rounded-l-3xl md:border-l md:border-t-0 md:shadow-2xl md:mx-0"
          >
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <span className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 border-b border-border shrink-0">
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">Praticar</h3>
                <p className="text-[11px] text-foreground/60">Baseado nesta videoaula</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!mode && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openMode('flashcards')}
                    className="rounded-2xl border border-border bg-secondary/40 hover:bg-secondary/70 p-5 flex flex-col items-start gap-2 transition-all active:scale-[0.98]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Flashcards</p>
                    <p className="text-[11px] text-muted-foreground text-left">Memorize com cartões que giram.</p>
                  </button>
                  <button
                    onClick={() => openMode('questoes')}
                    className="rounded-2xl border border-border bg-secondary/40 hover:bg-secondary/70 p-5 flex flex-col items-start gap-2 transition-all active:scale-[0.98]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
                      <Brain className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Questões</p>
                    <p className="text-[11px] text-muted-foreground text-left">Teste seu conhecimento estilo OAB.</p>
                  </button>
                </div>
              )}

              {mode === 'questoes' && (
                <div>
                  <button onClick={() => setMode(null)} className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1 hover:text-foreground">
                    <ChevronLeft className="w-3 h-3" /> Voltar
                  </button>
                  {questoesLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Gerando questões...</p>
                    </div>
                  ) : questoes.length > 0 && currentQ ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-4 text-center">Questão {currentQIdx + 1} de {questoes.length}</p>
                      <div className="rounded-xl border border-border bg-secondary/30 p-4">
                        <p className="text-[13px] font-semibold text-foreground mb-4">
                          <span className="text-primary mr-1.5">{currentQIdx + 1}.</span>
                          {currentQ.pergunta}
                        </p>
                        <div className="space-y-2">
                          {currentQ.alternativas.map((alt, altIdx) => {
                            const isCorrect = altIdx === currentQ.correta;
                            const isSelected = selectedAlt === altIdx;
                            let borderClass = 'border-border';
                            let bgClass = '';
                            let iconEl: React.ReactNode = null;
                            if (answered) {
                              if (isCorrect) { borderClass = 'border-emerald-500/60'; bgClass = 'bg-emerald-500/10'; iconEl = <Check className="w-4 h-4 text-emerald-500 shrink-0" />; }
                              else if (isSelected && !isCorrect) { borderClass = 'border-red-500/60'; bgClass = 'bg-red-500/10'; iconEl = <XIcon className="w-4 h-4 text-red-500 shrink-0" />; }
                            } else if (isSelected) { borderClass = 'border-primary/60'; bgClass = 'bg-primary/5'; }
                            return (
                              <button
                                key={altIdx}
                                onClick={() => { if (!answered) setSelectedAlt(altIdx); }}
                                disabled={answered}
                                className={"w-full text-left px-3 py-2.5 rounded-lg border   flex items-center gap-2 transition-all "}
                              >
                                <span className="text-[12px] text-foreground/80 flex-1">{alt}</span>
                                {iconEl}
                              </button>
                            );
                          })}
                        </div>
                        {!answered && selectedAlt !== null && (
                          <motion.button
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            onClick={handleResponder}
                            className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                          >
                            Responder
                          </motion.button>
                        )}
                        {answered && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                            <p className={`text-[12px] font-semibold mb-2 ${selectedAlt === currentQ.correta ? 'text-emerald-500' : 'text-red-500'}`}>
                              {selectedAlt === currentQ.correta ? '✓ Correto!' : `✗ Resposta correta: ${currentQ.alternativas[currentQ.correta] ?? ''}`}
                            </p>
                            {currentQ.comentario && (
                              <div className="rounded-lg bg-muted/50 border border-border p-3">
                                <p className="text-[11px] font-semibold text-muted-foreground mb-1">Comentário</p>
                                <p className="text-[12px] text-foreground/80 leading-relaxed">{currentQ.comentario}</p>
                              </div>
                            )}
                            {currentQIdx < questoes.length - 1 && (
                              <button onClick={handleNextQuestion} className="w-full mt-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
                                Próxima <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                            {currentQIdx === questoes.length - 1 && (
                              <p className="text-center text-xs text-muted-foreground mt-3">🎉 Você completou todas as questões!</p>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma questão disponível</p>
                  )}
                </div>
              )}

              {mode === 'flashcards' && (
                <div>
                  <button onClick={() => setMode(null)} className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1 hover:text-foreground">
                    <ChevronLeft className="w-3 h-3" /> Voltar
                  </button>
                  {flashcardsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Gerando flashcards...</p>
                    </div>
                  ) : flashcards.length > 0 && currentFc ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-4 text-center">Flashcard {currentFcIdx + 1} de {flashcards.length}</p>
                      <div className="w-full" style={{ perspective: '800px' }}>
                        <motion.div
                          className="relative w-full cursor-pointer"
                          onClick={() => setFlipped(!flipped)}
                          animate={{ rotateY: flipped ? 180 : 0 }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          <div className={"rounded-xl border p-6 min-h-[180px] flex flex-col justify-center  border-border bg-secondary/30"} style={{ backfaceVisibility: 'hidden' }}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pergunta</span>
                              <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <p className="text-[14px] text-foreground leading-relaxed font-medium">{currentFc.frente}</p>
                          </div>
                          <div className={"rounded-xl border p-6 min-h-[180px] flex flex-col justify-center absolute inset-0  border-primary/40 bg-primary/5"} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Resposta</span>
                              <RotateCcw className="w-3.5 h-3.5 text-primary/60" />
                            </div>
                            <p className="text-[14px] text-foreground leading-relaxed">{currentFc.verso}</p>
                          </div>
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {flipped && currentFc.comentario && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-4 rounded-lg bg-muted/50 border border-border p-3">
                            <p className="text-[11px] font-semibold text-muted-foreground mb-1">Comentário</p>
                            <p className="text-[12px] text-foreground/80 leading-relaxed">{currentFc.comentario}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex items-center justify-between mt-4">
                        <button onClick={handlePrevFc} disabled={currentFcIdx === 0} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                          <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>
                        <button onClick={handleNextFc} disabled={currentFcIdx >= flashcards.length - 1} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-30 transition-colors">
                          Próximo <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum flashcard disponível</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

