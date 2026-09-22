import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, MailOpen, Check, XCircle } from "lucide-react";

interface ResumoMetricas {
  enviadas: number;
  falhas: number;
  abertas: number;
  entregues: number;
  campanhasSent: number;
  comErro: number;
  taxaAbertura: number;
  taxaEntrega: number;
}

interface PushCronogramaResumoCardsProps {
  resumo: ResumoMetricas;
  onSelectReport: (type: "enviadas" | "abertas" | "entregues" | "falhas") => void;
}

export function PushCronogramaResumoCards({ resumo, onSelectReport }: PushCronogramaResumoCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      <button
        type="button"
        onClick={() => onSelectReport("enviadas")}
        className="text-left outline-none rounded-2xl focus:ring-2 focus:ring-primary/40 transition-all hover:scale-[1.01] active:scale-[0.98]"
      >
        <Card className="p-2.5 h-full border-border/70 bg-card/60 backdrop-blur hover:border-primary/50 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium uppercase text-[9px] tracking-wide">
              <Send className="w-3 h-3 text-primary" /> Enviadas
            </span>
            <Badge variant="outline" className="text-[8px] py-0 px-1 bg-primary/10 text-primary border-primary/20">
              {resumo.campanhasSent} rotinas
            </Badge>
          </div>
          <div className="mt-1">
            <div className="text-xl font-extrabold text-foreground tracking-tight">{resumo.enviadas}</div>
            <div className="text-[10px] text-muted-foreground">
              Taxa: <strong className="text-foreground">{resumo.taxaEntrega}%</strong>
            </div>
          </div>
        </Card>
      </button>

      <button
        type="button"
        onClick={() => onSelectReport("abertas")}
        className="text-left outline-none rounded-2xl focus:ring-2 focus:ring-emerald-500/40 transition-all hover:scale-[1.01] active:scale-[0.98]"
      >
        <Card className="p-2.5 h-full border-emerald-500/30 bg-emerald-500/5 backdrop-blur hover:border-emerald-500/60 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium uppercase text-[9px] tracking-wide text-emerald-400">
              <MailOpen className="w-3 h-3 text-emerald-400" /> Aberturas
            </span>
            <Badge variant="outline" className="text-[8px] py-0 px-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {resumo.taxaAbertura}% taxa
            </Badge>
          </div>
          <div className="mt-1">
            <div className="text-xl font-extrabold text-emerald-400 tracking-tight">{resumo.abertas}</div>
            <div className="text-[10px] text-emerald-400/80">Engajamento direto</div>
          </div>
        </Card>
      </button>

      <button
        type="button"
        onClick={() => onSelectReport("entregues")}
        className="text-left outline-none rounded-2xl focus:ring-2 focus:ring-sky-500/40 transition-all hover:scale-[1.01] active:scale-[0.98]"
      >
        <Card className="p-2.5 h-full border-border/70 bg-card/60 backdrop-blur hover:border-sky-500/50 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium uppercase text-[9px] tracking-wide text-sky-400">
              <Check className="w-3 h-3 text-sky-400" /> Confirmadas
            </span>
            <Badge variant="outline" className="text-[8px] py-0 px-1 bg-sky-500/10 text-sky-400 border-sky-500/20">
              FCM OK
            </Badge>
          </div>
          <div className="mt-1">
            <div className="text-xl font-extrabold text-foreground tracking-tight">{resumo.entregues}</div>
            <div className="text-[10px] text-muted-foreground">Dispositivos ativos</div>
          </div>
        </Card>
      </button>

      <button
        type="button"
        onClick={() => onSelectReport("falhas")}
        className="text-left outline-none rounded-2xl focus:ring-2 focus:ring-red-500/40 transition-all hover:scale-[1.01] active:scale-[0.98]"
      >
        <Card
          className={`p-2.5 h-full backdrop-blur transition-colors flex flex-col justify-between ${
            resumo.falhas > 0
              ? "border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
              : "border-border/70 bg-card/60 hover:border-red-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={`flex items-center gap-1 font-medium uppercase text-[9px] tracking-wide ${resumo.falhas > 0 ? "text-red-400" : ""}`}>
              <XCircle className={`w-3 h-3 ${resumo.falhas > 0 ? "text-red-400" : ""}`} /> Erros
            </span>
            {resumo.falhas > 0 && (
              <Badge className="text-[8px] py-0 px-1 bg-red-500 text-white font-bold animate-pulse">
                {resumo.comErro} rotinas
              </Badge>
            )}
          </div>
          <div className="mt-1">
            <div className={`text-xl font-extrabold tracking-tight ${resumo.falhas > 0 ? "text-red-400" : "text-foreground"}`}>
              {resumo.falhas}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {resumo.falhas > 0 ? "Ver log" : "Sem falhas"}
            </div>
          </div>
        </Card>
      </button>
    </div>
  );
}
