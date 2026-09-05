import React from "react";
import { haptic } from "@/lib/nativeHaptics";
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
  return (
    <div className="sticky top-0 z-40 px-4 py-4 mt-1 overflow-x-auto no-scrollbar flex items-center gap-2 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/5 shadow-sm">
      <button
        onClick={() => {
          haptic.selection();
          onSelectTab("Todos");
        }}
        className={`px-5 h-9 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors shadow-sm ${
          activeTab === "Todos"
            ? "bg-hero-panel text-white"
            : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
        }`}
      >
        Todos
      </button>
      {rows.map((r) => {
        const displayArea = r.area.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "");
        const isActive = activeTab === r.area;
        return (
          <button
            key={r.area}
            onClick={() => {
              haptic.selection();
              onSelectTab(r.area);
            }}
            className={`px-4 h-9 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors shadow-sm ${
              isActive
                ? "bg-hero-panel text-white"
                : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            }`}
          >
            {displayArea}
          </button>
        );
      })}
    </div>
  );
};
