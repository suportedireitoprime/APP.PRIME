import React from 'react';
import { Star } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { FILTROS, type Filtro } from './visuaisConstants';

interface VisuaisAbasFiltroProps {
  valor: Filtro;
  onChange: (f: Filtro) => void;
}

/** Abas Todos / Favoritos / Recentes — mesmo padrão do buscador do app. */
export function VisuaisAbasFiltro({ valor, onChange }: VisuaisAbasFiltroProps) {
  return (
    <div className="flex gap-2">
      {FILTROS.map(({ id, label, Icone }) => (
        <button
          key={id}
          onClick={() => {
            haptic.selection();
            onChange(id);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all ${
            valor === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Icone className={`w-5 h-5 ${id === 'favoritos' && valor === id ? 'fill-current' : ''}`} />
          <span className="whitespace-nowrap">{label}</span>
        </button>
      ))}
    </div>
  );
}

interface EstrelaFavoritoProps {
  ativo: boolean;
  onToggle: () => void;
}

/** Estrela de favorito posicionada no canto da linha. */
export function EstrelaFavorito({ ativo, onToggle }: EstrelaFavoritoProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        haptic.light();
        onToggle();
      }}
      aria-label={ativo ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full"
    >
      <Star className={`w-4 h-4 ${ativo ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/60'}`} />
    </button>
  );
}
