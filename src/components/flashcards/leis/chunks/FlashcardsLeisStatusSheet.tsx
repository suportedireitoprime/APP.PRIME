import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface FlashcardsLeisStatusSheetProps {
  statusSel: string;
  totalCount: number;
  onFechar: () => void;
  onConfirmar: (status: string) => void;
}

export function FlashcardsLeisStatusSheet({
  statusSel,
  totalCount,
  onFechar,
  onConfirmar,
}: FlashcardsLeisStatusSheetProps) {
  const [selecionados, setSelecionados] = useState<string[]>(() => {
    if (!statusSel) return [];
    if (statusSel === 'todos') return ['todos', 'novos', 'revisar'];
    return [statusSel];
  });

  const isTodosChecked =
    selecionados.includes('todos') ||
    (selecionados.includes('novos') && selecionados.includes('revisar'));
  const isNovosChecked = selecionados.includes('novos') || isTodosChecked;
  const isRevisarChecked = selecionados.includes('revisar') || isTodosChecked;

  const toggleTodos = () => {
    haptic.selection?.();
    if (isTodosChecked) {
      setSelecionados([]);
    } else {
      setSelecionados(['todos', 'novos', 'revisar']);
    }
  };

  const toggleNovos = () => {
    haptic.selection?.();
    if (isTodosChecked) {
      setSelecionados(['revisar']);
    } else if (isNovosChecked) {
      setSelecionados((prev) => prev.filter((x) => x !== 'novos' && x !== 'todos'));
    } else {
      const next = [...selecionados.filter((x) => x !== 'todos'), 'novos'];
      if (next.includes('revisar')) {
        setSelecionados(['todos', 'novos', 'revisar']);
      } else {
        setSelecionados(next);
      }
    }
  };

  const toggleRevisar = () => {
    haptic.selection?.();
    if (isTodosChecked) {
      setSelecionados(['novos']);
    } else if (isRevisarChecked) {
      setSelecionados((prev) => prev.filter((x) => x !== 'revisar' && x !== 'todos'));
    } else {
      const next = [...selecionados.filter((x) => x !== 'todos'), 'revisar'];
      if (next.includes('novos')) {
        setSelecionados(['todos', 'novos', 'revisar']);
      } else {
        setSelecionados(next);
      }
    }
  };

  const handleConfirm = () => {
    if (selecionados.length === 0) return;
    haptic.selection?.();
    if (isTodosChecked || (!isNovosChecked && !isRevisarChecked)) {
      onConfirmar('todos');
    } else if (isNovosChecked) {
      onConfirmar('novos');
    } else if (isRevisarChecked) {
      onConfirmar('revisar');
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-20 flex flex-col bg-zinc-950 text-foreground"
    >
      <div className="flex items-center gap-2 border-b border-zinc-800/80 px-3 pt-safe-header pb-3 bg-zinc-900/90 backdrop-blur-md">
        <button
          type="button"
          onClick={onFechar}
          className="grid h-10 w-10 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-[17px] font-bold text-white">Status dos Cards</span>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setSelecionados([])}
            className="text-[13px] font-medium text-zinc-400 hover:text-zinc-200"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Option: Todos os Cards */}
        <button
          type="button"
          onClick={toggleTodos}
          className={`flex w-full items-center justify-between p-4 rounded-xl border transition-all text-left group ${
            isTodosChecked
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="text-[15px] font-bold text-zinc-100 group-hover:text-white">
              Todos os Cards
            </span>
            <span className="text-[12px] text-zinc-400 mt-0.5">
              Inclui cards novos e a revisar
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {totalCount > 0 && (
              <span className="text-[12px] font-semibold text-zinc-300 bg-zinc-800/90 border border-zinc-700/60 px-2.5 py-0.5 rounded-full">
                {totalCount} {totalCount === 1 ? 'card' : 'cards'}
              </span>
            )}
            <span
              className={`grid h-6 w-6 place-items-center rounded-md border-2 transition-all ${
                isTodosChecked
                  ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25'
                  : 'border-zinc-700 bg-zinc-900/50'
              }`}
            >
              {isTodosChecked && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
            </span>
          </div>
        </button>

        {/* Option: Apenas Novos */}
        <button
          type="button"
          onClick={toggleNovos}
          className={`flex w-full items-center justify-between p-4 rounded-xl border transition-all text-left group ${
            isNovosChecked
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="text-[15px] font-bold text-zinc-100 group-hover:text-white">
              Apenas Novos
            </span>
            <span className="text-[12px] text-zinc-400 mt-0.5">
              Cards que você ainda não estudou
            </span>
          </div>
          <span
            className={`grid h-6 w-6 place-items-center rounded-md border-2 transition-all ${
              isNovosChecked
                ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25'
                : 'border-zinc-700 bg-zinc-900/50'
            }`}
          >
            {isNovosChecked && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
          </span>
        </button>

        {/* Option: A Revisar */}
        <button
          type="button"
          onClick={toggleRevisar}
          className={`flex w-full items-center justify-between p-4 rounded-xl border transition-all text-left group ${
            isRevisarChecked
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
          }`}
        >
          <div className="flex flex-col pr-2">
            <span className="text-[15px] font-bold text-zinc-100 group-hover:text-white">
              A Revisar
            </span>
            <span className="text-[12px] text-zinc-400 mt-0.5">
              Cards marcados para repetição espaçada
            </span>
          </div>
          <span
            className={`grid h-6 w-6 place-items-center rounded-md border-2 transition-all ${
              isRevisarChecked
                ? 'border-[#36AF85] bg-[#36AF85] text-white shadow-md shadow-[#36AF85]/25'
                : 'border-zinc-700 bg-zinc-900/50'
            }`}
          >
            {isRevisarChecked && <Check className="h-3.5 w-3.5 drop-shadow-md" strokeWidth={3} />}
          </span>
        </button>
      </div>

      <div className="border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 pb-safe-nav pt-4">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selecionados.length === 0}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#36AF85] hover:bg-[#2C9570] text-[15px] font-bold text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          Confirmar Status
        </button>
      </div>
    </motion.div>
  );
}
