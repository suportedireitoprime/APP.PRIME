import React, { memo } from 'react';
import { Layers } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';

interface AprenderHeaderToolbarProps {
  totalAreas: number;
  isAulas: boolean;
  isFlashcards: boolean;
  aulasViewMode: 'decks' | 'lista';
  flashcardsViewMode: 'decks' | 'lista';
  onAulasViewModeChange: (mode: 'decks' | 'lista') => void;
  onFlashcardsViewModeChange: (mode: 'decks' | 'lista') => void;
  filtro: 'todas' | 'andamento';
  onFiltroChange: (filtro: 'todas' | 'andamento') => void;
  emAndamentoCount: number;
}

export const AprenderHeaderToolbar: React.FC<AprenderHeaderToolbarProps> = memo(({
  totalAreas,
  isAulas,
  isFlashcards,
  aulasViewMode,
  flashcardsViewMode,
  onAulasViewModeChange,
  onFlashcardsViewModeChange,
  filtro,
  onFiltroChange,
  emAndamentoCount,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Matérias ({totalAreas})
      </p>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {isAulas && (
          <div className="flex items-center gap-1 rounded-full bg-card border border-border p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onAulasViewModeChange('decks');
              }}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
                aulasViewMode === 'decks'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Visualização em Decks 3D"
            >
              <Layers className="w-3 h-3" />
              <span>Decks</span>
            </button>
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onAulasViewModeChange('lista');
              }}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
                aulasViewMode === 'lista'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Visualização em Lista"
            >
              <span>Lista</span>
            </button>
          </div>
        )}

        {isFlashcards && (
          <div className="flex items-center gap-1 rounded-full bg-card border border-border p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onFlashcardsViewModeChange('decks');
              }}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
                flashcardsViewMode === 'decks'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Visualização em Decks 3D"
            >
              <Layers className="w-3 h-3" />
              <span>Decks</span>
            </button>
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onFlashcardsViewModeChange('lista');
              }}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
                flashcardsViewMode === 'lista'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Visualização em Lista"
            >
              <span>Lista</span>
            </button>
          </div>
        )}

        {emAndamentoCount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-card border border-border p-0.5 lg:hidden shadow-sm">
            {(['todas', 'andamento'] as const).map((f) => (
              <button
                key={f}
                onClick={() => onFiltroChange(f)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                  filtro === f
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f === 'todas' ? 'Todas' : `Andamento (${emAndamentoCount})`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

AprenderHeaderToolbar.displayName = 'AprenderHeaderToolbar';
