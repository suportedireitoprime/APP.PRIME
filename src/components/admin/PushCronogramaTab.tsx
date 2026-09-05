import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { toast } from "sonner";
import {
  type Canal,
  type PushPresetCover,
  PUSH_DEFAULT_COVERS,
  type EventoBase,
  EVENTOS_FIXOS,
  type CampaignRow,
  type LogRow,
  type EventoView,
  padHora,
  PushCronogramaCalendario,
  PushCronogramaResumoCards,
  PushCronogramaCapasGrid,
  PushCronogramaTimelineItem,
  PushCronogramaPreviewSheet,
  PushCronogramaReportSheet,
} from "./push/cronograma";

export { PUSH_DEFAULT_COVERS, type PushPresetCover };

export default function PushCronogramaTab() {
  const [loading, setLoading] = useState(false);
  const [campanhas, setCampanhas] = useState<CampaignRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [pushEvents, setPushEvents] = useState<any[]>([]);
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
      const inicio = new Date(dataFiltro);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(dataFiltro);
      fim.setHours(23, 59, 59, 999);
      const [campRes, logRes, eventsRes] = await Promise.all([
        supabase
          .from("push_campaigns")
          .select(
            "id,title,body,status,automation_key,scheduled_at,next_run_at,created_at,sent_count,failed_count,opened_count,delivered_count,image_url,emoji",
          )
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
        supabase
          .from("push_events")
          .select("event_type")
          .gte("created_at", inicio.toISOString())
          .lte("created_at", fim.toISOString()),
      ]);
      setCampanhas((campRes.data ?? []) as CampaignRow[]);
      setLogs((logRes.data ?? []) as LogRow[]);
      setPushEvents(eventsRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [dataFiltro]);

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
    const lista: EventoView[] = [];

    for (const ev of EVENTOS_FIXOS) {
      const camp = campanhas.find(
        (c) =>
          c.automation_key === ev.automation_key &&
          (c.status === "sent" || c.status === "sending" || c.status === "completed" || c.status === "failed"),
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
          badge =
            failed_count > 0
              ? `${sent_count} enviados · ${failed_count} falhas`
              : `${sent_count} disparos entregues`;
        }
      } else if (skipLog) {
        status = "agendado";
        badge = "Disparo Ativo";
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
      const d =
        c.status === "scheduled"
          ? new Date(c.next_run_at ?? c.scheduled_at ?? c.created_at)
          : new Date(c.created_at);
      const totalFalhas = c.failed_count ?? 0;
      const totalEnvios = c.sent_count ?? 0;
      const eErro = c.status === "failed" || (totalEnvios === 0 && totalFalhas > 0);
      lista.push({
        hora: d.getHours(),
        minuto: d.getMinutes(),
        automation_key: c.automation_key || "manual",
        nome: c.title,
        descricao: c.body,
        emoji: c.emoji || "📨",
        canal: "app",
        publico: "Segmentação personalizada",
        regra: c.status === "scheduled" ? "Campanha agendada manualmente" : "Disparo manual finalizado",
        titulo_exemplo: c.title,
        corpo_exemplo: c.body,
        capa_default: c.image_url || "/assets/push/capa-noticias-juridicas.jpg",
        tags_persuasao: ["Campanha Manual", "Disparo Direto"],
        gatilho_mental: "Comunicação Direta",
        label: padHora(d.getHours(), d.getMinutes()),
        status: c.status === "scheduled" ? "agendado" : eErro ? "erro" : "enviado",
        badge: eErro ? `${totalFalhas} falhas` : c.status !== "scheduled" ? `${totalEnvios} enviados` : "Agendado",
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
    let enviadas = 0,
      falhas = 0,
      abertas = 0,
      entregues = 0,
      campanhasSent = 0,
      comErro = 0;

    for (const ev of pushEvents) {
      if (ev.event_type === "sent") enviadas++;
      else if (ev.event_type === "failed") falhas++;
      else if (ev.event_type === "opened") abertas++;
      else if (ev.event_type === "delivered") entregues++;
    }

    for (const c of campanhas) {
      if ((c.sent_count ?? 0) > 0) campanhasSent++;
      if (c.status === "failed" || ((c.sent_count ?? 0) === 0 && (c.failed_count ?? 0) > 0)) comErro++;
    }

    const taxaAbertura = enviadas > 0 ? Math.round((abertas / enviadas) * 100) : 0;
    const taxaEntrega = enviadas > 0 ? Math.round(((enviadas - falhas) / enviadas) * 100) : 100;
    return { enviadas, falhas, abertas, entregues, campanhasSent, comErro, taxaAbertura, taxaEntrega };
  }, [campanhas, pushEvents]);

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

  return (
    <div className="space-y-5">
      {/* 1. SELETOR DE CALENDÁRIO HORIZONTAL — HOJE NA EXTREMA ESQUERDA */}
      <PushCronogramaCalendario
        isToday={isToday}
        dataFiltro={dataFiltro}
        setDataFiltro={setDataFiltro}
        dias={dias}
        loading={loading}
        onRefresh={load}
      />

      {/* 2. RESUMO DIÁRIO — DESTAQUE VISUAL DE SUCESSO & TAXAS */}
      <PushCronogramaResumoCards resumo={resumo} onSelectReport={setReportType} />

      {/* 3. CAPAS PADRÃO — PRESETS DISPONÍVEIS */}
      <PushCronogramaCapasGrid />

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

      {/* 5. LINHA DO TEMPO COM FEEDBACK VISUAL FORTE */}
      <div className="relative pl-8 space-y-4">
        {/* Linha vertical */}
        <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-border/60" />

        {eventosFiltrados.map((ev, i) => (
          <PushCronogramaTimelineItem
            key={ev.automation_key + i}
            ev={ev}
            isProximo={i === proximoIdx && isToday}
            isExpanded={cardExpandido === ev.automation_key}
            onToggleExpand={() => setCardExpandido(cardExpandido === ev.automation_key ? null : ev.automation_key)}
            onVisualizarETestar={() => {
              setSelectedCover(ev.capa_default);
              setDetalhe(ev);
            }}
          />
        ))}
      </div>

      {/* 6. MODAL DE PRÉVIA REALISTA MOBILE (ANDROID / IOS) & TESTE ADMIN */}
      <PushCronogramaPreviewSheet
        detalhe={detalhe}
        onClose={() => setDetalhe(null)}
        previewPlatform={previewPlatform}
        setPreviewPlatform={setPreviewPlatform}
        selectedCover={selectedCover}
        setSelectedCover={setSelectedCover}
        testando={testando}
        onTestarAdmin={testarAdmin}
      />

      {/* 7. RELATÓRIOS DETALHADOS DE EVENTOS DIÁRIOS */}
      <PushCronogramaReportSheet type={reportType} date={dataFiltro} onClose={() => setReportType(null)} />
    </div>
  );
}
