import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';

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
  return (
    <AnimatePresence>
      {powersOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/50 flex items-end"
          onClick={() => setPowersOpen(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full bg-card rounded-t-3xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
