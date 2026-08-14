import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface InicioTabProps {
  onTicketCreated: () => void;
}

export function InicioTab({ onTicketCreated }: InicioTabProps) {
  const { user } = useAuth();
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!assunto.trim() || !mensagem.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('mensagens_suporte').insert({
        user_id: user!.id,
        email: user!.email || '',
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        respondido: false
      });
      if (error) throw error;
      
      // Dispara o e-mail via Edge Function
      supabase.functions.invoke('enviar-suporte', {
        body: {
          assunto: assunto.trim(),
          mensagem: mensagem.trim(),
          email: user!.email || ''
        }
      }).catch(console.error);

      toast.success('Mensagem enviada! Acompanhe em Conversas.');
      setAssunto('');
      setMensagem('');
      onTicketCreated();
    } catch {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1D21] p-5 rounded-3xl border border-border/40 shadow-sm space-y-5">
        <div>
          <label className="text-sm font-semibold text-foreground font-display mb-2 block ml-1">Sobre o que deseja falar?</label>
          <Select value={assunto} onValueChange={setAssunto}>
            <SelectTrigger className="w-full rounded-2xl bg-black/20 border-border/50 h-12">
              <SelectValue placeholder="Selecione o assunto..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/50">
              <SelectItem value="Financeiro / Minha assinatura" className="rounded-xl">Financeiro / Minha assinatura</SelectItem>
              <SelectItem value="Bugs encontrados" className="rounded-xl">Bugs encontrados</SelectItem>
              <SelectItem value="Tutorial (Como usar)" className="rounded-xl">Tutorial (Como usar)</SelectItem>
              <SelectItem value="Outro" className="rounded-xl">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground font-display mb-2 block ml-1">Como podemos ajudar?</label>
          <Textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Descreva seu problema ou sugestão em detalhes..."
            rows={6}
            maxLength={1000}
            className="rounded-2xl bg-black/20 border-border/50 resize-none p-4"
          />
        </div>
        <Button onClick={handleSubmit} disabled={sending} className="w-full gap-2 rounded-2xl h-12 font-semibold text-base shadow-lg shadow-primary/20">
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-[-4px] mt-[2px]" />}
          Enviar mensagem
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground/80 text-center font-body px-4">
        Sua mensagem será enviada diretamente para a equipe de suporte do Direito Prime.
      </p>
    </div>
  );
}
