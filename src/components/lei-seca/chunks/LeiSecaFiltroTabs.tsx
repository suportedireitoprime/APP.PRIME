import React from "react";
import { motion } from "framer-motion";
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
  id: string;
  ativo: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function FiltroPill({ id, ativo, onClick, icon, label, badge }: FiltroPillProps) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic.selection();
        onClick();
      }}
      className={cn(
        "flex-1 sm:flex-none relative inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[46px] rounded-xl text-[13px] sm:text-[14px] transition-colors duration-150 touch-manipulation active:scale-[0.97] outline-none select-none",
        ativo ? "text-white font-bold" : "text-zinc-400 hover:text-white font-medium"
      )}
    >
      {/* Pílula de seleção roxa animada */}
      {ativo && (
        <motion.div
          layoutId="lei-seca-filtro-pill"
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 shadow-[0_0_24px_rgba(147,51,234,0.65),0_2px_8px_rgba(0,0,0,0.5)] border border-purple-300/40"
          style={{ backgroundColor: "#7c3aed" }}
        />
      )}

      {/* Ícone e Texto em camada superior */}
      <span className="relative z-10 flex items-center gap-2">
        <span className={cn("transition-transform duration-150 shrink-0", ativo ? "text-white scale-105" : "text-zinc-400")}>
          {icon}
        </span>
        <span className={cn("tracking-wide", ativo ? "text-white font-black" : "text-zinc-300 font-semibold")}>
          {label}
        </span>
        {badge !== undefined && badge > 0 && (
          <span
            className={cn(
              "ml-0.5 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-black tracking-tight transition-colors shadow-sm",
              ativo
                ? "bg-white/30 text-white border border-white/40"
                : "bg-purple-950/70 text-purple-300 border border-purple-700/50"
            )}
          >
            {badge}
          </span>
        )}
      </span>
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
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#120a26]/90 backdrop-blur-xl border border-purple-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_20px_rgba(124,58,237,0.1)] mb-6 overflow-x-auto">
      <FiltroPill
        id="todos"
        ativo={filtroAtual === "todos"}
        onClick={() => onChangeFiltro("todos")}
        icon={<BookOpen className="h-4 w-4" />}
        label="Matérias"
      />
      <FiltroPill
        id="recentes"
        ativo={filtroAtual === "recentes"}
        onClick={() => onChangeFiltro("recentes")}
        icon={<Clock className="h-4 w-4" />}
        label="Recentes"
        badge={totalRecentes}
      />
      <FiltroPill
        id="favoritos"
        ativo={filtroAtual === "favoritos"}
        onClick={() => onChangeFiltro("favoritos")}
        icon={<Heart className="h-4 w-4" />}
        label="Favoritos"
        badge={totalFavoritos}
      />
    </div>
  );
}
