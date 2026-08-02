import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VadeMecumHero from '@/components/vademecum/VadeMecumHero';
import BuscaLeisOverlay, { type LeiSelecionada } from '@/components/vademecum/BuscaLeisOverlay';
import MobileHomeSections from '@/components/vademecum/MobileHomeSections';
import VadeMecumBottomNav from '@/components/vademecum/VadeMecumBottomNav';
import AprendaSobreLeis from '@/components/vademecum/AprendaSobreLeis';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';

/**
 * Hub do Vade Mecum — mesmo painel do início do app, em verde,
 * com brasão da República e busca restrita a leis.
 */
const VadeMecum = () => {
  const navigate = useNavigate();
  const [buscaOpen, setBuscaOpen] = useState(false);

  const abrirLei = (lei: LeiSelecionada) => {
    setBuscaOpen(false);
    pushRecente(lei);
    navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${leiToSlug({ id: lei.leiId, nome: lei.nome })}`);
  };

  return (
    <div className="theme-vademecum min-h-dvh bg-background pb-24">
      <VadeMecumHero onBuscar={() => setBuscaOpen(true)} />

      {/* Carrossel de "Entenda as Leis" no topo — antes das abas e do blog jurídico */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen pt-4">
        <AprendaSobreLeis titleClassName="px-4 sm:px-6 md:px-8 lg:px-12" />
      </div>

      <main className="max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2">
        <MobileHomeSections noticiasAutoplay={false} hideNoticias hideBlog emAltaLeis />
      </main>
      <BuscaLeisOverlay open={buscaOpen} onClose={() => setBuscaOpen(false)} onSelectLei={abrirLei} />
      <VadeMecumBottomNav hidden={buscaOpen} />
    </div>
  );
};

export default VadeMecum;
