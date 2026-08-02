import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface NovoLembreteMenuProps {
  open: boolean;
  onClose: () => void;
  onHorario: () => void;
  onLocal: () => void;
}

export default function NovoLembreteMenu({ open, onClose, onHorario, onLocal }: NovoLembreteMenuProps) {
  useEscapeKey(open, onClose);

  const handleHorario = () => {
    onClose();
    onHorario();
  };

  const handleLocal = () => {
    onClose();
    onLocal();
  };

  const menu = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1400] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[1401] mx-auto w-full md:max-w-[640px] bg-card border-t border-border md:border-x rounded-t-3xl flex flex-col overflow-hidden"
          >
            <div className="pt-2 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-3 right-4 w-9 h-9 rounded-full bg-secondary/80 flex items-center justify-center"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="px-4 pt-2 pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
              <h2 className="font-display text-foreground text-lg font-semibold text-center mb-1">
                Novo lembrete
              </h2>
              <p className="text-center text-muted-foreground text-xs font-body mb-5">
                Escolha o tipo de lembrete que você quer criar.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleHorario}
                  className="w-full text-left p-4 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm text-foreground">
                        Por horário
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        “Quero ser lembrado(a) de estudar às 20h.”
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleLocal}
                  className="w-full text-left p-4 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm text-foreground">
                        Por local
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        “Quero ser lembrado(a) quando chegar perto de um lugar.”
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full mt-4 py-3 rounded-xl font-body font-semibold text-sm text-foreground bg-secondary hover:bg-secondary/80 transition"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(menu, document.body);
}
