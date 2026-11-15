import React from "react";
import { Search, X } from "lucide-react";

interface AudioaulasBuscaInputProps {
  busca: string;
  setBusca: (v: string) => void;
  buscaRef: React.RefObject<HTMLInputElement | null>;
}

export const AudioaulasBuscaInput = React.memo(function AudioaulasBuscaInput({
  busca,
  setBusca,
  buscaRef,
}: AudioaulasBuscaInputProps) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 mt-4 lg:px-10 2xl:max-w-[1600px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ffa285]" />
        <input
          ref={buscaRef}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar aula, tema ou área..."
          className="w-full rounded-2xl border border-[#ff6b4a]/35 bg-[#ff6b4a]/10 py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-zinc-400 outline-none transition focus:border-[#ffa285] focus:bg-[#ff6b4a]/18 focus:ring-2 focus:ring-[#ff6b4a]/25"
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#ffa285]/80 hover:bg-[#ff6b4a]/20"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});
