import React from "react";
import { Check, ChevronRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { corIcone, getMateriaByTrilha } from "@/lib/leiSecaMaterias";
import { getLeiSecaIcon } from "@/components/lei-seca/LeiSecaTrilhaIcons";
import { haptic } from "@/lib/nativeHaptics";
import type { useLeiSecaResumoGlobal } from "@/hooks/useLeiSecaResumoGlobal";

interface LeiSecaTrilhaCardProps {
  trilha: any;
  resumo?: ReturnType<typeof useLeiSecaResumoGlobal>["data"];
  isFav: boolean;
  onToggleFav: (slug: string) => void;
  onOpen: (slug: string) => void;
  prefetchHandlers?: Record<string, any>;
}

export function LeiSecaTrilhaCard({
  trilha,
  resumo,
  isFav,
  onToggleFav,
  onOpen,
  prefetchHandlers,
}: LeiSecaTrilhaCardProps) {
  const r = resumo?.porTrilha.get(trilha.slug);
  const pct = r?.pct ?? 0;
  const concluido = pct === 100 && (r?.total ?? 0) > 0;
  const Icon = getLeiSecaIcon(trilha.slug);
  const materia = getMateriaByTrilha(trilha.slug);

  return (
    <div className="min-h-[80px] h-auto py-3.5 rounded-2xl bg-card border border-border/60 hover:border-violet-500/40 hover:bg-card/80 transition-all duration-[80ms] flex items-center gap-3 px-3.5 group animate-stagger-in touch-manipulation">
      <button
        type="button"
        {...prefetchHandlers}
        onClick={() => {
          haptic.selection();
          onOpen(trilha.slug);
        }}
        className="flex-1 flex items-center gap-3 text-left min-w-0 active:scale-[0.99] transition-all duration-[80ms] touch-manipulation focus-visible:outline-none"
      >
        <div
          className="h-11 w-11 grid place-items-center shrink-0"
          style={{ color: corIcone(materia?.cor), filter: "saturate(1.3) brightness(1.1)" }}
        >
          <Icon width={28} height={28} strokeWidth={1.9} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-500/90">
              {trilha.sigla}
            </span>
            {materia && (
              <span className="text-[9.5px] text-muted-foreground/80 font-bold truncate">
                · {materia.nome}
              </span>
            )}
            {concluido && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5">
                <Check className="h-2.5 w-2.5" strokeWidth={4} /> Concluído
              </span>
            )}
          </div>
          <div className="font-bold text-[14px] leading-tight truncate text-foreground">
            {trilha.nome}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600 transition-[width] duration-700"
                style={{ width: `${Math.max(pct === 0 ? 0 : 4, pct)}%` }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground shrink-0">
              {r ? `${r.concluidas}/${r.total}` : `${trilha.partes?.length ?? 0}p`}
            </span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 transition-all duration-[80ms] shrink-0" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          haptic.selection();
          onToggleFav(trilha.slug);
        }}
        className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full grid place-items-center hover:bg-rose-500/10 active:scale-90 transition-all duration-[80ms] shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        aria-label={isFav ? "Desfavoritar" : "Favoritar"}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-all duration-[80ms]",
            isFav ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground/60"
          )}
        />
      </button>
    </div>
  );
}
