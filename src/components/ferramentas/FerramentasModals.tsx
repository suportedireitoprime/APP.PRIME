import React, { Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";

const DicionarioJuridico = lazyWithRetry(() => import('@/components/ferramentas/DicionarioJuridico'));

interface FerramentasModalsProps {
  dicionarioOpen: boolean;
  onCloseDicionario: () => void;
  rankingOpen?: boolean;
  onCloseRanking?: () => void;
}

export const FerramentasModals: React.FC<FerramentasModalsProps> = ({
  dicionarioOpen,
  onCloseDicionario,
}) => {
  return (
    <Suspense fallback={null}>
      {dicionarioOpen && <DicionarioJuridico open={dicionarioOpen} onClose={onCloseDicionario} />}
    </Suspense>
  );
};
