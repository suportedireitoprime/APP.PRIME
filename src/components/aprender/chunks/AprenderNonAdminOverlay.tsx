import React, { memo } from 'react';
import horusOwl from '@/assets/horus/horus-owl.webp';

export const AprenderNonAdminOverlay: React.FC = memo(() => {
  return (
    <div className="absolute inset-0 z-[60] backdrop-blur-[16px] bg-background/50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-card/90 p-8 rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full mx-auto relative overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <img
          src={horusOwl}
          alt="Hórus"
          className="w-24 h-24 mb-4 relative z-10 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.3)] object-cover"
        />
        <h2 className="text-xl font-display font-black text-foreground mb-2 relative z-10">Novidade a Caminho!</h2>
        <p className="text-sm font-body text-muted-foreground mb-6 relative z-10">
          O seu hub de estudos inteligente estará disponível em breve com cronogramas gerados pela IA.
        </p>

        <div className="flex gap-3 justify-center relative z-10">
          <div className="bg-background rounded-xl p-3 min-w-[70px] border border-border shadow-sm flex flex-col items-center justify-center">
            <span className="block text-3xl font-display font-black text-primary leading-none">5</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
              Dias Restantes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

AprenderNonAdminOverlay.displayName = 'AprenderNonAdminOverlay';
