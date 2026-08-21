import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Loader2, RefreshCw, Clock, CheckCircle2, CircleDashed, Eye, Send, Smartphone, MessageCircle, Sparkles,
  AlertCircle, Check, Bell, MailOpen, XCircle, Image as ImageIcon, Flame, ExternalLink,
  SmartphoneNfc, Copy, Filter, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";

// Canal de disparo
type Canal = "app" | "horus" | "ambos" | "sistema";

export interface PushPresetCover {
  id: string;
  nome: string;
  url: string;
  descricao: string;
  tag: string;
}

export const PUSH_DEFAULT_COVERS: PushPresetCover[] = [
  {
    id: "radar_leis",
    nome: "Diário Oficial & Leis",
    url: "/assets/push/capa-radar-leis.jpg",
    descricao: "Balança dourada, decretos e estética editorial clássica",
    tag: "Legislação & Radar",
  },
  {
    id: "estudo_horus",
    nome: "Hórus & Metas de Estudo",
    url: "/assets/push/capa-estudo-horus.jpg",
    descricao: "Coruja sábia, neon âmbar/roxo e hologramas de aprendizado",
    tag: "Gamificação & Foco",
  },
  {
    id: "noticias_juridicas",
    nome: "Plenário & Notícias STF",
    url: "/assets/push/capa-noticias-juridicas.jpg",
    descricao: "Tribunais superiores com dados ao vivo e transmissão jurídica",
    tag: "Notícias & Juris",
  },
];

interface EventoBase {
  hora: number;
  minuto: number;
  automation_key: string;
  nome: string;
  descricao: string;
  emoji: string;
  canal: Canal;
  publico: string;
  regra: string;
  titulo_exemplo: string;
  corpo_exemplo: string;
  capa_default: string;
  tags_persuasao: string[];
  gatilho_mental: string;
  papel?: "principal" | "complemento" | "unico";
  complemento?: Exclude<Canal, "sistema">;
  deep_link?: string;
}

const EVENTOS_FIXOS: EventoBase[] = [
  {
    hora: 7, minuto: 0, automation_key: "boletim_leis_matinal",
    nome: "Leis Publicadas", emoji: "📜", canal: "app",
    papel: "unico", deep_link: "/radar-360",
    descricao: "Push oficial com os novos atos normativos e leis publicadas nas últimas 24h.",
    publico: "Todos com opt-in de push",
    regra: "Dispara automaticamente às 07:00 caso haja ao menos 1 nova lei no Radar.",
    titulo_exemplo: "📜 [URGENTE] Novas leis publicadas no Diário Oficial hoje!",
    corpo_exemplo: "⚖️ Atos normativos de alto impacto acabam de entrar em vigor. Toque para ler o resumo.",
    capa_default: "/assets/push/capa-radar-leis.jpg",
    tags_persuasao: ["Urgência Real", "Curadoria Oficial", "Alta Prioridade"],
    gatilho_mental: "Antecipação & Primazia da Informação",
  },
  {
    hora: 9, minuto: 0, automation_key: "boletim_juridico_diario",
    nome: "Boletim Jurídico", emoji: "📰", canal: "app",
    papel: "unico", deep_link: "/noticias",
    descricao: "Boletim matinal consolidando as principais notícias e movimentações jurídicas.",
    publico: "Todos com push habilitado",
    regra: "Envia o boletim diário.",
    titulo_exemplo: "📰 Boletim do Dia: O que você precisa saber hoje",
    corpo_exemplo: "☕ Leitura rápida para não ficar desatualizado na prática.",
    capa_default: "/assets/push/capa-noticias-juridicas.jpg",
    tags_persuasao: ["Autoridade", "Prática Forense", "Micro-leitura"],
    gatilho_mental: "Prova Social & Conhecimento Estratégico",
  },
  {
    hora: 12, minuto: 0, automation_key: "push-aleatorio-blog",
    nome: "Artigo de Blog Aleatório", emoji: "✍️", canal: "app",
    papel: "unico", deep_link: "/blog",
    descricao: "Destaque do meio-dia: seleciona um artigo de doutrina ou jurisprudência aleatoriamente.",
    publico: "Todos os usuários",
    regra: "Puxa um artigo aleatório do blog para manter a leitura em dia.",
    titulo_exemplo: "✍️ Leitura de Meio-Dia: Recomendação Especial para você",
    corpo_exemplo: "Aprofunde-se neste artigo selecionado para a sua pausa de descanso.",
    capa_default: "/assets/push/capa-estudo-horus.jpg",
    tags_persuasao: ["Conteúdo Exclusivo", "Leitura de Pausa", "Atualização"],
    gatilho_mental: "Curiosidade & Recompensa Imprevisível",
  },
  {
    hora: 15, minuto: 0, automation_key: "push-aleatorio-audio",
    nome: "Audioaula Aleatória", emoji: "🎧", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Notificação à tarde incentivando o estudo multitarefa com uma audioaula.",
    publico: "Todos os usuários",
    regra: "Puxa uma audioaula aleatória para revisão passiva.",
    titulo_exemplo: "🎧 Coloque o fone de ouvido: Uma audioaula surpresa para sua tarde",
    corpo_exemplo: "Aproveite para revisar um conteúdo importante enquanto faz outras atividades.",
    capa_default: "/assets/push/capa-estudo-horus.jpg",
    tags_persuasao: ["Áudio Rápido", "Multitarefa", "Revisão Passiva"],
    gatilho_mental: "Facilidade & Aproveitamento de Tempo Ocioso",
  },
  {
    hora: 18, minuto: 0, automation_key: "push-aleatorio-video",
    nome: "Videoaula Aleatória", emoji: "📺", canal: "app",
    papel: "unico", deep_link: "/aprender",
    descricao: "Convite visual no início da noite para assistir a uma videoaula estratégica.",
    publico: "Todos os usuários",
    regra: "Puxa uma videoaula aleatória do acervo.",
    titulo_exemplo: "📺 Fim de Tarde de Foco: Sua videoaula recomendada de hoje",
    corpo_exemplo: "Assista agora a esta aula estratégica e garanta mais uma etapa vencida no dia.",
    capa_default: "/assets/push/capa-estudo-horus.jpg",
    tags_persuasao: ["Estudo Ativo", "Foco", "Consistência"],
    gatilho_mental: "Conclusão de Meta & Reforço Positivo",
  },
  {
    hora: 21, minuto: 0, automation_key: "boletim_noticias_diario",
    nome: "Notícias de Boletins", emoji: "🌙", canal: "app",
    papel: "unico", deep_link: "/noticias",
    descricao: "O giro final com o fechamento do dia nos tribunais e noticiários.",
    publico: "Todos os usuários",
    regra: "Resumo final das notícias mais lidas.",
    titulo_exemplo: "🌙 Fechamento: O resumo das notícias mais quentes de hoje",
    corpo_exemplo: "Confira as manchetes antes de finalizar o expediente.",
    capa_default: "/assets/push/capa-noticias-juridicas.jpg",
    tags_persuasao: ["Fechamento", "Giro Final", "Notícias Relevantes"],
    gatilho_mental: "Aversão à Perda & Informação Completa",
  },
];

