import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  RefreshCw,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Play,
  Sparkles,
  Smartphone,
  Plus,
  Radio,
  Layers,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Zap,
  Check,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

// ==========================================
// 1. CONFIGURAÇÃO DE SLOTS (INTERVALO EXATO 2h30m)
// 07:00 -> 09:30 -> 12:00 -> 14:30 -> 17:00 -> 19:30 -> 22:00
// ==========================================
interface PushSlotDef {
  id: string;
  hora: number;
  minuto: number;
  labelHora: string;
  automation_key: string;
  nome: string;
  emoji: string;
  funcaoEdge: string;
  deepLink: string;
  descricao: string;
  tituloPadrao: string;
  corpoPadrao: string;
  capaPadrao: string;
}

const SLOTS_2H30: PushSlotDef[] = [
  {
    id: "slot-1",
    hora: 7,
    minuto: 0,
    labelHora: "07:00",
    automation_key: "boletim_leis_matinal",
    nome: "Radar de Leis & DOU",
    emoji: "📜",
    funcaoEdge: "radar-leis-notify",
    deepLink: "/radar-360",
    descricao: "Varredura do Diário Oficial da União e atos normativos das últimas 24h.",
    tituloPadrao: "📜 Novas leis publicadas no Diário Oficial hoje!",
    corpoPadrao: "⚖️ Atos normativos de alto impacto acabam de entrar em vigor. Toque para ler.",
    capaPadrao: "/assets/push/capa-radar-leis.webp",
  },
  {
    id: "slot-2",
    hora: 9,
    minuto: 30,
    labelHora: "09:30",
    automation_key: "boletim_juridico_diario",
    nome: "Boletim Jurídico & Tribunais",
    emoji: "📰",
    funcaoEdge: "notif-noticias-dia",
    deepLink: "/noticias",
    descricao: "Giro matinal das principais notícias e pautas do STF e STJ (+2h30 do anterior).",
    tituloPadrao: "📰 Boletim do Dia: O que você precisa saber hoje",
    corpoPadrao: "☕ Leitura rápida para não ficar desatualizado na prática forense.",
    capaPadrao: "/assets/push/capa-noticias-juridicas.webp",
  },
  {
    id: "slot-3",
    hora: 12,
    minuto: 0,
    labelHora: "12:00",
    automation_key: "push-aleatorio-blog",
    nome: "Artigo Doutrinário & Blog",
    emoji: "✍️",
    funcaoEdge: "push-aleatorio-blog",
    deepLink: "/blog",
    descricao: "Artigo doutrinário selecionado para leitura na pausa do almoço (+2h30 do anterior).",
    tituloPadrao: "✍️ Leitura de Meio-Dia: Recomendação Especial para você",
    corpoPadrao: "Aprofunde-se neste artigo selecionado para sua pausa de descanso.",
    capaPadrao: "/assets/push/capa-estudo-horus.webp",
  },
  {
    id: "slot-4",
    hora: 14,
    minuto: 30,
    labelHora: "14:30",
    automation_key: "push-aleatorio-audio",
    nome: "Audioaula Estratégica",
    emoji: "🎧",
    funcaoEdge: "push-aleatorio-audio",
    deepLink: "/aprender",
    descricao: "Revisão passiva no fone de ouvido para foco à tarde (+2h30 do anterior).",
    tituloPadrao: "🎧 Coloque o fone de ouvido: Audioaula surpresa para sua tarde",
    corpoPadrao: "Aproveite para revisar um conteúdo importante enquanto faz outras tarefas.",
    capaPadrao: "/assets/push/capa-estudo-horus.webp",
  },
  {
    id: "slot-5",
    hora: 17,
    minuto: 0,
    labelHora: "17:00",
    automation_key: "push-aleatorio-video",
    nome: "Videoaula do Dia",
    emoji: "📺",
    funcaoEdge: "push-aleatorio-video",
    deepLink: "/aprender",
    descricao: "Videoaula recomendada para o estudo ativo de fim de tarde (+2h30 do anterior).",
    tituloPadrao: "📺 Fim de Tarde de Foco: Sua videoaula recomendada de hoje",
    corpoPadrao: "Assista agora a esta aula estratégica e garanta mais uma etapa vencida no dia.",
    capaPadrao: "/assets/push/capa-estudo-horus.webp",
  },
  {
    id: "slot-6",
    hora: 19,
    minuto: 30,
    labelHora: "19:30",
    automation_key: "push-simulado-desafio",
    nome: "Fixação & Questão do Dia",
    emoji: "🎯",
    funcaoEdge: "send-push",
    deepLink: "/simulados",
    descricao: "Desafio prático com questão comentada de concurso e OAB (+2h30 do anterior).",
    tituloPadrao: "🎯 Desafio Noturno: Teste seus conhecimentos agora!",
    corpoPadrao: "Uma questão comentada selecionada para testar seu raciocínio jurídico hoje.",
    capaPadrao: "/assets/push/capa-estudo-horus.webp",
  },
  {
    id: "slot-7",
    hora: 22,
    minuto: 0,
    labelHora: "22:00",
    automation_key: "boletim_noticias_diario",
    nome: "Síntese Noturna dos Tribunais",
    emoji: "🌙",
    funcaoEdge: "notif-noticias-dia",
    deepLink: "/noticias",
    descricao: "Giro final de fechamento do dia nos tribunais (+2h30 do anterior).",
    tituloPadrao: "🌙 Fechamento: O resumo das notícias mais quentes de hoje",
    corpoPadrao: "Confira as decisões de destaque antes de finalizar o expediente.",
    capaPadrao: "/assets/push/capa-noticias-juridicas.webp",
  },
];

