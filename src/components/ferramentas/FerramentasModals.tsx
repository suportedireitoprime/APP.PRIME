import React, { Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { ForcaRanking } from '@/components/gamificacao/ForcaRanking';
import { BoletinsBottomSheet } from '@/components/ferramentas/BoletinsBottomSheet';

const DicionarioJuridico = lazyWithRetry(() => import('@/components/ferramentas/DicionarioJuridico'));

interface FerramentasModalsProps {
  dicionarioOpen: boolean;
  onCloseDicionario: () => void;
  rankingOpen: boolean;
  onCloseRanking: () => void;
  boletinsSheetOpen: boolean;
  onCloseBoletins: () => void;
}

export const FerramentasModals: React.FC<FerramentasModalsProps> = ({
  dicionarioOpen,
  onCloseDicionario,
  rankingOpen,
  onCloseRanking,
  boletinsSheetOpen,
  onCloseBoletins,
}) => {
  return (
    <>
      <Suspense fallback={null}>
        {dicionarioOpen && <DicionarioJuridico open={dicionarioOpen} onClose={onCloseDicionario} />}
      </Suspense>

      <ForcaRanking isOpen={rankingOpen} onClose={onCloseRanking} />

      <BoletinsBottomSheet isOpen={boletinsSheetOpen} onClose={onCloseBoletins} />
    </>
  );
};
