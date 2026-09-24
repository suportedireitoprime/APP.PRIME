import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, Compass, ArrowRight, CornerDownLeft } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface JumpToArticleModalProps {
  open: boolean;
  onClose: () => void;
  onJump: (targetNumero: string) => void;
  leiNome?: string;
  totalArtigos?: number;
}

export const JumpToArticleModal: React.FC<JumpToArticleModalProps> = ({
  open,
  onClose,
  onJump,
  leiNome,
  totalArtigos,
}) => {
  const [typedNumber, setTypedNumber] = useState('');
  const [recentJumps, setRecentJumps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vademecum_recent_jumps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Limpa o valor digitado ao abrir o modal
  useEffect(() => {
    if (open) {
      setTypedNumber('');
    }
  }, [open]);

  const handleConfirm = useCallback(() => {
    const trimmed = typedNumber.trim();
    if (!trimmed) return;

    haptic.impact('medium').catch(() => {});

    // Salva no histórico de recentes
    try {
      const nextRecents = [trimmed, ...recentJumps.filter((n) => n !== trimmed)].slice(0, 5);
      setRecentJumps(nextRecents);
      localStorage.setItem('vademecum_recent_jumps', JSON.stringify(nextRecents));
    } catch {}

    onJump(trimmed);
    onClose();
  }, [typedNumber, recentJumps, onJump, onClose]);

  // Teclado físico desktop (Enter, Backspace, dígitos)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setTypedNumber((prev) => (prev.length < 6 ? prev + e.key : prev));
        haptic.selection().catch(() => {});
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setTypedNumber((prev) => prev.slice(0, -1));
        haptic.light().catch(() => {});
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleConfirm, onClose]);

  const handleDigit = (digit: string) => {
    haptic.selection().catch(() => {});
    setTypedNumber((prev) => (prev.length < 6 ? prev + digit : prev));
  };

  const handleBackspace = () => {
    haptic.light().catch(() => {});
    setTypedNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    haptic.light().catch(() => {});
    setTypedNumber('');
  };

  const handleSuffix = (suffix: string) => {
    haptic.selection().catch(() => {});
    setTypedNumber((prev) => {
      if (!prev) return prev;
      if (prev.endsWith(suffix)) return prev;
      return prev + suffix;
    });
  };

  // Sugestões rápidas de artigos populares ou recentes
  const quickSuggestions = useMemo(() => {
    if (recentJumps.length > 0) return recentJumps;
    return ['1', '5', '121', '157'];
  }, [recentJumps]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10060] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop com blur escuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="relative w-full sm:max-w-md bg-card/95 border-t sm:border border-border/80 rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 flex flex-col gap-4 backdrop-blur-xl z-[10061]"
          >
            {/* Drag Handle para Mobile */}
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto -mt-2 mb-1 sm:hidden" />

            {/* Cabeçalho */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground truncate">
                    Salto Rápido para Artigo
                  </h3>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {leiNome ? leiNome : totalArtigos ? `${totalArtigos} artigos nesta lei` : 'Digite o número do artigo desejado'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition active:scale-95"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Display de Número Digitado */}
            <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-secondary/70 border border-border/80 shadow-inner">
              <span className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
                Artigo
              </span>
              <div className="flex items-center gap-1">
                <span className="text-3xl font-extrabold font-mono text-primary min-w-[70px] text-right">
                  {typedNumber || <span className="text-muted-foreground/40 font-normal">___</span>}
                </span>
                <span className="w-0.5 h-6 bg-primary animate-pulse ml-0.5" />
              </div>
            </div>

            {/* Chips de Sufixo Rápido e Recentes */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
              <div className="flex items-center gap-1.5 shrink-0">
                {['-A', '-B', 'º'].map((suffix) => (
                  <button
                    key={suffix}
                    type="button"
                    onClick={() => handleSuffix(suffix)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground transition active:scale-95"
                  >
                    {suffix}
                  </button>
                ))}
              </div>

              {quickSuggestions.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Recentes:</span>
                  {quickSuggestions.slice(0, 3).map((item) => (
                    <button
                      key={`recent-${item}`}
                      type="button"
                      onClick={() => setTypedNumber(item)}
                      className="px-2 py-0.5 text-xs font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition active:scale-95"
                    >
                      Art. {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Numpad 10-Key Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="h-12 py-2.5 rounded-2xl bg-secondary/80 hover:bg-secondary active:scale-95 border border-border/60 text-xl font-bold text-foreground transition flex items-center justify-center shadow-sm select-none"
                >
                  {digit}
                </button>
              ))}

              {/* Botão Limpar / Backspace */}
              <button
                type="button"
                onClick={typedNumber ? handleBackspace : handleClear}
                className="h-12 py-2.5 rounded-2xl bg-secondary/50 hover:bg-secondary active:scale-95 border border-border/60 text-sm font-bold text-muted-foreground hover:text-foreground transition flex items-center justify-center shadow-sm select-none"
                title="Apagar dígito"
              >
                {typedNumber ? <Delete className="w-5 h-5" /> : 'C'}
              </button>

              {/* Dígito 0 */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-12 py-2.5 rounded-2xl bg-secondary/80 hover:bg-secondary active:scale-95 border border-border/60 text-xl font-bold text-foreground transition flex items-center justify-center shadow-sm select-none"
              >
                0
              </button>

              {/* Botão Confirmar IR */}
              <button
                type="button"
                disabled={!typedNumber}
                onClick={handleConfirm}
                className="h-12 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-primary-foreground font-extrabold text-sm transition flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 select-none"
              >
                <span>IR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dica para Desktop */}
            <div className="hidden sm:flex items-center justify-center gap-1 text-[11px] text-muted-foreground pt-1">
              <CornerDownLeft className="w-3 h-3" />
              <span>Você também pode digitar no teclado e pressionar Enter</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default JumpToArticleModal;
