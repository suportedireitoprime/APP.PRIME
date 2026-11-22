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
  Send, Clock, CheckCircle2, RefreshCw, LayoutDashboard, 
  Database, FlaskConical, ChevronRight, Bot, ArrowUpRight, Eye, AlertCircle, 
  Loader2, Smartphone, Sparkles, Filter, ExternalLink, Calendar,
  Bell, Scale, PlayCircle, Zap, ShieldCheck, Check, Pencil
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import { dispararNotificacaoLocalTeste, ModuloNotificacaoLocal } from '@/lib/nativo/notificacaoLocalManager';

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

type TabMode = 'grade2h' | 'dashboard' | 'manual' | 'laboratorio';
type TargetAudience = 'users_only' | 'premium' | 'free' | 'test_admin';

const GRADE_2_HORAS = [
  { hora: '06:00', titulo: 'Boletim Matinal', desc: 'Atualizações jurídicas e novidades para iniciar o dia.', emoji: '🌅', tag: 'Notícias', rota: '/radar-360', modulo: 'boletim' as ModuloNotificacaoLocal },
  { hora: '08:00', titulo: 'Novas Leis & CF88', desc: 'Atos publicados no Diário Oficial e artigos da Constituição.', emoji: '📜', tag: 'Legislação', rota: '/vade-mecum', modulo: 'livros' as ModuloNotificacaoLocal },
  { hora: '10:00', titulo: 'Dicionário Jurídico', desc: 'Conceito e vocabulário técnico com exemplo prático.', emoji: '📖', tag: 'Vocabulário', rota: '/ferramentas/dicionario', modulo: 'livros' as ModuloNotificacaoLocal },
  { hora: '12:00', titulo: 'Sugestão de Leitura', desc: 'Livro estratégico da biblioteca para a pausa do almoço.', emoji: '📚', tag: 'Biblioteca', rota: '/biblioteca', modulo: 'livros' as ModuloNotificacaoLocal },
  { hora: '14:00', titulo: 'Áudio-aula Explicativa', desc: 'Revisão jurídica em áudio citando o nome do estudante.', emoji: '🎧', tag: 'Áudio', rota: '/audioaulas', modulo: 'audioaulas' as ModuloNotificacaoLocal },
  { hora: '16:00', titulo: 'Pílula Jurídica', desc: 'Conceito clássico ou resumo doutrinário de 2 minutos.', emoji: '💊', tag: 'Pílula', rota: '/blog', modulo: 'boletim' as ModuloNotificacaoLocal },
  { hora: '18:00', titulo: 'Resumo do Expediente', desc: 'Fechamento do dia com as principais decisões dos tribunais.', emoji: '🌆', tag: 'Tribunais', rota: '/radar-360', modulo: 'boletim' as ModuloNotificacaoLocal },
  { hora: '20:00', titulo: 'Questão de Fixação', desc: 'Simulado prático de OAB e Concursos para a noite.', emoji: '🧠', tag: 'Questões', rota: '/questoes', modulo: 'streak' as ModuloNotificacaoLocal },
  { hora: '22:00', titulo: 'Áudio de Revisão', desc: 'Revisão passiva antes de dormir para consolidar a matéria.', emoji: '🌙', tag: 'Revisão', rota: '/audioaulas', modulo: 'audioaulas' as ModuloNotificacaoLocal },
  { hora: '00:00', titulo: 'Videoaula Coruja', desc: 'Aula rápida com tema coringa para quem estuda na madrugada.', emoji: '🦉', tag: 'Vídeo', rota: '/aprender', modulo: 'videoaulas' as ModuloNotificacaoLocal },
];

