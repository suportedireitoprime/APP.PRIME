import React, { useState } from 'react';
import FerramentasLivrosCarrossel from './FerramentasLivrosCarrossel';
import HomeNoticiasCarousel from '@/components/vademecum/home/HomeNoticiasCarousel';
import { FerramentasPrimaryGrid } from './FerramentasPrimaryGrid';
import TematicaCarrossel from './TematicaCarrossel';
import { FerramentasSecondaryList } from './FerramentasSecondaryList';

// Função para decidir o carrossel de forma determinística (por horário)
function getHomeCarouselType(): 'noticias' | 'livros' {
  const hour = new Date().getHours();
  // Das 00:00 às 17:59 exibe Notícias. Das 18:00 às 23:59 exibe Livros.
  return (hour >= 18 || hour < 6) ? 'livros' : 'noticias';
}

interface FerramentasMobileListProps {
  onToolClick: (id: string, route?: string) => void;
}

export const FerramentasMobileList: React.FC<FerramentasMobileListProps> = ({ onToolClick }) => {
  const [homeCarousel] = useState<'noticias' | 'livros'>(() => getHomeCarouselType());

  return (
    <div className="space-y-8">
      {/* Se a home está mostrando Notícias, ferramentas mostra Livros e vice-versa */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        {homeCarousel === 'noticias' ? (
          <div className="px-4">
            <FerramentasLivrosCarrossel />
          </div>
        ) : (
          <div className="-mt-4">
            <HomeNoticiasCarousel autoplay={false} />
          </div>
        )}
      </div>

      <FerramentasPrimaryGrid onToolClick={onToolClick} />

      <section className="mt-2 -mx-2">
        <TematicaCarrossel />
      </section>

      <FerramentasSecondaryList onToolClick={onToolClick} />
    </div>
  );
};
