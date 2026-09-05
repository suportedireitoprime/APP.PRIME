import { useState, useEffect, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import VadeMecumHero from '@/components/vademecum/home/VadeMecumHero';
import MobileHomeSections from '@/components/vademecum/home/MobileHomeSections';
import VadeMecumBottomNav from '@/components/vademecum/navigation/VadeMecumBottomNav';
import VadeMecumFavoritos from './VadeMecumFavoritos';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import { useIsDesktop } from '@/hooks/use-desktop';
import DesktopSidebar from '@/components/vademecum/desktop/DesktopSidebar';
import VadeMecumDesktopTabs from '@/components/vademecum/desktop/VadeMecumDesktopTabs';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
const ShapeGrid = lazyWithRetry(() => import('@/components/ui/ShapeGrid'));

// Busca própria e exclusiva do Vade Mecum (Artigos, Leis e Jurisprudência)
const BuscaLeisOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/BuscaLeisOverlay'));
const VadeMecumTutorialOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/VadeMecumTutorialOverlay'));

/**
 * Hub do Vade Mecum — painel de legislação completa em verde,
 * com brasão da República, carrossel de capas, ações rápidas e busca de leis.
 */
const VadeMecum = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const [buscaOpen, setBuscaOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  // Adia o ShapeGrid para não bloquear o primeiro paint
  const [gridReady, setGridReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGridReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('vademecum_tutorial_v1');
    if (!hasSeenTutorial) {
      setTutorialOpen(true);
    }
  }, []);

  const fecharTutorial = () => {
    localStorage.setItem('vademecum_tutorial_v1', 'true');
    setTutorialOpen(false);
  };

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
          <VadeMecumHero onBuscar={() => setBuscaOpen(true)} />
        </div>
      )}

      <main className={`relative ${isDesktop ? 'mt-8' : 'max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'favoritos' ? (
            <motion.div
              key="favoritos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={isDesktop ? '' : 'pt-6'}
            >
              <VadeMecumFavoritos />
            </motion.div>
          ) : (
            <motion.div
              key="outros"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <MobileHomeSections 
                noticiasAutoplay={false} 
                hideNoticias 
                hideBlog 
                emAltaLeis 
                hideTabs={!isDesktop}
                activeTab={activeTab as any}
                onBuscar={() => setBuscaOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );

  if (isDesktop) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col theme-vademecum relative overflow-hidden">
        {gridReady && (
          <div className="absolute inset-0 z-0 opacity-60">
            <Suspense fallback={null}>
              <ShapeGrid 
                speed={0.5} 
                squareSize={40}
                direction="diagonal"
                borderColor="rgba(255, 255, 255, 0.05)"
                hoverFillColor="rgba(255, 255, 255, 0.1)"
                shape="square"
                hoverTrailAmount={5}
              />
            </Suspense>
          </div>
        )}
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
            <VadeMecumDesktopTabs activeTabId="vademecum" />
            
            <div className="px-8 py-6 2xl:px-14">
              {renderContent()}
            </div>
          </div>
        </div>
        
        {buscaOpen && (
          <Suspense fallback={null}>
            <BuscaLeisOverlay open={buscaOpen} onClose={() => setBuscaOpen(false)} onSelectLei={abrirLei} />
          </Suspense>
        )}
        <AnimatePresence>
          {tutorialOpen && (
            <Suspense fallback={null}>
              <VadeMecumTutorialOverlay onClose={fecharTutorial} />
            </Suspense>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`theme-vademecum min-h-dvh bg-zinc-950 pb-24 relative overflow-hidden ${activeTab !== 'emalta' && activeTab !== 'favoritos' ? 'pt-8' : ''}`}>
      {gridReady && (
        <div className="absolute inset-0 z-0 opacity-60">
          <Suspense fallback={null}>
            <ShapeGrid 
              speed={0.5} 
              squareSize={40}
              direction="diagonal"
              borderColor="rgba(255, 255, 255, 0.05)"
              hoverFillColor="rgba(255, 255, 255, 0.1)"
              shape="square"
              hoverTrailAmount={5}
            />
          </Suspense>
        </div>
      )}
      <div className="relative z-10">
        {renderContent()}
        {buscaOpen && (
          <Suspense fallback={null}>
            <BuscaLeisOverlay open={buscaOpen} onClose={() => setBuscaOpen(false)} onSelectLei={abrirLei} />
          </Suspense>
        )}
        <VadeMecumBottomNav hidden={buscaOpen} />

        <AnimatePresence>
          {tutorialOpen && (
            <Suspense fallback={null}>
              <VadeMecumTutorialOverlay onClose={fecharTutorial} />
            </Suspense>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VadeMecum;
