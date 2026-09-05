import React from 'react';
import { FerramentasPrimaryGrid } from './FerramentasPrimaryGrid';
import TematicaCarrossel from './TematicaCarrossel';
import { FerramentasSecondaryList } from './FerramentasSecondaryList';

interface FerramentasMobileListProps {
  onToolClick: (id: string, route?: string) => void;
}

export const FerramentasMobileList: React.FC<FerramentasMobileListProps> = ({ onToolClick }) => {
  return (
    <div className="space-y-8">
      <FerramentasPrimaryGrid onToolClick={onToolClick} />

      <section className="mt-2 -mx-2">
        <TematicaCarrossel />
      </section>

      <FerramentasSecondaryList onToolClick={onToolClick} />
    </div>
  );
};
