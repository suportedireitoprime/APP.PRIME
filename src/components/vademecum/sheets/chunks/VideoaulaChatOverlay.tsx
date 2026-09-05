import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { resumoMdComponents } from './VideoaulaResumoMarkdown';
import { RefObject } from 'react';

export interface ChatMessage { role: 'user' | 'assistant'; content: string; }

interface VideoaulaChatOverlayProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  onInputChange: (val: string) => void;
  onSend: (msg: string) => void;
  chatEndRef: RefObject<HTMLDivElement>;
}

export const VideoaulaChatOverlay = ({ open, onClose, messages, loading, input, onInputChange, onSend, chatEndRef }: VideoaulaChatOverlayProps) => {
  const suggestedQuestions = [
    'Resuma o ponto principal',
    'Explique com exemplo prático',
    'Qual a aplicação em concurso?',
    'Quais as exceções a essa regra?',
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-[80] bg-background flex flex-col items-center"
        >
          <div className="w-full max-w-3xl h-full flex flex-col min-h-0">
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border shrink-0">
              <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-foreground">Professora IA</h2>
                <p className="text-[11px] text-muted-foreground">Tire suas dúvidas sobre a videoaula</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">Pergunte sobre o conteúdo da videoaula:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedQuestions.map((q, i) => (
                      <button key={i} onClick={() => onSend(q)} className="px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={"flex "}>
                  <div className={"max-w-[85%] rounded-xl px-3.5 py-2.5 "}>
                    {msg.role === 'assistant' ? (
                      <div className="text-[13px] leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown components={resumoMdComponents}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[13px] leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSend(input)}
                  placeholder="Pergunte sobre a aula..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                />
                <button onClick={() => onSend(input)} disabled={!input.trim() || loading} className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

