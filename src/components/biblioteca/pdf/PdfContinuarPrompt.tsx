import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface PdfContinuarPromptProps {
  page: number | null;
  onDismiss: () => void;
  onContinue: (page: number) => void;
}

export default function PdfContinuarPrompt({
  page,
  onDismiss,
  onContinue,
}: PdfContinuarPromptProps) {
  return (
    <AnimatePresence>
      {page != null && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-16 inset-x-4 mx-auto sm:left-1/2 sm:-translate-x-1/2 z-[1400] max-w-sm w-[calc(100%-2rem)] bg-neutral-950/95 border border-rose-500/40 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Continuar de onde parou?
              </p>
              <p className="text-xs text-neutral-300 mt-1">
                Sua última leitura foi na <strong className="text-white">página {page}</strong>.
              </p>
            </div>
            <button
              onClick={onDismiss}
              aria-label="Fechar aviso"
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onContinue(page)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition"
            >
              Ir para pág. {page}
            </button>
            <button
              onClick={() => onContinue(1)}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-semibold active:scale-95 transition"
            >
              Pág. 1
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
