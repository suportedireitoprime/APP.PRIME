import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Clock, Trash2, CheckCircle2, XCircle, RefreshCw, LayoutDashboard, Database, FlaskConical, ChevronRight, Bot } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PushCampaign {
  id: string;
  title: string;
  body: string;
  status: string;
  next_run_at?: string;
  created_at: string;
}

type ViewState = 'menu' | 'dashboard' | 'manual' | 'robos' | 'laboratorio';

export default function AdminPush() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('menu');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCampaign, setSelectedCampaign] = useState<PushCampaign | null>(null);
  
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const loadCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("push_campaigns")
      .select("id, title, body, status, next_run_at, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
      
    if (error) {
      toast.error("Erro ao carregar campanhas");
    } else {
      setCampaigns(data as PushCampaign[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreatePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setSubmitting(true);
    const nextRun = scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString();

    const { error } = await supabase.from("push_campaigns").insert({
      title,
      body,
      status: "scheduled",
      next_run_at: nextRun
    });

    if (error) {
      toast.error("Erro ao agendar notificação");
    } else {
      toast.success("Notificação agendada com sucesso!");
      setTitle("");
      setBody("");
      setScheduledTime("");
      setView('dashboard');
      loadCampaigns();
    }
    setSubmitting(false);
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("push_campaigns").update({ status: "cancelled" }).eq("id", id);
    if (!error) {
      toast.success("Campanha cancelada");
      loadCampaigns();
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'sent': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Enviado</Badge>;
      case 'cancelled': return <Badge variant="secondary" className="text-muted-foreground"><XCircle className="w-3 h-3 mr-1"/> Cancelado</Badge>;
      case 'sending': return <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><RefreshCw className="w-3 h-3 mr-1 animate-spin"/> Enviando</Badge>;
      default: return <Badge variant="outline" className="text-amber-500 border-amber-500/30"><Clock className="w-3 h-3 mr-1"/> Agendado</Badge>;
    }
  };

  const getHeaderProps = () => {
    switch (view) {
      case 'dashboard': return { title: "Dashboard", subtitle: "Histórico e métricas de campanhas" };
      case 'manual': return { title: "Mensagem Manual", subtitle: "Criar e agendar novos alertas" };
      case 'robos': return { title: "Robôs & Automações", subtitle: "Programação diária dos disparos automáticos" };
      case 'laboratorio': return { title: "Laboratório", subtitle: "Discussão de novas funções" };
      default: return { title: "Notificação Push Nova", subtitle: "Crie e gerencie seus alertas" };
    }
  };

  const headerProps = getHeaderProps();

  return (
    <div className="min-h-dvh bg-background pb-12">
      <PageHeader
        title={headerProps.title}
        subtitle={headerProps.subtitle}
        onBack={() => view === 'menu' ? navigate("/admin-funcoes") : setView('menu')}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6 mt-2">
        
        {view === 'menu' && (
          <div className="grid gap-3">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Acompanhar agendamentos e histórico' },
              { id: 'manual', label: 'Mensagem Manual', icon: Send, desc: 'Criar e agendar novos pushs avulsos' },
              { id: 'robos', label: 'Robôs & Automações', icon: Bot, desc: 'Guia de programação diária dos disparos' },
              { id: 'laboratorio', label: 'Laboratório', icon: FlaskConical, desc: 'Discutir novas funções de notificação' }
            ].map(item => (
              <Card 
                key={item.id}
                onClick={() => setView(item.id as ViewState)}
                className="p-5 flex items-center justify-between cursor-pointer border-border/40 bg-zinc-900/20 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-primary">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Card>
            ))}
          </div>
        )}

        {view === 'manual' && (
          <Card className="p-5 border-border/50 bg-zinc-900/40 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <form onSubmit={handleCreatePush} className="space-y-4">
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Nova Mensagem
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Título da Notificação</label>
                  <Input 
                    placeholder="Ex: Atualização Importante" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Mensagem</label>
                  <Textarea 
                    placeholder="Digite o conteúdo do push..." 
                    value={body} 
                    onChange={e => setBody(e.target.value)}
                    rows={3}
                    className="bg-background/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Agendar para (Opcional - deixe vazio para enviar agora)</label>
                  <Input 
                    type="datetime-local" 
                    value={scheduledTime} 
                    onChange={e => setScheduledTime(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto mt-2">
                {submitting ? "Processando..." : "Programar Envio"}
              </Button>
            </form>
          </Card>
        )}

        {view === 'dashboard' && (() => {
          const hojeStr = new Date().toISOString().split('T')[0];
          const isToday = selectedDate === hojeStr;
          
          const agendadosDoDia = campaigns.filter(c => c.status === 'scheduled' && c.next_run_at?.startsWith(selectedDate));
          const historicoDoDia = campaigns.filter(c => {
            const isAgendado = c.status === 'scheduled' && c.next_run_at?.startsWith(selectedDate);
            const dateToCompare = c.next_run_at || c.created_at;
            return dateToCompare.startsWith(selectedDate) && !isAgendado;
          });

          return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* DATES & MONTH FILTER */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Select defaultValue="outubro_2026">
                    <SelectTrigger className="w-[160px] bg-zinc-900/40 border-border/40 font-semibold uppercase tracking-wider text-xs">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outubro_2026">Outubro 2026</SelectItem>
                      <SelectItem value="setembro_2026">Setembro 2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const isSelected = dateStr === selectedDate;
                    return (
                      <button 
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[72px] p-2 rounded-2xl transition-all snap-center ${isSelected ? 'bg-primary text-primary-foreground shadow-md scale-105' : 'bg-zinc-900/40 text-muted-foreground hover:bg-zinc-900/80 border border-border/40 scale-100'}`}
                      >
                        <span className="text-[10px] uppercase font-semibold tracking-wider">
                          {new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d).replace('.', '')}
                        </span>
                        <span className="text-xl font-bold mt-0.5">{d.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                {[
                  { label: 'Enviados', value: campaigns.filter(c => c.status === 'sent').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Recebidos', value: 0, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
                  { label: 'Abertos', value: 0, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
                  { label: 'Erros', value: campaigns.filter(c => c.status === 'cancelled').length, color: 'text-red-400', bg: 'bg-red-500/10' },
                ].map(stat => (
                  <Card key={stat.label} className="p-2 sm:p-4 bg-zinc-900/30 border-border/30 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${stat.bg}`} />
                    <div className="text-[9px] sm:text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider relative z-10 truncate w-full">{stat.label}</div>
                    <div className={`text-2xl sm:text-3xl font-bold font-display ${stat.color} relative z-10`}>{stat.value}</div>
                  </Card>
                ))}
              </div>

              {/* TIMELINE DO DIA */}
              {agendadosDoDia.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Agendados {isToday ? 'para Hoje' : ''}
                  </h2>
                  <div className="relative border-l-2 border-primary/20 ml-4 space-y-6 py-2">
                    {agendadosDoDia.map(c => (
                      <div key={c.id} className="relative pl-6">
                        <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                        <Card 
                          className="p-4 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                          onClick={() => setSelectedCampaign(c)}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(c.next_run_at!))}
                            </span>
                            <Badge variant="outline" className="text-primary border-primary/30 text-[10px] h-5 bg-primary/10">Agendado</Badge>
                          </div>
                          <h3 className="font-semibold text-foreground text-base pr-2">{c.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{c.body}</p>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HISTORICO GERAL */}
              <div className="space-y-4 pt-4 border-t border-border/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Histórico Geral
                  </h2>
                  <Button size="icon" variant="ghost" onClick={loadCampaigns} disabled={loading} className="w-8 h-8">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="relative border-l-2 border-border/20 ml-4 space-y-6 py-2">
                  {historicoDoDia.length === 0 && !loading && (
                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl bg-zinc-900/10 ml-4">
                      Nenhum histórico encontrado para este dia
                    </div>
                  )}

                  {historicoDoDia.map(c => (
                    <div key={c.id} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-border rounded-full -left-[7px] top-1.5" />
                      <Card 
                        className="p-4 border-border/20 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedCampaign(c)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {c.next_run_at ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(c.next_run_at)).replace(',', ' às') : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(c.created_at)).replace(',', ' às')}
                          </span>
                          {getStatusBadge(c.status)}
                        </div>
                        <h3 className="font-semibold text-foreground text-base pr-2">{c.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{c.body}</p>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHEET DETAILS */}
              <Sheet open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
                <SheetContent side="bottom" className="h-[80vh] sm:h-[85vh] rounded-t-[2rem] border-t border-border/50 bg-background/95 backdrop-blur-xl p-0 flex flex-col">
                  {selectedCampaign && (
                    <>
                      <SheetHeader className="p-6 pb-4 border-b border-border/20 text-left shrink-0 pt-8">
                        <div className="flex items-center justify-between mb-3">
                          {getStatusBadge(selectedCampaign.status)}
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {selectedCampaign.next_run_at ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(selectedCampaign.next_run_at)).replace(',', ' às') : 'Imediato'}
                          </span>
                        </div>
                        <SheetTitle className="text-2xl font-bold font-display leading-tight">{selectedCampaign.title}</SheetTitle>
                      </SheetHeader>
                      
                      <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6 pb-10">
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                              <Send className="w-3.5 h-3.5" /> Mensagem
                            </h4>
                            <p className="text-base text-foreground leading-relaxed bg-zinc-900/40 p-5 rounded-2xl border border-border/30 whitespace-pre-wrap">
                              {selectedCampaign.body}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-border/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-blue-500/5" />
                              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 relative z-10">Quem Recebeu</h4>
                              <p className="text-3xl font-bold text-foreground font-display relative z-10">0</p>
                              <p className="text-xs text-muted-foreground mt-0.5 relative z-10">Usuários</p>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-border/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-purple-500/5" />
                              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 relative z-10">Quem Abriu</h4>
                              <p className="text-3xl font-bold text-foreground font-display relative z-10">0</p>
                              <p className="text-xs text-muted-foreground mt-0.5 relative z-10">Leituras</p>
                            </div>
                          </div>

                          {selectedCampaign.status === 'scheduled' && (
                            <div className="pt-6 mt-6 border-t border-border/10">
                              <Button 
                                variant="destructive" 
                                className="w-full h-12 text-base rounded-xl"
                                onClick={() => {
                                  handleCancel(selectedCampaign.id);
                                  setSelectedCampaign(null);
                                }}
                              >
                                <Trash2 className="w-5 h-5 mr-2" />
                                Cancelar Agendamento
                              </Button>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          );
        })()}

        {view === 'robos' && (() => {
          const robosSchedule = [
            { time: '00:00', name: 'Explicações CF88', desc: 'Geração e disparo automático de estudos da Constituição.', emoji: '📜', active: true },
            { time: '01:00', name: 'Explicações CP/CC/CPC', desc: 'Disparo noturno focado em códigos principais.', emoji: '⚖️', active: true },
            { time: '02:00', name: 'Explicações CLT/CDC/CTN', desc: 'Disparo noturno focado em legislação complementar.', emoji: '💼', active: true },
            { time: '04:00', name: 'Rastreador: Resenha Diária', desc: 'Busca por novas leis, despachos e diários oficiais (1º ciclo).', emoji: '🔍', active: true },
            { time: '07:00', name: 'Rastreador: Resenha Diária', desc: 'Busca por novas leis, despachos e diários oficiais (2º ciclo).', emoji: '🔍', active: true },
            { time: '08:00', name: 'Blog Push: Manhã', desc: 'Boletim diário com notícias jurídicas e atualizações.', emoji: '📰', active: true },
            { time: '10:00', name: 'Rastreador: Resenha Diária', desc: 'Busca por novas leis e diários oficiais (3º ciclo).', emoji: '🔍', active: true },
            { time: '13:00', name: 'Blog Push: Tarde', desc: 'Segundo boletim de notícias do dia.', emoji: '☕', active: false },
            { time: '13:00', name: 'Rastreador: Resenha Diária', desc: 'Busca por novas leis e diários oficiais (4º ciclo).', emoji: '🔍', active: true },
            { time: '16:00', name: 'Rastreador: Resenha Diária', desc: 'Busca por novas leis e diários oficiais (5º ciclo).', emoji: '🔍', active: true },
            { time: '19:00', name: 'Blog Push: Noite', desc: 'Fechamento do expediente e síntese do dia.', emoji: '🌙', active: false },
            { time: '19:00', name: 'Rastreador: Resenha Diária', desc: 'Busca por novas leis e diários oficiais (6º ciclo).', emoji: '🔍', active: true },
            { time: '22:00', name: 'Rastreador: Resenha Diária', desc: 'Busca por novas leis e diários oficiais (7º ciclo).', emoji: '🔍', active: true },
          ];

          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold font-display">Programação dos Robôs</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Guia fixo de horários em que os robôs do sistema acordam para gerar e enviar campanhas push automáticas.
                </p>
              </div>

              <div className="relative border-l-2 border-border/30 ml-4 space-y-8 py-2">
                {robosSchedule.map((robo, i) => (
                  <div key={i} className={`relative pl-8 ${!robo.active ? 'opacity-50 grayscale' : ''}`}>
                    <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-1.5 flex items-center justify-center ${robo.active ? 'bg-primary shadow-[0_0_12px_rgba(var(--primary),0.6)]' : 'bg-muted-foreground'}`}>
                      <div className="w-1.5 h-1.5 bg-background rounded-full" />
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="pt-0.5">
                        <Badge variant="outline" className={`font-mono text-xs ${robo.active ? 'text-primary border-primary/30 bg-primary/5' : 'text-muted-foreground'}`}>
                          {robo.time}
                        </Badge>
                      </div>
                      <div className="flex-1 -mt-1">
                        <Card className="p-4 bg-zinc-900/40 border-border/30 hover:bg-zinc-900/60 transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              <span>{robo.emoji}</span> {robo.name}
                            </h3>
                            {!robo.active && <Badge variant="secondary" className="text-[10px] h-5">Pausado</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{robo.desc}</p>
                        </Card>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {view === 'laboratorio' && (
          <Card className="p-10 text-center border-dashed border-border/50 bg-transparent animate-in fade-in slide-in-from-bottom-4 duration-300">
            <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-foreground">Laboratório</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
              Área dedicada para discutir e prototipar novas funções de notificação push antes de irem para produção.
            </p>
          </Card>
        )}

      </div>
    </div>
  );
}
