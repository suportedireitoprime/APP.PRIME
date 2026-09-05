import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Library, Gavel, GraduationCap, MessageSquare, BookOpenText } from 'lucide-react';

export const DESKTOP_TABS = [
  { id: 'legislacao', label: 'Legislação', icon: Scale, route: '/' },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library, route: '/bibliotecas' },
  { id: 'ferramentas', label: 'Ferramentas', icon: Gavel, route: '/ferramentas' },
  { id: 'aprender', label: 'Aprender', icon: GraduationCap, route: '/aprender' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, route: '/assistente-horus' },
  { id: 'vademecum', label: 'Vade Mecum', icon: BookOpenText, route: '/vade-mecum' },
] as const;

interface Props {
  activeTabId?: string;
}

const VadeMecumDesktopTabs: React.FC<Props> = ({ activeTabId = 'vademecum' }) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-1 px-8 h-12">
        {DESKTOP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.route)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground/60 hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(VadeMecumDesktopTabs);
