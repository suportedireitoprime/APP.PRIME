import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Send, Clock, CheckCircle2, XCircle, RefreshCw, LayoutDashboard, 
  Database, FlaskConical, ChevronRight, Bot, ArrowUpRight, Eye, AlertCircle, 
  Loader2, User, Users, Smartphone, ShieldCheck, Sparkles, Filter, ExternalLink, Calendar,
  BellRing, Bell, Scale
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ShapeGrid from '@/components/ui/ShapeGrid';

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  status: string;
  url?: string | null;
  image_url?: string | null;
  next_run_at?: string | null;
  created_at: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  failed_count: number;
  audience?: any;
  tipo?: string | null;
}

type ViewState = 'menu' | 'dashboard' | 'manual' | 'robos' | 'laboratorio' | 'templates';
type TargetAudience = 'users_only' | 'premium' | 'free' | 'test_admin';

export default function AdminPush() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('menu');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  });
  
  const [selectedCampaign, setSelectedCampaign] = useState<PushCampaign | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<'delivered' | 'opened' | 'failed' | null>(null);
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State (Manual Push)
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('users_only');
  const [selectedCategory, setSelectedCategory] = useState<string>('geral');

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("push_campaigns")
      .select("id, title, body, status, url, image_url, next_run_at, created_at, sent_count, delivered_count, opened_count, failed_count, audience, tipo")
      .order("created_at", { ascending: false })
      .limit(200);
      
    if (error) {
      toast.error("Erro ao carregar campanhas");
    } else if (data) {
      setCampaigns(data as PushCampaign[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleCreatePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setSubmitting(true);
    try {
      const isNow = !scheduledTime;
      const nextRun = scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString();

      let audiencePayload: any = { all: true, target: 'users_only' };
      if (targetAudience === 'premium') {
        audiencePayload = { premium: 'premium', target: 'users_only' };
      } else if (targetAudience === 'free') {
        audiencePayload = { premium: 'free', target: 'users_only' };
      } else if (targetAudience === 'test_admin') {
        audiencePayload = { target: 'admins_only', include_admins: true };
      }

      if (isNow && targetAudience === 'test_admin') {
        toast.info("Disparando push de teste para seu aparelho...");
        const { error: sErr } = await supabase.functions.invoke('send-push', {
          body: {
            title: title.trim(),
            body: body.trim(),
            url: destinationUrl.trim() || undefined,
            audience: { target: 'admins_only', include_admins: true },
            data: { category: selectedCategory }
          }
        });
        if (sErr) throw sErr;
        toast.success("Push de teste enviado com sucesso para seus aparelhos!");
      } else {
        const { data: campaign, error: cErr } = await supabase.from("push_campaigns").insert({
          title: title.trim(),
          body: body.trim(),
          url: destinationUrl.trim() || null,
          status: isNow ? "sending" : "scheduled",
          next_run_at: nextRun,
          audience: audiencePayload,
          tipo: selectedCategory,
        }).select().single();

        if (cErr) throw cErr;

        if (isNow) {
          toast.info("Disparando push para a audiência selecionada...");
          const { error: sErr } = await supabase.functions.invoke('send-push', {
            body: {
              campaign_id: campaign.id,
              title: title.trim(),
              body: body.trim(),
              url: destinationUrl.trim() || undefined,
              audience: audiencePayload,
              data: { category: selectedCategory }
            }
          });
          if (sErr) console.warn("Erro ao invocar send-push:", sErr);
          toast.success("Notificação enviada com sucesso!");
        } else {
          toast.success(`Notificação agendada para ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(nextRun))}`);
        }

        setTitle("");
        setBody("");
        setDestinationUrl("");
        setScheduledTime("");
        setView('dashboard');
        loadCampaigns();
      }
    } catch (err: any) {
      console.error("Erro ao criar push:", err);
      toast.error(`Falha: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
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
      { time: '06:00', name: '[TEMPLATE] Boletim Matinal', desc: 'Disparo de boletins jurídicos matinais.' },
      { time: '08:00', name: '[TEMPLATE] Novas Leis do Dia', desc: 'Disparo de novas leis publicadas no Diário Oficial.' },
      { time: '10:00', name: '[TEMPLATE] Questão Prática', desc: 'Uma questão aleatória para praticar.' },
      { time: '12:00', name: '[TEMPLATE] Sugestão de Leitura', desc: 'Livro sugerido para ler durante o almoço.' },
      { time: '14:00', name: '[TEMPLATE] Áudio-aula Explicativa', desc: 'Áudio curto com explicação jurídica.' },
      { time: '16:00', name: '[TEMPLATE] Pílula Jurídica', desc: 'Pílula rápida de conhecimento clássico.' },
      { time: '18:00', name: '[TEMPLATE] Boletim de Notícias', desc: 'Resumo das novidades jurídicas do final do dia.' },
      { time: '20:00', name: '[TEMPLATE] Questão Prática', desc: 'Questão de fixação para a noite.' },
      { time: '22:00', name: '[TEMPLATE] Áudio de Revisão', desc: 'Revisão antes de dormir.' },
    ];
    
    const pushesToInsert = template2Horas.map(item => {
      const d = new Date();
      const [h, m] = item.time.split(':');
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      if (d.getTime() < Date.now()) {
        d.setDate(d.getDate() + 1);
      }

      return {
        title: item.name,
        body: item.desc,
        status: "scheduled",
        next_run_at: d.toISOString(),
        audience: { all: true, target: 'users_only' },
        tipo: 'automatizado'
      };
    });

    const { error } = await supabase.from("push_campaigns").insert(pushesToInsert);
    
    if (error) {
      toast.error("Erro ao ativar template");
    } else {
      toast.success("Template 'A cada 2 horas' ativado com exclusão de admin!");
      loadCampaigns(); 
      setView('dashboard'); 
    }
    setSubmitting(false);
  };

  const getLocalDateStr = (d: Date | string) => {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
  };

  const hojeStr = getLocalDateStr(new Date());
  
  const agendadosDoDia = useMemo(() => {
    return campaigns.filter(c => c.status === 'scheduled' && c.next_run_at && getLocalDateStr(c.next_run_at) === selectedDate);
  }, [campaigns, selectedDate]);

  const historicoDoDia = useMemo(() => {
    return campaigns.filter(c => {
      const isAgendado = c.status === 'scheduled' && c.next_run_at && getLocalDateStr(c.next_run_at) === selectedDate;
      const dateToCompare = c.next_run_at || c.created_at;
      return getLocalDateStr(dateToCompare) === selectedDate && !isAgendado;
    });
  }, [campaigns, selectedDate]);

  // Métricas do dia
  const stats = useMemo(() => {
    const all = [...agendadosDoDia, ...historicoDoDia];
    const agendados = agendadosDoDia.length;
    const enviados = all.reduce((acc, c) => acc + (c.sent_count || 0), 0);
    const entregues = all.reduce((acc, c) => acc + (c.delivered_count || 0), 0);
    const abertos = all.reduce((acc, c) => acc + (c.opened_count || 0), 0);
    const falhas = all.reduce((acc, c) => acc + (c.failed_count || 0), 0);
    return { agendados, enviados, entregues, abertos, falhas };
  }, [agendadosDoDia, historicoDoDia]);

  const getHeaderProps = () => {
    switch (view) {
      case 'dashboard': return { title: "Dashboard Push", subtitle: "Métricas e timeline de campanhas" };
      case 'manual': return { title: "Nova Mensagem Push", subtitle: "Disparo seguro com preview em tempo real" };
      case 'robos': return { title: "Robôs & Automações", subtitle: "Programação e cronogramas automáticos" };
      case 'laboratorio': return { title: "Laboratório Push", subtitle: "Recursos em homologação" };
      case 'templates': return { title: "Templates de Campanhas", subtitle: "Modelos pré-definidos para ativação" };
      default: return { title: "Gestor de Push", subtitle: "Painel de controle de notificações" };
    }
  };

  const headerProps = getHeaderProps();

  return (
    <div className="min-h-dvh bg-background pb-16 relative overflow-hidden">
      <ShapeGrid />
      <PageHeader
        title={headerProps.title}
        subtitle={headerProps.subtitle}
        onBack={() => view === 'menu' ? navigate("/admin-funcoes") : setView('menu')}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6 mt-2 relative z-10">
        
        {/* MENU PRINCIPAL */}
        {view === 'menu' && (
          <div className="grid gap-3">
            {[
              { id: 'dashboard', label: 'Dashboard & Linha do Tempo', icon: LayoutDashboard, desc: 'Histórico, métricas e eventos do dia' },
              { id: 'manual', label: 'Criar Mensagem Push', icon: Send, desc: 'Envio avulso com seletor seguro de público e preview' },
              { id: 'templates', label: 'Templates Pré-configurados', icon: Database, desc: 'Cronograma automatizado de disparos a cada 2h' },
              { id: 'robos', label: 'Robôs do Sistema', icon: Bot, desc: 'Grade diária dos cronjobs e inteligência' },
              { id: 'laboratorio', label: 'Laboratório & Testes', icon: FlaskConical, desc: 'Disparo isolado para aparelhos administrativos' }
            ].map(item => (
              <Card 
                key={item.id}
                onClick={() => setView(item.id as ViewState)}
                className="p-5 flex items-center justify-between cursor-pointer border-border/40 bg-zinc-900/30 hover:bg-zinc-900/70 transition-all hover:border-red-500/30 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Card>
            ))}
          </div>
        )}

        {/* DASHBOARD & TIMELINE */}
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* SELETOR DE DATA */}
            <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-2xl border border-border/30">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-foreground">Data Selecionada:</span>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto bg-zinc-950/60 border-border/40 text-sm h-9"
              />
            </div>

            {/* CARDS DE MÉTRICAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Card className="p-3 bg-zinc-900/40 border-border/30 text-center">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">Agendados</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">{stats.agendados}</div>
              </Card>
              <Card className="p-3 bg-zinc-900/40 border-border/30 text-center">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">Enviados</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.enviados}</div>
              </Card>
              <Card 
                className="p-3 bg-zinc-900/40 border-border/30 text-center cursor-pointer hover:border-purple-500/40 transition-colors"
                onClick={() => setSelectedEventType('opened')}
              >
                <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-center gap-1">
                  Abertos <Eye className="w-3 h-3 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-400 mt-1">{stats.abertos}</div>
              </Card>
              <Card 
                className="p-3 bg-zinc-900/40 border-border/30 text-center cursor-pointer hover:border-red-500/40 transition-colors"
                onClick={() => setSelectedEventType('failed')}
              >
                <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-center gap-1">
                  Falhas <AlertCircle className="w-3 h-3 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-400 mt-1">{stats.falhas}</div>
              </Card>
            </div>

            {/* AÇÕES DA TIMELINE */}
            <div className="flex items-center justify-between pt-2">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" /> Linha do Tempo ({selectedDate})
              </h2>
              <div className="flex items-center gap-2">
                {/* BOTÃO SEGURO DE TESTE ADMIN (SEM LOOP) */}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
                  onClick={async () => {
                    toast.info("Disparando 1 teste para aparelhos admin...");
                    try {
                      const { error } = await supabase.functions.invoke('send-push', {
                        body: {
                          title: "🧪 Teste de Notificação Admin",
                          body: "Disparo pontual verificado com exclusão de usuários comuns.",
                          url: "/admin-push",
                          audience: { target: "admins_only", include_admins: true }
                        }
                      });
                      if (error) throw error;
                      toast.success("Teste entregue com sucesso aos dispositivos admin!");
                    } catch (e: any) {
                      toast.error(`Falha: ${e.message || e}`);
                    }
                  }}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Testar no Celular
                </Button>
                <Button size="icon" variant="ghost" onClick={loadCampaigns} disabled={loading} className="w-8 h-8">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* TIMELINE LIST */}
            <div className="relative border-l-2 border-border/20 ml-4 space-y-5 py-2">
              {(() => {
                const allToday = [...agendadosDoDia, ...historicoDoDia];
                if (allToday.length === 0 && !loading) {
                  return (
                    <div className="text-center py-12 px-4 border border-dashed border-border/40 rounded-2xl bg-zinc-900/20 ml-2">
                      <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma notificação programada para este dia.</p>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="mt-4 text-xs"
                        onClick={async () => {
                          toast.info("Planejando próximos 7 dias...");
                          try {
                            await supabase.functions.invoke('push-planner', { body: { dias: 7 } });
                            toast.success("Planejamento gerado!");
                            loadCampaigns();
                          } catch {
                            toast.error("Erro ao gerar planejamento");
                          }
                        }}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Gerar Planejamento (7 Dias)
                      </Button>
                    </div>
                  );
                }

                return allToday.map((c) => {
                  const isScheduled = c.status === 'scheduled';
                  const isSent = c.status === 'sent' || c.status === 'completed';
                  const isFailed = c.status === 'failed';
                  const runDate = c.next_run_at || c.created_at;

                  return (
                    <div key={c.id} className="relative pl-6">
                      <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-2 ${
                        isFailed ? 'bg-red-500' : isSent ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500'
                      }`} />
                      
                      <Card className="p-4 bg-zinc-900/30 border-border/30 hover:bg-zinc-900/60 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(runDate))}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] h-5 ${
                              isSent ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                              isFailed ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                              'text-amber-400 border-amber-500/30 bg-amber-500/10'
                            }`}>
                              {isSent ? 'Enviado' : isFailed ? 'Falhou' : 'Agendado'}
                            </Badge>
                            {isScheduled && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[11px] text-zinc-500 hover:text-red-400"
                                onClick={() => handleCancel(c.id)}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>

                        <h3 className="font-semibold text-foreground text-sm leading-snug">{c.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{c.body}</p>

                        {(c.sent_count > 0 || c.delivered_count > 0 || c.opened_count > 0) && (
                          <div className="mt-3 pt-3 border-t border-border/10 flex items-center gap-4 text-xs font-medium text-zinc-400">
                            {c.sent_count > 0 && <span className="text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> {c.sent_count} envios</span>}
                            {c.delivered_count > 0 && <span className="text-blue-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {c.delivered_count} entregues</span>}
                            {c.opened_count > 0 && <span className="text-purple-400 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {c.opened_count} abertos</span>}
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* CRIAR MENSAGEM MANUAL COM PREVIEW EM TEMPO REAL */}
        {view === 'manual' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6 border-border/40 bg-zinc-900/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Nova Mensagem Push</h3>
                  <p className="text-xs text-muted-foreground">Com isolamento automático de administradores</p>
                </div>
              </div>

              <form onSubmit={handleCreatePush} className="space-y-4">
                {/* PÚBLICO ALVO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-red-500" /> Público Alvo (Segmentação)
                  </label>
                  <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v as TargetAudience)}>
                    <SelectTrigger className="bg-zinc-950/60 border-border/30 h-10 text-sm">
                      <SelectValue placeholder="Selecione o público" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users_only">👥 Todos os Usuários Reais (Exclui Administradores)</SelectItem>
                      <SelectItem value="premium">⭐ Apenas Assinantes VIP (Exclui Administradores)</SelectItem>
                      <SelectItem value="free">📖 Apenas Usuários Gratuitos (Exclui Administradores)</SelectItem>
                      <SelectItem value="test_admin">🛡️ Apenas Aparelhos Admin (Teste de Segurança)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-zinc-500">
                    {targetAudience === 'test_admin' 
                      ? '⚠️ O disparo irá APENAS para os seus dispositivos de teste.' 
                      : '✅ Aparelhos de administradores são bloqueados por padrão.'}
                  </p>
                </div>

                {/* CATEGORIA */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Categoria do Push</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-zinc-950/60 border-border/30 h-10 text-sm">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">🔔 Notificação Geral</SelectItem>
                      <SelectItem value="leis">⚖️ Legislação & Diário Oficial</SelectItem>
                      <SelectItem value="noticias">📰 Notícias Jurídicas</SelectItem>
                      <SelectItem value="estudos">🎓 Estudo & Questões OAB/Concursos</SelectItem>
                      <SelectItem value="lembretes">⏰ Lembrete de Leitura</SelectItem>
                      <SelectItem value="blog">✍️ Artigo do Blog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* TÍTULO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Título do Push</label>
                  <Input 
                    placeholder="Ex: Nova súmula vinculante do STF publicada" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-zinc-950/60 border-border/30 h-10 text-sm"
                  />
                </div>

                {/* CORPO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Corpo da Mensagem</label>
                  <Textarea 
                    placeholder="Digite a mensagem persuasiva que aparecerá na tela de bloqueio..." 
                    className="bg-zinc-950/60 border-border/30 min-h-[90px] text-sm resize-none"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <div className="text-[11px] text-zinc-500 text-right">{body.length} caracteres</div>
                </div>

                {/* ROTA DE DESTINO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" /> Rota Interna ao Tocar (Opcional)
                  </label>
                  <Input 
                    placeholder="Ex: /vademecum, /noticias, /blog" 
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className="bg-zinc-950/60 border-border/30 h-10 text-sm"
                  />
                </div>

                {/* AGENDAMENTO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Agendar para Mais Tarde (Opcional)</span>
                    <span className="text-[10px] text-zinc-400">Em branco = Disparo imediato</span>
                  </label>
                  <Input 
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-zinc-950/60 border-border/30 h-10 text-sm"
                  />
                </div>

                {/* ============================================================== */}
                {/* PREVIEW EM TEMPO REAL: MOCKUP DO BANNER ANDROID / IOS          */}
                {/* ============================================================== */}
                <div className="pt-3">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-red-500" /> Prévia Visual no Aparelho
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-xl relative overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-md">
                        <Scale className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[11px] font-bold text-zinc-400 tracking-wide uppercase">
                            DIREITO PRIME
                          </span>
                          <span className="text-[10px] text-zinc-500">agora</span>
                        </div>
                        <p className="text-sm font-bold text-white leading-snug">
                          {title.trim() || "Título da sua notificação aparecerá aqui"}
                        </p>
                        <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                          {body.trim() || "O texto explicativo da mensagem será lido pelo usuário neste formato."}
                        </p>
                        {destinationUrl && (
                          <div className="mt-2 text-[10px] font-mono text-red-400 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Ao tocar: {destinationUrl}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE SUBMISSÃO */}
                <div className="pt-2 flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-sm"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> {scheduledTime ? 'Agendar Notificação' : 'Enviar Push Agora'}</>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* TEMPLATES */}
        {view === 'templates' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6 border-border/40 bg-zinc-900/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Template Automático: A Cada 2 Horas</h3>
                  <p className="text-xs text-muted-foreground">9 disparos diários com conteúdo dinâmico</p>
                </div>
                <Button 
                  onClick={handleActivateTemplate} 
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  {submitting ? "Ativando..." : "Ativar no Banco"}
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { time: '06:00', name: 'Boletim Matinal', desc: 'Atualizações legislativas do início da manhã' },
                  { time: '08:00', name: 'Novas Leis do Dia', desc: 'Atos do Diário Oficial da União' },
                  { time: '10:00', name: 'Questão Prática', desc: 'Simulado de fixação OAB/Concurso' },
                  { time: '12:00', name: 'Sugestão de Leitura', desc: 'Obras estratégicas da biblioteca' },
                  { time: '14:00', name: 'Áudio-aula', desc: 'Revisão jurídica em áudio com nome personalizado' },
                  { time: '16:00', name: 'Pílula Jurídica', desc: 'Resumo essencial de códigos' },
                  { time: '18:00', name: 'Boletim Noturno', desc: 'Fechamento de notícias do dia' },
                  { time: '20:00', name: 'Questão Noturna', desc: 'Segunda questão para fixação' },
                  { time: '22:00', name: 'Áudio de Revisão', desc: 'Áudio calmo para encerramento de estudos' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-950/50 border border-border/20 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono border-red-500/30 text-red-400 bg-red-500/10">
                          {item.time}
                        </Badge>
                        <span className="font-semibold text-sm text-foreground">{item.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ROBÔS & CRONS */}
        {view === 'robos' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6 border-border/40 bg-zinc-900/40 text-center">
              <Bot className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Robôs & Cronjobs Oficiais</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                Todas as automações agora executam com exclusão estrita de dispositivos administrativos configurada no backend.
              </p>
            </Card>
          </div>
        )}

        {/* LABORATÓRIO */}
        {view === 'laboratorio' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6 border-border/40 bg-zinc-900/40 text-center">
              <FlaskConical className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Laboratório de Testes</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-6 leading-relaxed">
                Envie pushes de teste para testar canais de som, prioridade e banners sem notificar os usuários reais.
              </p>
              <Button
                onClick={async () => {
                  toast.info("Disparando teste de alta prioridade...");
                  try {
                    const { error } = await supabase.functions.invoke('send-push', {
                      body: {
                        title: "🔬 Teste do Laboratório",
                        body: "Disparo recebido com prioridade HIGH e canal direitoprime-alertas-v2.",
                        url: "/admin-push",
                        audience: { target: "admins_only", include_admins: true }
                      }
                    });
                    if (error) throw error;
                    toast.success("Teste recebido com sucesso!");
                  } catch (e: any) {
                    toast.error(`Falha: ${e.message || e}`);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                <Smartphone className="w-4 h-4 mr-2" /> Disparar Teste Imediato
              </Button>
            </Card>
          </div>
        )}

      </div>

      {/* MODAL DE EVENTOS (DELIVERED / OPENED / FAILED) */}
      <PushEventsModal 
        date={selectedDate} 
        type={selectedEventType} 
        campaigns={historicoDoDia} 
        onClose={() => setSelectedEventType(null)} 
      />
    </div>
  );
}

function PushEventsModal({ 
  date, 
  type, 
  campaigns, 
  onClose 
}: { 
  date: string; 
  type: 'delivered' | 'opened' | 'failed' | null; 
  campaigns: PushCampaign[]; 
  onClose: () => void; 
}) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; campaign_title: string; created_at: string }[]>([]);

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
            user_id
          `)
          .in('campaign_id', campaignIds)
          .eq('event_type', type)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        
        const mapped = (data || []).map(e => ({
          id: e.user_id || 'anon',
          name: e.user_id ? 'Usuário Registrado' : 'Dispositivo Anônimo',
          email: e.user_id ? `ID: ${e.user_id.slice(0, 8)}...` : 'Sem e-mail',
          campaign_title: campaigns.find(c => c.id === e.campaign_id)?.title || 'Campanha Automática',
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
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-border/50 bg-[#0D0D0D] text-white p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2 text-left">
          <SheetTitle className="text-xl font-bold flex items-center gap-2 text-white">
            {type === 'opened' ? <Eye className="w-5 h-5 text-purple-400" /> : <CheckCircle2 className="w-5 h-5 text-blue-400" />}
            Usuários que {type === 'opened' ? 'Abriram' : 'Receberam'}
          </SheetTitle>
          <p className="text-xs text-zinc-400">Em {new Intl.DateTimeFormat('pt-BR').format(new Date(date + 'T12:00:00'))}</p>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-red-500 opacity-70" />
              <span className="text-sm font-medium text-zinc-400 animate-pulse">Carregando eventos...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
              Nenhum evento registrado nesta categoria hoje.
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u, i) => (
                <div key={`${u.id}-${i}`} className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
                  <div className="font-bold text-sm text-white">{u.name}</div>
                  <div className="text-xs text-zinc-400">{u.email}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500">
                    <span className="truncate max-w-[180px]">{u.campaign_title.replace('[TEMPLATE] ', '')}</span>
                    <span>{new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(u.created_at))}</span>
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
