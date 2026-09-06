import { Suspense, useState, useEffect } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useIsDesktop } from '@/hooks/use-desktop';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useBibliotecasData } from '@/components/biblioteca/useBibliotecasData';
import { BibliotecaMobileContent } from '@/components/biblioteca/BibliotecaMobileContent';
import { BibliotecaModals } from '@/components/biblioteca/BibliotecaModals';

const BibliotecasDesktop = lazyWithRetry(() => import('./BibliotecasDesktop'));
const ShapeGrid = lazyWithRetry(() => import('@/components/ui/ShapeGrid'));

const Bibliotecas = () => {
  useTrackArea("biblioteca_aberta");
  const isDesktop = useIsDesktop();
  // Adia o ShapeGrid para não competir com o primeiro paint da tela
  const [gridReady, setGridReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGridReady(true), 300);
    return () => clearTimeout(t);
  }, []);
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
    <main className="min-h-dvh bg-zinc-950 pb-[calc(2.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] relative overflow-x-hidden">
      {/* Fundo ShapeGrid fixo em toda a viewport para cobrir 100% da tela sem cortes */}
      {gridReady && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Suspense fallback={null}>
            <ShapeGrid
              speed={0.5}
              squareSize={40}
              direction="diagonal"
              borderColor="rgba(255, 255, 255, 0.05)"
              hoverFillColor="rgba(255, 255, 255, 0.1)"
              shape="square"
              hoverTrailAmount={5}
            />
          </Suspense>
        </div>
      )}

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
