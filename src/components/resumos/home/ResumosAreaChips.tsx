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
  const totalCount = React.useMemo(() => rows.reduce((acc, r) => acc + (r.total || 0), 0), [rows]);

  return (
    <div className="sticky top-0 z-40 px-1 py-2 overflow-x-auto no-scrollbar flex items-center gap-2 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/5 shadow-sm">
      <button
        onClick={() => {
          haptic.selection();
          onSelectTab("Todos");
        }}
        className={`px-4 h-9 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-colors shadow-sm cursor-pointer ${
          activeTab === "Todos"
            ? "bg-[#E8DCCB] text-black shadow-md font-black"
            : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
        }`}
      >
        Todas ({totalCount})
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
            className={`px-3.5 h-9 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? "bg-[#E8DCCB] text-black shadow-md font-black"
                : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
            }`}
          >
            <span>{displayArea}</span>
            <span
              className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-black ${
                isActive ? "bg-black/20 text-black font-extrabold" : "bg-white/10 text-white/60"
              }`}
            >
              {r.total}
            </span>
          </button>
        );
      })}
    </div>
  );
};
