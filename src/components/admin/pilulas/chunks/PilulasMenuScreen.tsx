import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ScreenState } from './pilulasConstants';

interface PilulasMenuScreenProps {
  livrosCount: number;
  onNavigate: (screen: ScreenState) => void;
}

export const PilulasMenuScreen: React.FC<PilulasMenuScreenProps> = ({
  livrosCount,
  onNavigate,
}) => {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => onNavigate('classicos')}
        className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-2xl shadow-sm border border-border hover:bg-muted/30 transition-colors active:scale-[0.98]"
      >
        <span className="font-bold text-lg uppercase tracking-wider text-muted-foreground">
          Clássicos do Direito ({livrosCount})
        </span>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={() => onNavigate('rapidas')}
        className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-2xl shadow-sm border border-border hover:bg-muted/30 transition-colors active:scale-[0.98]"
      >
        <span className="font-bold text-lg uppercase tracking-wider text-muted-foreground">
          Pílulas Rápidas
        </span>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={() => onNavigate('ministros')}
        className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-2xl shadow-sm border border-border hover:bg-muted/30 transition-colors active:scale-[0.98]"
      >
        <span className="font-bold text-lg uppercase tracking-wider text-muted-foreground">
          Pílulas dos Ministros
        </span>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  );
};
