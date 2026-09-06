import { Check, Lock, Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";
import type { LeiSecaLicao } from "@/lib/leiSeca";

interface LicaoProgresso {
  concluida?: boolean;
  estrelas?: number;
}

interface LeiSecaLicaoNodeProps {
  licao: LeiSecaLicao;
  index: number;
  desbloqueada: boolean;
  isProxima: boolean;
  progresso?: LicaoProgresso;
  tema: { from: string; solid: string; to: string };
  onSelect: (licao: LeiSecaLicao) => void;
}

export function LeiSecaLicaoNode({
  licao,
  index,
  desbloqueada,
  isProxima,
  progresso,
  tema,
  onSelect,
}: LeiSecaLicaoNodeProps) {
  return (
    <button
      type="button"
      disabled={!desbloqueada}
      onClick={() => {
        haptic.selection();
        onSelect(licao);
      }}
      className={cn(
        "w-full flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-[80ms] active:scale-[0.99] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        desbloqueada
          ? "border-white/10 bg-card hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-lg"
          : "border-white/5 bg-card/40 opacity-60 cursor-not-allowed",
        isProxima && "ring-2 ring-offset-0"
      )}
      style={
        isProxima
          ? {
              boxShadow: `0 0 0 2px ${tema.solid}55, 0 8px 24px -8px ${tema.solid}66`,
            }
          : undefined
      }
    >
      <div
        className={cn(
          "h-11 w-11 shrink-0 rounded-xl grid place-items-center border transition-transform",
          progresso?.concluida
            ? "bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-300/40"
            : desbloqueada
              ? "border-white/10"
              : "bg-muted border-muted-foreground/15"
        )}
        style={
          !progresso?.concluida && desbloqueada
            ? { background: `linear-gradient(135deg, ${tema.from}, ${tema.solid})` }
            : undefined
        }
      >
        {!desbloqueada ? (
          <Lock className="h-4 w-4 text-muted-foreground" />
        ) : progresso?.concluida ? (
          <Check className="h-5 w-5 text-white" strokeWidth={3} />
        ) : (
          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Lição {index + 1}
        </div>
        <div className="text-sm font-semibold leading-tight truncate text-foreground">{licao.titulo}</div>
        {progresso?.concluida && (
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-500">
            <Check className="h-3 w-3" strokeWidth={3} /> Concluído
          </div>
        )}
      </div>

      {progresso && (
        <div className="flex gap-0.5 shrink-0">
          {[0, 1, 2].map((i) => (
            <Star
              key={i}
              className={cn(
                "h-3.5 w-3.5",
                i < (progresso.estrelas ?? 0)
                  ? "text-amber-400 fill-amber-400"
                  : "text-muted-foreground/40"
              )}
            />
          ))}
        </div>
      )}
    </button>
  );
}
