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
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground font-body mb-1 block">Assunto</label>
        <Select value={assunto} onValueChange={setAssunto}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o assunto..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Financeiro / Minha assinatura">Financeiro / Minha assinatura</SelectItem>
            <SelectItem value="Bugs encontrados">Bugs encontrados</SelectItem>
            <SelectItem value="Tutorial (Como usar)">Tutorial (Como usar)</SelectItem>
            <SelectItem value="Outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground font-body mb-1 block">Mensagem</label>
        <Textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Descreva seu problema ou sugestão..."
          rows={8}
          maxLength={1000}
        />
      </div>
      <Button onClick={handleSubmit} disabled={sending} className="w-full gap-2">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Enviar mensagem
      </Button>
      <p className="text-[11px] text-muted-foreground text-center font-body">
        Sua mensagem será enviada para a equipe do Direito Prime
      </p>
    </div>
  );
}
