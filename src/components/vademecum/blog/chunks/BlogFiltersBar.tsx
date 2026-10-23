import React from 'react';
import { Flame, Layers } from 'lucide-react';
import { TEMAS } from '@/data/blogPosts';
import { haptic } from '@/lib/nativeHaptics';
import type { BlogFilter } from './blogTypes';

interface BlogFiltersBarProps {
  selectedFilter: BlogFilter;
  onSelectFilter: (filter: BlogFilter) => void;
  categorias?: string[];
  countsByTema?: Record<string, number>;
}

const DEFAULT_SORTED_TEMAS = [...TEMAS].sort((a, b) => a.localeCompare(b, 'pt-BR'));

export const BlogFiltersBar: React.FC<BlogFiltersBarProps> = ({
  selectedFilter,
  onSelectFilter,
  categorias,
  countsByTema,
}) => {
  const temasList = categorias && categorias.length > 0 ? categorias : DEFAULT_SORTED_TEMAS;

  const handleSelect = (filter: BlogFilter) => {
    try {
      haptic.selection();
    } catch {
      // ignore
    }
    onSelectFilter(filter);
  };

  return (
    <div id="blog-filters" className="bg-background/95 backdrop-blur-md border-b border-border/40 sticky top-0 z-20 transition-all">
      <div
        role="tablist"
        aria-label="Filtros de categorias do blog"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2.5 max-w-4xl mx-auto scroll-smooth"
      >
        {/* Opção Todas */}
        <button
          role="tab"
          aria-selected={selectedFilter === 'todos'}
          aria-label="Exibir todas as categorias"
          onClick={() => handleSelect('todos')}
          className={`shrink-0 min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-bold uppercase tracking-wider transition-all select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selectedFilter === 'todos'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
              : 'bg-secondary/70 hover:bg-secondary text-foreground/80 hover:text-foreground'
          }`}
        >
          <Layers className="w-3.5 h-3.5" strokeWidth={2.4} />
          <span>Todas</span>
          {countsByTema && Object.values(countsByTema).length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                selectedFilter === 'todos'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-background/60 text-muted-foreground'
              }`}
            >
              {Object.values(countsByTema).reduce((acc, curr) => acc + curr, 0)}
            </span>
          )}
        </button>

        {/* Opção Em Alta */}
        <button
          role="tab"
          aria-selected={selectedFilter === 'trending'}
          aria-label="Exibir artigos em alta"
          onClick={() => handleSelect('trending')}
          className={`shrink-0 min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-bold uppercase tracking-wider transition-all select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selectedFilter === 'trending'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
              : 'bg-secondary/70 hover:bg-secondary text-amber-400 hover:text-amber-300'
          }`}
        >
          <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Em Alta</span>
        </button>

        {/* Categorias Abertas Criadas */}
        {temasList.map((tema) => {
          const active = selectedFilter === tema;
          const count = countsByTema ? countsByTema[tema] : undefined;
          return (
            <button
              key={tema}
              role="tab"
              aria-selected={active}
              aria-label={`Filtrar pela categoria ${tema}`}
              onClick={() => handleSelect(tema as BlogFilter)}
              className={`shrink-0 min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-bold uppercase tracking-wider transition-all select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'bg-secondary/70 hover:bg-secondary text-foreground/85 hover:text-foreground'
              }`}
            >
              <span>{tema}</span>
              {typeof count === 'number' && count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                    active
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-background/60 text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

