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
  { id: 'favoritos' as const, label: 'Favoritos', icon: Bookmark, color: '#FF4D6D' },
  { id: 'emalta' as const,    label: 'Em Alta',   icon: Flame,    color: '#FF4D6D' },
  { id: 'recentes' as const,  label: 'Recentes',  icon: Clock,    color: '#FF4D6D' },
  { id: 'playlist' as const,  label: 'Playlist',  icon: ListMusic, color: '#FF4D6D' },
];

export const VideoaulasActionShortcuts: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  favoritosCount = 0,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 mx-1 mt-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-3xl p-2 shadow-2xl">
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
                ? 'bg-rose-500/20 border border-rose-500/40 shadow-[0_0_16px_rgba(244,63,94,0.3)]'
                : 'hover:bg-white/5 active:bg-white/10 border border-transparent'
            }`}
          >
            {item.id === 'favoritos' && favoritosCount > 0 && (
              <span className="absolute top-1 right-2 min-w-[17px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9.5px] font-bold leading-none flex items-center justify-center border border-white/30 shadow-[0_0_8px_rgba(239,68,68,0.7)] z-10">
                {favoritosCount > 99 ? '99+' : favoritosCount}
              </span>
            )}

            <Icon
              className="w-[22px] h-[22px] shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{
                color: item.color,
                filter: isActive
                  ? `drop-shadow(0 0 10px rgba(255, 77, 109, 0.85))`
                  : 'saturate(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
              }}
            />
            <span
              className={`text-[10.5px] sm:text-[11px] font-medium tracking-tight whitespace-nowrap drop-shadow-sm transition-colors ${
                isActive ? 'text-rose-300 font-bold' : 'text-white/85 group-hover:text-white'
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
