import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { MagicGrifo, MAGIC_COLORS } from '../artigoConstants';

interface ArtigoMagicTooltipModalProps {
  magicTooltip: { grifo: MagicGrifo } | null;
  onClose: () => void;
  onRemoveSingleMagicHighlight: (grifo: MagicGrifo) => void;
}

export const ArtigoMagicTooltipModal: React.FC<ArtigoMagicTooltipModalProps> = ({
  magicTooltip,
  onClose,
  onRemoveSingleMagicHighlight,
}) => {
  return (
    <AnimatePresence>
      {magicTooltip && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[79] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed z-[80] left-4 right-4 top-1/2 -translate-y-1/2 max-w-md mx-auto max-h-[80dvh] overflow-y-auto overscroll-contain bg-popover border border-border rounded-2xl shadow-2xl px-5 py-5 sm:px-6 sm:py-6"
          >
            <button
              onClick={onClose}
              aria-label="Fechar comentário"
              className="absolute top-2.5 right-2.5 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-3 pr-11">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: MAGIC_COLORS[magicTooltip.grifo.cor] }}
              />
              <span className="text-[clamp(0.8125rem,3.4vw,0.9375rem)] font-bold text-foreground/80 uppercase tracking-wider">
                {magicTooltip.grifo.hierarquia}
              </span>
            </div>
            <p className="text-[clamp(1.0625rem,4.4vw,1.25rem)] text-foreground leading-[1.55] mb-4">
              {magicTooltip.grifo.explicacao}
            </p>
            <div className="text-[clamp(0.9375rem,3.9vw,1.0625rem)] text-muted-foreground italic leading-[1.5] border-t border-border/40 pt-3">
              "{magicTooltip.grifo.trechoExato}"
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
              <button
                onClick={() => {
                  onRemoveSingleMagicHighlight(magicTooltip.grifo);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Apagar este grifo</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
