import React from "react";
import { ChevronRight } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";
import { CAPA_PADRAO_RESUMOS } from "../resumosStyles";

interface ResumosTemaCardProps {
  tema: string;
  onClick: () => void;
}

export const ResumosTemaCard: React.FC<ResumosTemaCardProps> = ({ tema, onClick }) => {
  return (
    <button
      onClick={() => {
        haptic.selection();
        onClick();
      }}
      className="w-full flex items-center gap-4 px-4 py-4 min-h-[96px] text-left hover:bg-secondary/20 active:scale-[0.98] transition-all rounded-2xl bg-card border border-border hover:border-[#ef4444]/40 shadow-sm group overflow-hidden relative"
    >
      <div className="w-16 h-[88px] rounded-lg bg-white/5 border border-white/10 shrink-0 overflow-hidden shadow-md">
        <img
          src={CAPA_PADRAO_RESUMOS}
          alt="Capa"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-body text-[15px] font-bold text-white line-clamp-2 leading-snug">
          {tema}
        </div>
        <div className="font-body text-[12px] text-[#ef4444] font-bold mt-1.5">LER RESUMO</div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
    </button>
  );
};
