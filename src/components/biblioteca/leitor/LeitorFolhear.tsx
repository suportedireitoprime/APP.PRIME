import { forwardRef, useImperativeHandle, useRef } from 'react';
import PaginaConteudo, { type PaginaData } from './PaginaConteudo';
import type { Tema } from '@/hooks/useLeitorPrefs';
import BookPageFlip3D, { type BookPageFlip3DHandle } from './BookPageFlip3D';

export interface LeitorFolhearHandle {
  flipNext: () => void;
  flipPrev: () => void;
  flip: (index: number) => void;
}

interface Props {
  paginas: PaginaData[];
  currentIndex: number;
  onChangeIndex: (idx: number) => void;
  tema: Tema;
  fonte: { family: string };
  fontSize: number;
  lineHeight: number;
  alinhamento: 'justify' | 'left';
  onTapCenter?: () => void;
}

/**
 * Leitor com folhear realista 3D (HTML + CSS transform-style preserve-3d / rotateY).
 * Implementado conforme a especificação de 3 camadas:
 * 1. .under (página de baixo)
 * 2. .flip-shadow (sombra projetada)
 * 3. .flip com .face.front, .face.back e .veil (virada em 0.58s com perspectiva de 1500px).
 */
const LeitorFolhear = forwardRef<LeitorFolhearHandle, Props>(function LeitorFolhear(
  {
    paginas,
    currentIndex,
    onChangeIndex,
    tema,
    fonte,
    fontSize,
    lineHeight,
    alinhamento,
    onTapCenter,
  },
  ref
) {
  const flip3DRef = useRef<BookPageFlip3DHandle>(null);

  useImperativeHandle(ref, () => ({
    flipNext: () => {
      flip3DRef.current?.flipNext();
    },
    flipPrev: () => {
      flip3DRef.current?.flipPrev();
    },
    flip: (index: number) => {
      flip3DRef.current?.goToPage(index + 1);
    },
  }));

  const renderPageContent = (pageNum: number, isBackFace?: boolean) => {
    const pageIndex = pageNum - 1;
    const pagina = paginas[pageIndex];

    if (!pagina) {
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: tema.bg, color: tema.text }}
        />
      );
    }

    if (isBackFace) {
      return (
        <div
          className="w-full h-full flex flex-col justify-between p-8 select-none border-l"
          style={{
            background: tema.isDark ? '#0e0e11' : tema.bg,
            color: tema.text,
            borderColor: tema.border,
            boxShadow: tema.isDark
              ? 'inset 20px 0 35px -10px rgba(0,0,0,0.3)'
              : 'inset 20px 0 35px -10px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center justify-between text-[11px] opacity-40 font-mono tracking-widest uppercase">
            <span>{pagina.chapterTitulo || 'Leitura'}</span>
            <span>p. {pagina.ocrPage}</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 opacity-25">
            <div className="w-10 h-0.5 bg-current mb-4 rounded-full opacity-40" />
            <p className="text-xs font-serif italic max-w-xs line-clamp-3">
              {pagina.chapterTitulo || 'Direito Prime'}
            </p>
          </div>

          <div className="text-center text-[10px] opacity-35 font-mono">
            {pageNum} / {paginas.length}
          </div>
        </div>
      );
    }

    return (
      <div
        className="w-full h-full min-w-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
        style={{
          background: tema.bg,
          color: tema.text,
          boxShadow: 'inset 12px 0 25px -12px rgba(0,0,0,0.25)',
        }}
      >
        <PaginaConteudo
          pagina={pagina}
          tema={tema}
          fonte={fonte}
          fontSize={fontSize}
          lineHeight={lineHeight}
          alinhamento={alinhamento}
          compact="mobile-flip"
        />
      </div>
    );
  };

  return (
    <div
      data-reader-flip
      className="absolute inset-0 w-full h-full min-w-0 overflow-hidden"
      style={{ background: tema.bg }}
    >
      <BookPageFlip3D
        ref={flip3DRef}
        currentPage={currentIndex + 1}
        totalPages={paginas.length}
        renderPage={renderPageContent}
        onPageChange={(p) => onChangeIndex(p - 1)}
        onTapCenter={onTapCenter}
      />
    </div>
  );
});

export default LeitorFolhear;
