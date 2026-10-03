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
import { Send, Clock, Trash2, CheckCircle2, XCircle, RefreshCw, LayoutDashboard, Database, FlaskConical, ChevronRight } from "lucide-react";

interface PushCampaign {
  id: string;
  title: string;
  body: string;
  status: string;
  next_run_at?: string;
  created_at: string;
}

type ViewState = 'menu' | 'dashboard' | 'manual' | 'banco' | 'laboratorio';

export default function AdminPush() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('menu');
  
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
      case 'banco': return { title: "Banco de Notificações", subtitle: "Novas funções para triagem" };
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
              { id: 'banco', label: 'Banco de Notificações', icon: Database, desc: 'Adicionar nova função na triagem' },
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

        {view === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground">Histórico e Agendamentos</h2>
              <Button size="icon" variant="ghost" onClick={loadCampaigns} disabled={loading} className="w-8 h-8">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="grid gap-3">
              {campaigns.length === 0 && !loading && (
                <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl">
                  Nenhuma notificação encontrada
                </div>
              )}

              {campaigns.map(c => (
                <Card key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border/40 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(c.status)}
                      <span className="text-xs text-muted-foreground">
                        {c.next_run_at ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(c.next_run_at)).replace(',', ' às') : '-'}
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground truncate">{c.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{c.body}</p>
                  </div>
                  
                  {c.status === 'scheduled' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 self-end sm:self-center shrink-0"
                      onClick={() => handleCancel(c.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Cancelar
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {view === 'banco' && (
          <Card className="p-10 text-center border-dashed border-border/50 bg-transparent animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-foreground">Banco de Notificações</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
              Aqui você poderá colocar uma função nova que vai entrar direto na triagem e gerenciar o pool de notificações.
            </p>
          </Card>
        )}

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
