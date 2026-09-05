import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SeletorOverlayProps<T extends string> {
  titulo: string;
  opcoes: Array<{ id: T; label: string; desc: string; icon: any }>;
  onClose: () => void;
  onPick: (id: T) => void;
}

export function SeletorOverlay<T extends string>({
  titulo,
  opcoes,
  onClose,
  onPick,
}: SeletorOverlayProps<T>) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 sm:left-auto sm:right-0 sm:w-[min(30rem,92vw)] z-[81] flex flex-col bg-background shadow-2xl pb-[calc(1.25rem+var(--sai-bottom))] pt-[calc(1rem+var(--sai-top))]"
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-card/95 backdrop-blur border-b border-border shrink-0">
          <button
            onClick={onClose}
            aria-label="Voltar"
            className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <p className="text-sm uppercase tracking-[0.1em] text-primary font-bold flex-1 text-center pr-10">
            {titulo}
          </p>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {opcoes.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => onPick(opt.id)}
                className="text-left rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors p-3.5 flex items-center gap-3"
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary grid place-items-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                  <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{opt.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
