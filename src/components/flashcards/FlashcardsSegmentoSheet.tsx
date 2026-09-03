import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Filter, X, BookOpen, Scale, Gavel, FileText } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export function FlashcardsSegmentoSheet({
  aberto,
  onFechar,
  onSelecionar
}: {
  aberto: boolean;
  onFechar: () => void;
  onSelecionar: (segmento: 'materias' | 'leis' | 'jurisprudencia') => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
            className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[81] flex flex-col rounded-t-3xl border-t border-zinc-800/80 bg-zinc-950 pb-safe-nav md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:rounded-none md:border-l"
          >
            <div className="flex items-center gap-3 px-4 pb-4 pt-safe-header border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md">
              <div className="min-w-0 flex-1 pl-2">
                <p className="flex items-center gap-2 text-[20px] font-extrabold text-zinc-100 tracking-tight">
                  <Filter className="h-5 w-5 text-[#36AF85]" /> Filtro Rápido
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-zinc-400 truncate">
                  O que você deseja praticar agora?
                </p>
              </div>
              <button
                onClick={onFechar}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 transition-colors active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 p-5 overflow-y-auto">
              <button
                onClick={() => { haptic.selection(); onSelecionar('materias'); }}
                className="group flex w-full flex-col gap-1 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 text-left hover:border-[#36AF85]/50 hover:bg-zinc-800/90 active:scale-[0.98] transition-all focus-visible:outline-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 group-hover:bg-[#36AF85]/10 text-zinc-400 group-hover:text-[#36AF85] transition-colors">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <span className="text-[17px] font-bold text-zinc-100">Matérias e Assuntos</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </div>
                <p className="pl-[52px] text-[13px] text-zinc-400 leading-snug">
                  Pratique por disciplina do Direito e escolha os temas específicos para revisar.
                </p>
              </button>

              <button
                onClick={() => { haptic.selection(); onSelecionar('leis'); }}
                className="group flex w-full flex-col gap-1 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 text-left hover:border-[#36AF85]/50 hover:bg-zinc-800/90 active:scale-[0.98] transition-all focus-visible:outline-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 group-hover:bg-[#36AF85]/10 text-zinc-400 group-hover:text-[#36AF85] transition-colors">
                      <Scale className="h-5 w-5" />
                    </div>
                    <span className="text-[17px] font-bold text-zinc-100">Leis e Códigos</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </div>
                <p className="pl-[52px] text-[13px] text-zinc-400 leading-snug">
                  Selecione a área, escolha a lei seca e filtre os artigos que deseja revisar.
                </p>
              </button>

              <button
                onClick={() => { haptic.selection(); onSelecionar('jurisprudencia'); }}
                className="group flex w-full flex-col gap-1 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 text-left hover:border-[#36AF85]/50 hover:bg-zinc-800/90 active:scale-[0.98] transition-all focus-visible:outline-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 group-hover:bg-[#36AF85]/10 text-zinc-400 group-hover:text-[#36AF85] transition-colors">
                      <Gavel className="h-5 w-5" />
                    </div>
                    <span className="text-[17px] font-bold text-zinc-100">Jurisprudência</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </div>
                <p className="pl-[52px] text-[13px] text-zinc-400 leading-snug">
                  Filtre por Súmulas, Informativos e Teses dos Tribunais Superiores.
                </p>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
