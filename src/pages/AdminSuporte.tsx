import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import { Loader2, Search, Send, CheckCircle2, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  user_id: string;
  email: string;
  assunto: string;
  mensagem: string;
  respondido: boolean;
  created_at: string;
}

interface Resposta {
  id: string;
  mensagem_id: string;
  sender_type: string;
  mensagem: string;
  created_at: string;
}

export default function AdminSuporte() {
  const goBack = useGoBack();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('mensagens_suporte')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (e) {
        toast.error('Erro ao carregar tickets');
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  const loadTicketsForUpdate = async () => {
    try {
      const { data } = await supabase
        .from('mensagens_suporte')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setTickets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.email?.toLowerCase().includes(search.toLowerCase()) || 
    t.assunto?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <PageHeader title="Admin: Suporte" onBack={() => selectedTicket ? setSelectedTicket(null) : goBack()} />
      
      <div className="flex-1 overflow-hidden flex">
        {/* Lista de Tickets (esconde no mobile se tiver ticket selecionado) */}
        <div className={`w-full lg:w-1/3 flex flex-col border-r border-border ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por email ou assunto..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              filteredTickets.map(ticket => {
                const getAssuntoTagStyle = (assunto: string) => {
                  const lower = assunto.toLowerCase();
                  if (lower.includes('financeiro') || lower.includes('assinatura')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                  if (lower.includes('bug') || lower.includes('erro')) return 'bg-red-500/10 text-red-500 border-red-500/20';
                  if (lower.includes('tutorial') || lower.includes('como usar')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
                  return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                };

                return (
                  <div 
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'bg-[#1f2328] border-primary/50' : 'bg-[#1A1D21] border-border/40 hover:border-primary/50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold truncate max-w-[70%]">{ticket.email}</span>
                      {ticket.respondido ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-yellow-500 shrink-0" />
                      )}
                    </div>
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getAssuntoTagStyle(ticket.assunto)}`}>
                      {ticket.assunto}
                    </span>
                    <div className="text-[10px] text-muted-foreground mt-2 font-medium">
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* View do Chat */}
        <div className={`flex-1 flex flex-col ${!selectedTicket ? 'hidden lg:flex items-center justify-center bg-muted/20' : 'flex'}`}>
          {selectedTicket ? (
            <AdminChatView ticket={selectedTicket} onUpdate={loadTicketsForUpdate} />
          ) : (
            <div className="text-muted-foreground text-sm">Selecione um ticket para visualizar</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminChatView({ ticket, onUpdate }: { ticket: Ticket, onUpdate: () => void }) {
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
    
    const channel = supabase
      .channel(`admin_chat_${ticket.id}`)
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
      // 1. Inserir resposta
      const { error: err1 } = await supabase.from('mensagens_suporte_respostas').insert({
        mensagem_id: ticket.id,
        mensagem: novaMensagem.trim(),
        sender_type: 'admin'
      });
      if (err1) throw err1;
      
      // 2. Atualizar status do ticket para respondido
      if (!ticket.respondido) {
        await supabase.from('mensagens_suporte').update({ respondido: true }).eq('id', ticket.id);
        onUpdate(); // Atualiza a lista lateral
      }
      
      // 3. Notificar usuário via e-mail
      supabase.functions.invoke('enviar-suporte', {
        body: {
          assunto: ticket.assunto,
          mensagem: novaMensagem.trim(),
          email: ticket.email,
          isReply: true
        }
      }).catch(console.error);

      setNovaMensagem('');
      scrollToBottom();
    } catch (e) {
      toast.error('Erro ao enviar resposta');
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    try {
      await supabase.from('mensagens_suporte').update({ respondido: !ticket.respondido }).eq('id', ticket.id);
      onUpdate();
    } catch (e) {
      toast.error('Erro ao alterar status');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-sm">{ticket.email}</h3>
          <p className="text-xs text-muted-foreground">{ticket.assunto}</p>
        </div>
        <Button variant={ticket.respondido ? "outline" : "default"} size="sm" onClick={toggleStatus}>
          {ticket.respondido ? 'Marcar como Pendente' : 'Marcar como Resolvido'}
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original */}
        <div className="flex justify-start">
          <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%] text-sm shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground mb-1 block">Usuário</span>
            <p className="whitespace-pre-wrap">{ticket.mensagem}</p>
            <span className="text-[9px] mt-1 block text-left text-muted-foreground">
              {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : (
          respostas.map(resp => {
            const isAdmin = resp.sender_type === 'admin';
            return (
              <div key={resp.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`${isAdmin ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'} rounded-2xl px-4 py-2 max-w-[85%] text-sm shadow-sm`}>
                  <span className={`text-[10px] font-bold mb-1 block ${isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {isAdmin ? 'Você (Admin)' : 'Usuário'}
                  </span>
                  <p className="whitespace-pre-wrap">{resp.mensagem}</p>
                  <span className={`text-[9px] mt-1 block ${isAdmin ? 'text-right opacity-70' : 'text-left text-muted-foreground'}`}>
                    {new Date(resp.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input 
            value={novaMensagem}
            onChange={e => setNovaMensagem(e.target.value)}
            placeholder="Digite sua resposta..."
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
