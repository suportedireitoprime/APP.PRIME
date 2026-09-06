import React from 'react';
import { Flame } from 'lucide-react';
import { TEMAS } from '@/data/blogPosts';
import type { BlogFilter } from './blogTypes';

interface BlogFiltersBarProps {
  selectedFilter: BlogFilter;
  onSelectFilter: (filter: BlogFilter) => void;
}

const sortedTemas = [...TEMAS].sort((a, b) => a.localeCompare(b, 'pt-BR'));

export const BlogFiltersBar: React.FC<BlogFiltersBarProps> = ({
  selectedFilter,
  onSelectFilter,
}) => {
  return (
    <div id="blog-filters" className="bg-background border-b border-border/40">
      <div
        role="tablist"
        aria-label="Filtros de temas do blog"
        className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 max-w-3xl mx-auto"
      >
        <button
          role="tab"
          aria-selected={selectedFilter === 'todos'}
          aria-label="Exibir todos os artigos"
          onClick={() => onSelectFilter('todos')}
          className={`shrink-0 min-h-[38px] px-4 py-2 rounded-full text-xs font-body font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selectedFilter === 'todos'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-foreground hover:bg-secondary/80'
          }`}
        >
          Todos
        </button>

        <button
          role="tab"
          aria-selected={selectedFilter === 'trending'}
          aria-label="Exibir artigos em alta"
          onClick={() => onSelectFilter('trending')}
          className={`shrink-0 min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selectedFilter === 'trending'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-amber-400 hover:bg-secondary/80'
          }`}
        >
          <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
          Em Alta
        </button>

        {sortedTemas.map((tema) => {
          const active = selectedFilter === tema;
          return (
            <button
              key={tema}
              role="tab"
              aria-selected={active}
              aria-label={`Filtrar por ${tema}`}
              onClick={() => onSelectFilter(tema)}
              className={`shrink-0 min-h-[38px] px-4 py-2 rounded-full text-xs font-body font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {tema}
            </button>
          );
        })}
      </div>
    </div>
  );
};
