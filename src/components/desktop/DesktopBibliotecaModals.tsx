import React, { Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/AssistenteOverlayV2'));
const LivroDetailSheet = lazyWithRetry(() => import('@/components/biblioteca/LivroDetailSheet'));

interface DesktopBibliotecaModalsProps {
  searchOpen: boolean;
  onCloseSearch: () => void;
  assistenteOpen: boolean;
  onCloseAssistente: () => void;
  livroAberto: LivroNormalizado | null;
  onCloseLivro: () => void;
}

export const DesktopBibliotecaModals: React.FC<DesktopBibliotecaModalsProps> = ({
  searchOpen,
  onCloseSearch,
  assistenteOpen,
  onCloseAssistente,
  livroAberto,
  onCloseLivro,
}) => {
  return (
    <>
      <Suspense fallback={null}>
        {searchOpen && (
          <SearchOverlay
            open={searchOpen}
            onClose={onCloseSearch}
          />
        )}
        {assistenteOpen && (
          <AssistenteOverlay
            open={assistenteOpen}
            onClose={onCloseAssistente}
          />
        )}
        {livroAberto && (
          <LivroDetailSheet
            livro={livroAberto}
            open={!!livroAberto}
            onOpenChange={(v) => { if (!v) onCloseLivro(); }}
          />
        )}
      </Suspense>
    </>
  );
};
