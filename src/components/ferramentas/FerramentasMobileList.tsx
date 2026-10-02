import React from 'react';
import HomeNoticiasCarousel from '@/components/vademecum/home/HomeNoticiasCarousel';
import { FerramentasPrimaryGrid } from './FerramentasPrimaryGrid';
import TematicaCarrossel from './TematicaCarrossel';
import { FerramentasSecondaryList } from './FerramentasSecondaryList';

interface FerramentasMobileListProps {
  onToolClick: (id: string, route?: string) => void;
}

export const FerramentasMobileList: React.FC<FerramentasMobileListProps> = ({ onToolClick }) => {
  return (
    <div className="space-y-8">
      {/* Carrossel de Notícias Jurídicas */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <div className="-mt-4">
          <HomeNoticiasCarousel autoplay={false} />
        </div>
      </div>

      <FerramentasPrimaryGrid onToolClick={onToolClick} />

      <section className="mt-2 -mx-2">
        <TematicaCarrossel />
      </section>

      <FerramentasSecondaryList onToolClick={onToolClick} />
    </div>
  );
};
