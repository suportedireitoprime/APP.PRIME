import { Suspense, useEffect } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useIsDesktop } from '@/hooks/use-desktop';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useBibliotecasData } from '@/components/biblioteca/useBibliotecasData';
import { BibliotecaMobileContent } from '@/components/biblioteca/BibliotecaMobileContent';
import { BibliotecaModals } from '@/components/biblioteca/BibliotecaModals';
import ShapeGrid from '@/components/ui/ShapeGrid';

const BibliotecasDesktop = lazyWithRetry(() => import('./BibliotecasDesktop'));

const Bibliotecas = () => {
  useTrackArea("biblioteca_aberta");
  const isDesktop = useIsDesktop();

  useEffect(() => {
    // Força o topo assim que a página renderizar (evita scroll indesejado herdado)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const {
    counts,
    materiaAberta,
    setMateriaAberta,
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
    <main className="min-h-dvh bg-[#0D0D0D] text-white pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] relative overflow-x-hidden">
      {/* Fundo Padrão ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <ShapeGrid />
      </div>

      <div className="relative z-10">
        <BibliotecaMobileContent
          counts={counts}
          onAbrirLivro={(l) => setLivroAberto(l)}
          onAbrirCustomPdf={(titulo, url) => {
            setCustomPdfTitle(titulo);
            setCustomPdfUrl(url);
          }}
          onAbrirMateria={(m) => setMateriaAberta(m)}
        />

        <BibliotecaModals
          materiaAberta={materiaAberta}
          onCloseMateria={() => setMateriaAberta(null)}
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
