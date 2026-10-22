import React from 'react';
import { motion } from 'framer-motion';
import { BookOpenText, LayoutGrid, Briefcase, Feather } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type BlogMainTab = 'artigos' | 'categorias' | 'carreiras' | 'biografia';

interface BlogNavTabsProps {
  activeTab: BlogMainTab;
  onChangeTab: (tab: BlogMainTab) => void;
}

const TABS: { id: BlogMainTab; label: string; icon: React.ElementType }[] = [
  { id: 'artigos', label: 'Artigos', icon: BookOpenText },
  { id: 'categorias', label: 'Categorias', icon: LayoutGrid },
  { id: 'carreiras', label: 'Carreiras', icon: Briefcase },
  { id: 'biografia', label: 'Biografia', icon: Feather },
];

export const BlogNavTabs: React.FC<BlogNavTabsProps> = ({ activeTab, onChangeTab }) => {
  return (
    <div className="w-full bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <nav
          role="tablist"
          aria-label="Menu principal do Blog"
          className="grid grid-cols-4 gap-1 p-1 bg-secondary/60 rounded-2xl border border-border/40"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  haptic.selection();
                  onChangeTab(tab.id);
                }}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="blog-main-tab-pill"
                    className="absolute inset-0 rounded-xl bg-card border border-border/80 shadow-xs"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative z-10 w-4 h-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.7} />
                <span className="relative z-10 truncate font-display tracking-tight text-[11px] sm:text-xs">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
export default BlogNavTabs;
