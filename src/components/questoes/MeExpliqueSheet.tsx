import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Wand2, Loader2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type Props = {
  aberto: boolean;
  onClose: () => void;
  questao: any;
};

export const MeExpliqueSheet = ({ aberto, onClose, questao }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!aberto || !questao) {
      // Reset when closed
      if (!aberto) {
        setTimeout(() => {
          setMessages([]);
          setRevealed({});
          setLoading(false);
        }, 300);
      }
      return;
    }

    if (messages.length === 0 && !loading) {
      carregarExplicacaoInicial();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, questao]);

  const carregarExplicacaoInicial = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('questao-acao-ia', {
        body: { questaoId: questao.id, tipo: 'me-explique', questao },
      });

      if (error) throw error;
      if (!data?.payload?.markdown) throw new Error('Falha ao gerar explicação');

      const msgId = crypto.randomUUID();
      setMessages([{ id: msgId, role: 'assistant', content: data.payload.markdown }]);
    } catch (e) {
      console.error(e);
      setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: 'Ops, tive um problema ao analisar essa questão. Pode tentar de novo?' }]);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensagem = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    
    const userMsgId = crypto.randomUUID();
    const newMessages: Message[] = [...messages, { id: userMsgId, role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const sessionMessages = newMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Você é o tutor jurídico 'Prime'. Você está tirando dúvidas sobre a explicação dada anteriormente. Seja direto." }] },
          contents: sessionMessages
        })
      });

      const res = await r.json();
      const txt = res.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (txt) {
        setMessages([...newMessages, { id: crypto.randomUUID(), role: 'assistant', content: txt }]);
      }
    } catch (e) {
      setMessages([...newMessages, { id: crypto.randomUUID(), role: 'assistant', content: 'Não consegui responder agora, tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, revealed]);

  // Typewriter effect for assistant messages
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant') return;
    if (revealed[last.id] === last.content.length) return;
    
    let i = revealed[last.id] || 0;
    const chunk = Math.max(2, Math.floor(last.content.length / 100));
    
    const t = setInterval(() => {
      i = Math.min(i + chunk, last.content.length);
      setRevealed(r => ({ ...r, [last.id]: i }));
      if (i >= last.content.length) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[85vh] h-[85vh] flex-col rounded-t-[32px] border-t border-border/50 bg-background shadow-2xl"
          >
            {/* Handle */}
            <div className="flex shrink-0 justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-border/60" />
            </div>

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold tracking-tight">Me Explique</h2>
                  <p className="text-[13px] text-muted-foreground">Tutor de IA Interativo</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-muted/60 p-2 text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {messages.length === 0 && loading && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm font-medium animate-pulse">Lendo a questão e dissecando alternativas...</p>
                </div>
              )}

              {messages.map((msg) => {
                const isAsst = msg.role === 'assistant';
                const textToShow = isAsst ? msg.content.substring(0, revealed[msg.id] || 0) : msg.content;
                
                return (
                  <div key={msg.id} className={cn("flex w-full gap-3", isAsst ? "justify-start" : "justify-end")}>
                    {isAsst && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 mt-1">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                        isAsst 
                          ? "bg-muted/50 rounded-tl-sm text-foreground/90 prose-p:my-1 prose-strong:text-blue-400" 
                          : "bg-blue-600 text-white rounded-tr-sm"
                      )}
                    >
                      {isAsst ? (
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown>{textToShow}</ReactMarkdown>
                        </div>
                      ) : (
                        textToShow
                      )}
                      {isAsst && (revealed[msg.id] || 0) < msg.content.length && (
                        <span className="inline-block h-4 w-2 ml-1 bg-blue-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}
              
              {messages.length > 0 && loading && (
                <div className="flex w-full gap-3 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 mt-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t border-white/5 p-4 pb-safe-nav">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-muted/30 p-1 pl-4 focus-within:border-blue-500/50 transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
                  placeholder="Ficou com dúvida? Pergunte algo..."
                  className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/60"
                  disabled={loading}
                />
                <button
                  onClick={enviarMensagem}
                  disabled={!input.trim() || loading}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 transition-transform active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
