import { memo } from 'react';
import { Tab } from './homeSectionsData';

interface HomeSegmentedTabsProps {
  currentTab: Tab;
  activeTabs: { id: Tab; label: string; icon: any }[];
  onSelectTab: (tab: Tab) => void;
}

const HomeSegmentedTabs = ({
  currentTab,
  activeTabs,
  onSelectTab,
}: HomeSegmentedTabsProps) => {
  return (
    <div>
      <div className="relative flex items-center gap-1 p-1 rounded-full bg-secondary/60 border border-border/60">
        {activeTabs.map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                import('@/lib/nativeHaptics').then((m) => m.haptic.selection());
                onSelectTab(t.id);
              }}
              data-track="home_tab_switch"
              data-track-tab={t.id}
              className="group relative flex-1 flex items-center justify-center gap-2 h-10 rounded-full font-display text-[13px] font-bold uppercase transition-all"
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full shadow-lg shadow-black/20 bg-hero-panel" />
              )}
              <span
                className={`relative flex items-center gap-2 transition-all duration-300 ease-out ${
                  isActive
                    ? 'text-white font-bold tracking-[0.13em]'
                    : 'text-muted-foreground hover:tracking-[0.13em] hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-110" />
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(HomeSegmentedTabs);
