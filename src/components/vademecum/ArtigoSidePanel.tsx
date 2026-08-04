import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsDesktop } from '@/hooks/use-desktop';

interface ArtigoSidePanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Largura do painel no desktop */
  widthClass?: string;
}

/**
 * Painel padrão das funções do artigo.
 * Desktop: painel lateral deslizando da direita, acima das barras de funções (z 10000).
 * Mobile: bottom sheet.
 */
const ArtigoSidePanel = ({ open, onClose, title, subtitle, children, widthClass = 'w-[min(30rem,92vw)]' }: ArtigoSidePanelProps) => {
  const isDesktop = useIsDesktop();
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-artigo-menu
            className="fixed inset-0 z-[10040] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            data-artigo-menu
            initial={isDesktop ? { x: '100%' } : { y: '100%' }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className={
              isDesktop
                ? `fixed right-0 top-0 bottom-0 z-[10041] ${widthClass} flex flex-col border-l border-border bg-card shadow-2xl`
                : 'fixed bottom-0 left-0 right-0 z-[10041] mx-auto flex max-h-[92vh] max-w-lg flex-col rounded-t-3xl border-t border-border bg-card pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] shadow-2xl'
            }
          >
            {!isDesktop && (
              <div className="flex justify-center pb-1 pt-3">
                <span className="h-1 w-10 rounded-full bg-border" />
              </div>
            )}
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
                <div className="min-w-0">
                  {title && <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>}
                  {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ArtigoSidePanel;
