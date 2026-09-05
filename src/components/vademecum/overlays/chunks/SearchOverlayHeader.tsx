import { RefObject } from 'react';
import { Search, Loader2, Mic, MicOff, ChevronDown } from 'lucide-react';
import { track } from '@/lib/analyticsEvents';
import { UnifiedTab, UNIFIED_TABS, TAB_LABELS } from './searchUtils';

interface SearchOverlayHeaderProps {
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement>;
  query: string;
  setQuery: (q: string) => void;
  debouncedQuery: string;
  placeholder: string;
  voice: {
    listening: boolean;
    partial: string;
    toggle: () => void;
  };
  activeTab: UnifiedTab;
  setActiveTab: (t: UnifiedTab) => void;
}

export const SearchOverlayHeader = ({
  onClose,
  inputRef,
  query,
  setQuery,
  debouncedQuery,
  placeholder,
  voice,
  activeTab,
  setActiveTab,
}: SearchOverlayHeaderProps) => {
  return (
    <div className="bg-hero-panel px-4 pb-4 pt-[calc(0.5rem+var(--sai-top))] shrink-0 shadow-md">
      <div className="flex items-center justify-center pb-2">
        <div className="w-10 h-1 rounded-full bg-white/30" />
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={onClose}
          aria-label="Fechar busca"
          className="w-11 h-11 rounded-full bg-black/40 border border-white/20 flex items-center justify-center active:scale-95 transition shrink-0"
        >
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
          <input
            ref={inputRef}
            autoFocus
            value={voice.listening && voice.partial ? voice.partial : query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-black/40 border border-white/25 text-white placeholder:text-white/50 outline-none focus:border-white/40 transition-colors"
          />
          {query !== debouncedQuery && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-white/70 animate-spin" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={voice.toggle}
          aria-label={voice.listening ? 'Parar gravação' : 'Pesquisar por voz'}
          className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition ${
            voice.listening
              ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
              : 'bg-black/40 border border-white/25 text-white hover:bg-black/50'
          }`}
        >
          {voice.listening ? <MicOff className="w-5 h-5" strokeWidth={2.4} /> : <Mic className="w-5 h-5" strokeWidth={2.4} />}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1 p-1 rounded-full bg-black/30 border border-white/15 overflow-x-auto hide-scrollbar">
        {UNIFIED_TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                track('search_tab_selecionada', { tab });
                setActiveTab(tab);
              }}
              className={`shrink-0 px-3.5 py-2 rounded-full text-[11px] uppercase tracking-wide font-bold transition-all ${
                active
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