interface AutomacaoDb {
  id: string;
  key: string;
  nome: string;
  descricao: string | null;
  enabled: boolean;
  default_url: string | null;
  emoji: string | null;
  cooldown_minutos: number;
  last_run_at: string | null;
}

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
}

interface TokenStats {
  total: number;
  android: number;
  ios: number;
  web: number;
}

export default function AdminPush() {
  const navigate = useNavigate();

  // Estados principais
  const [dataFiltro, setDataFiltro] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"cronograma" | "automacoes" | "historico">("cronograma");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "enviados" | "previstos" | "erros">("todos");

  // Dados do Supabase
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [automacoes, setAutomacoes] = useState<Record<string, AutomacaoDb>>({});
  const [tokenStats, setTokenStats] = useState<TokenStats>({ total: 0, android: 0, ios: 0, web: 0 });
  const [pushEvents, setPushEvents] = useState<any[]>([]);

  // Estados de ação e modais
  const [testandoKey, setTestandoKey] = useState<string | null>(null);
  const [disparandoKey, setDisparandoKey] = useState<string | null>(null);
  const [previewSlot, setPreviewSlot] = useState<PushSlotDef | null>(null);
  const [previewOs, setPreviewOs] = useState<"android" | "ios">("android");
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  // Modal Novo Disparo Manual
  const [modalNovoPush, setModalNovoPush] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoCorpo, setNovoCorpo] = useState("");
  const [novoUrl, setNovoUrl] = useState("/radar-360");
  const [novoPublico, setNovoPublico] = useState<"all" | "premium" | "free">("all");
  const [novoImagem, setNovoImagem] = useState("/assets/push/capa-noticias-juridicas.webp");
  const [enviandoManual, setEnviandoManual] = useState(false);

  // Carregar dados
  async function carregarDados() {
    setLoading(true);
    try {
      const inicio = new Date(dataFiltro);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(dataFiltro);
      fim.setHours(23, 59, 59, 999);

      const [campsRes, autsRes, tokensRes, eventsRes] = await Promise.all([
        supabase
          .from("push_campaigns")
          .select("id,title,body,status,automation_key,scheduled_at,next_run_at,created_at,sent_count,failed_count,opened_count,delivered_count,image_url")
          .or(
            `and(created_at.gte.${inicio.toISOString()},created_at.lte.${fim.toISOString()}),and(next_run_at.gte.${inicio.toISOString()},next_run_at.lte.${fim.toISOString()})`
          )
          .order("created_at", { ascending: false }),
        supabase.from("push_automations" as any).select("*"),
        supabase.from("device_tokens").select("platform"),
        supabase
          .from("push_events")
          .select("event_type")
          .gte("created_at", inicio.toISOString())
          .lte("created_at", fim.toISOString()),
      ]);

      setCampaigns((campsRes.data ?? []) as CampaignRow[]);

      // Mapa de automações
      const autsMap: Record<string, AutomacaoDb> = {};
      ((autsRes.data ?? []) as unknown as AutomacaoDb[]).forEach((a) => {
        autsMap[a.key] = a;
      });
      setAutomacoes(autsMap);

      // Tokens
      const tStats: TokenStats = { total: 0, android: 0, ios: 0, web: 0 };
      (tokensRes.data ?? []).forEach((row: any) => {
        tStats.total++;
        if (row.platform === "android") tStats.android++;
        else if (row.platform === "ios") tStats.ios++;
        else if (row.platform === "web") tStats.web++;
      });
      setTokenStats(tStats);

      setPushEvents(eventsRes.data ?? []);
    } catch (e: any) {
      console.error("Erro ao carregar dados de push:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [dataFiltro]);

  // Seletor de dias (Hoje na extrema esquerda, depois D-1, D-2...)
  const listaDias = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d);
    }
    return arr;
  }, []);

  const isHoje = dataFiltro.toDateString() === new Date().toDateString();
  const agoraMinutos = isHoje ? new Date().getHours() * 60 + new Date().getMinutes() : 9999;

  // Métricas agregadas do dia
  const metricas = useMemo(() => {
    let totalEnviados = 0;
    let totalFalhas = 0;
    let totalAbertos = 0;

    campaigns.forEach((c) => {
      totalEnviados += c.sent_count ?? 0;
      totalFalhas += c.failed_count ?? 0;
      totalAbertos += c.opened_count ?? 0;
    });

    const taxaEntrega = totalEnviados > 0 ? Math.round(((totalEnviados - totalFalhas) / totalEnviados) * 100) : 100;
    const taxaAbertura = totalEnviados > 0 ? Math.round((totalAbertos / totalEnviados) * 100) : 0;

    return {
      totalEnviados,
      totalFalhas,
      totalAbertos,
      taxaEntrega,
      taxaAbertura,
    };
  }, [campaigns]);

  // Processamento dos 7 slots diários
  const slotsProcessados = useMemo(() => {
    return SLOTS_2H30.map((slot) => {
      const slotMinutos = slot.hora * 60 + slot.minuto;
      const campanhaEncontrada = campaigns.find((c) => c.automation_key === slot.automation_key);
      const automacaoDb = automacoes[slot.automation_key];
      const isAtivo = automacaoDb ? automacaoDb.enabled : true;

      let status: "enviado" | "proximo" | "previsto" | "falha" = "previsto";
      let statusLabel = "Previsto";

      if (campanhaEncontrada) {
        if (campanhaEncontrada.status === "failed" || (campanhaEncontrada.sent_count === 0 && campanhaEncontrada.failed_count > 0)) {
          status = "falha";
          statusLabel = "Falha no disparo";
        } else {
          status = "enviado";
          statusLabel = `${campanhaEncontrada.sent_count} enviados`;
        }
      } else if (isHoje) {
        if (slotMinutos < agoraMinutos) {
          status = "previsto";
          statusLabel = "Horário concluído";
        } else if (slotMinutos >= agoraMinutos && slotMinutos <= agoraMinutos + 150) {
          status = "proximo";
          statusLabel = "Próximo envio";
        } else {
          status = "previsto";
          statusLabel = "Agendado";
        }
      }

      return {
        ...slot,
        slotMinutos,
        campanha: campanhaEncontrada,
        isAtivo,
        status,
        statusLabel,
      };
    });
  }, [campaigns, automacoes, isHoje, agoraMinutos]);

  // Filtro de slots
  const slotsFiltrados = useMemo(() => {
    if (filtroStatus === "todos") return slotsProcessados;
    if (filtroStatus === "enviados") return slotsProcessados.filter((s) => s.status === "enviado");
    if (filtroStatus === "erros") return slotsProcessados.filter((s) => s.status === "falha");
    if (filtroStatus === "previstos") return slotsProcessados.filter((s) => s.status === "previsto" || s.status === "proximo");
    return slotsProcessados;
  }, [slotsProcessados, filtroStatus]);

  // 1. Testar Admin (Push + WhatsApp)
  async function testarAdmin(slot: PushSlotDef) {
    setTestandoKey(slot.automation_key);
    try {
      const { data, error } = await supabase.functions.invoke("push-testar-admin", {
        body: {
          automation_key: slot.automation_key,
          title: slot.tituloPadrao,
          body: slot.corpoPadrao,
          url: slot.deepLink,
          image: slot.capaPadrao,
        },
      });
      if (error) throw error;
      const pushOk = !(data as any)?.results?.push?.error;
      const wppOk = !(data as any)?.results?.whatsapp?.error;
      toast.success(
        `Teste enviado para os admins! (${pushOk ? "Push OK" : "Push Falhou"} • ${wppOk ? "WhatsApp OK" : "WhatsApp Falhou"})`
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar teste aos administradores");
    } finally {
      setTestandoKey(null);
    }
  }

  // 2. Disparar Agora (Execução Real da Edge Function para toda a base)
  async function dispararBaseAgora(slot: PushSlotDef) {
    const confirmou = window.confirm(
      `Confirma o disparo REAL da rotina "${slot.nome}" para TODOS os usuários ativos cadastrados?`
    );
    if (!confirmou) return;

    setDisparandoKey(slot.automation_key);
    try {
      if (slot.funcaoEdge === "send-push") {
        // Disparo universal
        const { error } = await supabase.functions.invoke("send-push", {
          body: {
            title: slot.tituloPadrao,
            body: slot.corpoPadrao,
            url: slot.deepLink,
            audience: { all: true },
          },
        });
        if (error) throw error;
      } else {
        // Disparo da edge function especializada (ex: push-aleatorio-blog, radar-leis-notify, etc.)
        const { error } = await supabase.functions.invoke(slot.funcaoEdge, {
          body: { force: true },
        });
        if (error) throw error;
      }
      toast.success(`Rotina "${slot.nome}" executada com sucesso! Atualizando métricas...`);
      await carregarDados();
    } catch (e: any) {
      toast.error(`Erro ao executar rotina: ${e?.message ?? "Falha na comunicação com o servidor"}`);
    } finally {
      setDisparandoKey(null);
    }
  }

  // 3. Toggle Ativar/Desativar Automação
  async function alternarAutomacao(key: string, enabledAtual: boolean) {
    const novaEnabled = !enabledAtual;
    const { error } = await supabase
      .from("push_automations" as any)
      .update({ enabled: novaEnabled })
      .eq("key", key);

    if (error) {
      toast.error("Erro ao salvar status da automação");
      return;
    }

    setAutomacoes((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: novaEnabled },
    }));
    toast.success(novaEnabled ? "Automação ativada" : "Automação pausada");
  }

  // 4. Envio Manual Rápido
  async function enviarPushManual() {
    if (!novoTitulo.trim() || !novoCorpo.trim()) {
      toast.error("Preencha o título e a mensagem");
      return;
    }

    setEnviandoManual(true);
    try {
      const { error } = await supabase.functions.invoke("send-push", {
        body: {
          title: novoTitulo,
          body: novoCorpo,
          url: novoUrl,
          audience: novoPublico === "all" ? { all: true } : { plan: novoPublico },
          imageUrl: novoImagem,
        },
      });

      if (error) throw error;
      toast.success("Notificação push disparada com sucesso para a base!");
      setModalNovoPush(false);
      setNovoTitulo("");
      setNovoCorpo("");
      await carregarDados();
    } catch (e: any) {
      toast.error(`Falha no envio: ${e?.message ?? "Erro desconhecido"}`);
    } finally {
      setEnviandoManual(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#09090b] text-zinc-100 pb-16 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* ========================================================
          1. HEADER ULTRA-MINIMALISTA & BARRA SUPERIOR
         ======================================================== */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin-funcoes")}
              className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95"
              title="Voltar ao menu administrativo"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.4} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Notificações Push
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cadência 2h30m
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {isHoje ? "Cronograma ao vivo de hoje" : `Disparos de ${dataFiltro.toLocaleDateString("pt-BR")}`} · {tokenStats.total} dispositivos ativos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setModalNovoPush(true)}
              className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />
              <span className="hidden sm:inline">Novo Disparo</span>
            </Button>
            <button
              onClick={carregarDados}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* ========================================================
            2. 4 CARDS DE MÉTRICAS ESSENCIAIS (KPIs MINIMALISTAS)
           ======================================================== */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Card className="p-3.5 bg-zinc-900/50 border-zinc-800/80 rounded-2xl flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-zinc-400" /> Enviadas Hoje
            </span>
            <div className="mt-2">
              <div className="text-2xl font-black text-white tracking-tight">{metricas.totalEnviados}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> {metricas.taxaEntrega}% taxa de entrega
              </div>
            </div>
          </Card>

          <Card className="p-3.5 bg-zinc-900/50 border-zinc-800/80 rounded-2xl flex flex-col justify-between">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Aberturas
            </span>
            <div className="mt-2">
              <div className="text-2xl font-black text-emerald-400 tracking-tight">{metricas.totalAbertos}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {metricas.taxaAbertura}% taxa de abertura
              </div>
            </div>
          </Card>

          <Card className="p-3.5 bg-zinc-900/50 border-zinc-800/80 rounded-2xl flex flex-col justify-between">
            <span className="text-[11px] font-medium text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" /> Dispositivos FCM
            </span>
            <div className="mt-2">
              <div className="text-2xl font-black text-white tracking-tight">{tokenStats.total}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                {tokenStats.android} Android · {tokenStats.ios} iOS · {tokenStats.web} Web
              </div>
            </div>
          </Card>

          <Card className="p-3.5 bg-zinc-900/50 border-zinc-800/80 rounded-2xl flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-400" /> Falhas / Erros
            </span>
            <div className="mt-2">
              <div className={`text-2xl font-black tracking-tight ${metricas.totalFalhas > 0 ? "text-red-400" : "text-white"}`}>
                {metricas.totalFalhas}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {metricas.totalFalhas === 0 ? "Nenhum erro registrado" : "Verificar logs de envio"}
              </div>
            </div>
          </Card>
        </section>

        {/* ========================================================
            3. SELETOR DE DATA HORIZONTAL (HOJE NA ESQUERDA)
           ======================================================== */}
        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="px-2 text-xs font-semibold text-zinc-400 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Data:
          </div>
          {listaDias.map((d, idx) => {
            const ehHoje = d.toDateString() === new Date().toDateString();
            const selecionado = d.toDateString() === dataFiltro.toDateString();
            const diaSemana = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();
            const diaNum = d.getDate();

            return (
              <button
                key={idx}
                onClick={() => setDataFiltro(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  selecionado
                    ? "bg-zinc-100 text-zinc-950 font-bold shadow"
                    : ehHoje
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {ehHoje && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                <span>{ehHoje ? "Hoje" : diaSemana}</span>
                <span className="opacity-80 font-mono">({diaNum})</span>
              </button>
            );
          })}
        </section>

        {/* ========================================================
            4. ABAS DE VISUALIZAÇÃO: CRONOGRAMA 2h30 vs AUTOMAÇÕES vs HISTÓRICO
           ======================================================== */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab("cronograma")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === "cronograma"
                  ? "bg-zinc-800 text-white shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Cronograma (2h30m)
            </button>
            <button
              onClick={() => setActiveTab("automacoes")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === "automacoes"
                  ? "bg-zinc-800 text-white shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Regras & Funções
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === "historico"
                  ? "bg-zinc-800 text-white shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Histórico ({campaigns.length})
            </button>
          </div>

          {activeTab === "cronograma" && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400">
              <span className="text-zinc-500 font-mono">Filtrar:</span>
              {(["todos", "enviados", "previstos", "erros"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltroStatus(st)}
                  className={`px-2 py-0.5 rounded capitalize transition-all ${
                    filtroStatus === st ? "bg-zinc-800 text-white font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================
            5. ABA: CRONOGRAMA 2H30 (LINHA DO TEMPO REFEITA DO ZERO)
           ======================================================== */}
        {activeTab === "cronograma" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  <strong>7 horários sequenciais</strong> com espaçamento exato de <strong>2h30m</strong>
                </span>
              </div>
              <span className="font-mono text-zinc-500">
                07:00 → 09:30 → 12:00 → 14:30 → 17:00 → 19:30 → 22:00
              </span>
            </div>

            <div className="space-y-3">
              {slotsFiltrados.map((slot, index) => {
                const isSent = slot.status === "enviado";
                const isFailed = slot.status === "falha";
                const isNext = slot.status === "proximo";
                const isExpanded = expandidoId === slot.id;

                return (
                  <React.Fragment key={slot.id}>
                    {/* Indicador visual de intervalo entre slots (+2h30m) */}
                    {index > 0 && (
                      <div className="flex items-center justify-center py-1">
                        <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
                          <Clock className="w-2.5 h-2.5 text-zinc-400" />
                          <span>+ 2 horas e 30 minutos</span>
                        </div>
                      </div>
                    )}

                    <Card
                      className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-200 ${
                        isSent
                          ? "bg-zinc-900/40 border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.03)]"
                          : isFailed
                          ? "bg-zinc-900/40 border-red-500/40 hover:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.06)]"
                          : isNext
                          ? "bg-zinc-900/80 border-emerald-500/50 ring-1 ring-emerald-500/30"
                          : "bg-zinc-900/30 border-zinc-800/80 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        {/* Lado Esquerdo: Horário, Ícone e Detalhes */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-white border border-zinc-700">
                              {slot.labelHora}
                            </span>
                            <span className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{slot.emoji}</span> {slot.nome}
                            </span>

                            {/* Badge de Status */}
                            {isSent && (
                              <Badge className="bg-emerald-500 text-zinc-950 font-black text-[10px] gap-1 hover:bg-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> ENVIADO
                              </Badge>
                            )}
                            {isFailed && (
                              <Badge className="bg-red-500 text-white font-black text-[10px] gap-1 animate-pulse">
                                <XCircle className="w-3 h-3" /> FALHA
                              </Badge>
                            )}
                            {isNext && (
                              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] gap-1 font-semibold animate-pulse">
                                <Zap className="w-3 h-3" /> PRÓXIMO DISPARO
                              </Badge>
                            )}
                            {!isSent && !isFailed && !isNext && (
                              <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700 bg-zinc-800/40">
                                AGENDADO
                              </Badge>
                            )}

                            {!slot.isAtivo && (
                              <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-800">
                                Pausado
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {slot.campanha ? slot.campanha.body : slot.descricao}
                          </p>

                          {/* Estatísticas do Disparo Se Existir */}
                          {slot.campanha && (
                            <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1 font-mono">
                              <span className="text-emerald-400 font-semibold">
                                ✓ {slot.campanha.sent_count} disparos entregues
                              </span>
                              <span>·</span>
                              <span>{slot.campanha.opened_count} aberturas</span>
                              {slot.campanha.failed_count > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-red-400 font-semibold">{slot.campanha.failed_count} falhas</span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Área Expandida com Informações Técnicas */}
                          {isExpanded && (
                            <div className="pt-2 text-xs text-zinc-400 space-y-1.5 border-t border-zinc-800/60 mt-2 animate-in fade-in">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase font-mono">Gatilho Edge:</span>
                                  <code className="text-emerald-400 font-mono text-[11px]">{slot.funcaoEdge}</code>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase font-mono">Deep Link Destino:</span>
                                  <span className="text-zinc-300 font-mono text-[11px]">{slot.deepLink}</span>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-zinc-500 block text-[10px] uppercase font-mono">Título Padrão:</span>
                                  <span className="text-zinc-300">{slot.tituloPadrao}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Lado Direito: Ações Rápidas */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {/* Botão Testar Admin */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testarAdmin(slot)}
                            disabled={testandoKey === slot.automation_key}
                            className="h-8 text-xs px-2.5 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1 active:scale-95"
                            title="Disparar push e WhatsApp de teste apenas para os administradores"
                          >
                            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{testandoKey === slot.automation_key ? "Testando..." : "Testar Admin"}</span>
                          </Button>

                          {/* Botão Disparar Base Agora */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dispararBaseAgora(slot)}
                            disabled={disparandoKey === slot.automation_key}
                            className="h-8 text-xs px-2.5 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1 active:scale-95"
                            title="Executar imediatamente esta rotina para todos os usuários"
                          >
                            <Play className="w-3.5 h-3.5 text-sky-400" />
                            <span>{disparandoKey === slot.automation_key ? "Disparando..." : "Disparar Base"}</span>
                          </Button>

                          {/* Botão Ver Prévia */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewSlot(slot)}
                            className="h-8 w-8 p-0 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
                            title="Ver como fica no celular"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {/* Toggle Ativo/Inativo */}
                          <div className="pl-1 border-l border-zinc-800" title="Ativar ou pausar slot">
                            <Switch
                              checked={slot.isAtivo}
                              onCheckedChange={() => alternarAutomacao(slot.automation_key, slot.isAtivo)}
                            />
                          </div>

                          {/* Expansor de Detalhes */}
                          <button
                            onClick={() => setExpandidoId(isExpanded ? null : slot.id)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                            title="Expandir informações"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </Card>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            6. ABA: REGRAS & FUNÇÕES (CONTROLE DE AUTOMATIONS NO BANCO)
           ======================================================== */}
        {activeTab === "automacoes" && (
          <div className="space-y-3">
            <div className="text-xs text-zinc-400">
              Gerencie o status direto das rotinas registradas na tabela <code className="text-zinc-300">push_automations</code>.
            </div>

            {Object.values(automacoes).map((auto) => (
              <Card key={auto.id} className="p-3.5 bg-zinc-900/40 border-zinc-800 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-2xl">{auto.emoji || "🔔"}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-white flex items-center gap-2">
                      <span>{auto.nome}</span>
                      <code className="text-[10px] text-zinc-500 font-mono">({auto.key})</code>
                    </div>
                    {auto.descricao && <div className="text-xs text-zinc-400 truncate">{auto.descricao}</div>}
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Destino: <span className="font-mono text-zinc-400">{auto.default_url || "/"}</span> · Cooldown: {auto.cooldown_minutos || 120}m
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold ${auto.enabled ? "text-emerald-400" : "text-zinc-500"}`}>
                    {auto.enabled ? "Ativa" : "Pausada"}
                  </span>
                  <Switch
                    checked={auto.enabled}
                    onCheckedChange={() => alternarAutomacao(auto.key, auto.enabled)}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ========================================================
            7. ABA: HISTÓRICO DE DISPAROS
           ======================================================== */}
        {activeTab === "historico" && (
          <div className="space-y-2">
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                Nenhum disparo registrado nesta data.
              </div>
            ) : (
              campaigns.map((camp) => (
                <Card key={camp.id} className="p-3 bg-zinc-900/40 border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{camp.title}</span>
                      <Badge variant="outline" className="text-[9px] font-mono text-zinc-400">
                        {camp.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-zinc-400 truncate mt-0.5">{camp.body}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                      {new Date(camp.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                      {camp.sent_count} enviados · {camp.opened_count} abertos · {camp.failed_count} falhas
                    </div>
                  </div>
                  {camp.image_url && (
                    <img src={camp.image_url} alt="" className="w-10 h-10 object-cover rounded-lg shrink-0 border border-zinc-800" />
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: PRÉVIA REALISTA NO SMARTPHONE (ANDROID & IOS)
         ======================================================== */}
      <Dialog open={!!previewSlot} onOpenChange={(open) => !open && setPreviewSlot(null)}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Prévia no Smartphone</span>
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
                <button
                  onClick={() => setPreviewOs("android")}
                  className={`px-2 py-0.5 rounded font-medium ${previewOs === "android" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
                >
                  Android
                </button>
                <button
                  onClick={() => setPreviewOs("ios")}
                  className={`px-2 py-0.5 rounded font-medium ${previewOs === "ios" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
                >
                  iOS
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {previewSlot && (
            <div className="py-2 space-y-4">
              {/* Moldura do Celular */}
              <div className="mx-auto w-[280px] sm:w-[320px] rounded-[32px] border-4 border-zinc-800 bg-zinc-950 p-4 shadow-2xl relative overflow-hidden">
                {/* Notch / Dynamic Island */}
                <div className="w-20 h-4 bg-zinc-800 rounded-full mx-auto mb-6" />

                {/* Relógio do Lockscreen */}
                <div className="text-center my-2 text-zinc-300">
                  <div className="text-4xl font-extralight tracking-tight font-sans">
                    {previewSlot.labelHora}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                    {dataFiltro.toLocaleDateString("pt-BR", { weekday: "long", month: "short", day: "numeric" })}
                  </div>
                </div>

                {/* Banner da Notificação */}
                <div className="mt-6 rounded-2xl bg-zinc-900/90 border border-zinc-700/60 p-3 backdrop-blur shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                      <span className="w-4 h-4 rounded bg-emerald-500 text-black flex items-center justify-center text-[10px] font-black">
                        P
                      </span>
                      <span>DIREITO PRIME</span>
                    </div>
                    <span>agora</span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white leading-snug">
                      {previewSlot.tituloPadrao}
                    </div>
                    <div className="text-[11px] text-zinc-300 leading-relaxed mt-0.5 line-clamp-2">
                      {previewSlot.corpoPadrao}
                    </div>
                  </div>

                  {previewSlot.capaPadrao && (
                    <img
                      src={previewSlot.capaPadrao}
                      alt="Capa do push"
                      className="w-full h-24 object-cover rounded-xl border border-zinc-800"
                    />
                  )}
                </div>

                {/* Barra Home */}
                <div className="w-24 h-1 bg-zinc-700 rounded-full mx-auto mt-12" />
              </div>

              <div className="text-center text-xs text-zinc-400">
                Gatilho: <code className="text-emerald-400 font-mono">{previewSlot.funcaoEdge}</code>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl"
              onClick={() => {
                if (previewSlot) testarAdmin(previewSlot);
              }}
            >
              <FlaskConical className="w-4 h-4 mr-1.5" /> Disparar Teste Real para Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL: NOVO DISPARO MANUAL INSTANTÂNEO
         ======================================================== */}
      <Dialog open={modalNovoPush} onOpenChange={setModalNovoPush}>
        <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-white rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" /> Compor Novo Disparo Manual
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Título da Notificação</label>
              <Input
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                placeholder="Ex: 📜 Nova Lei de Impacto Publicada Hoje"
                className="bg-zinc-900 border-zinc-800 text-white rounded-xl text-xs h-9"
              />
            </div>

            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Mensagem (Corpo)</label>
              <Textarea
                value={novoCorpo}
                onChange={(e) => setNovoCorpo(e.target.value)}
                placeholder="Ex: Atos normativos acabam de ser catalogados no Radar 360..."
                className="bg-zinc-900 border-zinc-800 text-white rounded-xl text-xs resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Destino (Deep Link)</label>
                <Input
                  value={novoUrl}
                  onChange={(e) => setNovoUrl(e.target.value)}
                  placeholder="/radar-360"
                  className="bg-zinc-900 border-zinc-800 text-white rounded-xl text-xs h-9 font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Público Alvo</label>
                <select
                  value={novoPublico}
                  onChange={(e) => setNovoPublico(e.target.value as any)}
                  className="w-full h-9 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-xs px-2.5 outline-none"
                >
                  <option value="all">Todos os usuários (Geral)</option>
                  <option value="premium">Apenas Assinantes Premium</option>
                  <option value="free">Apenas Usuários Gratuitos</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Capa da Notificação</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Radar Leis", url: "/assets/push/capa-radar-leis.webp" },
                  { label: "Notícias", url: "/assets/push/capa-noticias-juridicas.webp" },
                  { label: "Hórus / Estudo", url: "/assets/push/capa-estudo-horus.webp" },
                ].map((capa) => (
                  <button
                    key={capa.url}
                    type="button"
                    onClick={() => setNovoImagem(capa.url)}
                    className={`p-1.5 rounded-xl border text-left transition-all ${
                      novoImagem === capa.url ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/60"
                    }`}
                  >
                    <img src={capa.url} alt="" className="w-full h-12 object-cover rounded-lg mb-1" />
                    <span className="text-[10px] text-zinc-300 font-medium truncate block">{capa.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setModalNovoPush(false)}
              className="rounded-xl border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            >
              Cancelar
            </Button>
            <Button
              onClick={enviarPushManual}
              disabled={enviandoManual}
              className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl"
            >
              <Send className="w-4 h-4 mr-1.5" />
              {enviandoManual ? "Disparando..." : "Disparar Push Agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
