import React from 'react';
import { Search, Mic, X } from 'lucide-react';
import { useDictation } from '@/hooks/useDictation';

interface VisuaisBarraBuscaProps {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
}

/** Barra de pesquisa igual à do buscador do app (input alto + microfone redondo). */
export function VisuaisBarraBusca({ valor, onChange, placeholder }: VisuaisBarraBuscaProps) {
  const { state, start, stop } = useDictation((chunk) => onChange(`${valor} ${chunk}`.trim().slice(0, 60)));
  const ouvindo = state === 'recording';

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value.slice(0, 60))}
          placeholder={placeholder}
          className="h-14 w-full rounded-xl border-none bg-muted pl-11 pr-10 font-body text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        {!!valor && (
          <button
            onClick={() => onChange('')}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <button
        onClick={() => (ouvindo ? stop() : start())}
        aria-label={ouvindo ? 'Parar ditado' : 'Pesquisar por voz'}
        className={`btn-attention-shine flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-lg transition-all ${
          ouvindo ? 'bg-red-500 text-white animate-pulse shadow-red-500/40' : 'bg-primary text-primary-foreground shadow-primary/30'
        }`}
      >
        <Mic className="w-6 h-6 relative z-[2]" />
      </button>
    </div>
  );
}
