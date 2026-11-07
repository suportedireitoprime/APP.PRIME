import React from 'react';
import { haptic } from '@/lib/nativeHaptics';
import { simplificarNomeArea } from '@/lib/videoaulasCatalogos';
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
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 overflow-x-auto no-scrollbar flex items-center gap-2 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/5 shadow-sm">
      {/* Aba Todas */}
      <button
        type="button"
        onClick={() => {
          haptic.selection();
          onSelectTab('Todos');
        }}
        className={`px-4 h-9 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-colors shadow-sm cursor-pointer ${
          activeTab === 'Todos'
            ? 'bg-rose-600 text-white shadow-rose-900/50'
            : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
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
          className={`px-3.5 h-9 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'Em Andamento'
              ? 'bg-rose-600 text-white shadow-rose-900/50'
              : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
          }`}
        >
          <span>Em Andamento</span>
          <span
            className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === 'Em Andamento'
                ? 'bg-black/30 text-white'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {emAndamentoCount}
          </span>
        </button>
      )}

      {/* Aba Lei Seca */}
      <button
        type="button"
        onClick={() => {
          haptic.selection();
          onSelectTab('Lei Seca');
        }}
        className={`px-3.5 h-9 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 ${
          activeTab === 'Lei Seca'
            ? 'bg-rose-600 text-white shadow-rose-900/50'
            : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
        }`}
      >
        <span>Lei Seca</span>
      </button>

      {/* Aba Três Poderes */}
      <button
        type="button"
        onClick={() => {
          haptic.selection();
          onSelectTab('Três Poderes');
        }}
        className={`px-3.5 h-9 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 ${
          activeTab === 'Três Poderes'
            ? 'bg-rose-600 text-white shadow-rose-900/50'
            : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
        }`}
      >
        <span>Três Poderes</span>
      </button>

      {/* Abas Individuais de Áreas */}
      {areas.map((r) => {
        const displayArea = simplificarNomeArea(r.area).replace(
          /^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i,
          ''
        );
        const isActive = activeTab === r.area;
        return (
          <button
            key={r.slug}
            type="button"
            onClick={() => {
              haptic.selection();
              onSelectTab(r.area);
            }}
            className={`px-3.5 h-9 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-rose-600 text-white shadow-rose-900/50'
                : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <span>{displayArea}</span>
            <span
              className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-black ${
                isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-white/60'
              }`}
            >
              {r.total}
            </span>
          </button>
        );
      })}
    </div>
  );
};

