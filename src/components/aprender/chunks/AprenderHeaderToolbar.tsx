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
        {/* Toggles de ViewMode removidos para simplificação do layout mobile */}


      </div>
    </div>
  );
});

AprenderHeaderToolbar.displayName = 'AprenderHeaderToolbar';
