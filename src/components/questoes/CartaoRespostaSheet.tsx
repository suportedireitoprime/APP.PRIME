import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';

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
                <div className="grid grid-cols-5 gap-3 sm:grid-cols-8 md:grid-cols-10">
                  {Array.from({ length: questoesCount }).map((_, i) => {
                    const qId = questoesIdMap[i];
                    const resp = qId ? respostas[qId] : undefined;
                    const isAtual = i === idxAtual;
                    
                    let bgClass = "bg-muted text-muted-foreground border-transparent";
                    if (resp) {
                      bgClass = resp.acertou 
                        ? "bg-green-500 text-white border-green-600 shadow-green-500/20 shadow-lg" 
                        : "bg-red-500 text-white border-red-600 shadow-red-500/20 shadow-lg";
                    } else if (isAtual) {
                      bgClass = "bg-primary/20 text-primary border-primary shadow-primary/20 shadow-lg";
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          haptic.light?.();
                          onSelect(i);
                          onClose();
                        }}
                        className={cn(
                          "relative flex aspect-square w-full items-center justify-center rounded-full border-2 text-[15px] font-bold transition-transform active:scale-90",
                          bgClass
                        )}
                      >
                        {resp ? (
                          resp.acertou ? <Check className="h-5 w-5" /> : <XIcon className="h-5 w-5" />
                        ) : (
                          String(i + 1)
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
