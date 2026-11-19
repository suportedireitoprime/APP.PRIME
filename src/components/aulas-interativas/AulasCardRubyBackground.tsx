import React, { memo } from 'react';

interface AulasCardRubyBackgroundProps {
  className?: string;
  active?: boolean;
  rounded?: string;
}

/**
 * AulasCardRubyBackground
 * Aplica o design nobre do fundo das funções (paleta Imperial Ruby & Rose Gold)
 * com gradiente acetinado, listras de seda sutis, resplendor e crista de luz superior.
 */
export const AulasCardRubyBackground: React.FC<AulasCardRubyBackgroundProps> = memo(
  function AulasCardRubyBackground({ className = '', active = false, rounded = 'rounded-2xl' }) {
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${rounded} z-0 select-none ${className}`}>
        {/* 1. Gradiente Base Vinho/Rubi Profundo */}
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            active
              ? 'bg-gradient-to-br from-[#2c0511]/95 via-[#1c0309]/92 to-[#0e0205]/98'
              : 'bg-gradient-to-br from-[#22040b]/92 via-[#150206]/90 to-[#0a0104]/96'
          }`} 
        />

        {/* 2. Listras de Seda Fluidas (Design do Fundo das Funções) */}
        <div 
          className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
            active ? 'opacity-35' : 'opacity-20 group-hover:opacity-30'
          }`}
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(251,113,133,0.18) 0px, rgba(251,113,133,0.18) 1.5px, transparent 1.5px, transparent 11px)',
          }}
        />

        {/* 3. Onda de Luz / Resplendor Volumétrico Superior Esquerdo */}
        <div 
          className={`absolute -top-12 -left-12 rounded-full bg-gradient-to-br from-rose-500/25 via-red-600/15 to-transparent blur-2xl transform-gpu pointer-events-none transition-all duration-300 ${
            active ? 'w-36 h-36 opacity-90' : 'w-28 h-28 opacity-60 group-hover:opacity-85'
          }`} 
        />

        {/* 4. Resplendor Suave Inferior Direito */}
        <div 
          className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-red-950/40 blur-xl transform-gpu pointer-events-none" 
        />

        {/* 5. Linha de Crista de Luz Superior Reluzente */}
        <div 
          className={`absolute inset-x-0 top-0 h-[1px] transition-opacity duration-300 ${
            active 
              ? 'bg-gradient-to-r from-transparent via-rose-300/50 to-transparent opacity-100' 
              : 'bg-gradient-to-r from-transparent via-rose-400/30 to-transparent opacity-70 group-hover:opacity-100'
          }`} 
        />
      </div>
    );
  }
);

export default AulasCardRubyBackground;
