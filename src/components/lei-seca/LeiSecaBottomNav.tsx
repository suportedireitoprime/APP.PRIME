import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Heart, History, BellRing } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

const TABS = [
  { id: 'trilhas', label: 'Leis', to: '/lei-seca', icon: Scale, match: (p: string) => p === '/lei-seca' },
  { id: 'favoritos', label: 'Favoritos', to: '/lei-seca/favoritos', icon: Heart, match: (p: string) => p.startsWith('/lei-seca/favoritos') },
  { id: 'recentes', label: 'Recentes', to: '/lei-seca/recentes', icon: History, match: (p: string) => p.startsWith('/lei-seca/recentes') },
  { id: 'lembretes', label: 'Lembretes', to: '/lei-seca/lembretes', icon: BellRing, match: (p: string) => p.startsWith('/lei-seca/lembretes') },
];

const LeiSecaBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <motion.nav
      aria-label="Navegação Lei Seca"
      initial={false}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto pointer-events-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[calc(0.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-4 items-end px-1 pt-2.5 pb-2.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic.selection();
                  if (!active) navigate(tab.to);
                }}
                className={`relative flex flex-col items-center justify-center gap-1 min-h-[48px] py-1.5 px-1 rounded-2xl touch-manipulation active:scale-95 transition-all ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="lei-seca-nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-primary/15 ring-1 ring-primary/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative w-6 h-6 sm:w-7 sm:h-7" strokeWidth={active ? 2.2 : 1.6} />
                <span className={`relative text-[10px] sm:text-[11px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default LeiSecaBottomNav;
