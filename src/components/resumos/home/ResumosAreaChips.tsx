import React from "react";
import { motion } from "framer-motion";
import { haptic } from "@/lib/nativeHaptics";
import { cn } from "@/lib/utils";
import type { AreaRow } from "../resumosStyles";

interface ResumosAreaChipsProps {
  rows: AreaRow[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const ResumosAreaChips: React.FC<ResumosAreaChipsProps> = ({
  rows,
  activeTab,
  onSelectTab,
}) => {
  const totalCount = React.useMemo(
    () => rows.reduce((acc, r) => acc + (r.total || 0), 0),
    [rows]
  );

  const tabs = React.useMemo(() => {
    return [
      { id: "Todos", label: "Todas", count: totalCount },
      ...rows.map((r) => ({
        id: r.area,
        label: r.area.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, ""),
        count: r.total,
      })),
    ];
  }, [rows, totalCount]);

  return (
    <div className="relative w-full -mr-4 sm:-mr-6 pr-4 sm:pr-6 overflow-hidden">
      {/* Contêiner de Abas 3D em Formato de Pasta com Rolagem Horizontal sem Margem Direita */}
      <div className="flex w-full items-end overflow-x-auto no-scrollbar h-11 sm:h-12 pt-1 pl-1">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const zIndex = isActive ? 40 : 30 - Math.min(index, 20);

          return (
            <button
              key={tab.id}
              onClick={() => {
                haptic.selection();
                onSelectTab(tab.id);
              }}
              className={cn(
                "relative shrink-0 h-full flex items-center justify-center gap-1.5 px-4 sm:px-5 rounded-t-2xl border-x border-t font-bold text-[10px] sm:text-[11px] uppercase tracking-wider cursor-pointer select-none transition-colors duration-200",
                isActive
                  ? "bg-[#1A1A1A] text-white shadow-[0_-8px_20px_rgba(0,0,0,0.5)] border-emerald-500/50"
                  : "bg-[#0A0A0A] text-zinc-400 hover:bg-[#121212] shadow-[inset_0_-4px_10px_rgba(0,0,0,0.8)] hover:text-white border-white/5 opacity-80"
              )}
              style={{
                zIndex,
                marginLeft: index > 0 ? "-10px" : "0",
              }}
            >
              <div className="absolute inset-0 rounded-t-2xl overflow-hidden pointer-events-none">
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-emerald-500/5 to-emerald-500/10 opacity-70" />
                )}
              </div>

              <span
                className={cn(
                  "relative z-10 whitespace-nowrap transition-transform duration-200",
                  isActive ? "scale-105 text-emerald-400 font-black" : "scale-100"
                )}
              >
                {tab.label}
              </span>

              <span
                className={cn(
                  "relative z-10 text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold tracking-tight transition-colors duration-200",
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/5 text-zinc-500"
                )}
              >
                {tab.count}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeFolderTabAreaChips"
                  className="absolute inset-0 rounded-t-2xl border-x border-t border-emerald-500/60 pointer-events-none shadow-[inset_0_2px_10px_rgba(16,185,129,0.25)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.8 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Linha de Base da Pasta */}
      <div className="w-full h-px bg-[#1A1A1A] relative z-20 shadow-[0_-1px_0_rgba(16,185,129,0.35)]" />
    </div>
  );
};
