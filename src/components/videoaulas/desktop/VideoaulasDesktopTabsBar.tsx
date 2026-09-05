import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Library, Gavel, GraduationCap, MessageSquare, BookOpenText } from 'lucide-react';
import DesktopBreadcrumb from '@/components/vademecum/desktop/DesktopBreadcrumb';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';

export const DESKTOP_TABS: Array<{ id: string; label: string; icon: any; path: string; prefetch?: PrefetchKey }> = [
  { id: 'legislacao', label: 'Legislação', icon: Scale, path: '/' },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library, path: '/bibliotecas' },
  { id: 'ferramentas', label: 'Ferramentas', icon: Gavel, path: '/ferramentas', prefetch: 'ferramentas' },
  { id: 'aprender', label: 'Aprender', icon: GraduationCap, path: '/aprender', prefetch: 'aprender' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/assistente-horus' },
  { id: 'vademecum', label: 'Vade Mecum', icon: BookOpenText, path: '/vade-mecum' },
];

export const VideoaulasDesktopTabsBar = memo(function VideoaulasDesktopTabsBar() {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 bg-background/95 border-b border-border">
      <div className="flex items-center gap-1 px-8 h-12">
        {DESKTOP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = 'aprender' === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              onMouseEnter={() => {
                if (tab.prefetch) prefetchRoute(tab.prefetch);
              }}
              onFocus={() => {
                if (tab.prefetch) prefetchRoute(tab.prefetch);
              }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground/60 hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      <DesktopBreadcrumb />
    </div>
  );
});
