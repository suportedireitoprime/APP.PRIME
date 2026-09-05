import { motion, AnimatePresence } from 'framer-motion';
import { List, X } from 'lucide-react';
import type { OutlineItem } from './pdfReaderTypes';

interface PdfSumarioSheetProps {
  showSumario: boolean;
  onClose: () => void;
  totalPages: number;
  currentPage: number;
  outline: OutlineItem[];
  onSelectPage: (pagina: number) => void;
}

export default function PdfSumarioSheet({
  showSumario,
  onClose,
  totalPages,
  currentPage,
  outline,
  onSelectPage,
}: PdfSumarioSheetProps) {
  return (
    <AnimatePresence>
      {showSumario && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[1320]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-[1330] mx-auto w-full sm:max-w-lg bg-neutral-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl sm:bottom-6 flex flex-col max-h-[75dvh] shadow-2xl"
            style={{ paddingBottom: 'var(--sai-bottom)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
              <List className="w-4 h-4 text-primary" />
              <p className="flex-1 text-white text-sm font-semibold">Sumário</p>
              <button
                onClick={onClose}
                aria-label="Fechar sumário"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const input = form.elements.namedItem('page') as HTMLInputElement;
                const n = Math.max(1, Math.min(totalPages, Number(input.value) || 1));
                onSelectPage(n);
                onClose();
              }}
              className="flex gap-2 px-4 py-3 shrink-0"
            >
              <input
                name="page"
                type="number"
                min={1}
                max={totalPages}
                defaultValue={currentPage}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/10 text-white text-sm outline-none border border-white/10 focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shrink-0"
              >
                Ir p/ página
              </button>
            </form>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pb-4">
              {outline.length === 0 ? (
                <p className="text-white/50 text-xs px-3 py-6 text-center">
                  Este PDF não tem sumário embutido. Use o campo acima para ir direto a uma página (1 – {totalPages}).
                </p>
              ) : (
                outline.map((it, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSelectPage(it.pagina);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 text-left px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition"
                    style={{ paddingLeft: 12 + it.nivel * 14 }}
                  >
                    <span className="flex-1 min-w-0 text-white text-sm truncate">{it.titulo}</span>
                    <span className="text-white/45 text-xs tabular-nums shrink-0">{it.pagina}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
