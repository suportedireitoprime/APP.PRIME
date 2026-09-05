import React, { Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

const LivroDetailSheet = lazyWithRetry(() => import('@/components/biblioteca/LivroDetailSheet'));
const PdfScrollReader = lazyWithRetry(() => import('@/components/biblioteca/PdfScrollReader'));
const BibliotecaMateriaSheet = lazyWithRetry(() => import('@/components/biblioteca/BibliotecaMateriaSheet'));

interface BibliotecaModalsProps {
  materiaAberta: string | null;
  onCloseMateria: () => void;
  livrosAreas: LivroNormalizado[];
  livroAberto: LivroNormalizado | null;
  onCloseLivro: () => void;
  onAbrirLivro: (livro: LivroNormalizado) => void;
  customPdfUrl: string | null;
  customPdfTitle: string;
  onCloseCustomPdf: () => void;
}

export const BibliotecaModals: React.FC<BibliotecaModalsProps> = ({
  materiaAberta,
  onCloseMateria,
  livrosAreas,
  livroAberto,
  onCloseLivro,
  onAbrirLivro,
  customPdfUrl,
  customPdfTitle,
  onCloseCustomPdf,
}) => {
  return (
    <>
      {/* Matéria: bottom sheet sob demanda */}
      <Suspense fallback={null}>
        <BibliotecaMateriaSheet
          materiaAberta={materiaAberta}
          onClose={onCloseMateria}
          livrosAreas={livrosAreas}
          onAbrirLivro={onAbrirLivro}
        />
      </Suspense>

      {/* Detalhes do Livro sob demanda */}
      <Suspense fallback={null}>
        {livroAberto && (
          <LivroDetailSheet
            livro={livroAberto}
            open={!!livroAberto}
            onClose={onCloseLivro}
          />
        )}
      </Suspense>

      {/* Leitor de PDF sob demanda */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {customPdfUrl && (
            <PdfScrollReader
              url={customPdfUrl}
              titulo={customPdfTitle}
              onClose={onCloseCustomPdf}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </>
  );
};
