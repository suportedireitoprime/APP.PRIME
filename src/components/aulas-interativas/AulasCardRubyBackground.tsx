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
            active ? 'opacity-25' : 'opacity-15 group-hover:opacity-20'
          }`}
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(251,113,133,0.12) 0px, rgba(251,113,133,0.12) 1.5px, transparent 1.5px, transparent 11px)',
          }}
        />

        {/* 3. Linha de Crista Superior Sutil */}
        <div 
          className={`absolute inset-x-0 top-0 h-[1px] transition-opacity duration-300 ${
            active 
              ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80' 
              : 'bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40 group-hover:opacity-60'
          }`} 
        />
      </div>
    );
  }
);

export default AulasCardRubyBackground;
