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
import { Send, Clock, Trash2, CheckCircle2, XCircle, RefreshCw, LayoutDashboard, Database, FlaskConical, ChevronRight, Bot, ArrowUpRight } from "lucide-react";
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
  sent_count?: number;
  delivered_count?: number;
  opened_count?: number;
  failed_count?: number;
}

type ViewState = 'menu' | 'dashboard' | 'manual' | 'robos' | 'laboratorio' | 'templates';

export default function AdminPush() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('menu');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  });
  const [selectedCampaign, setSelectedCampaign] = useState<PushCampaign | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<'delivered' | 'opened' | null>(null);
  
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
      .select("id, title, body, status, next_run_at, created_at, sent_count, delivered_count, opened_count, failed_count")
      .order("created_at", { ascending: false })
      .limit(200);
      
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

  const handleActivateTemplate = async () => {
    setSubmitting(true);
    const template2Horas = [
      { time: '08:00', name: 'Novas Leis do Dia', desc: 'Disparo de novas leis cadastradas. Caso não tenha, não será enviado para a pessoa.' },
      { time: '10:00', name: 'Boletins Informativos', desc: 'Disparo de boletins jurídicos. Caso não tenha, não será enviado.' },
      { time: '12:00', name: 'Áudio-aula Explicativa', desc: 'Áudio aleatório com explicação jurídica, citando o nome da pessoa na notificação para ser persuasivo.' },
      { time: '14:00', name: 'Questão Prática', desc: 'Uma questão aleatória para a pessoa poder resolver e praticar.' },
      { time: '16:00', name: 'Sugestão de Leitura', desc: 'Um livro sugerido para a pessoa poder ler durante a tarde.' },
      { time: '18:00', name: 'Áudio-aula Explicativa', desc: 'Áudio aleatório com explicação jurídica, citando o nome da pessoa.' },
      { time: '20:00', name: 'Questão Prática', desc: 'Mais uma questão para fixar o conhecimento à noite.' },
      { time: '22:00', name: 'Áudio-aula Explicativa', desc: 'Áudio aleatório curto antes de dormir, focado em revisão.' },
      { time: '00:00', name: 'Notícias da Madrugada', desc: 'Resumo das novidades jurídicas da madrugada.' },
    ];
    
    const pushesToInsert = template2Horas.map(item => {
      const d = new Date();
      const [h, m] = item.time.split(':');
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      
      // Se a hora já passou, agenda para o dia seguinte
      if (d.getTime() < Date.now()) {
        d.setDate(d.getDate() + 1);
      }

      return {
        title: item.name,
        body: item.desc,
        status: "scheduled",
        next_run_at: d.toISOString()
      };
    });

    const { error } = await supabase.from("push_campaigns").insert(pushesToInsert);
    
    if (error) {
      toast.error("Erro ao ativar template no banco de dados");
    } else {
      toast.success("Template 'A cada 2 horas' ativado com sucesso!");
      loadCampaigns(); 
      setView('dashboard'); 
    }
    setSubmitting(false);
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
      case 'templates': return { title: "Templates", subtitle: "Modelos pré-configurados de disparo" };
      default: return { title: "Notificação Push Nova", subtitle: "Crie e gerencie seus alertas" };
    }
  };

  const headerProps = getHeaderProps();

  const getLocalDateStr = (d: Date | string) => {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
  };

  const hojeStr = getLocalDateStr(new Date());
  const isToday = selectedDate === hojeStr;
  
  const agendadosDoDia = campaigns.filter(c => c.status === 'scheduled' && c.next_run_at && getLocalDateStr(c.next_run_at) === selectedDate);
  const historicoDoDia = campaigns.filter(c => {
    const isAgendado = c.status === 'scheduled' && c.next_run_at && getLocalDateStr(c.next_run_at) === selectedDate;
    const dateToCompare = c.next_run_at || c.created_at;
    return getLocalDateStr(dateToCompare) === selectedDate && !isAgendado;
  });

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
              { id: 'templates', label: 'Templates', icon: Database, desc: 'Modelos de horários e conteúdos para disparo' },
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

        {view === 'templates' && (() => {
          const template2Horas = [
            { time: '08:00', name: 'Novas Leis do Dia', desc: 'Disparo de novas leis cadastradas. Caso não tenha, não será enviado para a pessoa.', emoji: '📜' },
            { time: '10:00', name: 'Boletins Informativos', desc: 'Disparo de boletins jurídicos. Caso não tenha, não será enviado.', emoji: '📰' },
            { time: '12:00', name: 'Áudio-aula Explicativa', desc: 'Áudio aleatório com explicação jurídica, citando o nome da pessoa na notificação para ser persuasivo.', emoji: '🎧' },
            { time: '14:00', name: 'Questão Prática', desc: 'Uma questão aleatória para a pessoa poder resolver e praticar.', emoji: '📝' },
            { time: '16:00', name: 'Sugestão de Leitura', desc: 'Um livro sugerido para a pessoa poder ler durante a tarde.', emoji: '📚' },
            { time: '18:00', name: 'Áudio-aula Explicativa', desc: 'Áudio aleatório com explicação jurídica, citando o nome da pessoa.', emoji: '🎧' },
            { time: '20:00', name: 'Questão Prática', desc: 'Mais uma questão para fixar o conhecimento à noite.', emoji: '📝' },
            { time: '22:00', name: 'Áudio-aula Explicativa', desc: 'Áudio aleatório curto antes de dormir, focado em revisão.', emoji: '🎧' },
            { time: '00:00', name: 'Notícias da Madrugada', desc: 'Resumo das novidades jurídicas da madrugada.', emoji: '🌙' },
          ];

          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div className="flex items-center justify-between bg-zinc-900/40 p-2 rounded-xl border border-border/30">
                <Select defaultValue="2horas">
                  <SelectTrigger className="w-full sm:w-[300px] border-none bg-transparent shadow-none focus:ring-0">
                    <SelectValue placeholder="Selecione o Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2horas">A cada 2 horas (8 Pushes)</SelectItem>
                    <SelectItem value="7por_dia">7 notificações por dia</SelectItem>
                    <SelectItem value="9por_dia">9 notificações por dia</SelectItem>
                    <SelectItem value="10por_dia">10 notificações por dia</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleActivateTemplate} 
                  disabled={submitting}
                  className="shrink-0 rounded-lg hidden sm:flex"
                >
                  {submitting ? "Ativando..." : "Ativar Template"}
                </Button>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" /> Cronograma do Template
                  </h2>
                  <Button 
                    onClick={handleActivateTemplate} 
                    disabled={submitting}
                    className="h-8 text-xs sm:hidden"
                  >
                    {submitting ? "Ativando..." : "Ativar"}
                  </Button>
                </div>
                
                <div className="relative border-l-2 border-primary/20 ml-4 space-y-6 py-2">
                  {template2Horas.map((item, i) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                      <Card className="p-4 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-default">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {item.time}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground text-base pr-2 flex items-center gap-2">
                          <span>{item.emoji}</span> {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.desc}</p>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

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
                
                <div className="flex gap-2 overflow-x-hidden pb-2 snap-x max-w-full justify-start md:justify-center">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = getLocalDateStr(d);
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
                  { label: 'Enviados', value: historicoDoDia.reduce((acc, c) => acc + (c.sent_count || 0), 0), color: 'text-emerald-400', bg: 'bg-emerald-500/10', type: null },
                  { label: 'Recebidos', value: historicoDoDia.reduce((acc, c) => acc + (c.delivered_count || 0), 0), color: 'text-zinc-400', bg: 'bg-zinc-500/10', type: 'delivered' as const },
                  { label: 'Abertos', value: historicoDoDia.reduce((acc, c) => acc + (c.opened_count || 0), 0), color: 'text-zinc-400', bg: 'bg-zinc-500/10', type: 'opened' as const },
                  { label: 'Erros', value: historicoDoDia.reduce((acc, c) => acc + (c.failed_count || 0), 0), color: 'text-red-400', bg: 'bg-red-500/10', type: null },
                ].map(stat => (
                  <Card 
                    key={stat.label} 
                    className={`p-2 sm:p-4 bg-zinc-900/30 border-border/30 flex flex-col items-center justify-center text-center relative overflow-hidden group ${stat.type ? 'cursor-pointer hover:border-border/50' : ''}`}
                    onClick={() => stat.type && setSelectedEventType(stat.type)}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${stat.bg}`} />
                    <div className="text-[9px] sm:text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider relative z-10 truncate w-full">{stat.label}</div>
                    <div className={`text-2xl sm:text-3xl font-bold font-display ${stat.color} relative z-10`}>{stat.value}</div>
                  </Card>
                ))}
              </div>


              {/* TIMELINE UNIFICADA DO DIA */}
              <div className="space-y-4 pt-4 border-t border-border/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Linha do Tempo
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs border-primary/50 text-primary hover:bg-primary/10"
                      onClick={() => {
                        toast.success("Teste iniciado! Disparando pushes a cada 1 minuto no celular admin...");
                        const sorted = [...agendadosDoDia].sort((a,b) => (a.next_run_at || "").localeCompare(b.next_run_at || ""));
                        sorted.forEach((c, i) => {
                          setTimeout(async () => {
                            await supabase.functions.invoke('push-testar-admin', { body: { automation_key: "template_test", title: c.title, body: c.body }});
                          }, i * 60000);
                        });
                      }}
                    >
                      <Bot className="w-3.5 h-3.5 mr-1.5" /> Testar
                    </Button>
                    <Button size="icon" variant="ghost" onClick={loadCampaigns} disabled={loading} className="w-8 h-8">
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                <div className="relative border-l-2 border-border/20 ml-4 space-y-6 py-2">
                  {[...agendadosDoDia, ...historicoDoDia].length === 0 && !loading && (
                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl bg-zinc-900/10 ml-4">
                      Nenhuma notificação encontrada para este dia
                    </div>
                  )}

                  {[...agendadosDoDia, ...historicoDoDia].sort((a,b) => (a.next_run_at || a.created_at).localeCompare(b.next_run_at || b.created_at)).map(c => {
                    const isPending = c.status === 'scheduled';
                    const isFailed = c.status === 'failed';
                    const isSent = !isPending && !isFailed;
                    
                    const dotColor = isFailed ? 'bg-red-500' : isSent ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-600';
                    const borderColor = isFailed ? 'border-red-500/20' : isSent ? 'border-emerald-500/20' : 'border-zinc-500/20';
                    const bgColor = isFailed ? 'bg-red-500/5 hover:bg-red-500/10' : isSent ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-zinc-900/20 hover:bg-zinc-900/40';
                    const badgeText = isPending ? 'Agendado' : isFailed ? 'Erro' : (c.status === 'sending' ? 'Enviando' : 'Enviado');
                    const badgeColor = isFailed ? 'text-red-400 border-red-400/30 bg-red-400/10' : isSent ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 'text-zinc-400 border-zinc-400/30 bg-zinc-400/10';

                    return (
                      <div key={c.id} className="relative pl-6">
                        <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ${dotColor}`} />
                        <Card 
                          className={`p-4 transition-colors cursor-pointer ${borderColor} ${bgColor}`}
                          onClick={() => setSelectedCampaign(c)}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 opacity-70" />
                              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(c.next_run_at || c.created_at))}
                            </span>
                            <Badge variant="outline" className={`text-[10px] h-5 ${badgeColor}`}>
                              {isSent ? <CheckCircle2 className="w-3 h-3 mr-1" /> : isPending ? <Clock className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                              {badgeText}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-foreground text-base pr-2 uppercase">{c.title.replace('[TEMPLATE] ', '')}</h3>
                          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{c.body}</p>
                          
                          {/* Status bar */}
                          {(c.sent_count > 0 || c.delivered_count > 0 || c.opened_count > 0) && (
                            <div className="mt-4 flex items-center gap-4 text-xs font-medium border-t border-border/10 pt-3">
                              {c.sent_count > 0 && <span className="text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> {c.sent_count} envios</span>}
                              {c.delivered_count > 0 && <span className="text-blue-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {c.delivered_count} entregues</span>}
                              {c.opened_count > 0 && <span className="text-purple-400 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {c.opened_count} abertos</span>}
                            </div>
                          )}
                        </Card>
                      </div>
                    );
                  })}
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
                              <p className="text-3xl font-bold text-foreground font-display relative z-10">{selectedCampaign.delivered_count || 0}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 relative z-10">Usuários</p>
                            </div>
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-border/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-purple-500/5" />
                              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 relative z-10">Quem Abriu</h4>
                              <p className="text-3xl font-bold text-foreground font-display relative z-10">{selectedCampaign.opened_count || 0}</p>
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

      <PushEventsModal 
        date={selectedDate} 
        type={selectedEventType} 
        campaigns={historicoDoDia} 
        onClose={() => setSelectedEventType(null)} 
      />
    </div>
  );
}

