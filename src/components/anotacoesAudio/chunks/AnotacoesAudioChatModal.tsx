import React, { useState } from 'react';
import { ChevronRight, MessageCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Recording } from './anotacoesAudioConstants';

interface AnotacoesAudioChatModalProps {
  chatRec: Recording | null;
  onClose: () => void;
}

export const AnotacoesAudioChatModal: React.FC<AnotacoesAudioChatModalProps> = ({
  chatRec,
  onClose,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: 'Olá! Pergunte algo sobre essa aula e eu te ajudarei a revisar.',
    },
  ]);
  const [chatBusy, setChatBusy] = useState(false);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatRec || !chatRec.transcript) return;
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatBusy(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-aula', {
        body: { transcript: chatRec.transcript, question: userMessage },
      });
      if (error) throw error;
      const ans = data?.answer ?? 'Desculpe, ocorreu um erro.';
      setChatHistory((prev) => [...prev, { role: 'assistant', content: ans }]);
    } catch (err: any) {
      toast.error('Erro no chat: ' + (err?.message ?? 'Erro na IA.'));
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {chatRec && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-50 bg-background flex flex-col pt-safe"
        >
          <div className="flex items-center p-4 border-b border-border bg-card shadow-sm">
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-3">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" /> Hórus
              </h3>
              <p className="text-xs text-muted-foreground truncate">{chatRec.title}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-card border border-border text-foreground rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatBusy && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-card border border-border text-foreground rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" /> Digitando...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-card pb-safe">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendChatMessage();
                }}
                placeholder="Pergunte à aula..."
                className="rounded-full bg-muted border-none"
              />
              <Button
                size="icon"
                className="rounded-full shrink-0"
                onClick={sendChatMessage}
                disabled={chatBusy || !chatInput.trim()}
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
