import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Menu, X, ChevronRight, Gavel, Landmark, PocketKnife, Map, ScrollText } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

type Tab = {
  id: string;
  label: string;
  to?: string;
  icon: typeof Scale;
  match: (path: string) => boolean;
  isMais?: boolean;
};

const TABS: Tab[] = [
  {
    id: 'leis',
    label: 'Vade Mecum',
    to: '/vade-mecum',
    icon: Scale,
    match: (p) => p === '/vade-mecum',
  },
  {
    id: 'codigos',
    label: 'Códigos',
    to: '/vade-mecum/codigos',
    icon: Gavel,
    match: (p) => p.startsWith('/vade-mecum/codigos'),
  },
  {
    id: 'estatutos',
    label: 'Estatutos',
    to: '/vade-mecum/estatutos',
    icon: Landmark,
    match: (p) => p.startsWith('/vade-mecum/estatutos'),
  },
  {
    id: 'jurisprudencia',
    label: 'Jurisprudência',
    to: '/jurisprudencia',
    icon: ScrollText,
    match: (p) => p.startsWith('/jurisprudencia') || p.startsWith('/vade-mecum/sumulas'),
  },
  {
    id: 'mais',
    label: 'Mais',
    icon: Menu,
    match: () => false,
    isMais: true,
  },
];

const MAIS_MENU = [
  { id: 'especiais', label: 'Legislação Especial', to: '/vade-mecum/especiais', icon: PocketKnife, desc: 'Leis penais extravagantes e especiais', color: '#F97316' },
  { id: 'estadual', label: 'Legislação Estadual', to: '/legislacao-estadual', icon: Map, desc: 'Normas das 27 unidades federativas', color: '#38BDF8' },
];

import { useKeyboardHeight } from '@/hooks/useKeyboardListeners';

const VadeMecumBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [maisOpen, setMaisOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const keyboardHeight = useKeyboardHeight();
  const actuallyHidden = hidden || keyboardHeight > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const navContent = (
    <>
      <motion.nav
        aria-label="Navegação Vade Mecum"
        initial={false}
        animate={actuallyHidden ? { y: 120, opacity: 0, pointerEvents: 'none' as const } : { y: 0, opacity: 1, pointerEvents: 'auto' as const }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
      >
        <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[calc(0.5rem+var(--sai-bottom))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
          <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
            {TABS.map((tab) => {
              const active = tab.match(pathname) || (tab.isMais && maisOpen);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic.selection();
                    if (tab.isMais) {
                      setMaisOpen(!maisOpen);
                    } else if (tab.to && !active) {
                      setMaisOpen(false);
                      navigate(tab.to);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-1 rounded-2xl transition-colors ${
                    active ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                  }`}
                  aria-label={tab.label}
                  aria-current={active && !tab.isMais ? 'page' : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="vademecum-nav-active-pill"
                      className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      aria-hidden="true"
                    />
                  )}

                  <Icon className="relative w-7 h-7 sm:w-8 sm:h-8" strokeWidth={active ? 1.9 : 1.5} />
                  <span
                    className={`relative text-[10px] sm:text-[11px] leading-none ${
                      active ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>

      {/* Sheet do menu "Mais" */}
      <AnimatePresence>
        {maisOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMaisOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] "
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-background border-t border-border rounded-t-3xl pb-[calc(2.5rem+var(--sai-bottom))] pt-6 px-4 shadow-2xl max-h-[85vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-foreground">Mais Opções</h2>
                <button
                  onClick={() => setMaisOpen(false)}
                  className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {MAIS_MENU.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        haptic.selection();
                        setMaisOpen(false);
                        navigate(item.to);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 hover:bg-secondary/80 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <Icon className="w-7 h-7" style={{ color: item.color }} strokeWidth={1.5} />
                        <div className="text-left">
                          <h3 className="font-display font-bold text-[16px] text-foreground">{item.label}</h3>
                          <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(navContent, document.body);
};

export default VadeMecumBottomNav;
