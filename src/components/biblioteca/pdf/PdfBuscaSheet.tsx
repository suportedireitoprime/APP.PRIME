import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, X } from 'lucide-react';
import type { Match } from './pdfReaderTypes';

interface PdfBuscaSheetProps {
  showBusca: boolean;
  onClose: () => void;
  totalPages: number;
  termo: string;
  setTermo: (t: string) => void;
  buscando: boolean;
  matches: Match[] | null;
  onBuscar: (termo: string) => void;
  onSelectMatch: (pagina: number) => void;
}

export default function PdfBuscaSheet({
  showBusca,
  onClose,
  totalPages,
  termo,
  setTermo,
  buscando,
  matches,
  onBuscar,
  onSelectMatch,
}: PdfBuscaSheetProps) {
  return (
    <AnimatePresence>
      {showBusca && (
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onBuscar(termo);
              }}
              className="flex items-center gap-2 px-4 py-3 border-b border-white/10 shrink-0"
            >
              <Search className="w-4 h-4 text-white/60 shrink-0" />
              <input
                autoFocus
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Procurar palavra no livro…"
                className="flex-1 min-w-0 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                disabled={buscando || termo.trim().length < 2}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0 disabled:opacity-40"
              >
                {buscando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar busca"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </form>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2">
              {buscando && (
                <p className="text-white/60 text-xs px-3 py-6 text-center">
                  Procurando nas {totalPages} páginas…
                </p>
              )}
              {!buscando && matches?.length === 0 && (
                <p className="text-white/50 text-xs px-3 py-6 text-center">
                  Nenhuma ocorrência encontrada.
                </p>
              )}
              {!buscando &&
                matches?.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSelectMatch(m.pagina);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition"
                  >
                    <p className="text-primary text-[11px] font-semibold mb-0.5">Página {m.pagina}</p>
                    <p className="text-white/75 text-xs line-clamp-2">…{m.trecho}…</p>
                  </button>
                ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
