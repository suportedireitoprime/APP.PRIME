import React from 'react';
import { FerramentasPrimaryGrid } from './FerramentasPrimaryGrid';
import { FerramentasSecondaryList } from './FerramentasSecondaryList';

interface FerramentasMobileListProps {
  onToolClick: (id: string, route?: string) => void;
}

export const FerramentasMobileList: React.FC<FerramentasMobileListProps> = ({ onToolClick }) => {
  return (
    <div className="space-y-8">
      <FerramentasPrimaryGrid onToolClick={onToolClick} />

      <FerramentasSecondaryList onToolClick={onToolClick} />
    </div>
  );
};
