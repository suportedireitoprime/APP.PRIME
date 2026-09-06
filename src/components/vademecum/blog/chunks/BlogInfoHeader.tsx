import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';

interface BlogInfoHeaderProps {
  infoOpen: boolean;
  onToggleInfo: () => void;
  onBack: () => void;
}

export const BlogInfoHeader: React.FC<BlogInfoHeaderProps> = ({
  infoOpen,
  onToggleInfo,
  onBack,
}) => {
  return (
    <>
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            title="Blogger Jurídico"
            subtitle="Artigos, curiosidades e filosofia do Direito"
            onBack={onBack}
            rightAction={
              <button
                onClick={onToggleInfo}
                aria-expanded={infoOpen}
                aria-label="Sobre esta seção"
                className={`w-11 h-11 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors ${
                  infoOpen
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <Info className="w-4 h-4" />
              </button>
            }
          />
        </div>
      </header>

      <AnimatePresence initial={false}>
        {infoOpen && (
          <motion.div
            key="info-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="overflow-hidden max-w-3xl mx-auto px-4"
          >
            <div className="mt-1 mb-2 rounded-2xl border border-primary/30 bg-card/60 backdrop-blur-sm p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-display text-sm font-bold text-foreground">O que é o Blogger?</h3>
              </div>
              <p className="font-body text-[12.5px] leading-relaxed text-muted-foreground">
                Uma curadoria de <strong className="text-foreground">artigos autorais</strong> sobre
                filosofia do Direito, decisões marcantes do STF e curiosidades que caem em prova.
                Toque no tema para filtrar.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
