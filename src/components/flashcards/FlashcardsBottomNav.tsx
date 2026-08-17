import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, FolderPlus, RotateCcw, Route as RouteIcon, Trophy, Briefcase, BarChart3, Target, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

const TABS = [
  { id: 'categorias', label: 'Categorias', to: '/flashcards', icon: LayoutGrid, match: (p: string) => p === '/flashcards' },
  { id: 'trilhas', label: 'Trilhas', to: '/flashcards/trilhas', icon: RouteIcon, match: (p: string) => p.startsWith('/flashcards/trilhas') },
  { id: 'cargos', label: 'Cargos', to: '/flashcards/cargos', icon: Briefcase, match: (p: string) => p.startsWith('/flashcards/cargos') },
  { id: 'personalizado', label: 'Personalizado', to: '/flashcards/personalizado', icon: Sparkles, match: (p: string) => p.startsWith('/flashcards/personalizado') },
  { id: 'desafios', label: 'Desafios', to: '/flashcards/desafios', icon: Target, match: (p: string) => p.startsWith('/flashcards/desafios') },
];


const FlashcardsBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <motion.nav
      aria-label="Navegação Flashcards"
      initial={false}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[calc(0.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
          {TABS.map((t) => {
            const active = t.match(pathname);
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { haptic.selection(); if (!active) navigate(t.to); }}
                aria-label={t.label}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-1 rounded-2xl transition-colors ${
                  active ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="flashcards-nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative w-6 h-6 sm:w-7 sm:h-7" strokeWidth={active ? 1.9 : 1.5} />
                <span className={`relative text-[10px] sm:text-[11px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default FlashcardsBottomNav;
