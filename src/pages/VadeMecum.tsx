import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import VadeMecumHero from '@/components/vademecum/home/VadeMecumHero';
import BuscaLeisOverlay, { type LeiSelecionada } from '@/components/vademecum/overlays/BuscaLeisOverlay';
import MobileHomeSections from '@/components/vademecum/home/MobileHomeSections';
import VadeMecumBottomNav from '@/components/vademecum/navigation/VadeMecumBottomNav';
import VadeMecumFavoritos from './VadeMecumFavoritos';
import VadeMecumTutorialOverlay from '@/components/vademecum/overlays/VadeMecumTutorialOverlay';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import { useIsDesktop } from '@/hooks/use-desktop';
import DesktopSidebar from '@/components/vademecum/desktop/DesktopSidebar';
import { Scale, BookOpen, Gavel, Library, MessageSquare, BookOpenText, GraduationCap } from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';

const DESKTOP_TABS: { id: string; label: string; icon: any }[] = [
  { id: 'legislacao', label: 'Legislação', icon: Scale },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library },
  { id: 'ferramentas', label: 'Ferramentas', icon: Gavel },
  { id: 'aprender', label: 'Aprender', icon: GraduationCap },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'vademecum', label: 'Vade Mecum', icon: BookOpenText },
];

/**
 * Hub do Vade Mecum — mesmo painel do início do app, em verde,
 * com brasão da República e busca restrita a leis.
 */
const VadeMecum = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const [buscaOpen, setBuscaOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

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

  const abrirLei = (lei: LeiSelecionada) => {
    setBuscaOpen(false);
    pushRecente(lei);
    navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${leiToSlug({ id: lei.leiId, nome: lei.nome })}`);
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
        <div className="absolute inset-0 z-0 opacity-60">
          <ShapeGrid 
            speed={0.5} 
            squareSize={40}
            direction='diagonal'
            borderColor='rgba(255, 255, 255, 0.05)'
            hoverFillColor='rgba(255, 255, 255, 0.1)'
            shape='square'
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
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
              <div className="flex items-center gap-1 px-8 h-12">
                {DESKTOP_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.id === 'vademecum';
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        const routes: Record<string, string> = {
                          legislacao: '/',
                          noticias: '/noticias',
                          ferramentas: '/ferramentas',
                          biblioteca: '/bibliotecas',
                          aprender: '/aprender',
                          chat: '/assistente-horus',
                          vademecum: '/vade-mecum',
                        };
                        if (routes[tab.id]) navigate(routes[tab.id]);
                      }}
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
            
            <div className="px-8 py-6 2xl:px-14">
              {renderContent()}
            </div>
          </div>
        </div>
        
        <BuscaLeisOverlay open={buscaOpen} onClose={() => setBuscaOpen(false)} onSelectLei={abrirLei} />
        <AnimatePresence>
          {tutorialOpen && <VadeMecumTutorialOverlay onClose={fecharTutorial} />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`theme-vademecum min-h-dvh bg-zinc-950 pb-24 relative overflow-hidden ${activeTab !== 'emalta' && activeTab !== 'favoritos' ? 'pt-8' : ''}`}>
      <div className="absolute inset-0 z-0 opacity-60">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>
      <div className="relative z-10">
        {renderContent()}
        <BuscaLeisOverlay open={buscaOpen} onClose={() => setBuscaOpen(false)} onSelectLei={abrirLei} />
        <VadeMecumBottomNav hidden={buscaOpen} />

        <AnimatePresence>
          {tutorialOpen && <VadeMecumTutorialOverlay onClose={fecharTutorial} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VadeMecum;
