import React from "react";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CAPA_PADRAO_RESUMOS, type Ordem, type TemaRow } from "../resumosStyles";

interface ResumosDesktopColTemasProps {
  decodedArea: string;
  decodedTema: string;
  temas: TemaRow[];
  loadingTemas: boolean;
  qTema: string;
  setQTema: (q: string) => void;
  ordemTema: Ordem;
  setOrdemTema: (o: Ordem) => void;
  placeholderTextTemas: string;
  onSelectTema: (tema: string) => void;
}

export const ResumosDesktopColTemas: React.FC<ResumosDesktopColTemasProps> = ({
  decodedArea,
  decodedTema,
  temas,
  loadingTemas,
  qTema,
  setQTema,
  ordemTema,
  setOrdemTema,
  placeholderTextTemas,
  onSelectTema,
}) => {
  return (
    <div className="w-[360px] xl:w-[420px] shrink-0 border-r border-white/5 bg-[#0D0D0D]/80 backdrop-blur-md flex flex-col h-full z-10">
      <div className="p-4 border-b border-white/5 bg-black/20">
        <div className="font-display text-[11px] uppercase tracking-widest text-[#ef4444] font-bold mb-1">
          Área Selecionada
        </div>
        <h2 className="font-display text-white text-[20px] font-bold tracking-tight mb-4">
          {decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "")}
        </h2>

        <div className="relative flex items-center mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={qTema}
            onChange={(e) => setQTema(e.target.value)}
            placeholder={placeholderTextTemas || "Pesquisar tema..."}
            className="pl-9 h-10 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef4444]/50 text-sm text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="flex w-full bg-black/40 rounded-lg p-1 gap-1">
          {[
            { id: "crono", label: "Crono" },
            { id: "alpha", label: "A-Z" },
            { id: "fav", label: "Fav" },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => setOrdemTema(o.id as Ordem)}
              className={`flex-1 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all ${
                ordemTema === o.id
                  ? "bg-[#ef4444] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5">
        {loadingTemas ? (
          <div className="flex items-center justify-center py-10 text-white/50">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          temas.map((r) => {
            const isActive = r.tema === decodedTema;
            return (
              <button
                key={r.tema}
                onClick={() => onSelectTema(r.tema)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
                  isActive
                    ? "bg-white/10 border-white/20 shadow-md"
                    : "bg-transparent border-white/5 hover:bg-white/5"
                }`}
              >
                <div className="w-[36px] h-[50px] rounded flex-shrink-0 overflow-hidden opacity-90">
                  <img
                    src={CAPA_PADRAO_RESUMOS}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-[14px] leading-snug line-clamp-2 ${
                      isActive ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    {r.tema}
                  </div>
                  <div className="text-[12px] text-[#ef4444] font-bold mt-1">{r.total} resumos</div>
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
