import React, { memo } from 'react';
import { Bookmark, Flame, Clock, ListMusic } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type VideoaulasHeroTab = 'todos' | 'favoritos' | 'emalta' | 'recentes' | 'playlist';

interface Props {
  activeTab: VideoaulasHeroTab;
  onSelectTab: (tab: VideoaulasHeroTab) => void;
  favoritosCount?: number;
}

const SHORTCUTS = [
  { id: 'favoritos' as const, label: 'Favoritos', icon: Bookmark },
  { id: 'emalta' as const,    label: 'Em Alta',   icon: Flame },
  { id: 'recentes' as const,  label: 'Recentes',  icon: Clock },
  { id: 'playlist' as const,  label: 'Playlist',  icon: ListMusic },
];

export const VideoaulasActionShortcuts: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  favoritosCount = 0,
}) => {
  return (
    <div 
      className="flex items-center justify-between gap-1.5 p-1 rounded-2xl bg-zinc-900/85 backdrop-blur-md border border-white/10 shadow-lg touch-pan-y"
      style={{ touchAction: 'pan-y' }}
    >
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
            style={{ touchAction: 'pan-y' }}
            className={`flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 active:scale-95 gap-1 text-center select-none cursor-pointer touch-pan-y ${
              isActive
                ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            {item.id === 'favoritos' && favoritosCount > 0 && (
              <span className="absolute top-1 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold leading-none flex items-center justify-center border border-white/20 shadow z-10">
                {favoritosCount > 99 ? '99+' : favoritosCount}
              </span>
            )}

            <Icon
              className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isActive ? 'text-white drop-shadow-sm' : 'text-zinc-400 group-hover:text-zinc-200'
              }`}
              strokeWidth={1.9}
            />
            <span
              className={`text-[11.5px] sm:text-xs font-medium tracking-tight whitespace-nowrap transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-zinc-400 group-hover:text-zinc-200'
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

export default memo(VideoaulasActionShortcuts);
