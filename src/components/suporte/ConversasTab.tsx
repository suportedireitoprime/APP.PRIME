// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, MessageSquare, Send, ChevronLeft, Clock, CheckCircle2, Info, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  assunto: string;
  mensagem: string;
  created_at: string;
  respondido: boolean;
}

interface Resposta {
  id: string;
  mensagem_id: string;
  sender_type: string;
  mensagem: string;
  created_at: string;
}

export function ConversasTab() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('mensagens_suporte')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (e) {
        console.error(e);
        toast.error('Erro ao carregar conversas');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadTickets();
    }
  }, [user]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (selectedTicket) {
    return <ChatView ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />;
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground/60 h-[40vh]">
        <div className="w-20 h-20 rounded-full bg-[#1A1D21] border border-border/20 flex items-center justify-center mb-6 shadow-sm">
          <MessageSquare className="w-8 h-8 opacity-40" />
        </div>
        <p className="font-display text-base">Você ainda não abriu nenhum ticket.</p>
        <p className="text-xs mt-1 max-w-[200px]">Suas conversas com o suporte aparecerão aqui.</p>
      </div>
    );
  }

  const getAssuntoTagStyle = (assunto: string) => {
    const lower = assunto.toLowerCase();
    if (lower.includes('financeiro') || lower.includes('assinatura')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (lower.includes('bug') || lower.includes('erro')) return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (lower.includes('tutorial') || lower.includes('como usar')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  return (
    <div className="space-y-3">
      {tickets.map(ticket => (
        <div 
          key={ticket.id} 
          onClick={() => setSelectedTicket(ticket)}
          className="p-5 rounded-3xl bg-[#1A1D21] border border-border/40 cursor-pointer hover:border-primary/50 hover:bg-[#1f2328] transition-all shadow-sm"
        >
          <div className="flex justify-between items-start mb-3 gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getAssuntoTagStyle(ticket.assunto)}`}>
              {ticket.assunto}
            </span>
            {ticket.respondido ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Respondido
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0 bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-3 h-3" />
                Em análise
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ticket.mensagem}</p>
          <div className="flex items-center justify-between mt-4 text-[10px] text-muted-foreground/60 font-medium">
            <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <span className="flex items-center gap-1 text-[10px] text-primary/80">
              Ver detalhes →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatView({ ticket, onBack }: { ticket: Ticket, onBack: () => void }) {
  const { user } = useAuth();
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [ticket.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async () => {
    if (!novaMensagem.trim()) return;
    setSending(true);
    try {
      toast.info('Seu chamado está registrado e em atendimento pela equipe. O retorno será enviado por e-mail.');
      setNovaMensagem('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[65vh] -mx-4 -mt-4">
      {/* Header do Chat */}
      <div className="flex items-center justify-between p-3.5 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">{ticket.assunto}</h3>
            <p className="text-[10px] text-muted-foreground">Ticket #{ticket.id.slice(0, 8)}</p>
          </div>
        </div>
        {ticket.respondido ? (
          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Respondido
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Em análise
          </span>
        )}
      </div>

      {/* Área de Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Banner Informativo */}
        <div className="rounded-2xl p-3 bg-secondary/30 border border-border/30 text-xs flex items-start gap-2.5 shadow-sm">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-xs">Atendimento Direito Prime</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Sua solicitação está vinculada ao seu e-mail cadastrado. A resposta e as instruções são enviadas diretamente para a sua caixa de entrada.
            </p>
          </div>
        </div>

        {/* Mensagem Original */}
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm shadow-sm">
            <p className="whitespace-pre-wrap leading-relaxed">{ticket.mensagem}</p>
            <span className="text-[9px] opacity-70 mt-1 block text-right font-medium">
              {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Status Box */}
        {ticket.respondido ? (
          <div className="flex justify-start">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-xs shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Chamado Respondido</span>
              </div>
              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                Nossa equipe enviou o parecer detalhado e a resposta para o seu e-mail cadastrado. Por favor, verifique sua caixa de entrada e a pasta de spam.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-start">
            <div className="bg-muted/40 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-xs shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Em análise pela equipe</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Recebemos sua mensagem e um de nossos especialistas está avaliando o caso. Você receberá o retorno no seu e-mail.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input de Acompanhamento */}
      <div className="p-3 border-t border-border bg-background">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input 
            value={novaMensagem}
            onChange={e => setNovaMensagem(e.target.value)}
            placeholder="Adicionar nota ou observação..."
            className="flex-1 rounded-full"
            disabled={sending}
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={sending || !novaMensagem.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-[-2px] mt-[2px]" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
