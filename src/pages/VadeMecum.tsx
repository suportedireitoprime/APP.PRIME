import { useState, useEffect, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VadeMecumHero from '@/components/vademecum/home/VadeMecumHero';
import MobileHomeSections from '@/components/vademecum/home/MobileHomeSections';
import VadeMecumBottomNav from '@/components/vademecum/navigation/VadeMecumBottomNav';
import VadeMecumSearchBar from '@/components/vademecum/home/chunks/VadeMecumSearchBar';
import VadeMecumFavoritos from './VadeMecumFavoritos';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import { useIsDesktop } from '@/hooks/use-desktop';
import DesktopSidebar from '@/components/vademecum/desktop/DesktopSidebar';
import VadeMecumDesktopTabs from '@/components/vademecum/desktop/VadeMecumDesktopTabs';
import VadeMecumDesktopHeroBanner from '@/components/vademecum/desktop/VadeMecumDesktopHeroBanner';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import ShapeGrid from '@/components/ui/ShapeGrid';
import VadeMecumQuickActionSheet, { type QuickActionType } from '@/components/vademecum/sheets/VadeMecumQuickActionSheet';

// Busca própria e exclusiva do Vade Mecum (Artigos, Leis e Jurisprudência)
const BuscaLeisOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/BuscaLeisOverlay'));

/**
 * Hub do Vade Mecum — painel de legislação completa em verde,
 * com brasão da República, carrossel de capas, ações rápidas e busca de leis.
 */
const VadeMecum = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const [buscaOpen, setBuscaOpen] = useState(false);
  const [activeQuickSheet, setActiveQuickSheet] = useState<QuickActionType | null>(null);

  const abrirLei = (lei: { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string; artigoNumero?: string }) => {
    setBuscaOpen(false);
    pushRecente({ tipo: lei.tipo, leiId: lei.leiId, nome: lei.nome, descricao: lei.descricao, tabela_nome: lei.tabela_nome });
    const slug = leiToSlug({ id: lei.leiId, nome: lei.nome });
    const base = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
    navigate(lei.artigoNumero ? `${base}/${encodeURIComponent(lei.artigoNumero)}` : base);
  };

  const getActiveTab = () => {
    if (pathname.includes('/areas')) return 'areas';
    if (pathname.includes('/categorias')) return 'categorias';
    if (pathname.includes('/favoritos')) return 'favoritos';
    return 'emalta';
  };

  const activeTab = getActiveTab();

  const renderContent = () => (
    <>
      {activeTab === 'emalta' && (
        <div className={isDesktop ? "-mx-8 -mt-6 2xl:-mx-14" : ""}>
          <VadeMecumHero onSelectQuickAction={(action) => setActiveQuickSheet(action)} />
        </div>
      )}


      <main className={`relative ${isDesktop ? 'mt-8' : 'max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2'}`}>
        {activeTab === 'favoritos' ? (
          <div key="favoritos" className={isDesktop ? '' : 'pt-6'}>
            <VadeMecumFavoritos />
          </div>
        ) : (
          <div key="outros">
            <MobileHomeSections 
              noticiasAutoplay={false} 
              hideNoticias 
              hideBlog 
              emAltaLeis 
              hideTabs={!isDesktop}
              activeTab={activeTab as any}
              onBuscar={() => setBuscaOpen(true)}
            />
          </div>
        )}
      </main>
    </>
  );

  if (isDesktop) {
    return (
      <div className="min-h-dvh bg-hero-panel flex flex-col theme-vademecum relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none z-0">
          <ShapeGrid 
            speed={0.5} 
            squareSize={40}
            direction="diagonal"
            borderColor="rgba(255, 255, 255, 0.08)"
            hoverFillColor="rgba(255, 255, 255, 0.12)"
            shape="square"
            hoverTrailAmount={5}
          />
        </div>
        <div className="flex flex-1 min-h-0 relative z-10">
          <DesktopSidebar 
            activeTab={'vademecum' as any} 
            onTabChange={(tab) => {
              const routes: Record<string, string> = {
                legislacao: '/',
                noticias: '/noticias',
                ferramentas: '/ferramentas',
                biblioteca: '/bibliotecas',
                aprender: '/aprender',
                chat: '/assistente-horus',
                vademecum: '/vade-mecum',
              };
              if (routes[tab]) navigate(routes[tab]);
            }} 
          />
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="px-8 py-6 2xl:px-14">
              <VadeMecumDesktopHeroBanner 
                typingHint="Buscar na legislação..."
                onSearchClick={() => setBuscaOpen(true)}
                onSelectQuickAction={(action) => setActiveQuickSheet(action)}
              />
              <div className="mt-8">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
        
        {buscaOpen && (
          <Suspense fallback={null}>
            <BuscaLeisOverlay open={buscaOpen} onClose={() => setBuscaOpen(false)} onSelectLei={abrirLei} />
          </Suspense>
        )}

        <VadeMecumQuickActionSheet
          activeSheet={activeQuickSheet}
          onClose={() => setActiveQuickSheet(null)}
        />
      </div>
    );

  }

  return (
    <div className={`theme-vademecum min-h-dvh bg-zinc-950 pb-24 relative overflow-x-hidden ${activeTab !== 'emalta' && activeTab !== 'favoritos' ? 'pt-8' : ''}`}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.08)"
          hoverFillColor="rgba(255, 255, 255, 0.12)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>
      <div className="relative z-10">
        {renderContent()}
        {buscaOpen && (
          <Suspense fallback={null}>
            <BuscaLeisOverlay open={buscaOpen} onClose={() => setBuscaOpen(false)} onSelectLei={abrirLei} />
          </Suspense>
        )}
        <VadeMecumBottomNav hidden={buscaOpen} />

        <VadeMecumQuickActionSheet
          activeSheet={activeQuickSheet}
          onClose={() => setActiveQuickSheet(null)}
        />
      </div>

    </div>
  );
};

export default VadeMecum;
