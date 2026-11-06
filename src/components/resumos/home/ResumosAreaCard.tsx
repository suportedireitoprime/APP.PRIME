import React from "react";
import { ChevronRight } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { type AreaRow } from "../resumosStyles";

interface ResumosAreaCardProps {
  areaRow: AreaRow;
  onClick: (area: string) => void;
}

export const ResumosAreaCard: React.FC<ResumosAreaCardProps> = ({ areaRow, onClick }) => {
  const displayArea = areaRow.area.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "");

  return (
    <button
      onClick={() => {
        haptic.selection();
        onClick(areaRow.area);
      }}
      className="w-full flex items-center gap-3.5 p-3 sm:p-4 min-h-[88px] text-left hover:bg-white/[0.04] active:scale-[0.985] transition-all rounded-2xl bg-[#141416]/90 border border-white/10 hover:border-rose-500/40 shadow-md group overflow-hidden relative cursor-pointer"
    >
      <div className="w-[58px] h-[78px] sm:w-[64px] sm:h-[84px] shrink-0 rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-lg relative flex items-center justify-center">
        <img
          src={getAreaCover(areaRow.area)?.cover}
          alt={displayArea}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-sans font-bold text-base sm:text-[17px] text-white group-hover:text-rose-300 transition-colors leading-snug">
          {displayArea}
        </h4>
        <p className="font-sans text-xs sm:text-[13px] text-white/50 leading-tight mt-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{areaRow.total} {areaRow.total === 1 ? "resumo completo" : "resumos completos"}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 group-hover:bg-rose-600 group-hover:border-rose-500 group-hover:text-white transition-all duration-200 shrink-0 text-xs font-bold tracking-wider uppercase">
        <span>Acessar</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
};
