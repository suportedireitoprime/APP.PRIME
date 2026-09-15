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
        "flex-1 sm:flex-none relative inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-[13px] transition-all duration-200 touch-manipulation active:scale-[0.97]",
        ativo
          ? "bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white font-bold shadow-[0_4px_18px_rgba(147,51,234,0.45)] border border-purple-400/30 scale-[1.01]"
          : "text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium border border-transparent"
      )}
    >
      <span className={cn("transition-transform duration-200", ativo ? "text-white scale-105" : "text-zinc-400")}>
        {icon}
      </span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "ml-0.5 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-black tracking-tight transition-colors",
            ativo ? "bg-white/25 text-white" : "bg-purple-950/50 text-purple-300 border border-purple-700/30"
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
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5)] mb-6 overflow-x-auto">
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
