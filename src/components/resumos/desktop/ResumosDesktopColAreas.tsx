import React from "react";
import { ArrowLeft, ChevronRight, Loader2, NotebookText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { haptic } from "@/lib/nativeHaptics";
import { styleForArea, type AreaRow } from "../resumosStyles";

interface ResumosDesktopColAreasProps {
  areas: AreaRow[];
  loadingAreas: boolean;
  qArea: string;
  setQArea: (q: string) => void;
  decodedArea: string;
  onSelectArea: (area: string) => void;
  onBackHome: () => void;
}

export const ResumosDesktopColAreas: React.FC<ResumosDesktopColAreasProps> = ({
  areas,
  loadingAreas,
  qArea,
  setQArea,
  decodedArea,
  onSelectArea,
  onBackHome,
}) => {
  return (
    <div className="w-[320px] xl:w-[380px] shrink-0 border-r border-white/5 bg-black/40 backdrop-blur-md flex flex-col h-full shadow-2xl z-20">
      <div className="p-4 border-b border-white/5">
        <button
          onClick={() => {
            haptic.selection();
            onBackHome();
          }}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-bold text-[13px] tracking-wide">Voltar ao Início</span>
        </button>
        <h1 className="font-display text-white text-[24px] font-black tracking-tight mb-4 flex items-center gap-2">
          <NotebookText className="w-6 h-6 text-[#ef4444]" />
          Resumos
        </h1>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={qArea}
            onChange={(e) => setQArea(e.target.value)}
            placeholder="Pesquisar matéria..."
            className="pl-9 h-10 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef4444]/50 text-sm text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5">
        {loadingAreas ? (
          <div className="flex items-center justify-center py-10 text-white/50">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          areas.map((r) => {
            const displayArea = r.area.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "");
            const isActive = r.area === decodedArea;
            const { icon: Icon, color } = styleForArea(r.area);
            return (
              <button
                key={r.area}
                onClick={() => onSelectArea(r.area)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                  isActive
                    ? "bg-white/10 border-white/20 shadow-md"
                    : "bg-transparent border-transparent hover:bg-white/5"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${
                    isActive ? "bg-[#ef4444]/20" : "bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? "#ef4444" : color }} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div
                    className={`font-bold text-[14px] truncate ${
                      isActive ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    {displayArea}
                  </div>
                  <div className="text-[12px] text-zinc-500 font-medium">{r.total} resumos</div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? "text-white rotate-90" : "text-zinc-600"
                  }`}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
