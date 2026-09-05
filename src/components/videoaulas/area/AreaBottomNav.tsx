import { motion } from 'framer-motion';
import { Video, Route as RouteIcon, Star, History, BookOpenText } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type AreaTab = 'videos' | 'trilhas' | 'favoritos' | 'recentes' | 'anotacoes';

const MENU = [
  { id: 'videos', label: 'Vídeos', icon: Video },
  { id: 'trilhas', label: 'Trilhas', icon: RouteIcon },
  { id: 'favoritos', label: 'Favoritos', icon: Star },
  { id: 'recentes', label: 'Recentes', icon: History },
  { id: 'anotacoes', label: 'Anotações', icon: BookOpenText },
] as const;

interface AreaBottomNavProps {
  currentTab: AreaTab;
  onSelectTab: (tab: AreaTab) => void;
}

export const AreaBottomNav = ({ currentTab, onSelectTab }: AreaBottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-safe">
      <div className="flex h-16 max-w-md mx-auto relative px-1">
        {MENU.map(({ id, label, icon: Icon }) => {
          const ativo = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                if (!ativo) haptic.selection();
                onSelectTab(id as AreaTab);
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative z-10"
            >
              <motion.div
                animate={{ y: ativo ? -2 : 0, scale: ativo ? 1.1 : 1 }}
                className={`relative p-1.5 rounded-full transition-colors ${ativo ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={ativo ? 2.5 : 2} />
              </motion.div>
              <span className={`text-[10px] font-semibold transition-colors ${ativo ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
