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
import { Send, Clock, Trash2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface PushCampaign {
  id: string;
  title: string;
  body: string;
  status: string;
  next_run_at?: string;
  created_at: string;
}

export default function AdminPush() {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-dvh bg-background pb-12">
      <PageHeader
        title="Notificação Push Nova"
        subtitle="Crie e gerencie seus alertas"
        onBack={() => navigate("/admin-funcoes")}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-8 mt-4">
        
        {/* CREATE FORM */}
        <Card className="p-5 border-border/50 bg-zinc-900/40 shadow-sm">
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

        {/* LIST */}
        <div className="space-y-4">
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
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 self-end sm:self-center"
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

      </div>
    </div>
  );
}
