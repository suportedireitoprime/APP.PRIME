import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, NotebookPen, Radar, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { haptic } from '@/lib/nativeHaptics';

const VadeMecumQuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-2 mx-1 mt-1">
      <button 
        onClick={() => {
          haptic.selection();
          navigate('/vade-mecum/favoritos');
        }} 
        className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center min-h-[48px]"
        aria-label="Ir para Favoritos"
      >
        <Heart className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" strokeWidth={2} />
        <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Favoritos</span>
      </button>
      
      <button 
        onClick={() => {
          haptic.selection();
          toast({ title: 'Anotações', description: 'Módulo de anotações e fichamentos legislativos.' });
        }} 
        className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center min-h-[48px]"
        aria-label="Abrir Anotações"
      >
        <NotebookPen className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" strokeWidth={2} />
        <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Anotações</span>
      </button>

      <button 
        onClick={() => {
          haptic.selection();
          navigate('/radares');
        }} 
        className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center min-h-[48px]"
        aria-label="Ir para Radares"
      >
        <Radar className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" strokeWidth={2} />
        <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Radares</span>
      </button>

      <button 
        onClick={() => {
          haptic.selection();
          navigate('/vade-mecum/recentes');
        }} 
        className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center min-h-[48px]"
        aria-label="Ir para Histórico recente"
      >
        <History className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" strokeWidth={2} />
        <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">Histórico</span>
      </button>
    </div>
  );
};

export default memo(VadeMecumQuickActions);
