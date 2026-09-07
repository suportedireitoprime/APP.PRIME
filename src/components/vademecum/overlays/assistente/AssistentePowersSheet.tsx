import React from 'react';
import { motion, AnimatePresence, useDragControls, useReducedMotion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { PrimeBottomSheet } from '../PrimeBottomSheet';

interface AssistentePowersSheetProps {
  powersOpen: boolean;
  setPowersOpen: (open: boolean) => void;
  webSearch: boolean;
  toggleWebSearch: () => void;
}

export const AssistentePowersSheet: React.FC<AssistentePowersSheetProps> = ({
  powersOpen,
  setPowersOpen,
  webSearch,
  toggleWebSearch,
}) => {
  const dragControls = useDragControls();
  const shouldReduceMotion = useReducedMotion();
  return (
    <PrimeBottomSheet
      open={powersOpen}
      onClose={() => setPowersOpen(false)}
      dragControls={dragControls}
      zIndex={70}
      className="flex justify-end lg:top-[30%] lg:h-[70vh] lg:max-w-[800px] lg:mx-auto"
    >
          <div
            className="w-full bg-card rounded-t-3xl p-5 pb-8 overscroll-none h-auto mt-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="flex items-center justify-center w-full h-8 cursor-grab active:cursor-grabbing mb-2 -mt-2 touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mb-1">Poderes</h3>
            <p className="text-xs font-body text-muted-foreground mb-4">
              Ative superpoderes para respostas ainda melhores.
            </p>
            <button
              onClick={toggleWebSearch}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                webSearch ? 'bg-accent/20 border-accent' : 'bg-secondary border-border'
              }`}
            >
              <Globe className={`w-6 h-6 ${webSearch ? 'text-accent' : 'text-foreground'}`} />
              <div className="flex-1 text-left">
                <p className="font-body text-sm font-bold text-foreground">
                  Pesquisar na internet
                </p>
                <p className="text-xs text-muted-foreground">Busca em tempo real via Google.</p>
              </div>
              <div
                className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                  webSearch ? 'bg-accent justify-end' : 'bg-muted justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-background" />
              </div>
            </button>
          </div>
    </PrimeBottomSheet>
  );
};