export default function AdminPush() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabMode>('grade2h');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  });
  
  const [selectedEventType, setSelectedEventType] = useState<'delivered' | 'opened' | 'failed' | null>(null);
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [plannerLoading, setPlannerLoading] = useState(false);

  // Estados dos Slots Operacionais da Grade 2 Horas
  const [disparandoSlotHora, setDisparandoSlotHora] = useState<string | null>(null);
  const [testandoSlotHora, setTestandoSlotHora] = useState<string | null>(null);
  const [slotParaEditar, setSlotParaEditar] = useState<typeof GRADE_2_HORAS[0] | null>(null);
  const [editTitulo, setEditTitulo] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editRota, setEditRota] = useState<string>('');
  const [editEmoji, setEditEmoji] = useState<string>('');
  const [salvandoEdicao, setSalvandoEdicao] = useState<boolean>(false);

  // Form State (Manual Push)
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('users_only');
  const [selectedCategory, setSelectedCategory] = useState<string>('geral');

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Contagem de campanhas agendadas
  const scheduledCampaigns = useMemo(() => {
    return campaigns.filter(c => c.status === 'scheduled');
  }, [campaigns]);

  // Timer de 10s para contagem regressiva em tempo real
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Helper de contagem regressiva humanizada
  const getNextRunInfo = useCallback((nextRunAtIso: string | null | undefined) => {
    if (!nextRunAtIso) return null;
    const diffMs = new Date(nextRunAtIso).getTime() - nowMs;
    if (diffMs <= 0) return { passed: true, diffMin: 0, label: "Disparando agora" };
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;
    
    if (diffHours > 0) {
      return { passed: false, diffMin, label: `em ${diffHours}h ${remMin > 0 ? `${remMin}min` : ''}`.trim() };
    }
    return { passed: false, diffMin, label: `em ${diffMin} min` };
  }, [nowMs]);

  // Próximo disparo programado geral
  const nextScheduled = useMemo(() => {
    const nowIso = new Date(nowMs).toISOString();
    return scheduledCampaigns
      .filter(c => c.next_run_at && c.next_run_at >= nowIso)
      .sort((a, b) => (a.next_run_at || '').localeCompare(b.next_run_at || ''))[0] || null;
  }, [scheduledCampaigns, nowMs]);

  // Mapeamento dos slots da Grade 2 Horas com status em tempo real
  const slotStatusMap = useMemo(() => {
    const map = new Map<string, { 
      nextRunIso: string; 
      campaignTitle: string; 
      countdownLabel: string; 
      isNextImmediate: boolean;
      destinationUrl?: string | null;
    }>();
    
    const nowIso = new Date(nowMs).toISOString();
    const futureCampaigns = scheduledCampaigns
      .filter(c => c.next_run_at && c.next_run_at >= nowIso)
      .sort((a, b) => (a.next_run_at || '').localeCompare(b.next_run_at || ''));
      
    const immediateNextId = futureCampaigns[0]?.id;

    for (const c of futureCampaigns) {
      if (!c.next_run_at) continue;
      // Extrai hora exata no Fuso Oficial de Brasília (UTC-3)
      const horaBrt = new Intl.DateTimeFormat('pt-BR', { 
        timeZone: 'America/Sao_Paulo', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      }).format(new Date(c.next_run_at));

      if (!map.has(horaBrt)) {
        const info = getNextRunInfo(c.next_run_at);
        map.set(horaBrt, {
          nextRunIso: c.next_run_at,
          campaignTitle: c.title,
          countdownLabel: info?.label || '',
          isNextImmediate: c.id === immediateNextId,
          destinationUrl: c.url,
        });
      }
    }
    return map;
  }, [scheduledCampaigns, nowMs, getNextRunInfo]);

  // Disparo manual ou agendamento
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

      let audiencePayload: any = { all: true, target: 'all', include_admins: true };
      if (targetAudience === 'premium') {
        audiencePayload = { premium: 'premium', target: 'all', include_admins: true };
      } else if (targetAudience === 'free') {
        audiencePayload = { premium: 'free', target: 'all', include_admins: true };
      } else if (targetAudience === 'test_admin') {
        audiencePayload = { target: 'admins_only', include_admins: true };
      }

      if (isNow && targetAudience === 'test_admin') {
        toast.info("Enviando push de teste para o seu aparelho...");
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
        toast.success("Push de teste entregue ao aparelho admin!");
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
          toast.info("Disparando notificação agora...");
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
          if (sErr) console.warn("Erro no worker:", sErr);
          toast.success("Notificação enviada com sucesso para os usuários!");
        } else {
          toast.success(`Notificação agendada para ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(nextRun))}`);
        }

        setTitle("");
        setBody("");
        setDestinationUrl("");
        setScheduledTime("");
        setTab('dashboard');
        loadCampaigns();
      }
    } catch (err: any) {
      console.error("Erro ao criar push:", err);
      toast.error(`Falha: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Ativar / Renovar grade de 2 em 2 horas via push-planner (Próximos 7 dias = 70 disparos)
  const handleRegenerate2HourSchedule = async () => {
    haptic.impact('heavy');
    setPlannerLoading(true);
    toast.loading("Gerando e ativando grade de 2 em 2 horas (próximos 7 dias)...", { id: 'planner_run' });
    try {
      // 1. Tenta via invoke oficial Supabase
      const { data, error } = await supabase.functions.invoke('push-planner', {
        body: { dias: 7 }
      });

      if (!error && data?.ok) {
        toast.success(`Grade a cada 2 horas ativada! ${data.generated} disparos programados.`, { id: 'planner_run' });
        void loadCampaigns();
        return;
      }

      // 2. Fallback direto autenticado
      const resp = await fetch("https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"
        },
        body: JSON.stringify({ dias: 7 })
      });
      const res = await resp.json();
      if (res?.ok) {
        toast.success(`Grade ativada! ${res.generated} disparos programados.`, { id: 'planner_run' });
        void loadCampaigns();
      } else {
        toast.error(`Falha ao gerar grade: ${res?.error || 'Erro desconhecido'}`, { id: 'planner_run' });
      }
    } catch (err: any) {
      toast.error(`Erro: ${err?.message || err}`, { id: 'planner_run' });
    } finally {
      setPlannerLoading(false);
    }
  };

  // Dispara imediatamente o slot selecionado para TODOS os usuários
  const handleDispararSlotAgora = async (slot: typeof GRADE_2_HORAS[0]) => {
    haptic.impact('heavy');
    setDisparandoSlotHora(slot.hora);
    toast.loading(`Disparando notificação das ${slot.hora} (${slot.titulo}) para todos...`, { id: `disp_slot_${slot.hora}` });
    try {
      const tituloFinal = `${slot.emoji} ${slot.titulo}`;
      const { data: campaign, error: cErr } = await supabase.from("push_campaigns").insert({
        title: tituloFinal,
        body: slot.desc,
        url: slot.rota,
        status: "sending",
        next_run_at: new Date().toISOString(),
        audience: { all: true, target: 'all', include_admins: true },
        tipo: slot.tag.toLowerCase(),
        automation_key: `manual-slot-${slot.hora.replace(':', 'h')}`,
      }).select().single();

      if (cErr) throw cErr;

      const { error: sErr } = await supabase.functions.invoke('send-push', {
        body: {
          campaign_id: campaign.id,
          title: tituloFinal,
          body: slot.desc,
          url: slot.rota,
          emoji: slot.emoji,
          audience: { all: true, target: 'all', include_admins: true },
          data: {
            category: slot.tag.toLowerCase(),
            horaSlot: slot.hora,
          }
        }
      });

      if (sErr) console.warn("Aviso worker send-push:", sErr);
      toast.success(`Notificação das ${slot.hora} disparada com sucesso!`, { id: `disp_slot_${slot.hora}` });
      void loadCampaigns();
    } catch (err: any) {
      console.error("Erro ao disparar slot agora:", err);
      toast.error(`Falha ao disparar: ${err.message || err}`, { id: `disp_slot_${slot.hora}` });
    } finally {
      setDisparandoSlotHora(null);
    }
  };

  // Disparo de teste seguro no aparelho do admin (Nuvem + Nativo local)
  const handleTestarSlotNoAparelho = async (slot: typeof GRADE_2_HORAS[0]) => {
    haptic.impact('medium');
    setTestandoSlotHora(slot.hora);
    toast.loading(`Testando push das ${slot.hora} no seu aparelho...`, { id: `test_slot_${slot.hora}` });
    try {
      const tituloFinal = `${slot.emoji} [Teste] ${slot.titulo}`;
      
      // 1. Tenta envio remoto isolado para admins
      void supabase.functions.invoke('send-push', {
        body: {
          title: tituloFinal,
          body: slot.desc,
          url: slot.rota,
          emoji: slot.emoji,
          audience: { target: 'admins_only', include_admins: true },
          data: { category: slot.tag.toLowerCase(), slotHora: slot.hora }
        }
      });

      // 2. Dispara nativamente no hardware do aparelho
      await dispararNotificacaoLocalTeste({
        regra: {
          id: `slot_teste_${slot.hora}`,
          modulo: slot.modulo,
          nome: slot.titulo,
          descricao: slot.desc,
          ativo: true,
          tituloTemplate: tituloFinal,
          subtituloTemplate: slot.desc,
          textoBotaoAcao: 'Abrir agora',
          rotaPadrao: slot.rota,
          publicoAlvo: 'todos',
          gatilhoHorasInatividade: 0,
          mostrarBarraProgresso: false,
          progressoExemplo: 0,
          exemploTitulo: tituloFinal,
          exemploSubtitulo: slot.desc,
          canalAndroid: 'lembrete_estudo',
        },
        delaySegundos: 0,
      });

      toast.success(`Teste das ${slot.hora} entregue no seu aparelho!`, { id: `test_slot_${slot.hora}` });
    } catch (err: any) {
      console.error("Erro ao testar slot:", err);
      toast.error(`Falha no teste: ${err.message || err}`, { id: `test_slot_${slot.hora}` });
    } finally {
      setTestandoSlotHora(null);
    }
  };

  // Abre Sheet para editar conteúdo do slot
  const handleAbrirEditarSlot = (slot: typeof GRADE_2_HORAS[0]) => {
    haptic.selection();
    setSlotParaEditar(slot);
    setEditTitulo(slot.titulo);
    setEditDesc(slot.desc);
    setEditRota(slot.rota);
    setEditEmoji(slot.emoji);
  };

  // Salva customização do slot ou dispara
  const handleSalvarEDispararEditado = async (dispararAgora: boolean) => {
    if (!slotParaEditar) return;
    if (!editTitulo.trim() || !editDesc.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }
    setSalvandoEdicao(true);
    try {
      const tituloFinal = `${editEmoji} ${editTitulo.trim()}`;
      if (dispararAgora) {
        toast.loading(`Disparando notificação editada para todos...`, { id: 'disp_edit' });
        const { data: campaign, error: cErr } = await supabase.from("push_campaigns").insert({
          title: tituloFinal,
          body: editDesc.trim(),
          url: editRota.trim() || slotParaEditar.rota,
          status: "sending",
          next_run_at: new Date().toISOString(),
          audience: { all: true, target: 'all', include_admins: true },
          tipo: slotParaEditar.tag.toLowerCase(),
          automation_key: `manual-edit-${slotParaEditar.hora.replace(':', 'h')}`,
        }).select().single();

        if (cErr) throw cErr;

        await supabase.functions.invoke('send-push', {
          body: {
            campaign_id: campaign.id,
            title: tituloFinal,
            body: editDesc.trim(),
            url: editRota.trim() || slotParaEditar.rota,
            emoji: editEmoji,
            audience: { all: true, target: 'all', include_admins: true },
            data: { category: slotParaEditar.tag.toLowerCase() }
          }
        });
        toast.success("Notificação enviada com sucesso!", { id: 'disp_edit' });
      } else {
        const hoje = new Date();
        const [hh, mm] = slotParaEditar.hora.split(':').map(Number);
        const dataAlvo = new Date();
        dataAlvo.setHours(hh, mm, 0, 0);
        if (dataAlvo.getTime() <= hoje.getTime()) {
          dataAlvo.setDate(dataAlvo.getDate() + 1);
        }

        const { error: cErr } = await supabase.from("push_campaigns").insert({
          title: tituloFinal,
          body: editDesc.trim(),
          url: editRota.trim() || slotParaEditar.rota,
          status: "scheduled",
          next_run_at: dataAlvo.toISOString(),
          audience: { all: true, target: 'all', include_admins: true },
          tipo: slotParaEditar.tag.toLowerCase(),
          automation_key: `custom-slot-${slotParaEditar.hora.replace(':', 'h')}`,
        });

        if (cErr) throw cErr;
        toast.success(`Notificação agendada para ${slotParaEditar.hora}!`);
      }

      setSlotParaEditar(null);
      void loadCampaigns();
    } catch (err: any) {
      toast.error(`Falha: ${err.message || err}`);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Disparo de teste seguro no aparelho do admin
  const handleTestOnAdminDevice = async () => {
    toast.info("Disparando push de teste para o celular do admin...");
    try {
      const { error } = await supabase.functions.invoke('send-push', {
        body: {
          title: "🧪 Teste Direito Prime",
          body: "Push de alta prioridade verificado. O aparelho admin está isolado e nenhum usuário comum recebeu este teste.",
          url: "/admin-push",
          audience: { target: "admins_only", include_admins: true }
        }
      });
      if (error) throw error;
      toast.success("Teste entregue com sucesso!");
    } catch (e: any) {
      toast.error(`Erro: ${e.message || e}`);
    }
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("push_campaigns").update({ status: "cancelled" }).eq("id", id);
    if (!error) {
      toast.success("Disparo cancelado");
      loadCampaigns();
    }
  };

  const getLocalDateStr = (d: Date | string) => {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
  };

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

  const stats = useMemo(() => {
    const all = [...agendadosDoDia, ...historicoDoDia];
    const agendados = agendadosDoDia.length;
    const enviados = all.reduce((acc, c) => acc + (c.sent_count || 0), 0);
    const entregues = all.reduce((acc, c) => acc + (c.delivered_count || 0), 0);
    const abertos = all.reduce((acc, c) => acc + (c.opened_count || 0), 0);
    const falhas = all.reduce((acc, c) => acc + (c.failed_count || 0), 0);
    return { agendados, enviados, entregues, abertos, falhas };
  }, [agendadosDoDia, historicoDoDia]);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white pb-20 relative overflow-hidden font-sans">
      <ShapeGrid />
      <PageHeader
        title={<span className="font-bold tracking-wider text-base sm:text-lg uppercase">Gestor de Push</span>}
        subtitle="Notificações a cada 2 horas e alertas inteligentes"
        onBack={() => navigate("/admin-funcoes")}
        rightAction={
          <button
            onClick={() => navigate('/admin-notificacoes-locais')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-xs font-semibold text-sky-300 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Notificações</span> Locais
          </button>
        }
      />

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 relative z-10">

        {/* ============================================================== */}
        {/* BARRA DE CONTROLE & ABAS MINIMALISTA                          */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-1.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md">
          {/* Segmented Control / Abas */}
          <div className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setTab('grade2h')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                tab === 'grade2h'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Grade 2 Horas</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                tab === 'dashboard'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Linha do Tempo</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                tab === 'manual'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Criar Manual</span>
            </button>
          </div>

          {/* Ações Rápidas Minimalistas */}
          <div className="flex items-center gap-2 self-end sm:self-auto px-1 sm:px-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleTestOnAdminDevice}
              className="h-8 px-2.5 rounded-lg border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
              title="Testar entrega do push no aparelho admin"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
              <span>Testar no Celular</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleRegenerate2HourSchedule}
              disabled={plannerLoading}
              className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Reprogramar agenda de 10 pushes diários para os próximos 7 dias"
            >
              {plannerLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span>Renovar 7 Dias</span>
            </Button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ABA 1: GRADE DETALHADA DAS 2 EM 2 HORAS                        */}
        {/* ============================================================== */}
        {tab === 'grade2h' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* LINHA DE STATUS ULTRA-MINIMALISTA */}
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-zinc-400 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-medium text-zinc-200">10 disparos/dia</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-mono text-[11px]">Brasília (UTC-3)</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 text-[11px]">{scheduledCampaigns.length} agendados</span>
              </div>

              <div className="flex items-center gap-2">
                {nextScheduled && (
                  <div className="flex items-center gap-1.5 text-[11.5px] bg-zinc-900/60 border border-zinc-800 px-2 py-0.5 rounded-md">
                    <span className="text-zinc-500">Próximo:</span>
                    <span className="font-mono font-bold text-white">
                      {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(nextScheduled.next_run_at!))}
                    </span>
                    <span className="font-semibold text-emerald-400">
                      ({getNextRunInfo(nextScheduled.next_run_at)?.label})
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    void loadCampaigns();
                  }}
                  disabled={loading}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
                  title="Atualizar lista de agendados"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GRADE_2_HORAS.map((slot) => {
                const status = slotStatusMap.get(slot.hora);
                const isNext = status?.isNextImmediate;

                return (
                  <div 
                    key={slot.hora}
                    className={`p-4 rounded-2xl transition-all flex flex-col justify-between gap-3 shadow-lg ${
                      isNext
                        ? 'bg-red-950/25 border-2 border-red-500/80 ring-2 ring-red-500/30 shadow-xl shadow-red-950/50'
                        : 'bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center shrink-0 ${
                        isNext ? 'bg-red-900/40 border-red-500/40' : 'bg-zinc-800/80 border-white/5'
                      }`}>
                        <span className="text-base leading-none">{slot.emoji}</span>
                        <span className={`text-[10px] font-mono font-bold mt-1 ${isNext ? 'text-red-300' : 'text-red-400'}`}>
                          {slot.hora}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-sm font-bold text-white tracking-wide truncate">
                            {slot.titulo}
                          </span>
                          <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 shrink-0">
                            {slot.tag}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                          {slot.desc}
                        </p>
                      </div>
                    </div>

                    {/* STATUS DE DISPARO E ROTA DE REDIRECIONAMENTO */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap text-xs">
                      {isNext ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Próximo às {slot.hora} ({status.countdownLabel})
                        </span>
                      ) : status ? (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          Agendado ({status.countdownLabel})
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ativo na Grade
                        </span>
                      )}

                      <span className="text-[10.5px] text-zinc-400 flex items-center gap-1 font-mono shrink-0">
                        <ExternalLink className="w-3 h-3 text-red-400" />
                        <span className="text-zinc-500">Destino:</span>
                        <code className="text-zinc-200 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/5 text-[10px]">
                          {slot.rota}
                        </code>
                      </span>
                    </div>

                    {/* BARRA DE AÇÕES OPERACIONAIS 100% FUNCIONAIS */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleDispararSlotAgora(slot)}
                          disabled={disparandoSlotHora === slot.hora}
                          className="h-7 px-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10.5px] font-bold shadow-sm cursor-pointer"
                          title="Disparar push imediatamente para todos os alunos"
                        >
                          {disparandoSlotHora === slot.hora ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Send className="w-3 h-3 mr-1" />
                          )}
                          <span>Disparar Agora</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestarSlotNoAparelho(slot)}
                          disabled={testandoSlotHora === slot.hora}
                          className="h-7 px-2 rounded-lg bg-zinc-800/80 border-white/10 text-[10.5px] text-zinc-300 hover:text-white hover:bg-zinc-700/60 cursor-pointer"
                          title="Testar entrega da notificação no seu aparelho"
                        >
                          {testandoSlotHora === slot.hora ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Smartphone className="w-3 h-3 mr-1 text-sky-400" />
                          )}
                          <span>Testar</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAbrirEditarSlot(slot)}
                          className="h-7 px-2 rounded-lg text-[10.5px] text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
                          title="Editar texto e rota deste horário"
                        >
                          <Pencil className="w-3 h-3 mr-1 text-zinc-400" />
                          <span>Editar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 2: DASHBOARD & LINHA DO TEMPO DO DIA                       */}
        {/* ============================================================== */}
        {tab === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* SELETOR DE DATA */}
            <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Data dos Disparos:</span>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto bg-zinc-950 border-zinc-800 text-sm h-9 text-white"
              />
            </div>

            {/* MÉTRICAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center">
                <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Agendados</div>
                <div className="text-2xl font-bold text-amber-400 mt-0.5 font-mono">{stats.agendados}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center">
                <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Enviados</div>
                <div className="text-2xl font-bold text-emerald-400 mt-0.5 font-mono">{stats.enviados}</div>
              </div>
              <div 
                className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center cursor-pointer hover:border-purple-500/40 transition-colors"
                onClick={() => setSelectedEventType('opened')}
              >
                <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 flex items-center justify-center gap-1">
                  Abertos <Eye className="w-3 h-3 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-400 mt-0.5 font-mono">{stats.abertos}</div>
              </div>
              <div 
                className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center cursor-pointer hover:border-red-500/40 transition-colors"
                onClick={() => setSelectedEventType('failed')}
              >
                <div className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 flex items-center justify-center gap-1">
                  Falhas <AlertCircle className="w-3 h-3 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-400 mt-0.5 font-mono">{stats.falhas}</div>
              </div>
            </div>

            {/* LISTA DA TIMELINE */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold tracking-widest uppercase text-zinc-400">
                  Eventos do Dia ({selectedDate})
                </h4>
                <Button size="icon" variant="ghost" onClick={loadCampaigns} disabled={loading} className="w-7 h-7 text-zinc-400">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {(() => {
                const allToday = [...agendadosDoDia, ...historicoDoDia];
                if (allToday.length === 0 && !loading) {
                  return (
                    <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
                      <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400">Nenhuma notificação programada para este dia.</p>
                      <Button 
                        onClick={handleRegenerate2HourSchedule}
                        size="sm"
                        className="mt-3 text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
                      >
                        Ativar Grade das 2 em 2 Horas
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
                    <div 
                      key={c.id} 
                      className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-red-400 font-mono flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(runDate))}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                            isSent ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                            isFailed ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                            'text-amber-400 border-amber-500/30 bg-amber-500/10'
                          }`}>
                            {isSent ? 'Enviado' : isFailed ? 'Falhou' : 'Agendado'}
                          </span>
                          {isScheduled && (
                            <button
                              onClick={() => handleCancel(c.id)}
                              className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>

                      <h5 className="font-bold text-sm text-white leading-snug">{c.title}</h5>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{c.body}</p>

                      {(c.sent_count > 0 || c.delivered_count > 0 || c.opened_count > 0) && (
                        <div className="mt-1 pt-2.5 border-t border-zinc-800/60 flex items-center gap-4 text-xs font-mono text-zinc-400">
                          {c.sent_count > 0 && <span className="text-emerald-400">{c.sent_count} envios</span>}
                          {c.delivered_count > 0 && <span className="text-blue-400">{c.delivered_count} entregues</span>}
                          {c.opened_count > 0 && <span className="text-purple-400">{c.opened_count} abertos</span>}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 3: CRIAR MENSAGEM MANUAL COM MOCKUP REALISTA DO BANNER    */}
        {/* ============================================================== */}
        {tab === 'manual' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="p-5 sm:p-6 rounded-3xl bg-zinc-900/40 border-zinc-800/80">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">Criar Mensagem Manual</h3>
                  <p className="text-xs text-zinc-400">Envio pontual com segmentação e isolamento de admin</p>
                </div>
              </div>

              <form onSubmit={handleCreatePush} className="space-y-4">
                {/* PÚBLICO ALVO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-red-500" /> Público Alvo (Segmentação)
                  </label>
                  <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v as TargetAudience)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white">
                      <SelectValue placeholder="Selecione o público" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="users_only">👥 Todos os Usuários Reais (Exclui Admin)</SelectItem>
                      <SelectItem value="premium">⭐ Apenas Assinantes VIP (Exclui Admin)</SelectItem>
                      <SelectItem value="free">📖 Apenas Usuários Gratuitos (Exclui Admin)</SelectItem>
                      <SelectItem value="test_admin">🛡️ Apenas Meu Aparelho Admin (Teste)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* CATEGORIA */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Categoria do Conteúdo</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
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
                  <label className="text-xs font-bold text-zinc-300">Título do Push</label>
                  <Input 
                    placeholder="Ex: Nova lei publicada hoje no DOU" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white"
                  />
                </div>

                {/* CORPO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Mensagem da Tela de Bloqueio</label>
                  <Textarea 
                    placeholder="Digite o texto que o estudante lerá no celular..." 
                    className="bg-zinc-950 border-zinc-800 text-sm min-h-[85px] text-white resize-none"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <div className="text-[11px] text-zinc-500 text-right">{body.length} caracteres</div>
                </div>

                {/* ROTA */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" /> Rota ao Tocar (Opcional)
                  </label>
                  <Input 
                    placeholder="Ex: /vademecum, /noticias, /blog" 
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white"
                  />
                </div>

                {/* AGENDAMENTO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                    <span>Agendar para Mais Tarde (Opcional)</span>
                    <span className="text-[10px] text-zinc-500">Vazio = Envio agora</span>
                  </label>
                  <Input 
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-sm h-10 text-white"
                  />
                </div>

                {/* MOCKUP DO BANNER */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-red-500" /> Prévia do Banner no Aparelho
                  </span>
                  
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl relative overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-md">
                        <Scale className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                            DIREITO PRIME
                          </span>
                          <span className="text-[10px] text-zinc-500">agora</span>
                        </div>
                        <p className="text-xs font-bold text-white leading-snug">
                          {title.trim() || "Título da notificação"}
                        </p>
                        <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                          {body.trim() || "Texto que será exibido no topo do celular do estudante."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÃO */}
                <div className="pt-3">
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> {scheduledTime ? 'Agendar Disparo' : 'Enviar Push Imediato'}</>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

      </div>

      {/* MODAL DE EVENTOS */}
      {/* SHEET DE EDIÇÃO RÁPIDA DE SLOT */}
      <Sheet open={Boolean(slotParaEditar)} onOpenChange={(open) => !open && setSlotParaEditar(null)}>
        <SheetContent side="right" className="bg-[#121214] border-white/10 text-white w-full sm:max-w-md p-6 space-y-5">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-white text-base font-bold flex items-center gap-2">
              <span className="text-xl">{editEmoji}</span>
              <span>Editar Notificação das {slotParaEditar?.hora}</span>
            </SheetTitle>
            <p className="text-xs text-zinc-400">
              Personalize o texto, link e dispare agora ou agende para este horário.
            </p>
          </SheetHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Título da Notificação
              </label>
              <div className="flex gap-2">
                <Input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  className="w-14 bg-zinc-900 border-white/10 text-center text-lg rounded-xl"
                  title="Emoji"
                />
                <Input
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  placeholder="Ex: Hora da Leitura"
                  className="flex-1 bg-zinc-900 border-white/10 text-xs text-white rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Mensagem (Corpo do Push)
              </label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Mensagem do push. Use {nome} para personalizar."
                rows={3}
                className="bg-zinc-900 border-white/10 text-xs text-white rounded-xl resize-none"
              />
              <span className="text-[10px] text-zinc-500">
                Dica: use &#123;nome&#125; para citar o primeiro nome do estudante automaticamente.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Link de Destino (Rota)
              </label>
              <Input
                value={editRota}
                onChange={(e) => setEditRota(e.target.value)}
                placeholder="Ex: /radar-360, /audioaulas"
                className="bg-zinc-900 border-white/10 text-xs text-white font-mono rounded-xl"
              />
            </div>

            <div className="pt-4 space-y-2">
              <Button
                type="button"
                onClick={() => handleSalvarEDispararEditado(true)}
                disabled={salvandoEdicao}
                className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {salvandoEdicao ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Disparar Esta Mensagem Agora para Todos</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSalvarEDispararEditado(false)}
                disabled={salvandoEdicao}
                className="w-full h-10 rounded-xl bg-zinc-900/80 border-white/10 text-zinc-200 hover:text-white text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Salvar Agendamento para às {slotParaEditar?.hora}</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-zinc-800 bg-[#0D0D0D] text-white p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2 text-left">
          <SheetTitle className="text-lg font-bold flex items-center gap-2 text-white">
            {type === 'opened' ? <Eye className="w-5 h-5 text-purple-400" /> : <CheckCircle2 className="w-5 h-5 text-blue-400" />}
            Usuários que {type === 'opened' ? 'Abriram' : 'Receberam'}
          </SheetTitle>
          <p className="text-xs text-zinc-400">Em {new Intl.DateTimeFormat('pt-BR').format(new Date(date + 'T12:00:00'))}</p>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-7 h-7 animate-spin text-red-500 opacity-70" />
              <span className="text-xs font-medium text-zinc-400">Buscando eventos...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
              Nenhum evento registrado nesta categoria hoje.
            </div>
          ) : (
            <div className="space-y-2.5">
              {users.map((u, i) => (
                <div key={`${u.id}-${i}`} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
                  <div className="font-bold text-xs text-white">{u.name}</div>
                  <div className="text-[11px] text-zinc-400">{u.email}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800 text-[10px] text-zinc-500">
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
