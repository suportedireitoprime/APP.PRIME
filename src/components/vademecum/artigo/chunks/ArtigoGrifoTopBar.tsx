import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ArtigoGrifoTopBarProps {
  isVisible: boolean;
  voiceGrifoActive: boolean;
  onCloseGrifo: () => void;
}

export const ArtigoGrifoTopBar: React.FC<ArtigoGrifoTopBarProps> = ({
  isVisible,
  voiceGrifoActive,
  onCloseGrifo,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 left-0 right-0 h-20 z-[10000] bg-gradient-to-b from-black/40 to-transparent backdrop-blur-[1px] pointer-events-none"
              aria-hidden="true"
            />,
            document.body
          )}
          {createPortal(
            <div className="fixed top-[calc(0.75rem+var(--sai-top,0px))] left-0 right-0 z-[10001] flex justify-center pointer-events-none">
              <motion.button
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                onClick={onCloseGrifo}
                className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 font-semibold text-sm hover:bg-primary/90 transition-colors"
                aria-label="Fechar grifo"
              >
                <X className="w-4 h-4" />
                Fechar grifo
              </motion.button>
            </div>,
            document.body
          )}
        </>
      )}
    </AnimatePresence>
  );
};
