import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import { CartaoRespostaGrid } from './CartaoRespostaGrid';

type Props = {
  aberto: boolean;
  onClose: () => void;
  questoesCount: number;
  idxAtual: number;
  respostas: Record<string, { acertou: boolean }>;
  questoesIdMap: string[];
  onSelect: (idx: number) => void;
};

export const CartaoRespostaSheet = ({
  aberto,
  onClose,
  questoesCount,
  idxAtual,
  respostas,
  questoesIdMap,
  onSelect
}: Props) => {
  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] border-t border-border/50 bg-background pb-safe-nav pt-2 shadow-2xl"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col">
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="h-1.5 w-12 rounded-full bg-border/60" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4">
                <h2 className="text-[20px] font-extrabold tracking-tight">Cartão Resposta</h2>
                <button
                  onClick={onClose}
                  className="rounded-full bg-muted/60 p-2 text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Grid */}
              <div className="max-h-[60vh] overflow-y-auto px-6 pb-8">
                <CartaoRespostaGrid
                  questoesCount={questoesCount}
                  idxAtual={idxAtual}
                  respostas={respostas}
                  questoesIdMap={questoesIdMap}
                  onSelect={(i) => {
                    onSelect(i);
                    onClose();
                  }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
