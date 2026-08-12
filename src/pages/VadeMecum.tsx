import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import VadeMecumHero from '@/components/vademecum/VadeMecumHero';
import BuscaLeisOverlay, { type LeiSelecionada } from '@/components/vademecum/BuscaLeisOverlay';
import MobileHomeSections from '@/components/vademecum/MobileHomeSections';
import VadeMecumBottomNav from '@/components/vademecum/VadeMecumBottomNav';
import VadeMecumFavoritos from './VadeMecumFavoritos';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';

/**
 * Hub do Vade Mecum — mesmo painel do início do app, em verde,
 * com brasão da República e busca restrita a leis.
 */
const VadeMecum = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [buscaOpen, setBuscaOpen] = useState(false);

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

  return (
    <div className={`theme-vademecum min-h-dvh bg-background pb-24 ${activeTab !== 'emalta' && activeTab !== 'favoritos' ? 'pt-8' : ''}`}>
      {activeTab === 'emalta' && (
        <VadeMecumHero onBuscar={() => setBuscaOpen(true)} />
      )}

      <main className="max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'favoritos' ? (
            <motion.div
              key="favoritos"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
              className="pt-6"
            >
              <VadeMecumFavoritos />
            </motion.div>
          ) : (
            <motion.div
              key="outros"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <MobileHomeSections 
                noticiasAutoplay={false} 
                hideNoticias 
                hideBlog 
                emAltaLeis 
                hideTabs
                activeTab={activeTab as any}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BuscaLeisOverlay open={buscaOpen} onClose={() => setBuscaOpen(false)} onSelectLei={abrirLei} />
      <VadeMecumBottomNav hidden={buscaOpen} />
    </div>
  );
};

export default VadeMecum;
