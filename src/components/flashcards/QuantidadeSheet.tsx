import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export function QuantidadeSheet({
  quantidadeSel,
  totalCount,
  onFechar,
  onConfirmar,
}: {
  quantidadeSel: number | 'todos' | undefined;
  totalCount: number;
  onFechar: () => void;
  onConfirmar: (qtd: number | 'todos') => void;
}) {
  const [localQtd, setLocalQtd] = useState<number | 'todos' | undefined>(quantidadeSel);
  const isTodos = localQtd === 'todos';
  const opcoesFixas = [10, 20, 50, 100];

  const handleSelectTodos = () => {
    haptic.selection?.();
    setLocalQtd('todos');
  };

  const handleSelectFixa = (qtd: number) => {
    haptic.selection?.();
    setLocalQtd(qtd);
  };

  const handleConfirm = () => {
    if (localQtd === undefined) return;
    haptic.selection?.();
    onConfirmar(localQtd);
  };

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-20 flex flex-col bg-zinc-950 text-foreground"
    >
      <div className="flex items-center gap-2 border-b border-zinc-800/80 px-3 pt-safe-header pb-3 bg-zinc-900/90 backdrop-blur-md">
        <button
          onClick={onFechar}
          className="grid h-10 w-10 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-[17px] font-bold text-white">Quantidade de Cards</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Option: Todos */}
        <button
          type="button"
          onClick={handleSelectTodos}
          className={`flex w-full items-center justify-between p-4 rounded-xl border transition-all text-left group ${
            isTodos
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="text-[15px] font-bold text-zinc-100 group-hover:text-white">
              Todos os flashcards
            </span>
            <span className="text-[12px] text-zinc-400 mt-0.5">
              Estudar sem limite de quantidade
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {totalCount > 0 && (
              <span className="text-[12px] font-semibold text-zinc-300 bg-zinc-800/90 border border-zinc-700/60 px-2.5 py-0.5 rounded-full">
                {totalCount} {totalCount === 1 ? 'card' : 'cards'}
              </span>
            )}
            <span className={`grid h-6 w-6 place-items-center rounded-md border-2 transition-all ${
              isTodos
                ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25'
                : 'border-zinc-700 bg-zinc-900/50'
            }`}>
              {isTodos && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
            </span>
          </div>
        </button>

        {/* Animated collapse / expand for fixed quantities */}
        <AnimatePresence>
          {!isTodos ? (
            <motion.div
              key="fixed-options"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden space-y-2.5 pt-1"
            >
              {opcoesFixas.map(qtd => {
                const checked = localQtd === qtd;
                return (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => handleSelectFixa(qtd)}
                    className={`flex w-full items-center justify-between p-4 rounded-xl border transition-all text-left group ${
                      checked
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
                    }`}
                  >
                    <span className="text-[15px] font-bold text-zinc-100 group-hover:text-white">
                      {qtd} flashcards
                    </span>
                    <span className={`grid h-6 w-6 place-items-center rounded-md border-2 transition-all ${
                      checked
                        ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25'
                        : 'border-zinc-700 bg-zinc-900/50 group-hover:border-zinc-500'
                    }`}>
                      {checked && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 pb-safe-nav pt-4">
        <button
          onClick={handleConfirm}
          disabled={localQtd === undefined}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#36AF85] hover:bg-[#2C9570] text-[15px] font-bold text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          Confirmar Quantidade
        </button>
      </div>
    </motion.div>
  );
}
