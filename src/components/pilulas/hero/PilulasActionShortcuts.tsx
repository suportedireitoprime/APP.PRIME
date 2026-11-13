import React, { memo } from 'react';
import { Bookmark, Flame, Clock, ListMusic } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type PilulasHeroTab = 'todos' | 'favoritos' | 'emalta' | 'recentes' | 'playlist';

interface Props {
  activeTab: PilulasHeroTab;
  onSelectTab: (tab: PilulasHeroTab) => void;
  favoritosCount?: number;
}

const SHORTCUTS = [
  { id: 'favoritos' as const, label: 'Favoritos', icon: Bookmark, color: '#F59E0B' },
  { id: 'emalta' as const,    label: 'Em Alta',   icon: Flame,    color: '#FB923C' },
  { id: 'recentes' as const,  label: 'Recentes',  icon: Clock,    color: '#38BDF8' },
  { id: 'playlist' as const,  label: 'Playlist',  icon: ListMusic, color: '#A855F7' },
];

export const PilulasActionShortcuts: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  favoritosCount = 0,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 mx-1 mt-1 bg-black/45 backdrop-blur-md border border-white/10 rounded-3xl p-2 shadow-2xl">
      {SHORTCUTS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              haptic.selection();
              onSelectTab(isActive ? 'todos' : item.id);
            }}
            className={`flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden ${
              isActive
                ? 'bg-amber-500/20 border border-amber-500/40 shadow-inner'
                : 'hover:bg-white/5 active:bg-white/10 border border-transparent'
            }`}
          >
            {item.id === 'favoritos' && favoritosCount > 0 && (
              <span className="absolute top-1 right-2 min-w-[17px] h-[16px] px-1 rounded-full bg-amber-500 text-black text-[9.5px] font-bold leading-none flex items-center justify-center border border-white/20 shadow z-10">
                {favoritosCount > 99 ? '99+' : favoritosCount}
              </span>
            )}

            <Icon
              className="w-[22px] h-[22px] shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{
                color: item.color,
                filter: isActive
                  ? `drop-shadow(0 0 8px ${item.color})`
                  : 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              }}
            />
            <span
              className={`text-[10.5px] sm:text-[11px] font-medium tracking-tight whitespace-nowrap drop-shadow-sm transition-colors ${
                isActive ? 'text-amber-300 font-bold' : 'text-white/85 group-hover:text-white'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(PilulasActionShortcuts);
