import React from 'react';
import { Scale, Heart, Loader2, Search, Mic, MicOff } from 'lucide-react';
import { tribunalClasses } from './jurisprudenciaConstants';

interface JurisprudenciaFiltrosBarProps {
  totalItens: number;
  revalidating: boolean;
  favoritosCount: number;
  tribunaisDisponiveis: Array<{ tribunal: string; count: number }>;
  tab: 'todos' | 'favoritos';
  setTab: (t: 'todos' | 'favoritos') => void;
  tribunalFiltro: string;
  setTribunalFiltro: (tf: string) => void;
  busca: string;
  setBusca: (b: string) => void;
  voice: {
    listening: boolean;
    partial: string;
    toggle: () => void;
  };
}

export const JurisprudenciaFiltrosBar: React.FC<JurisprudenciaFiltrosBarProps> = ({
  totalItens,
  revalidating,
  favoritosCount,
  tribunaisDisponiveis,
  tab,
  setTab,
  tribunalFiltro,
  setTribunalFiltro,
  busca,
  setBusca,
  voice,
}) => {
  const isFavActive = tab === 'favoritos';
  const isTodos = !isFavActive && tribunalFiltro === 'todos';

  const setSeg = (kind: 'todos' | 'trib' | 'fav', trib?: string) => {
    if (kind === 'fav') {
      setTab('favoritos');
      return;
    }
    setTab('todos');
    setTribunalFiltro(kind === 'todos' ? 'todos' : trib!);
  };

  const baseSegBtnClass =
    'h-9 px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5';

  return (
    <>
      {/* Resumo */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Scale className="w-4 h-4 text-primary" />
          <span>
            <strong className="text-foreground font-semibold">{totalItens}</strong>{' '}
            {totalItens === 1 ? 'resultado' : 'resultados'}
          </span>
          {revalidating && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
              <Loader2 className="w-3 h-3 animate-spin" /> atualizando
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Heart className="w-3.5 h-3.5" /> {favoritosCount}
        </div>
      </div>

      {/* Segmented control único: Todos · STF · STJ · ♥ */}
      {(tribunaisDisponiveis.length > 0 || favoritosCount > 0) && (
        <div className="mb-3 flex items-center gap-1.5 p-1 rounded-full bg-muted/60 border border-border/60 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSeg('todos')}
            className={`${baseSegBtnClass} ${
              isTodos
                ? 'bg-hero-yellow text-black shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos <span className="opacity-70">· {totalItens}</span>
          </button>
          {tribunaisDisponiveis.map(({ tribunal, count }) => {
            const active = !isFavActive && tribunalFiltro === tribunal;
            return (
              <button
                key={tribunal}
                type="button"
                onClick={() => setSeg('trib', tribunal)}
                className={`${baseSegBtnClass} ${
                  active
                    ? tribunalClasses(tribunal, true) + ' shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tribunal} <span className="opacity-70">· {count}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSeg('fav')}
            className={`${baseSegBtnClass} ${
              isFavActive
                ? 'bg-hero-yellow text-black shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Favoritos"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavActive ? 'fill-current' : ''}`} />
            {favoritosCount}
          </button>
        </div>
      )}

      {/* Search compacta */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={voice.listening && voice.partial ? voice.partial : busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por ementa, processo…"
            className="w-full h-11 pl-10 pr-3 rounded-full bg-muted/60 border border-border/60 text-sm outline-none focus:ring-2 focus:ring-[hsl(0_72%_52%)]/50 focus:border-transparent placeholder:text-muted-foreground/70"
            aria-label="Buscar jurisprudência"
          />
        </div>
        <button
          type="button"
          onClick={voice.toggle}
          aria-label={voice.listening ? 'Parar gravação' : 'Buscar por voz'}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
            voice.listening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-hero-yellow text-black'
          }`}
        >
          {voice.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
};
