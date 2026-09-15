import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

const HomeLeiSecaBar = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    try { haptic.selection(); } catch {}
    navigate('/lei-seca');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      role="button"
      aria-label="Praticar Lei Seca. Abra artigos comentados e pílulas."
      className="group relative w-full flex items-center h-16 pl-14 pr-[116px] rounded-2xl bg-[#252528] hover:bg-[#2E2E33] backdrop-blur-md border border-white/10 shadow-lg shadow-black/30 active:scale-[0.99] transition-all cursor-pointer overflow-hidden search-bar-shine text-left"
    >
      {/* Glow e iluminação interna */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-primary/20 blur-xl pointer-events-none group-hover:bg-primary/30 transition-colors" />

      {/* Ícone da Balança da Justiça à esquerda */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-primary drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]" strokeWidth={2.2} />
      </div>

      {/* Texto principal e subtítulo */}
      <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden pr-2">
        <div className="flex items-center gap-1.5 leading-none mb-1">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-primary drop-shadow-sm">
            Lei Seca
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-[10px] text-muted-foreground font-medium truncate">
            Artigos comentados
          </span>
        </div>
        <span className="font-body text-white text-[13px] sm:text-[14.5px] font-bold truncate leading-tight">
          Pratique agora os artigos da Lei Seca
        </span>
      </div>

      {/* Botão de Ação Lateral 'PRATICAR >' */}
      <div
        aria-hidden="true"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-11 px-4 rounded-xl bg-primary hover:bg-[#BE123C] text-white font-display text-[12.5px] sm:text-[13px] font-black tracking-wider flex items-center justify-center gap-1 shadow-md shadow-primary/30 group-hover:shadow-primary/50 transition-all select-none uppercase"
      >
        <span>PRATICAR</span>
        <ChevronRight className="w-4 h-4 stroke-[2.8] transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
};

export default memo(HomeLeiSecaBar);
