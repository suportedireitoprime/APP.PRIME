import React from "react";
import { ChevronRight, Heart, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import type { Ordem } from "../resumosStyles";

interface ResumosDesktopColSubtemasProps {
  decodedTema: string;
  subtemas: ResumoRow[];
  subtemasOrdenados: ResumoRow[];
  loadingSubtemas: boolean;
  qSubtema: string;
  setQSubtema: (q: string) => void;
  ordemSubtema: Ordem;
  setOrdemSubtema: (o: Ordem) => void;
  favoritosGlobais: Array<{ id: string }>;
  onSelectSubtema: (subtema: ResumoRow) => void;
}

export const ResumosDesktopColSubtemas: React.FC<ResumosDesktopColSubtemasProps> = ({
  decodedTema,
  subtemas,
  subtemasOrdenados,
  loadingSubtemas,
  qSubtema,
  setQSubtema,
  ordemSubtema,
  setOrdemSubtema,
  favoritosGlobais,
  onSelectSubtema,
}) => {
  return (
    <>
      <div className="p-6 border-b border-white/5 bg-black/20">
        <div className="font-display text-[11px] uppercase tracking-widest text-[#ef4444] font-bold mb-1">
          Tema Selecionado
        </div>
        <h2 className="font-display text-white text-[24px] font-bold tracking-tight mb-4">
          {decodedTema}
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              value={qSubtema}
              onChange={(e) => setQSubtema(e.target.value)}
              placeholder="Filtrar subtemas..."
              className="pl-9 h-10 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef4444]/50 text-sm text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="flex bg-black/40 rounded-lg p-1 gap-1 shrink-0">
            {[
              { id: "crono", label: "Crono" },
              { id: "alpha", label: "A-Z" },
              { id: "fav", label: "Fav" },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setOrdemSubtema(o.id as Ordem)}
                className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all ${
                  ordemSubtema === o.id
                    ? "bg-[#ef4444] text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        {loadingSubtemas ? (
          <div className="flex items-center justify-center py-20 text-white/50">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 max-w-4xl">
            {subtemasOrdenados.map((r, i) => {
              const numero = String(
                ordemSubtema === "crono" ? i + 1 : subtemas.findIndex((s) => s.id === r.id) + 1,
              ).padStart(2, "0");
              const isFav = favoritosGlobais.some((f) => f.id === r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => onSelectSubtema(r)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-[#ef4444]/50 hover:bg-black/60 transition-all text-left group relative overflow-hidden"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="font-display font-bold text-[24px] text-[#ef4444] opacity-80 shrink-0 w-8 ml-1">
                    {numero}
                  </span>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-semibold text-[15px] leading-snug text-white">
                      {r.subtema || r.tema}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isFav && <Heart className="w-4 h-4 text-[#ef4444] fill-[#ef4444]" />}
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
