import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellRing } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

const VadeMecumHeroHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 pb-2 pt-2 flex items-center justify-between relative z-30">
      <button 
        onClick={() => { 
          haptic.selection(); 
          navigate('/'); 
        }} 
        aria-label="Voltar para tela inicial"
        className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
      >
        <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
      </button>
      <button 
        onClick={() => { 
          haptic.selection(); 
          navigate('/meus-lembretes'); 
        }} 
        aria-label="Lembretes legislativos"
        className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
      >
        <BellRing className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
      </button>
    </div>
  );
};

export default memo(VadeMecumHeroHeader);
