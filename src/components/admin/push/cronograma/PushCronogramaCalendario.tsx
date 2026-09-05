import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, RefreshCw } from "lucide-react";

interface PushCronogramaCalendarioProps {
  isToday: boolean;
  dataFiltro: Date;
  setDataFiltro: (d: Date) => void;
  dias: Date[];
  loading: boolean;
  onRefresh: () => void;
}

export function PushCronogramaCalendario({
  isToday,
  dataFiltro,
  setDataFiltro,
  dias,
  loading,
  onRefresh,
}: PushCronogramaCalendarioProps) {
  return (
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
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={onRefresh} disabled={loading}>
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
  );
}
