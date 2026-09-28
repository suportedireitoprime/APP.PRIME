const fs = require('fs');
const path = 'C:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Documentos/APP.PRIME/src/components/resumos/ResumosHero.tsx';

let content = fs.readFileSync(path, 'utf8');

// Fix background color
content = content.replace(/backgroundColor: '#050505'/g, "backgroundColor: '#0D0D0D'");
content = content.replace(/bg-\[#050505\]/g, "bg-[#0D0D0D]");

// Move HeroMotifs outside clipPath
const badOverlay = `
          {/* Wrapper com máscara para exibir SVGs apenas no lado direito do painel vermelho (atrás do texto fica limpo) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 20%, black 46%)',
              maskImage: 'linear-gradient(to right, transparent 20%, black 46%)'
            }}
          >
            <HeroMotifs />
          </div>`;

content = content.replace(badOverlay, '');

const wrapper = `
      {/* Overlay vermelho com gradiente estilo menu e sombra */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
      >
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
        >
          <div className="absolute inset-0 bg-hero-panel" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        </div>
      </div>
`;

const wrapperReplacement = wrapper + `
      {/* SVGs flutuantes fora do clip-path para não serem cortados */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <HeroMotifs />
      </div>
`;

content = content.replace(wrapper.trim(), wrapperReplacement.trim());

fs.writeFileSync(path, content);
console.log('Fixed ResumosHero');
