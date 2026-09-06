import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import type { Highlight } from '@/hooks/useHighlights';

interface GrifoCommentPromptProps {
  commentPrompt: { id: string; show: boolean; mode: 'create' | 'view' } | null;
  highlights: Highlight[];
  selectedColor: string;
  commentText: string;
  setCommentText: (text: string) => void;
  commentTags: string[];
  setCommentTags: React.Dispatch<React.SetStateAction<string[]>>;
  tagDraft: string;
  setTagDraft: (text: string) => void;
  isGeneratingAiNote: boolean;
  handleGerarAnotacaoIa: () => void;
  handleDismissComment: () => void;
  handleSaveComment: () => void;
  removeHighlight: (id: string) => void;
  addTagFromDraft: () => void;
}

export const GrifoCommentPrompt = ({
  commentPrompt,
  highlights,
  selectedColor,
  commentText,
  setCommentText,
  commentTags,
  setCommentTags,
  tagDraft,
  setTagDraft,
  isGeneratingAiNote,
  handleGerarAnotacaoIa,
  handleDismissComment,
  handleSaveComment,
  removeHighlight,
  addTagFromDraft,
}: GrifoCommentPromptProps) => {
  return createPortal(
    <AnimatePresence>
      {commentPrompt?.show && (() => {
        const currentHl = highlights.find(h => h.id === commentPrompt.id);
        const isView = commentPrompt.mode === 'view';
        return (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10050] bg-black/65 backdrop-blur-sm"
              onClick={handleDismissComment}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto z-[10051] w-full sm:w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-2xl h-[95dvh] sm:h-auto sm:max-h-[90vh] flex flex-col bg-card border-t sm:border border-border rounded-t-[28px] sm:rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden"
            >
              {/* Drag handle visual para mobile */}
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-3 shrink-0 sm:hidden" />

              <div className="flex items-center gap-2.5 mb-3 shrink-0">
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: currentHl?.color || selectedColor }}
                />
                <p className="text-foreground text-base sm:text-lg font-bold flex-1">
                  {isView ? 'Sua anotação' : 'Nova anotação'}
                </p>
                {isView && (
                  <button
                    onClick={() => { if (currentHl) { removeHighlight(currentHl.id); handleDismissComment(); } }}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-md"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
                {currentHl?.text && (
                  <div
                    className="text-sm italic text-foreground/80 border-l-2 pl-3 line-clamp-4 bg-muted/20 p-2.5 rounded-r-xl"
                    style={{ borderColor: currentHl.color }}
                  >
                    "{currentHl.text}"
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-semibold text-muted-foreground">Anotação</span>
                  <button
                    type="button"
                    disabled={isGeneratingAiNote}
                    onClick={handleGerarAnotacaoIa}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary hover:bg-primary/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAiNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{isGeneratingAiNote ? 'Gerando...' : 'Gerar com IA'}</span>
                  </button>
                </div>

                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva sua anotação ou clique em 'Gerar com IA'..."
                  className="w-full flex-1 min-h-[160px] sm:min-h-[120px] bg-secondary/60 border border-border rounded-2xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={6}
                />

                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {commentTags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-xs font-semibold px-2.5 py-1.5">
                        #{t}
                        <button
                          onClick={() => setCommentTags(prev => prev.filter(x => x !== t))}
                          className="opacity-70 hover:opacity-100"
                          aria-label={`Remover tag ${t}`}
                        >Ã—</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTagFromDraft(); } }}
                      placeholder="Adicionar tag (ex: prova, importante)"
                      className="flex-1 bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={addTagFromDraft}
                      className="px-4 rounded-xl text-sm font-semibold bg-secondary hover:bg-secondary/80 text-foreground"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 mt-auto border-t border-border/50 shrink-0 pb-[max(1.5rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))]">
                <button
                  onClick={handleDismissComment}
                  className="flex-1 h-12 min-h-[48px] rounded-2xl text-sm font-bold text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  {isView ? 'Fechar' : 'Pular'}
                </button>
                <button
                  onClick={handleSaveComment}
                  className="flex-1 h-12 min-h-[48px] rounded-2xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </>
        );
      })()}
    </AnimatePresence>,
    document.body
  );
};
