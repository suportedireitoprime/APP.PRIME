import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, NotebookPen, Radar, History, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { haptic } from '@/lib/nativeHaptics';

import type { QuickActionType } from '@/components/vademecum/sheets/VadeMecumQuickActionSheet';

interface VadeMecumQuickActionsProps {
  onSelectQuickAction?: (action: QuickActionType) => void;
}

const VadeMecumQuickActions: React.FC<VadeMecumQuickActionsProps> = ({ onSelectQuickAction }) => {
  const navigate = useNavigate();

  const handleAction = (action: QuickActionType, fallbackRoute: string) => {
    haptic.selection();
    if (onSelectQuickAction) {
      onSelectQuickAction(action);
    } else {
      navigate(fallbackRoute);
    }
  };

  return (
    <div className="flex items-center justify-between gap-1 xs:gap-1.5 mx-0.5 mt-0.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl xs:rounded-3xl py-1 xs:py-1.5 sm:py-2 px-1 xs:px-2 sm:px-3 shadow-xl">
      <button 
        onClick={() => handleAction('favoritos', '/vade-mecum/favoritos')} 
        className="flex-1 group relative flex flex-col items-center justify-center pt-1.5 pb-1 px-0.5 rounded-xl hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-all duration-200 active:scale-95 gap-0.5 text-center select-none cursor-pointer overflow-hidden"
        aria-label="Abrir Favoritos"
      >
        <Bookmark className="w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-transform duration-200 group-hover:scale-110 text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.55)]" strokeWidth={2.1} />
        <span className="font-sans text-white/95 text-[10px] xs:text-[10.5px] sm:text-[11.5px] font-semibold leading-tight tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] group-hover:text-emerald-300 transition-colors truncate max-w-full">Favoritos</span>
      </button>
      
      <button 
        onClick={() => handleAction('anotacoes', '/vade-mecum/anotacoes')} 
        className="flex-1 group relative flex flex-col items-center justify-center pt-1.5 pb-1 px-0.5 rounded-xl hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-all duration-200 active:scale-95 gap-0.5 text-center select-none cursor-pointer overflow-hidden"
        aria-label="Abrir Anotações"
      >
        <NotebookPen className="w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-transform duration-200 group-hover:scale-110 text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.55)]" strokeWidth={2.1} />
        <span className="font-sans text-white/95 text-[10px] xs:text-[10.5px] sm:text-[11.5px] font-semibold leading-tight tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] group-hover:text-emerald-300 transition-colors truncate max-w-full">Anotações</span>
      </button>

      <button 
        onClick={() => {
          haptic.selection();
          window.dispatchEvent(new CustomEvent('vademecum:abrir-sheet', { detail: 'novidades' }));
        }} 
        className="flex-1 group relative flex flex-col items-center justify-center pt-1.5 pb-1 px-0.5 rounded-xl hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-all duration-200 active:scale-95 gap-0.5 text-center select-none cursor-pointer overflow-hidden"
        aria-label="Abrir Novidades"
      >
        <AlertTriangle className="w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-transform duration-200 group-hover:scale-110 text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.55)]" strokeWidth={2.1} />
        <span className="font-sans text-white/95 text-[10px] xs:text-[10.5px] sm:text-[11.5px] font-semibold leading-tight tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] group-hover:text-emerald-300 transition-colors truncate max-w-full">Novidades</span>
      </button>

      <button 
        onClick={() => handleAction('radares', '/radares')} 
        className="flex-1 group relative flex flex-col items-center justify-center pt-1.5 pb-1 px-0.5 rounded-xl hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-all duration-200 active:scale-95 gap-0.5 text-center select-none cursor-pointer overflow-hidden"
        aria-label="Abrir Radares"
      >
        <Radar className="w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-transform duration-200 group-hover:scale-110 text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.55)]" strokeWidth={2.1} />
        <span className="font-sans text-white/95 text-[10px] xs:text-[10.5px] sm:text-[11.5px] font-semibold leading-tight tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] group-hover:text-emerald-300 transition-colors truncate max-w-full">Radares</span>
      </button>
    </div>
  );
};


export default memo(VadeMecumQuickActions);
