import { motion } from 'framer-motion';
import { BookOpenText, LayoutGrid, Briefcase, Heart, Feather } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type BloggerTab = 'blogger' | 'categorias' | 'carreiras' | 'biografia' | 'favoritos';

const TABS: { id: BloggerTab; label: string; icon: any }[] = [
  { id: 'blogger', label: 'Blogger', icon: BookOpenText },
  { id: 'categorias', label: 'Categorias', icon: LayoutGrid },
  { id: 'carreiras', label: 'Carreiras', icon: Briefcase },
  { id: 'biografia', label: 'Biografia', icon: Feather },
  { id: 'favoritos', label: 'Favoritos', icon: Heart },
];

interface Props {
  active: BloggerTab;
  onChange: (id: BloggerTab) => void;
  hidden?: boolean;
}

const BloggerBottomNav = ({ active, onChange, hidden = false }: Props) => {
  return (
    <motion.nav
      aria-label="Navegação Blogger Jurídico"
      initial={false}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic.selection();
                  onChange(tab.id); // Sempre emite o evento para possibilitar cliques que abrem modais
                }}
                className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-1 rounded-2xl transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                }`}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="blogger-nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative w-6 h-6 sm:w-7 sm:h-7" strokeWidth={isActive ? 2 : 1.5} />
                <span
                  className={`relative text-[10px] sm:text-[11px] leading-none ${
                    isActive ? 'font-bold' : 'font-medium'
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

export default BloggerBottomNav;
