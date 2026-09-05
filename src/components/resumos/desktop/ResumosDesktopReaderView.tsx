import React from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";
import ResumoJuridicoReaderSheet, {
  type ResumoRow,
} from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";

interface ResumosDesktopReaderViewProps {
  selectedSubtema: ResumoRow;
  favoritosGlobais: Array<{ id: string }>;
  onBack: () => void;
  onToggleFavorito: () => void;
}

export const ResumosDesktopReaderView: React.FC<ResumosDesktopReaderViewProps> = ({
  selectedSubtema,
  favoritosGlobais,
  onBack,
  onToggleFavorito,
}) => {
  const isFav = favoritosGlobais.some((f) => f.id === selectedSubtema.id);

  return (
    <div className="flex flex-col h-full w-full bg-[#0D0D0D]">
      <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-black/40 backdrop-blur-md">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-[#ef4444] font-bold uppercase tracking-wider mb-0.5">
            {selectedSubtema.tema}
          </div>
          <div className="font-bold text-[18px] text-white truncate">
            {selectedSubtema.subtema || selectedSubtema.tema}
          </div>
        </div>
        <button
          onClick={() => {
            haptic.selection();
            onToggleFavorito();
          }}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
        >
          <Heart
            className={`w-5 h-5 ${isFav ? "text-[#ef4444] fill-[#ef4444]" : "text-white"}`}
          />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto w-full flex justify-center">
        <div className="w-full max-w-4xl">
          <ResumoJuridicoReaderSheet
            open={true}
            onOpenChange={(v) => !v && onBack()}
            resumo={selectedSubtema}
            defaultMetodo="conceitos"
            inline={true}
          />
        </div>
      </div>
    </div>
  );
};