interface CampaignRow {
  id: string;
  title: string;
  body: string;
  status: string;
  automation_key: string | null;
  scheduled_at: string | null;
  next_run_at: string | null;
  created_at: string;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  delivered_count: number;
  image_url?: string | null;
  emoji?: string | null;
}

interface LogRow {
  id: string;
  kind: string;
  tipo: string;
  status: string;
  created_at: string;
  payload: any;
}

function padHora(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function CanalBadge({ canal }: { canal: Canal }) {
  const map: Record<Canal, { label: string; cls: string; icon: any }> = {
    app: { label: "Push App", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Smartphone },
    horus: { label: "Hórus WhatsApp", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: MessageCircle },
    ambos: { label: "App + WhatsApp", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: Sparkles },
    sistema: { label: "Sistema", cls: "bg-muted text-muted-foreground border-border", icon: Sparkles },
  };
  const m = map[canal] || map.app;
  const Icon = m.icon;
  return (
    <Badge variant="outline" className={`text-[10px] border ${m.cls} gap-1 py-0.5 px-2 font-medium`}>
      <Icon className="w-3 h-3" /> {m.label}
    </Badge>
  );
}

export default function PushCronogramaTab() {
  const [loading, setLoading] = useState(false);
  const [campanhas, setCampanhas] = useState<CampaignRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [detalhe, setDetalhe] = useState<EventoBase | null>(null);
  const [testando, setTestando] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"enviadas" | "abertas" | "entregues" | "falhas" | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "enviado" | "erro" | "previsto">("todos");
  const [selectedCover, setSelectedCover] = useState<string>(PUSH_DEFAULT_COVERS[0].url);
  const [previewPlatform, setPreviewPlatform] = useState<"android" | "ios">("android");
  const [cardExpandido, setCardExpandido] = useState<string | null>(null);

  // Data selecionada (padrão é hoje)
  const [dataFiltro, setDataFiltro] = useState(new Date());

  async function load() {
    setLoading(true);
    try {
      const inicio = new Date(dataFiltro); inicio.setHours(0, 0, 0, 0);
      const fim = new Date(dataFiltro); fim.setHours(23, 59, 59, 999);
      const [campRes, logRes] = await Promise.all([
        supabase
          .from("push_campaigns")
          .select("id,title,body,status,automation_key,scheduled_at,next_run_at,created_at,sent_count,failed_count,opened_count,delivered_count,image_url,emoji")
          .or(
            `and(created_at.gte.${inicio.toISOString()},created_at.lte.${fim.toISOString()}),and(next_run_at.gte.${inicio.toISOString()},next_run_at.lte.${fim.toISOString()})`,
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("horus_outbound_log")
          .select("id, kind, tipo, status, created_at, payload")
          .gte("created_at", inicio.toISOString())
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      setCampanhas((campRes.data ?? []) as CampaignRow[]);
      setLogs((logRes.data ?? []) as LogRow[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [dataFiltro]);

  const isToday = dataFiltro.toDateString() === new Date().toDateString();
  const agora = new Date();
  const horaAtual = isToday ? agora.getHours() + agora.getMinutes() / 60 : 25;

  // 1. DATA MAIS RECENTE NA ESQUERDA (Hoje primeiro, depois Ontem, D-2, D-3...)
  const dias = useMemo(() => {
    const list = [];
    for (let i = 0; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d);
    }
    return list;
  }, []);

  const eventos = useMemo(() => {
    type EventoView = EventoBase & {
      label: string;
      status: "enviado" | "erro" | "agendado" | "previsto" | "nao_enviado";
      badge?: string;
      sent_count?: number;
      failed_count?: number;
      opened_count?: number;
      realTitle?: string;
      realBody?: string;
      realImage?: string;
      campaignId?: string;
      errorMsg?: string;
    };
    const lista: EventoView[] = [];

    for (const ev of EVENTOS_FIXOS) {
      const camp = campanhas.find(
        (c) => c.automation_key === ev.automation_key && (c.status === "sent" || c.status === "sending" || c.status === "completed" || c.status === "failed"),
      );
      const skipLog = logs.find((l) => l.tipo === ev.automation_key && l.status === "skipped");
      let status: EventoView["status"] = "previsto";
      let badge: string | undefined;
      let sent_count = 0;
      let failed_count = 0;
      let opened_count = 0;
      let realTitle = ev.titulo_exemplo;
      let realBody = ev.corpo_exemplo;
      let realImage = ev.capa_default;
      let campaignId: string | undefined;
      let errorMsg: string | undefined;

      if (camp) {
        campaignId = camp.id;
        failed_count = camp.failed_count ?? 0;
        sent_count = camp.sent_count ?? 0;
        opened_count = camp.opened_count ?? 0;
        if (camp.title) realTitle = camp.title;
        if (camp.body) realBody = camp.body;
        if (camp.image_url) realImage = camp.image_url;

        if (camp.status === "failed" || (sent_count === 0 && failed_count > 0)) {
          status = "erro";
          badge = `${failed_count} falha${failed_count === 1 ? "" : "s"}`;
          errorMsg = `Falha no disparo FCM. ${failed_count} aparelho(s) rejeitaram a mensagem ou token expirado.`;
        } else {
          status = "enviado";
          badge = failed_count > 0
            ? `${sent_count} enviados · ${failed_count} falhas`
            : `${sent_count} disparos entregues`;
        }
      } else if (skipLog) {
        status = "nao_enviado";
        badge = skipLog.payload?.reason === "sem_leis_novas" ? "Sem leis novas hoje" : "Sem conteúdo pendente";
      }

      lista.push({
        ...ev,
        label: padHora(ev.hora, ev.minuto),
        status,
        badge,
        sent_count,
        failed_count,
        opened_count,
        realTitle,
        realBody,
        realImage,
        campaignId,
        errorMsg,
      });
    }

    // Campanhas manuais
    for (const c of campanhas) {
      if (c.automation_key && EVENTOS_FIXOS.some((e) => e.automation_key === c.automation_key)) continue;
      const d = c.status === "scheduled" ? new Date(c.next_run_at ?? c.scheduled_at ?? c.created_at) : new Date(c.created_at);
      const totalFalhas = c.failed_count ?? 0;
      const totalEnvios = c.sent_count ?? 0;
      const eErro = c.status === "failed" || (totalEnvios === 0 && totalFalhas > 0);
      lista.push({
        hora: d.getHours(), minuto: d.getMinutes(), automation_key: c.automation_key || "manual",
        nome: c.title, descricao: c.body, emoji: c.emoji || "📨", canal: "app",
        publico: "Segmentação personalizada",
        regra: c.status === "scheduled" ? "Campanha agendada manualmente" : "Disparo manual finalizado",
        titulo_exemplo: c.title, corpo_exemplo: c.body,
        capa_default: c.image_url || "/assets/push/capa-noticias-juridicas.jpg",
        tags_persuasao: ["Campanha Manual", "Disparo Direto"],
        gatilho_mental: "Comunicação Direta",
        label: padHora(d.getHours(), d.getMinutes()),
        status: c.status === "scheduled" ? "agendado" : eErro ? "erro" : "enviado",
        badge: eErro
          ? `${totalFalhas} falhas`
          : c.status !== "scheduled" ? `${totalEnvios} enviados` : "Agendado",
        sent_count: totalEnvios,
        failed_count: totalFalhas,
        opened_count: c.opened_count ?? 0,
        realTitle: c.title,
        realBody: c.body,
        realImage: c.image_url || "/assets/push/capa-noticias-juridicas.jpg",
        campaignId: c.id,
      });
    }

    lista.sort((a, b) => a.hora * 60 + a.minuto - (b.hora * 60 + b.minuto));
    return lista;
  }, [campanhas, logs]);

  const resumo = useMemo(() => {
    let enviadas = 0, falhas = 0, abertas = 0, entregues = 0, campanhasSent = 0, comErro = 0;
    for (const c of campanhas) {
      enviadas += c.sent_count ?? 0;
      falhas += c.failed_count ?? 0;
      abertas += c.opened_count ?? 0;
      entregues += c.delivered_count ?? 0;
      if ((c.sent_count ?? 0) > 0) campanhasSent++;
      if (c.status === "failed" || ((c.sent_count ?? 0) === 0 && (c.failed_count ?? 0) > 0)) comErro++;
    }
    const taxaAbertura = enviadas > 0 ? Math.round((abertas / enviadas) * 100) : 0;
    const taxaEntrega = enviadas > 0 ? Math.round(((enviadas - falhas) / enviadas) * 100) : 100;
    return { enviadas, falhas, abertas, entregues, campanhasSent, comErro, taxaAbertura, taxaEntrega };
  }, [campanhas]);

  const proximoIdx = eventos.findIndex(
    (e) => (e.status === "previsto" || e.status === "agendado") && e.hora + e.minuto / 60 >= horaAtual,
  );

  const eventosFiltrados = useMemo(() => {
    if (filtroStatus === "todos") return eventos;
    return eventos.filter((e) => e.status === filtroStatus);
  }, [eventos, filtroStatus]);

  async function testarAdmin(ev: EventoBase, coverUrl?: string) {
    setTestando(ev.automation_key);
    try {
      const finalImage = coverUrl || ev.capa_default;
      const { data, error } = await supabase.functions.invoke("push-testar-admin", {
        body: {
          automation_key: ev.automation_key,
          title: ev.titulo_exemplo,
          body: ev.corpo_exemplo,
          image: finalImage,
        },
      });
      if (error) throw error;
      const push = (data as any)?.results?.push?.error ? "push falhou" : "push enviado com sucesso";
      const wpp = (data as any)?.results?.whatsapp?.error ? "whatsapp falhou" : "whatsapp ok";
      toast.success(`Teste disparado com sucesso! (${push} • ${wpp})`);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no disparo do teste para o admin");
    } finally {
      setTestando(null);
    }
  }

  function copiarTexto(texto: string, label: string) {
    navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado para a área de transferência!`);
  }

  return (
    <div className="space-y-5">
      {/* 1. SELETOR DE CALENDÁRIO HORIZONTAL — HOJE NA EXTREMA ESQUERDA */}
      <div className="bg-card/80 backdrop-blur-md p-3.5 rounded-2xl border border-border/70 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Linha do Tempo de Disparos
            </span>
            {isToday && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] animate-pulse">
                AO VIVO (HOJE)
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={isToday ? "default" : "outline"}
              className="h-7 text-xs px-2.5 rounded-lg"
              onClick={() => setDataFiltro(new Date())}
            >
              Hoje ({new Date().getDate()})
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Régua com Hoje na esquerda */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none snap-x">
          {dias.map((d, i) => {
            const selecionado = d.toDateString() === dataFiltro.toDateString();
            const eHoje = d.toDateString() === new Date().toDateString();
            const diaNum = d.getDate();
            const diaSemana = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();
            const mesNome = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

            return (
              <button
                key={i}
                onClick={() => setDataFiltro(d)}
                className={`snap-center flex flex-col items-center justify-center min-w-[72px] h-[70px] rounded-xl border transition-all relative ${
                  selecionado
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02] ring-2 ring-primary/40"
                    : eHoje
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-background/60 border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {eHoje && (
                  <span className="absolute -top-1.5 px-1.5 py-0.2 bg-emerald-500 text-[8px] font-black text-black rounded-full uppercase tracking-tighter">
                    Hoje
                  </span>
                )}
                <div className={`text-[10px] font-bold ${selecionado ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {diaSemana}
                </div>
                <div className="text-xl font-black leading-none my-0.5">{diaNum}</div>
                <div className="text-[9px] opacity-75 capitalize">{mesNome}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. RESUMO DIÁRIO — DESTAQUE VISUAL DE SUCESSO & TAXAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setReportType("enviadas")}
          className="text-left outline-none rounded-2xl focus:ring-2 focus:ring-primary/40 transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <Card className="p-3.5 h-full border-border/70 bg-card/60 backdrop-blur hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium uppercase text-[10px] tracking-wide">
                <Send className="w-3.5 h-3.5 text-primary" /> Enviadas
              </span>
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20">
                {resumo.campanhasSent} rotinas
              </Badge>
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2 tracking-tight">{resumo.enviadas}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Taxa de Entrega: <strong className="text-foreground">{resumo.taxaEntrega}%</strong>
            </div>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setReportType("abertas")}
          className="text-left outline-none rounded-2xl focus:ring-2 focus:ring-emerald-500/40 transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <Card className="p-3.5 h-full border-emerald-500/30 bg-emerald-500/5 backdrop-blur hover:border-emerald-500/60 transition-colors">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium uppercase text-[10px] tracking-wide text-emerald-400">
                <MailOpen className="w-3.5 h-3.5 text-emerald-400" /> Aberturas
              </span>
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {resumo.taxaAbertura}% taxa
              </Badge>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2 tracking-tight">{resumo.abertas}</div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Engajamento direto</div>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setReportType("entregues")}
          className="text-left outline-none rounded-2xl focus:ring-2 focus:ring-sky-500/40 transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <Card className="p-3.5 h-full border-border/70 bg-card/60 backdrop-blur hover:border-sky-500/50 transition-colors">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium uppercase text-[10px] tracking-wide text-sky-400">
                <Check className="w-3.5 h-3.5 text-sky-400" /> Confirmadas
              </span>
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-sky-500/10 text-sky-400 border-sky-500/20">
                FCM OK
              </Badge>
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2 tracking-tight">{resumo.entregues}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Dispositivos ativos</div>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setReportType("falhas")}
          className="text-left outline-none rounded-2xl focus:ring-2 focus:ring-red-500/40 transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <Card className={`p-3.5 h-full backdrop-blur transition-colors ${
            resumo.falhas > 0
              ? "border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
              : "border-border/70 bg-card/60 hover:border-red-500/30"
          }`}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className={`flex items-center gap-1.5 font-medium uppercase text-[10px] tracking-wide ${resumo.falhas > 0 ? "text-red-400" : ""}`}>
                <XCircle className={`w-3.5 h-3.5 ${resumo.falhas > 0 ? "text-red-400" : ""}`} /> Falhas / Erros
              </span>
              {resumo.falhas > 0 && (
                <Badge className="text-[9px] py-0 px-1.5 bg-red-500 text-white font-bold animate-pulse">
                  {resumo.comErro} com erro
                </Badge>
              )}
            </div>
            <div className={`text-2xl font-extrabold mt-2 tracking-tight ${resumo.falhas > 0 ? "text-red-400" : "text-foreground"}`}>
              {resumo.falhas}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {resumo.falhas > 0 ? "Toque para ver log de erros" : "Zero falhas registradas"}
            </div>
          </Card>
        </button>
      </div>

      {/* 3. CAPAS PADRÃO — PRESETS DISPONÍVEIS */}
      <div className="bg-card/70 backdrop-blur-md p-4 rounded-2xl border border-border/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              3 Capas Oficiais Padrão (16:9 Widescreen)
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Otimizadas para FCM e Notificações Ricas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PUSH_DEFAULT_COVERS.map((capa) => (
            <div
              key={capa.id}
              className="group relative overflow-hidden rounded-xl border border-border/80 bg-zinc-950 p-2 space-y-2 hover:border-primary/60 transition-all"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40">
                <img
                  src={capa.url}
                  alt={capa.nome}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <Badge className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-[9px] text-white border-white/20">
                  {capa.tag}
                </Badge>
              </div>
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">{capa.nome}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{capa.descricao}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => copiarTexto(window.location.origin + capa.url, "Link da Capa")}
                  title="Copiar URL pública da imagem"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. FILTROS & BARRA DE CONTROLE DA LINHA DO TEMPO */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Filtrar:</span>
          {(["todos", "enviado", "erro", "previsto"] as const).map((st) => (
            <Button
              key={st}
              size="sm"
              variant={filtroStatus === st ? "secondary" : "ghost"}
              className={`h-7 text-xs px-2.5 rounded-lg capitalize ${
                filtroStatus === st ? "font-bold text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setFiltroStatus(st)}
            >
              {st === "todos" ? "Todos" : st === "enviado" ? "🟢 Enviados" : st === "erro" ? "🔴 Erros" : "⚪ Previstos"}
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Exibindo <strong>{eventosFiltrados.length}</strong> disparos ({dataFiltro.toLocaleDateString("pt-BR")})
        </div>
      </div>

      {/* 5. LINHA DO TEMPO COM FEEDBACK VISUAL FORTE (VERDE PARA SUCESSO / VERMELHO PARA FALHA) */}
      <div className="relative pl-8 space-y-4">
        {/* Linha vertical */}
        <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-border/60" />

        {eventosFiltrados.map((ev, i) => {
          const isProximo = i === proximoIdx && isToday;
          const enviado = ev.status === "enviado";
          const erro = ev.status === "erro";
          const agendado = ev.status === "agendado";
          const naoEnviado = ev.status === "nao_enviado";
          const isExpanded = cardExpandido === ev.automation_key;

          return (
            <div key={ev.automation_key + i} className="relative group">
              {/* Ícone marcador da timeline */}
              <div
                className={`absolute -left-[27px] top-3.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-md transition-all ${
                  enviado
                    ? "bg-emerald-500 border-emerald-400 text-black font-bold ring-4 ring-emerald-500/20"
                    : erro
                    ? "bg-red-500 border-red-400 text-white font-bold ring-4 ring-red-500/20 animate-bounce"
                    : isProximo
                    ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse"
                    : agendado
                    ? "bg-background border-primary/80 text-primary"
                    : "bg-background border-muted-foreground/40 text-muted-foreground"
                }`}
              >
                {enviado ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : erro ? (
                  <XCircle className="w-4 h-4" strokeWidth={3} />
                ) : isProximo ? (
                  <Bell className="w-3.5 h-3.5" />
                ) : agendado ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <CircleDashed className="w-3.5 h-3.5" />
                )}
              </div>

              {/* CARD PRINCIPAL COM DESTAQUE CONDICIONAL */}
              <Card
                className={`p-4 rounded-2xl transition-all duration-200 border ${
                  enviado
                    ? "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.06)] hover:border-emerald-500/70"
                    : erro
                    ? "bg-red-950/20 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.12)] hover:border-red-500"
                    : isProximo
                    ? "bg-card border-primary/60 shadow-md ring-1 ring-primary/30"
                    : "bg-card/70 border-border/70 hover:border-border"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Informações do Disparo */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-black text-primary px-2 py-0.5 bg-primary/10 rounded-md border border-primary/20">
                        {ev.label}
                      </span>
                      <span className="text-base font-bold text-foreground flex items-center gap-1.5">
                        <span>{ev.emoji}</span> {ev.nome}
                      </span>
                      <CanalBadge canal={ev.canal} />

                      {/* BADGES DE STATUS */}
                      {enviado && (
                        <Badge className="bg-emerald-500 text-black font-black text-[10px] gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> ENVIADO COM SUCESSO
                        </Badge>
                      )}
                      {erro && (
                        <Badge className="bg-red-500 text-white font-black text-[10px] gap-1 shadow-sm animate-pulse">
                          <XCircle className="w-3 h-3" /> ERRO NO DISPARO
                        </Badge>
                      )}
                      {agendado && (
                        <Badge variant="outline" className="text-[10px] border-primary text-primary font-bold">
                          <Clock className="w-3 h-3 mr-1" /> AGENDADO
                        </Badge>
                      )}
                      {ev.status === "previsto" && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                          <CircleDashed className="w-3 h-3 mr-1" /> PREVISTO
                        </Badge>
                      )}
                      {naoEnviado && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                          NÃO ENVIADO (SEM DADOS)
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{ev.descricao}</p>

                    {/* Resumo de Disparos se Enviado ou Erro */}
                    {ev.badge && (
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className={`font-semibold ${enviado ? "text-emerald-400" : erro ? "text-red-400" : "text-muted-foreground"}`}>
                          📊 {ev.badge}
                        </span>
                        {ev.opened_count ? (
                          <span className="text-emerald-400/90 font-medium">
                            • {ev.opened_count} aberturas ({Math.round(((ev.opened_count) / (ev.sent_count || 1)) * 100)}%)
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* MENSAGEM DE ERRO DETALHADA */}
                    {erro && ev.errorMsg && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Motivo da Falha:</strong> {ev.errorMsg}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ações do Card */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 rounded-xl border-border/80 hover:bg-secondary"
                      onClick={() => {
                        setSelectedCover(ev.capa_default);
                        setDetalhe(ev);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" /> Visualizar & Testar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                      onClick={() => setCardExpandido(isExpanded ? null : ev.automation_key)}
                      title={isExpanded ? "Ocultar Template" : "Ver Template Persuasivo"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* TEMPLATE INLINE PERSUASIVO COM THUMBNAIL DA CAPA */}
                <div className={`mt-3 pt-3 border-t border-border/50 grid grid-cols-1 md:grid-cols-12 gap-3 transition-all ${
                  isExpanded ? "block" : "hidden md:grid"
                }`}>
                  {/* Prévia do Texto Persuasivo */}
                  <div className="md:col-span-8 bg-zinc-950/60 rounded-xl p-3 border border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Template de Alta Conversão ({ev.gatilho_mental})
                      </span>
                      <div className="flex gap-1">
                        {ev.tags_persuasao.map((tag, tIdx) => (
                          <Badge key={tIdx} variant="secondary" className="text-[9px] py-0 px-1.5 bg-secondary/80">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-foreground leading-snug">{ev.titulo_exemplo}</div>
                    <div className="text-[11px] text-zinc-300 leading-snug">{ev.corpo_exemplo}</div>
                  </div>

                  {/* Thumbnail da Capa Associada */}
                  <div className="md:col-span-4 relative rounded-xl overflow-hidden border border-border/60 bg-black aspect-video flex items-center justify-center group/capa">
                    <img
                      src={ev.realImage || ev.capa_default}
                      alt={ev.nome}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/capa:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[10px] px-2 bg-white/90 text-black hover:bg-white font-bold"
                        onClick={() => {
                          setSelectedCover(ev.capa_default);
                          setDetalhe(ev);
                        }}
                      >
                        Ver em Tela Cheia
                      </Button>
                    </div>
                    <Badge className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-md text-[8px] text-white border-white/20">
                      Capa 16:9
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* 6. MODAL DE PRÉVIA REALISTA MOBILE (ANDROID / IOS) & TESTE ADMIN */}
      <Sheet open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-border/80 bg-background/95 backdrop-blur-xl">
          {detalhe && (
            <div className="max-w-2xl mx-auto space-y-5 pb-8">
              <SheetHeader className="text-left">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">{detalhe.emoji}</span> {detalhe.nome}
                  </SheetTitle>
                  <CanalBadge canal={detalhe.canal} />
                </div>
                <SheetDescription>
                  Disparo agendado para as {padHora(detalhe.hora, detalhe.minuto)} BRT · {detalhe.regra}
                </SheetDescription>
              </SheetHeader>

              {/* Seletor de visualização Android vs iOS */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <SmartphoneNfc className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Prévia de Notificação Push:</span>
                </div>
                <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl">
                  <Button
                    size="sm"
                    variant={previewPlatform === "android" ? "default" : "ghost"}
                    className="h-6 text-xs px-2 rounded-lg"
                    onClick={() => setPreviewPlatform("android")}
                  >
                    Android
                  </Button>
                  <Button
                    size="sm"
                    variant={previewPlatform === "ios" ? "default" : "ghost"}
                    className="h-6 text-xs px-2 rounded-lg"
                    onClick={() => setPreviewPlatform("ios")}
                  >
                    iOS (Apple)
                  </Button>
                </div>
              </div>

              {/* SMARTPHONE REALISTA — NOTIFICAÇÃO EXPANDIDA COM CAPA */}
              <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-800 shadow-2xl relative mx-auto max-w-[380px]">
                {/* Mockup Android Notification */}
                {previewPlatform === "android" ? (
                  <div className="bg-[#242424] rounded-2xl p-3.5 shadow-xl text-white space-y-2.5 border border-zinc-700/50">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <img src="/icons/icon-72x72.png" alt="App" className="w-4 h-4 rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.png'; }} />
                        <span>Direito Prime</span>
                        <span>•</span>
                        <span>agora</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] py-0 px-1 border-zinc-600 text-zinc-300">
                        FCM
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-[13px] text-zinc-100 leading-tight">
                        {detalhe.titulo_exemplo}
                      </div>
                      <div className="text-[12px] text-zinc-300 leading-snug">
                        {detalhe.corpo_exemplo}
                      </div>
                    </div>

                    {/* Capa Anexada */}
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-700/80 shadow-md">
                      <img src={selectedCover} alt="Capa Push" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : (
                  /* Mockup iOS Notification */
                  <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-3.5 shadow-xl text-white space-y-2 border border-zinc-700/40">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                        <img src="/icons/icon-72x72.png" alt="App" className="w-4 h-4 rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.png'; }} />
                        <span>DIREITO PRIME</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">agora</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-bold text-[13px] text-zinc-100">
                        {detalhe.titulo_exemplo}
                      </div>
                      <div className="text-[12px] text-zinc-300 leading-snug">
                        {detalhe.corpo_exemplo}
                      </div>
                    </div>

                    {/* Capa Anexada iOS */}
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-700/60 shadow-md mt-2">
                      <img src={selectedCover} alt="Capa Push" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              {/* SELEÇÃO DE CAPAS PARA O TESTE */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">
                  Escolha a capa padrão para disparar neste teste:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PUSH_DEFAULT_COVERS.map((cp) => (
                    <button
                      key={cp.id}
                      type="button"
                      onClick={() => setSelectedCover(cp.url)}
                      className={`p-1.5 rounded-xl border transition-all text-left ${
                        selectedCover === cp.url
                          ? "bg-primary/10 border-primary ring-2 ring-primary/30"
                          : "bg-secondary/40 border-border hover:bg-secondary"
                      }`}
                    >
                      <div className="aspect-video rounded-lg overflow-hidden border border-border/60">
                        <img src={cp.url} alt={cp.nome} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[10px] font-bold text-foreground mt-1 truncate">{cp.nome}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTÃO DE DISPARO DE TESTE */}
              <div className="pt-2">
                <Button
                  className="w-full h-12 text-sm font-bold rounded-xl shadow-lg"
                  disabled={testando === detalhe.automation_key}
                  onClick={() => testarAdmin(detalhe, selectedCover)}
                >
                  {testando === detalhe.automation_key ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  Disparar Teste Imediato (Push + Capa Selecionada)
                </Button>
                <p className="text-[11px] text-muted-foreground text-center mt-2">
                  O teste será enviado aos aparelhos com token de administrador cadastrado no Supabase.
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 7. RELATÓRIOS DETALHADOS DE EVENTOS DIÁRIOS */}
      <DailyReportSheet type={reportType} date={dataFiltro} onClose={() => setReportType(null)} />
    </div>
  );
}

function DailyReportSheet({ type, date, onClose }: { type: "enviadas"|"abertas"|"entregues"|"falhas"|null; date: Date; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    (async () => {
      const inicio = new Date(date); inicio.setHours(0, 0, 0, 0);
      const fim = new Date(date); fim.setHours(23, 59, 59, 999);
      
      let eventFilter = "";
      if (type === "enviadas") eventFilter = "sent";
      else if (type === "abertas") eventFilter = "opened";
      else if (type === "entregues") eventFilter = "delivered";
      else if (type === "falhas") eventFilter = "failed";

      const { data, error } = await supabase
        .from("push_events")
        .select("id, user_id, campaign_id, platform, event_type, error, created_at, metadata")
        .eq("event_type", eventFilter)
        .gte("created_at", inicio.toISOString())
        .lte("created_at", fim.toISOString())
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) toast.error(error.message);
      
      let list = data ?? [];

      // Deduplica eventos para a mesma campanha e usuário (evita duplicatas na UI se o usuário tiver múltiplos tokens FCM)
      const uniqueKeys = new Set();
      list = list.filter(item => {
        if (!item.campaign_id || !item.user_id) return true;
        const k = `${item.campaign_id}-${item.user_id}`;
        if (uniqueKeys.has(k)) return false;
        uniqueKeys.add(k);
        return true;
      });

      if (type === "abertas") {
        // Buscar jornadas de abertura para calcular rotas e tempo em tela

        // Buscar jornadas de abertura para calcular rotas e tempo em tela
        const campaignIds = Array.from(new Set(list.filter(x => x.campaign_id).map(x => x.campaign_id)));
        if (campaignIds.length > 0) {
          const { data: journeys } = await supabase
            .from("push_open_journey")
            .select("campaign_id, user_id, route, created_at")
            .in("campaign_id", campaignIds)
            .gte("created_at", inicio.toISOString())
            .lte("created_at", fim.toISOString())
            .order("created_at", { ascending: true });

          if (journeys && journeys.length > 0) {
            list.forEach(item => {
               const j = journeys.filter(x => x.campaign_id === item.campaign_id && x.user_id === item.user_id);
               if (j.length > 0) {
                 const first = new Date(j[0].created_at).getTime();
                 const last = new Date(j[j.length - 1].created_at).getTime();
                 const timeS = Math.round((last - first) / 1000);
                 const routes = Array.from(new Set(j.map(x => x.route?.split("?")[0] || ""))).filter(Boolean);
                 if (!item.metadata) item.metadata = {};
                 item.metadata.time_on_screen = timeS;
                 item.metadata.routes = routes;
               }
            });
          }
        }
      }

      const userIds = Array.from(new Set(list.filter(x => x.user_id).map(x => x.user_id)));
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
        const pMap = new Map(profs?.map(p => [p.id, p.display_name]) ?? []);
        list.forEach(item => {
           (item as any).display_name = pMap.get(item.user_id);
        });
      }
      
      setRows(list);
      setLoading(false);
    })();
  }, [type, date]);

  const titles = {
    enviadas: "Disparos Realizados pelo App",
    abertas: "Notificações Abertas pelos Usuários",
    entregues: "Confirmações de Entrega FCM",
    falhas: "Relatório Detalhado de Falhas & Rejeições",
  };

  return (
    <Sheet open={!!type} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border/80 bg-background/95 backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle className="text-base">{type ? titles[type] : ""}</SheetTitle>
          <SheetDescription>Histórico e diagnóstico dos eventos em {date.toLocaleDateString("pt-BR")}</SheetDescription>
        </SheetHeader>
        
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2 mt-4 pb-12">
            {rows.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground text-sm font-medium">Nenhum evento desta categoria registrado para este dia.</p>
              </div>
            )}
            {rows.map((r, i) => (
              <div
                key={i}
                className={`p-3.5 border rounded-xl bg-card/80 text-sm flex flex-col gap-1.5 transition-all ${
                  type === "falhas" ? "border-red-500/30 bg-red-500/5" : "border-border/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground truncate flex-1">
                    {r.display_name || (r.user_id ? "Usuário" : "Aparelho Anônimo")}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono ml-2 shrink-0">
                    {new Date(r.created_at).toLocaleTimeString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold text-foreground shrink-0">
                    {r.platform || "android"}
                  </span>
                  {type === "falhas" && (
                    <span className="text-red-400 font-mono text-xs truncate text-right flex-1 ml-2 font-medium">
                      {r.error || "Token inválido ou notificação desabilitada"}
                    </span>
                  )}
                  {type === "abertas" && (
                    <span className={`flex items-center gap-1 font-medium ml-2 truncate ${r.metadata?.time_on_screen ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {r.metadata?.time_on_screen ? `+${r.metadata.time_on_screen}s em tela` : "Saiu logo em seguida"}
                        {r.metadata?.routes && r.metadata.routes.length > 0 && ` • Rotas: ${r.metadata.routes.join(" → ")}`}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
