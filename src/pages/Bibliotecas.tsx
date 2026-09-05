import { Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import ShapeGrid from '@/components/ui/ShapeGrid';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useBibliotecasData } from '@/components/biblioteca/useBibliotecasData';
import { BibliotecaMobileContent } from '@/components/biblioteca/BibliotecaMobileContent';
import { BibliotecaModals } from '@/components/biblioteca/BibliotecaModals';

const BibliotecasDesktop = lazyWithRetry(() => import('./BibliotecasDesktop'));

const Bibliotecas = () => {
  useTrackArea("biblioteca_aberta");
  const isDesktop = useIsDesktop();
  const {
    counts,
    materiaAberta,
    setMateriaAberta,
    livrosAreas,
    livroAberto,
    setLivroAberto,
    customPdfUrl,
    setCustomPdfUrl,
    customPdfTitle,
    setCustomPdfTitle,
  } = useBibliotecasData();

  if (isDesktop) {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-background" />}>
        <BibliotecasDesktop />
      </Suspense>
    );
  }

  return (
    <main className="min-h-dvh bg-zinc-950 pb-20 relative overflow-hidden">
      {/* Fundo ShapeGrid */}
      <div className="absolute inset-0 z-0">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.1)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        <BibliotecaMobileContent
          counts={counts}
          onAbrirLivro={(l) => setLivroAberto(l)}
          onAbrirCustomPdf={(titulo, url) => {
            setCustomPdfTitle(titulo);
            setCustomPdfUrl(url);
          }}
        />

        <BibliotecaModals
          materiaAberta={materiaAberta}
          onCloseMateria={() => setMateriaAberta(null)}
          livrosAreas={livrosAreas}
          livroAberto={livroAberto}
          onCloseLivro={() => setLivroAberto(null)}
          onAbrirLivro={(l) => setLivroAberto(l)}
          customPdfUrl={customPdfUrl}
          customPdfTitle={customPdfTitle}
          onCloseCustomPdf={() => {
            setCustomPdfUrl(null);
            setCustomPdfTitle('');
          }}
        />
      </div>
    </main>
  );
};

export default Bibliotecas;
