import { Suspense, useEffect } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useIsDesktop } from '@/hooks/use-desktop';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useBibliotecasData } from '@/components/biblioteca/useBibliotecasData';
import { BibliotecaMobileContent } from '@/components/biblioteca/BibliotecaMobileContent';
import { BibliotecaModals } from '@/components/biblioteca/BibliotecaModals';
import bibliotecaCoverClara from '@/assets/biblioteca-cover-clara.webp';

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
    livroModoInicial,
    setLivroModoInicial,
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
    <main className="min-h-dvh bg-[#09090b] text-white pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] relative overflow-x-hidden select-none">
      {/* ── Imagem Monumental de Biblioteca Clara no Fundo Inteiro da Página (Estilo Flashcards) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#09090b]">
        <img
          src={bibliotecaCoverClara}
          alt="Biblioteca Monumental e Iluminada"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter blur-[1.2px] brightness-[0.92] contrast-[1.05]"
        />
        {/* Camada sutil para contraste e legibilidade de leitura */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/60 to-black/90 pointer-events-none" />
      </div>

      <div className="relative z-10">
        <BibliotecaMobileContent
          counts={counts}
          onAbrirLivro={(l, modo) => {
            setLivroModoInicial(modo);
            setLivroAberto(l);
          }}
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
          initialMode={livroModoInicial}
          onCloseLivro={() => {
            setLivroAberto(null);
            setLivroModoInicial(undefined);
          }}
          onAbrirLivro={(l) => {
            setLivroModoInicial(undefined);
            setLivroAberto(l);
          }}
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