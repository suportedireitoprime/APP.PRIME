import React from 'react';
import { haptic } from '@/lib/nativeHaptics';
import type { VideoaulaAreaItem } from './VideoaulasAreaCard';

interface VideoaulasAreaChipsProps {
  areas: VideoaulaAreaItem[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  emAndamentoCount: number;
}

export const VideoaulasAreaChips: React.FC<VideoaulasAreaChipsProps> = ({
  areas,
  activeTab,
  onSelectTab,
  emAndamentoCount,
}) => {
  const totalCount = React.useMemo(
    () => areas.reduce((acc, r) => acc + (r.total || 0), 0),
    [areas]
  );

  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 overflow-x-auto no-scrollbar flex items-center gap-2 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/5 shadow-md">
      {/* Aba Todas */}
      <button
        type="button"
        onClick={() => {
          haptic.selection();
          onSelectTab('Todos');
        }}
        className={`px-4 min-h-[44px] rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all shadow-sm cursor-pointer touch-manipulation font-sans ${
          activeTab === 'Todos'
            ? 'bg-zinc-100 text-zinc-950 shadow-md font-extrabold'
            : 'bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
        }`}
      >
        Todas ({totalCount})
      </button>

      {/* Aba Em Andamento */}
      {emAndamentoCount > 0 && (
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onSelectTab('Em Andamento');
          }}
          className={`px-3.5 min-h-[44px] rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all shadow-sm cursor-pointer touch-manipulation font-sans flex items-center gap-2 ${
            activeTab === 'Em Andamento'
              ? 'bg-zinc-100 text-zinc-950 shadow-md font-extrabold'
              : 'bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>Em Andamento</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'Em Andamento'
                ? 'bg-black/20 text-zinc-950'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {emAndamentoCount}
          </span>
        </button>
      )}
    </div>
  );
};
