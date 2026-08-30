import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, LayoutGrid, TrendingUp, Newspaper, Plus, BarChart3, Trophy, X, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

type Tab = {
  id: string;
  label: string;
  to?: string;
  icon: typeof Radar;
  match: (path: string) => boolean;
  isAction?: boolean;
};

const TABS: Tab[] = [
  {
    id: 'radares',
    label: 'Radares',
    to: '/radares',
    icon: Radar,
    match: (p) => p === '/radares',
  },
  {
    id: 'categorias',
    label: 'Categorias',
    to: '/radar/categorias',
    icon: LayoutGrid,
    match: (p) => p.startsWith('/radar/categorias'),
  },
  {
    id: 'em-alta',
    label: 'Em alta',
    to: '/radar/em-alta',
    icon: TrendingUp,
    match: (p) => p.startsWith('/radar/em-alta'),
  },
  {
    id: 'boletins',
    label: 'Boletins',
    to: '/boletins',
    icon: Newspaper,
    match: (p) => p.startsWith('/boletins'),
  },
  {
    id: 'mais',
    label: 'Mais',
    icon: Plus,
    match: () => false,
    isAction: true,
  },
];

const RadarBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <motion.nav
        aria-label="Navegação do Radar"
        initial={false}
        animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50  md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
      >
        <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[calc(0.5rem+var(--sai-bottom))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
          <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
            {TABS.map((tab) => {
              const active = tab.match(pathname);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic.selection();
                    if (tab.isAction) {
                      setShowMore(true);
                    } else if (!active && tab.to) {
                      navigate(tab.to);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-1 rounded-2xl transition-colors ${
                    active ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                  }`}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="radar-nav-active-pill"
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

      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-card border-t border-border rounded-t-3xl pb-[calc(1.5rem+var(--sai-bottom))] px-5 pt-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-[19px] font-display font-bold text-foreground">Mais Opções</h3>
                <button
                  onClick={() => setShowMore(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { haptic.selection(); setShowMore(false); }}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-secondary/60 border border-border/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[15px] text-foreground">Estatísticas</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">Em breve na API</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                </button>

                <button 
                  onClick={() => { haptic.selection(); setShowMore(false); navigate('/radar/em-alta'); }}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-secondary/60 border border-border/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[15px] text-foreground">Ranking de Deputados</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">Veja quem mais propõe leis</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default RadarBottomNav;
