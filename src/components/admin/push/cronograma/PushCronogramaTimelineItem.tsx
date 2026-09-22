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
            ? "transparent"
            : "transparent",
          borderColor: enviado
            ? "#10b981"
            : erro
            ? "#ef4444"
            : isProximo
            ? "#10b981"
            : agendado || ev.status === "previsto"
            ? "#52525b"
            : "#3f3f46",
          color: enviado
            ? "#000"
            : erro
            ? "#fff"
            : isProximo
            ? "#10b981"
            : agendado || ev.status === "previsto"
            ? "#a1a1aa"
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
            ? "font-medium border-zinc-600 text-zinc-400"
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
          <CircleDashed className="w-3.5 h-3.5" />
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
            : undefined,
          borderColor: enviado
            ? "rgba(16, 185, 129, 0.4)"
            : erro
            ? "rgba(239, 68, 68, 0.6)"
            : isProximo
            ? "rgba(16, 185, 129, 0.6)"
            : undefined,
        }}
        className={`p-2.5 px-3.5 rounded-xl transition-all duration-200 border cursor-pointer ${
          enviado
            ? "shadow-[0_0_20px_rgba(16,185,129,0.06)] hover:border-emerald-500/70"
            : erro
            ? "shadow-[0_0_20px_rgba(239,68,68,0.12)] hover:border-red-500"
            : isProximo
            ? "shadow-md ring-1 ring-emerald-500/30"
            : agendado || ev.status === "previsto"
            ? "shadow-sm hover:border-border bg-card/40"
            : "bg-card/40 border-border/70 hover:border-border"
        }`}
        onClick={(e) => {
          // Apenas expande se o clique não for nos botões
          if ((e.target as HTMLElement).closest("button")) return;
          onToggleExpand();
        }}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          {/* Informações do Disparo */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-black text-primary px-1.5 py-0 bg-primary/10 rounded-md border border-primary/20">
                {ev.label}
              </span>
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
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
                <Badge variant="outline" className="text-[9px] font-bold text-zinc-400 border-zinc-700/50 bg-zinc-800/30">
                  <Check className="w-2.5 h-2.5 mr-0.5" strokeWidth={3} /> AGENDADO
                </Badge>
              )}
              {ev.status === "previsto" && (
                <Badge variant="outline" className="text-[9px] font-bold text-zinc-400 border-zinc-700/50 bg-zinc-800/30">
                  <Check className="w-2.5 h-2.5 mr-0.5" strokeWidth={3} /> AGENDADO
                </Badge>
              )}
              {naoEnviado && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                  NÃO ENVIADO (SEM DADOS)
                </Badge>
              )}
            </div>

            {isExpanded && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 animate-in fade-in slide-in-from-top-1">
                {ev.descricao}
              </p>
            )}

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
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1 rounded-lg border-border/80 hover:bg-secondary px-2.5"
              onClick={onVisualizarETestar}
            >
              <Eye className="w-3 h-3 text-primary" /> Testar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              title={isExpanded ? "Ocultar Detalhes" : "Ver Detalhes"}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

      </Card>
    </div>
  );
}
