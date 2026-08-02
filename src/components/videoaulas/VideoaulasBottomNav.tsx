import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, PlayCircle, Route, Star, Trophy } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

type Tab = {
  id: string;
  label: string;
  to: string;
  icon: typeof PlayCircle;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    id: 'aulas',
    label: 'Aulas',
    to: '/videoaulas',
    icon: PlayCircle,
    match: (p) =>
      p === '/videoaulas' ||
      (p.startsWith('/videoaulas/') &&
        !/^\/videoaulas\/(trilhas|categorias|favoritos|conquistas)/.test(p)),
  },
  {
    id: 'trilhas',
    label: 'Trilhas',
    to: '/videoaulas/trilhas',
    icon: Route,
    match: (p) => p.startsWith('/videoaulas/trilhas'),
  },
  {
    id: 'categorias',
    label: 'Categorias',
    to: '/videoaulas/categorias',
    icon: LayoutGrid,
    match: (p) => p.startsWith('/videoaulas/categorias'),
  },
  {
    id: 'favoritos',
    label: 'Favoritos',
    to: '/videoaulas/favoritos',
    icon: Star,
    match: (p) => p.startsWith('/videoaulas/favoritos'),
  },
  {
    id: 'conquistas',
    label: 'Conquistas',
    to: '/videoaulas/conquistas',
    icon: Trophy,
    match: (p) => p.startsWith('/videoaulas/conquistas'),
  },
];

const VideoaulasBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Navegação Videoaulas"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
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
                    layoutId="videoaulas-nav-active-pill"
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
    </nav>
  );
};

export default VideoaulasBottomNav;
