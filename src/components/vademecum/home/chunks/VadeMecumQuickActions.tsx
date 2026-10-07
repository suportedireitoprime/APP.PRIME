import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, NotebookPen, Radar, History, AlertTriangle } from 'lucide-react';
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
    <div className="flex items-center justify-between gap-2 mx-1 mt-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-2 shadow-2xl">
      <button 
        onClick={() => handleAction('favoritos', '/vade-mecum/favoritos')} 
        className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
        aria-label="Abrir Favoritos"
      >
        <Heart className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ color: '#F43F5E', filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} strokeWidth={2} />
        <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">Favoritos</span>
      </button>
      
      <button 
        onClick={() => handleAction('anotacoes', '/vade-mecum/anotacoes')} 
        className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
        aria-label="Abrir Anotações"
      >
        <NotebookPen className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ color: '#60A5FA', filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} strokeWidth={2} />
        <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">Anotações</span>
      </button>

      <button 
        onClick={() => {
          haptic.selection();
          window.dispatchEvent(new CustomEvent('vademecum:abrir-sheet', { detail: 'novidades' }));
        }} 
        className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
        aria-label="Abrir Novidades"
      >
        <AlertTriangle className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ color: '#FBBF24', filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} strokeWidth={2} />
        <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">Novidades</span>
      </button>

      <button 
        onClick={() => handleAction('radares', '/radares')} 
        className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
        aria-label="Abrir Radares"
      >
        <Radar className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ color: '#A78BFA', filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} strokeWidth={2} />
        <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">Radares</span>
      </button>
    </div>
  );
};


export default memo(VadeMecumQuickActions);
