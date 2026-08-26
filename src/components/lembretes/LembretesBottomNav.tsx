import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BellRing, BookOpen, Video, NotebookText, ListChecks, LayoutGrid } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

type Tab = {
  id: string;
  label: string;
  to: string;
  icon: typeof BellRing;
  match: (path: string) => boolean;
  color: string;
  bg: string;
};

const TABS: Tab[] = [
  { id: 'tudo', label: 'Tudo', to: '/lembretes', icon: LayoutGrid, match: (p) => p === '/lembretes', color: 'text-zinc-200', bg: 'bg-zinc-800/50' },
  {
    id: 'meus',
    label: 'Meus',
    to: '/lembretes/meus',
    icon: BellRing,
    match: (p) => p.startsWith('/lembretes/meus'),
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15'
  },
  {
    id: 'leitura',
    label: 'Leitura',
    to: '/lembretes/leitura',
    icon: BookOpen,
    match: (p) => p.startsWith('/lembretes/leitura'),
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15'
  },
  {
    id: 'videoaulas',
    label: 'Videoaulas',
    to: '/lembretes/videoaulas',
    icon: Video,
    match: (p) => p.startsWith('/lembretes/videoaulas'),
    color: 'text-orange-400',
    bg: 'bg-orange-500/15'
  },
  {
    id: 'resumos',
    label: 'Resumos',
    to: '/lembretes/resumos',
    icon: NotebookText,
    match: (p) => p.startsWith('/lembretes/resumos'),
    color: 'text-sky-400',
    bg: 'bg-sky-500/15'
  },
];

const LembretesBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <motion.nav
      aria-label="Navegação Lembretes"
      initial={false}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3 pb-3 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
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
                className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-0.5 rounded-2xl transition-colors ${
                  active ? tab.color : 'text-zinc-500'
                }`}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="lembretes-nav-active-pill"
                    className={`absolute inset-0 rounded-2xl ${tab.bg} ring-1 ring-white/5`}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative w-6 h-6" strokeWidth={active ? 1.9 : 1.5} />
                <span
                  className={`relative text-[9.5px] leading-none ${active ? 'font-bold' : 'font-medium'}`}
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

export default LembretesBottomNav;
