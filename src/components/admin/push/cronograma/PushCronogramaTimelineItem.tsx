import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  CheckCircle2,
  CircleDashed,
  XCircle,
  Bell,
  Eye,
  ChevronDown,
  ChevronUp,
  Flame,
  AlertCircle,
} from "lucide-react";
import { CanalBadge } from "./CanalBadge";
import { type EventoView } from "./pushCronogramaConstants";

interface PushCronogramaTimelineItemProps {
  ev: EventoView;
  isProximo: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onVisualizarETestar: () => void;
}

export function PushCronogramaTimelineItem({
  ev,
  isProximo,
  isExpanded,
  onToggleExpand,
  onVisualizarETestar,
}: PushCronogramaTimelineItemProps) {
  const enviado = ev.status === "enviado";
  const erro = ev.status === "erro";
  const agendado = ev.status === "agendado";
  const naoEnviado = ev.status === "nao_enviado";

  return (
    <div className="relative group">
      {/* Ícone marcador da timeline */}
      <div
        style={{
          backgroundColor: enviado
            ? "#10b981"
            : erro
            ? "#ef4444"
            : isProximo
            ? "rgba(16, 185, 129, 0.2)"
            : agendado || ev.status === "previsto"
            ? "rgba(16, 185, 129, 0.2)"
            : "transparent",
          borderColor: enviado
            ? "#10b981"
            : erro
            ? "#ef4444"
            : isProximo
            ? "#10b981"
            : agendado || ev.status === "previsto"
            ? "#10b981"
            : "#3f3f46",
          color: enviado
            ? "#000"
            : erro
            ? "#fff"
            : isProximo
            ? "#10b981"
            : agendado || ev.status === "previsto"
            ? "#10b981"
            : "#a1a1aa",
        }}
        className={`absolute -left-[27px] top-3.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-md transition-all ${
          enviado
            ? "font-bold ring-4 ring-emerald-500/20"
            : erro
            ? "font-bold ring-4 ring-red-500/20 animate-bounce"
            : isProximo
            ? "ring-4 ring-emerald-500/20 animate-pulse"
            : agendado || ev.status === "previsto"
            ? "font-bold"
            : ""
        }`}
      >
        {enviado ? (
          <Check className="w-4 h-4" strokeWidth={3} />
        ) : erro ? (
          <XCircle className="w-4 h-4" strokeWidth={3} />
        ) : isProximo ? (
          <Bell className="w-3.5 h-3.5" />
        ) : agendado || ev.status === "previsto" ? (
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        ) : (
          <CircleDashed className="w-3.5 h-3.5" />
        )}
      </div>

      {/* CARD PRINCIPAL COM DESTAQUE CONDICIONAL */}
      <Card
        style={{
          backgroundColor: enviado
            ? "rgba(16, 185, 129, 0.1)"
            : erro
            ? "rgba(239, 68, 68, 0.1)"
            : isProximo
            ? "rgba(16, 185, 129, 0.05)"
            : agendado || ev.status === "previsto"
            ? "rgba(16, 185, 129, 0.05)"
            : undefined,
          borderColor: enviado
            ? "rgba(16, 185, 129, 0.4)"
            : erro
            ? "rgba(239, 68, 68, 0.6)"
            : isProximo
            ? "rgba(16, 185, 129, 0.6)"
            : agendado || ev.status === "previsto"
            ? "rgba(16, 185, 129, 0.3)"
            : undefined,
        }}
        className={`p-4 rounded-2xl transition-all duration-200 border ${
          enviado
            ? "shadow-[0_0_20px_rgba(16,185,129,0.06)] hover:border-emerald-500/70"
            : erro
            ? "shadow-[0_0_20px_rgba(239,68,68,0.12)] hover:border-red-500"
            : isProximo
            ? "shadow-md ring-1 ring-emerald-500/30"
            : agendado || ev.status === "previsto"
            ? "shadow-sm border-emerald-500/30"
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
                <Badge style={{ backgroundColor: "#10b981", color: "#000" }} className="font-black text-[10px] gap-1 shadow-sm hover:bg-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> ENVIADO COM SUCESSO
                </Badge>
              )}
              {erro && (
                <Badge style={{ backgroundColor: "#ef4444", color: "#fff" }} className="font-black text-[10px] gap-1 shadow-sm animate-pulse hover:bg-red-400">
                  <XCircle className="w-3 h-3" /> ERRO NO DISPARO
                </Badge>
              )}
              {agendado && (
                <Badge variant="outline" style={{ borderColor: "#10b981", color: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)" }} className="text-[10px] font-bold">
                  <Check className="w-3 h-3 mr-1" strokeWidth={3} /> ATIVO
                </Badge>
              )}
              {ev.status === "previsto" && (
                <Badge variant="outline" style={{ borderColor: "#10b981", color: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)" }} className="text-[10px] font-bold">
                  <Check className="w-3 h-3 mr-1" strokeWidth={3} /> ATIVO
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
              onClick={onVisualizarETestar}
            >
              <Eye className="w-3.5 h-3.5 text-primary" /> Visualizar & Testar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={onToggleExpand}
              title={isExpanded ? "Ocultar Template" : "Ver Template Persuasivo"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* TEMPLATE INLINE PERSUASIVO COM THUMBNAIL DA CAPA */}
        <div
          className={`mt-3 pt-3 border-t border-border/50 grid grid-cols-1 md:grid-cols-12 gap-3 transition-all ${
            isExpanded ? "block" : "hidden md:grid"
          }`}
        >
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
                onClick={onVisualizarETestar}
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
}
