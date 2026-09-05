import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Layers, ChevronRight, X } from 'lucide-react';

interface ArtigoPraticarModalProps {
  showPraticarSheet: boolean;
  setShowPraticarSheet: (v: boolean) => void;
  artigoNumero?: string | number;
  tabelaNome?: string;
  isPremium: boolean;
  openPremiumGate: (feature: any) => void;
  isDesktop: boolean;
  setShowQuestoesPanel: (v: boolean) => void;
  navigate: (path: string) => void;
}

export const ArtigoPraticarModal = memo(function ArtigoPraticarModal({
  showPraticarSheet,
  setShowPraticarSheet,
  artigoNumero,
  tabelaNome,
  isPremium,
  openPremiumGate,
  isDesktop,
  setShowQuestoesPanel,
  navigate,
}: ArtigoPraticarModalProps) {
  return (
    <AnimatePresence>
      {showPraticarSheet && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[10040]"
            onClick={() => setShowPraticarSheet(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[10041] bg-card rounded-t-3xl border-t border-border pb-safe h-[85vh] max-h-[85vh] overflow-y-auto mx-auto max-w-lg flex flex-col md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-none md:w-[min(30rem,92vw)] md:max-w-none md:rounded-none md:rounded-l-3xl md:border-l md:border-t-0 md:shadow-2xl md:mx-0"
          >
            <div className="pt-3 pb-2 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-heading text-base font-semibold text-foreground">Praticar</h3>
              </div>
              <button
                onClick={() => setShowPraticarSheet(false)}
                className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="px-5 pt-3 text-[12.5px] text-foreground/60">
              Art. {artigoNumero} — Escolha o modo de estudo
            </p>
            <div className="flex-1 py-2">
              {[
                {
                  icon: Target,
                  label: 'Questões',
                  desc: 'Múltipla escolha com comentários e exemplos',
                  color: '#DC2626',
                  onClick: () => {
                    setShowPraticarSheet(false);
                    if (!isPremium) {
                      openPremiumGate('questoes');
                      return;
                    }
                    if (isDesktop) {
                      setShowQuestoesPanel(true);
                    } else {
                      navigate(
                        `/estudos?mode=questoes&tabela=${tabelaNome}&artigo=${artigoNumero}`
                      );
                    }
                  },
                },
                {
                  icon: Layers,
                  label: 'Flashcards',
                  desc: 'Cards com flip animado e exemplos práticos',
                  color: '#DC2626',
                  onClick: () => {
                    setShowPraticarSheet(false);
                    if (!isPremium) {
                      openPremiumGate('flashcards');
                      return;
                    }
                    navigate(
                      `/estudos?mode=flashcards&tabela=${tabelaNome}&artigo=${artigoNumero}`
                    );
                  },
                },
              ].map((item, i, arr) => {
                const Icon = item.icon;
                return (
                  <div key={i}>
                    <button
                      onClick={item.onClick}
                      className="w-full flex items-center gap-4 px-5 py-5 transition-colors text-left hover:bg-secondary/60"
                    >
                      <span
                        className="w-11 h-11 flex items-center justify-center shrink-0"
                        style={{ color: item.color }}
                      >
                        <Icon className="w-[26px] h-[26px]" strokeWidth={2} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15.5px] font-medium text-foreground truncate">
                          {item.label}
                        </span>
                        <span className="block text-[12.5px] text-foreground/60 truncate mt-0.5">
                          {item.desc}
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-foreground/40 shrink-0" />
                    </button>
                    {i < arr.length - 1 && <div className="mx-5 h-px bg-border/60" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
