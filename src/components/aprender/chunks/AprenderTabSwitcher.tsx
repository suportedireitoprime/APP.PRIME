import React, { memo } from 'react';
import { GraduationCap, ListChecks } from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';

interface AprenderTabSwitcherProps {
  activeTab: 'aulas' | 'flashcards' | 'questoes';
  onTabChange: (tab: 'aulas' | 'flashcards' | 'questoes') => void;
}

const TAB_CONFIGS = {
  aulas: {
    label: 'Aulas',
    icon: GraduationCap,
    bg: 'rgba(244, 63, 94, 0.15)',
    border: 'rgba(244, 63, 94, 0.4)',
    color: '#fb7185',
    glow: '0 0 14px rgba(244, 63, 94, 0.22)',
  },
  flashcards: {
    label: 'Flashcards',
    icon: FlashcardsIcon,
    bg: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(52, 211, 153, 0.42)',
    color: '#34D399',
    glow: '0 0 14px rgba(16, 185, 129, 0.22)',
  },
  questoes: {
    label: 'Questões',
    icon: ListChecks,
    bg: 'rgba(14, 165, 233, 0.16)',
    border: 'rgba(56, 189, 248, 0.42)',
    color: '#38BDF8',
    glow: '0 0 14px rgba(14, 165, 233, 0.22)',
  },
} as const;

export const AprenderTabSwitcher: React.FC<AprenderTabSwitcherProps> = memo(({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex bg-card p-1.5 rounded-2xl border border-border/80 w-full shadow-sm relative z-20 mt-8 mb-4">
      {(['aulas', 'flashcards', 'questoes'] as const).map((tab) => {
        const isActive = activeTab === tab;
        const config = TAB_CONFIGS[tab];
        const IconComponent = config.icon;

        return (
          <button
            key={tab}
            onClick={() => {
              try { haptic.selection(); } catch {}
              onTabChange(tab);
            }}
            style={
              isActive
                ? {
                    backgroundColor: config.bg,
                    borderColor: config.border,
                    color: config.color,
                    boxShadow: config.glow,
                  }
                : undefined
            }
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-[13px] uppercase tracking-wider transition-all duration-200 cursor-pointer border",
              isActive
                ? "font-bold shadow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 font-semibold"
            )}
          >
            <IconComponent
              className="w-4 h-4 shrink-0 transition-colors"
              style={{ color: isActive ? config.color : undefined }}
            />
            <span style={{ color: isActive ? config.color : undefined }}>
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
});

AprenderTabSwitcher.displayName = 'AprenderTabSwitcher';
