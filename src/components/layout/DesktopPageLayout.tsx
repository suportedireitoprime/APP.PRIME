import { startTransition } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, Gavel, Library, BookOpenText, Newspaper } from 'lucide-react';
import DesktopHeroBanner from '@/components/vademecum/desktop/DesktopHeroBanner';

import { useIsDesktop } from '@/hooks/use-desktop';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';

const TABS: Array<{ id: string; label: string; icon: any; path: string; prefetch?: PrefetchKey }> = [
  { id: 'legislacao', label: 'Legislação', icon: Scale, path: '/' },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library, path: '/bibliotecas' },
  { id: 'blog', label: 'Blog', icon: Newspaper, path: '/blog', prefetch: 'blog' },
  { id: 'ferramentas', label: 'Ferramentas', icon: Gavel, path: '/ferramentas', prefetch: 'ferramentas' },
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
  const location = useLocation();
  const isDesktop = useIsDesktop();

  // Deriva o tema de forma síncrona diretamente da rota para evitar qualquer flicker de cor (Item 45)
  const currentPath = location.pathname.toLowerCase();
  const themeClass = currentPath.startsWith('/aulas')
    ? 'theme-aprender'
    : currentPath.startsWith('/questoes')
    ? 'theme-questoes'
    : currentPath.startsWith('/biblioteca')
    ? 'theme-biblioteca'
    : activeId === 'aprender'
    ? 'theme-aprender'
    : activeId === 'questoes'
    ? 'theme-questoes'
    : 'theme-vademecum';

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
    <div className={`min-h-full bg-[#09090B] flex flex-col ${themeClass}`}>
      {/* Content */}
      <div className="flex-1">
        <div
          className={
            wide
              ? 'w-full max-w-[1440px] mx-auto px-6 lg:px-10 py-8'
              : 'w-full max-w-6xl mx-auto px-6 lg:px-10 py-8'
          }
        >
          <div className="mb-6">
            <h1 className="font-display text-2xl text-foreground font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-zinc-400 text-sm mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DesktopPageLayout;
