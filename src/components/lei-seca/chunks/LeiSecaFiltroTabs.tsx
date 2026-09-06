import React from "react";
import { BookOpen, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";

export type LeiSecaFiltro = "todos" | "recentes" | "favoritos";

interface LeiSecaFiltroTabsProps {
  filtroAtual: LeiSecaFiltro;
  onChangeFiltro: (filtro: LeiSecaFiltro) => void;
  totalRecentes?: number;
  totalFavoritos?: number;
}

interface FiltroPillProps {
  ativo: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function FiltroPill({ ativo, onClick, icon, label, badge }: FiltroPillProps) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic.selection();
        onClick();
      }}
      className={cn(
        "flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full text-[13px] font-bold transition-all duration-[80ms] touch-manipulation active:scale-[0.97]",
        ativo
          ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/20"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold",
            ativo ? "bg-white/25 text-white" : "bg-violet-500/15 text-violet-500"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function LeiSecaFiltroTabs({
  filtroAtual,
  onChangeFiltro,
  totalRecentes = 0,
  totalFavoritos = 0,
}: LeiSecaFiltroTabsProps) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border/60 mb-6 overflow-x-auto">
      <FiltroPill
        ativo={filtroAtual === "todos"}
        onClick={() => onChangeFiltro("todos")}
        icon={<BookOpen className="h-4 w-4 shrink-0" />}
        label="Matérias"
      />
      <FiltroPill
        ativo={filtroAtual === "recentes"}
        onClick={() => onChangeFiltro("recentes")}
        icon={<Clock className="h-4 w-4 shrink-0" />}
        label="Recentes"
        badge={totalRecentes}
      />
      <FiltroPill
        ativo={filtroAtual === "favoritos"}
        onClick={() => onChangeFiltro("favoritos")}
        icon={<Heart className="h-4 w-4 shrink-0" />}
        label="Favoritos"
        badge={totalFavoritos}
      />
    </div>
  );
}
