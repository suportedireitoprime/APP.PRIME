import React, { useEffect } from 'react';
import { Smartphone, BookOpen, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { haptic } from '@/lib/nativeHaptics';

export type LerModo = 'nativa' | 'pdf' | 'online' | 'download' | 'desktop';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (modo: LerModo) => void;
  hasPdf: boolean;
  hasOnline?: boolean;
  pdfCached?: boolean;
  downloadProgress?: number | null;
  livroTitulo?: string;
  livroAutor?: string;
}

const LerAgoraDialog: React.FC<Props> = ({ open, onClose, onSelect }) => {
  // Fechar com tecla Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  const handleSelect = (modo: LerModo) => {
    haptic.selection();
    onSelect(modo);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="ler-agora-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            haptic.selection();
            onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ler-agora-title"
            className="relative w-full max-w-md rounded-3xl bg-[#141416] border border-white/10 shadow-2xl p-5 sm:p-6 overflow-hidden"
          >
            {/* Cabeçalho limpo */}
            <div className="flex items-center justify-between mb-5">
              <h3 id="ler-agora-title" className="font-display text-base sm:text-lg font-bold text-white tracking-wide uppercase">
                Escolha como ler
              </h3>
              <button
                onClick={() => {
                  haptic.selection();
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Apenas os dois botões simples e elegantes */}
            <div className="flex flex-col gap-3">
              {/* Botão 1: Leitura Nativa */}
              <button
                onClick={() => handleSelect('nativa')}
                className="group w-full rounded-2xl p-4 text-left flex items-center gap-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-primary/50 transition-all duration-150 active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-6 h-6" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-[15px] text-white tracking-wide uppercase">
                    Leitura Nativa
                  </div>
                  <div className="text-[12.5px] text-zinc-400 leading-snug mt-0.5 font-body">
                    Texto adaptado para a tela com busca inteligente.
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Botão 2: Ler Arquivo Original (PDF) */}
              <button
                onClick={() => handleSelect('pdf')}
                className="group w-full rounded-2xl p-4 text-left flex items-center gap-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-150 active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-[15px] text-zinc-200 tracking-wide uppercase">
                    Ler Arquivo Original (PDF)
                  </div>
                  <div className="text-[12.5px] text-zinc-400 leading-snug mt-0.5 font-body">
                    Visualização idêntica ao documento original.
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LerAgoraDialog;
