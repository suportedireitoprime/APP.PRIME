import React from 'react';
import { BookOpen } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { CATEGORY_ICONS, TemaRow } from './flashcardsLeisConstants';

interface FlashcardsLeisCategoriasGridProps {
  groupedByCategoria: [string, TemaRow[]][];
  onSelectCategoria: (categoria: string) => void;
}

export const FlashcardsLeisCategoriasGrid: React.FC<FlashcardsLeisCategoriasGridProps> = ({
  groupedByCategoria,
  onSelectCategoria,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {groupedByCategoria.map(([cat, leis]) => {
        const Icon = CATEGORY_ICONS[cat] || BookOpen;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => {
              haptic.selection?.();
              onSelectCategoria(cat);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center p-5 sm:p-6 bg-card border border-border/80 rounded-3xl hover:border-[#36AF85]/50 hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 text-muted-foreground group-hover:text-[#36AF85] group-hover:bg-[#36AF85]/10 transition-colors">
              <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground text-center">
              {cat}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
              {leis.length} {leis.length === 1 ? 'item' : 'itens'}
            </p>
          </button>
        );
      })}
    </div>
  );
};
