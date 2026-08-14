import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, MessageSquare, Send, ChevronLeft } from 'lucide-react';
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
          <div className="flex justify-between items-start mb-3">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getAssuntoTagStyle(ticket.assunto)}`}>
              {ticket.assunto}
            </span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${ticket.respondido ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
              {ticket.respondido ? 'Respondido' : 'Aguardando'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ticket.mensagem}</p>
          <div className="text-[10px] text-muted-foreground/50 mt-4 font-medium">
            {new Date(ticket.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatView({ ticket, onBack }: { ticket: Ticket, onBack: () => void }) {
  const { user } = useAuth();
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRespostas = async () => {
      try {
        const { data, error } = await supabase
          .from('mensagens_suporte_respostas')
          .select('*')
          .eq('mensagem_id', ticket.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setRespostas(data || []);
        scrollToBottom();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadRespostas();
    
    // Subscribe para novas mensagens (Realtime)
    const channel = supabase
      .channel(`chat_${ticket.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensagens_suporte_respostas',
        filter: `mensagem_id=eq.${ticket.id}`
      }, (payload) => {
        setRespostas(prev => [...prev, payload.new as Resposta]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      const { error } = await supabase.from('mensagens_suporte_respostas').insert({
        mensagem_id: ticket.id,
        mensagem: novaMensagem.trim(),
        sender_type: 'user'
      });
      if (error) throw error;
      
      setNovaMensagem('');
      scrollToBottom();
    } catch (e) {
      toast.error('Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] -mx-4 -mt-4">
      {/* Header do Chat */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="font-semibold text-sm line-clamp-1">{ticket.assunto}</h3>
          <p className="text-[10px] text-muted-foreground">Ticket #{ticket.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mensagem Original */}
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] text-sm shadow-sm">
            <p className="whitespace-pre-wrap">{ticket.mensagem}</p>
            <span className="text-[9px] opacity-70 mt-1 block text-right">
              {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Respostas */}
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : (
          respostas.map(resp => {
            const isUser = resp.sender_type === 'user';
            return (
              <div key={resp.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'} rounded-2xl px-4 py-2 max-w-[85%] text-sm shadow-sm`}>
                  {!isUser && <span className="text-[10px] font-bold text-primary mb-1 block">Equipe de Suporte</span>}
                  <p className="whitespace-pre-wrap">{resp.mensagem}</p>
                  <span className={`text-[9px] mt-1 block ${isUser ? 'text-right opacity-70' : 'text-left text-muted-foreground'}`}>
                    {new Date(resp.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-background">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input 
            value={novaMensagem}
            onChange={e => setNovaMensagem(e.target.value)}
            placeholder="Digite uma mensagem..."
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
