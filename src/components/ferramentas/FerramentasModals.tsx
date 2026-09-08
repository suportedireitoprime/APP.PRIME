import React, { Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { ForcaRanking } from '@/components/gamificacao/ForcaRanking';

const DicionarioJuridico = lazyWithRetry(() => import('@/components/ferramentas/DicionarioJuridico'));

interface FerramentasModalsProps {
  dicionarioOpen: boolean;
  onCloseDicionario: () => void;
  rankingOpen: boolean;
  onCloseRanking: () => void;
}

export const FerramentasModals: React.FC<FerramentasModalsProps> = ({
  dicionarioOpen,
  onCloseDicionario,
  rankingOpen,
  onCloseRanking,
}) => {
  return (
    <>
      <Suspense fallback={null}>
        {dicionarioOpen && <DicionarioJuridico open={dicionarioOpen} onClose={onCloseDicionario} />}
      </Suspense>

      <ForcaRanking isOpen={rankingOpen} onClose={onCloseRanking} />
    </>
  );
};
