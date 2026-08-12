import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Radar, BellRing, Heart, Newspaper } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

type Tab = {
  id: string;
  label: string;
  to: string;
  icon: typeof Scale;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    id: 'leis',
    label: 'Leis',
    to: '/vade-mecum',
    icon: Scale,
    match: (p) => p === '/vade-mecum',
  },
  {
    id: 'favoritos',
    label: 'Favoritos',
    to: '/vade-mecum/favoritos',
    icon: Heart,
    match: (p) => p.startsWith('/vade-mecum/favoritos'),
  },
  {
    id: 'boletins',
    label: 'Boletins',
    to: '/boletins',
    icon: Newspaper,
    match: (p) => p.startsWith('/boletins'),
  },
  {
    id: 'radar',
    label: 'Radares',
    to: '/radares',
    icon: Radar,
    match: (p) => p.startsWith('/radares'),
  },
  {
    id: 'lembretes',
    label: 'Lembretes',
    to: '/meus-lembretes',
    icon: BellRing,
    match: (p) => p.startsWith('/meus-lembretes'),
  },
];

const VadeMecumBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <motion.nav
      aria-label="Navegação Vade Mecum"
      initial={false}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[calc(0.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
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
                className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-1 rounded-2xl transition-colors ${
                  active ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                }`}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
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
  );
};

export default VadeMecumBottomNav;
