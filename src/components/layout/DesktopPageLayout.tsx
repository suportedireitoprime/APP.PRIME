import { startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, BookOpen, Gavel, Library, MessageSquare, BookOpenText } from 'lucide-react';
import DesktopHeroBanner from '@/components/vademecum/desktop/DesktopHeroBanner';

import { useIsDesktop } from '@/hooks/use-desktop';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';

const TABS: Array<{ id: string; label: string; icon: any; path: string; prefetch?: PrefetchKey }> = [
  { id: 'legislacao', label: 'Legislação', icon: Scale, path: '/' },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library, path: '/bibliotecas' },
  { id: 'ferramentas', label: 'Ferramentas', icon: Gavel, path: '/ferramentas', prefetch: 'ferramentas' },
  { id: 'aprender', label: 'Aprender', icon: BookOpen, path: '/aprender', prefetch: 'aprender' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/assistente-horus' },
  { id: 'vademecum', label: 'Vade Mecum', icon: BookOpenText, path: '/vade-mecum' },
];

interface DesktopPageLayoutProps {
  children: React.ReactNode;
  activeId: string;
  title: string;
  subtitle?: string;
  mobileHeader?: React.ReactNode;
  /** Usa toda a largura disponível (com margens laterais fluidas) em vez do container estreito. */
  wide?: boolean;
  /** Esconde a barra de abas principal (Legislação, Biblioteca, etc). Útil para sub-telas. */
  hideTabs?: boolean;
}

const DesktopPageLayout = ({ children, activeId, title, subtitle, mobileHeader, wide, hideTabs }: DesktopPageLayoutProps) => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const themeClass = activeId === 'aprender' ? 'theme-aprender' : activeId === 'questoes' ? 'theme-questoes' : 'theme-vademecum';

  if (!isDesktop) {
    return (
      <div className={`min-h-dvh bg-background pb-[calc(7rem+var(--sai-bottom))] ${themeClass}`}>
        <div className="mx-auto w-full md:max-w-[900px] md:px-6">
          {mobileHeader}
          {children}
        </div>
      </div>
    );
  }


  return (
    <div className={`min-h-dvh bg-background flex flex-col ${themeClass}`}>
      {/* Cabeçalho amarelo e breadcrumb agora vêm do GlobalDesktopHeader.
          O hero de busca é exclusivo da área de Legislação. */}
      {activeId === 'legislacao' && <DesktopHeroBanner />}





      {/* Tab bar */}
      {!hideTabs && (
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-center gap-1 h-12">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  onMouseEnter={() => { if (tab.prefetch) prefetchRoute(tab.prefetch); }}
                  onFocus={() => { if (tab.prefetch) prefetchRoute(tab.prefetch); }}
                  onClick={() => startTransition(() => navigate(tab.path))}
                  className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors min-w-[130px] ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground/60 hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div id="desktop-scroll-container" data-desktop-scroll="true" className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div
          className={
            wide
              ? 'w-full max-w-[1600px] mx-auto px-6 lg:px-10 2xl:px-16 py-8'
              : 'w-full max-w-6xl mx-auto px-6 lg:px-10 2xl:px-14 py-8'
          }
        >
          <div className="mb-6">
            <h1 className="font-display text-2xl text-foreground font-bold">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DesktopPageLayout;