function PushEventsModal({ date, type, campaigns, onClose }: { date: string, type: 'delivered' | 'opened' | null, campaigns: PushCampaign[], onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ id: string, name: string, email: string, campaign_title: string, created_at: string }[]>([]);

  useEffect(() => {
    if (!type || campaigns.length === 0) return;
    
    async function loadEvents() {
      setLoading(true);
      try {
        const campaignIds = campaigns.map(c => c.id);
        const { data, error } = await supabase
          .from('push_events')
          .select(`
            created_at,
            campaign_id,
            user_id,
            profiles ( id, nome, email )
          `)
          .in('campaign_id', campaignIds)
          .eq('event_type', type)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const mapped = (data || []).filter(e => e.profiles).map(e => ({
          id: e.user_id,
          name: (e.profiles as any)?.nome || 'Sem Nome',
          email: (e.profiles as any)?.email || '',
          campaign_title: campaigns.find(c => c.id === e.campaign_id)?.title || 'Desconhecida',
          created_at: e.created_at
        }));
        setUsers(mapped);
      } catch (err) {
        console.error("Erro ao carregar eventos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [type, campaigns]);

  return (
    <Sheet open={!!type} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-border/50 bg-background/95 backdrop-blur-xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2 text-left">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            {type === 'opened' ? <Eye className="w-5 h-5 text-purple-400" /> : <CheckCircle2 className="w-5 h-5 text-blue-400" />}
            Usuários que {type === 'opened' ? 'Abriram' : 'Receberam'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">Em {new Intl.DateTimeFormat('pt-BR').format(new Date(date + 'T12:00:00'))}</p>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-50" />
              <span className="text-sm font-medium text-muted-foreground animate-pulse">Carregando usuários...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-zinc-900/10">
              Nenhum registro encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u, i) => (
                <div key={`${u.id}-${i}`} className="p-3 rounded-xl border border-border/10 bg-zinc-900/30">
                  <div className="font-bold text-sm text-foreground">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/5 text-[10px]">
                    <span className="truncate max-w-[150px] text-zinc-500">{u.campaign_title.replace('[TEMPLATE] ', '')}</span>
                    <span className="text-zinc-500">{new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(u.created_at))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
