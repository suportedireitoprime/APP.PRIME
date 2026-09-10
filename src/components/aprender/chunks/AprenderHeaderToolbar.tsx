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
          <div role="tablist" aria-label="Modo de exibição de aulas" className="flex items-center gap-1 rounded-full bg-card border border-border p-0.5 shadow-sm">
            <button
              type="button"
              role="tab"
              aria-selected={aulasViewMode === 'decks'}
              aria-label="Visualizar aulas em Decks 3D"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onAulasViewModeChange('decks');
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer min-h-[34px] relative after:absolute after:-inset-1.5 after:content-[\'\']',
                aulasViewMode === 'decks'
                  ? 'text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={aulasViewMode === 'decks' ? { backgroundColor: '#F43F5E', color: '#FFFFFF' } : undefined}
              title="Visualização em Decks 3D"
            >
              <Layers className="w-3 h-3" />
              <span>Decks</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={aulasViewMode === 'lista'}
              aria-label="Visualizar aulas em Lista"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onAulasViewModeChange('lista');
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer min-h-[34px] relative after:absolute after:-inset-1.5 after:content-[\'\']',
                aulasViewMode === 'lista'
                  ? 'text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={aulasViewMode === 'lista' ? { backgroundColor: '#F43F5E', color: '#FFFFFF' } : undefined}
              title="Visualização em Lista"
            >
              <span>Lista</span>
            </button>
          </div>
        )}

        {isFlashcards && (
          <div role="tablist" aria-label="Modo de exibição de flashcards" className="flex items-center gap-1 rounded-full bg-card border border-border p-0.5 shadow-sm">
            <button
              type="button"
              role="tab"
              aria-selected={flashcardsViewMode === 'decks'}
              aria-label="Visualizar flashcards em Decks 3D"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onFlashcardsViewModeChange('decks');
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer min-h-[34px] relative after:absolute after:-inset-1.5 after:content-[\'\']',
                flashcardsViewMode === 'decks'
                  ? 'text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={flashcardsViewMode === 'decks' ? { backgroundColor: '#10B981', color: '#FFFFFF' } : undefined}
              title="Visualização em Decks 3D"
            >
              <Layers className="w-3 h-3" />
              <span>Decks</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={flashcardsViewMode === 'lista'}
              aria-label="Visualizar flashcards em Lista"
              onClick={() => {
                try { haptic.selection(); } catch {}
                onFlashcardsViewModeChange('lista');
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer min-h-[34px] relative after:absolute after:-inset-1.5 after:content-[\'\']',
                flashcardsViewMode === 'lista'
                  ? 'text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={flashcardsViewMode === 'lista' ? { backgroundColor: '#10B981', color: '#FFFFFF' } : undefined}
              title="Visualização em Lista"
            >
              <span>Lista</span>
            </button>
          </div>
        )}


      </div>
    </div>
  );
});

AprenderHeaderToolbar.displayName = 'AprenderHeaderToolbar';
