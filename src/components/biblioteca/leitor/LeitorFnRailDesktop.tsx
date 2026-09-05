import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sliders,
  Volume2,
  Square,
  Bookmark,
  BookmarkCheck,
  WandSparkles,
  Share2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Pagina } from '@/hooks/domain/useLeitorPaginas';

interface LeitorFnRailDesktopProps {
  currentIndex: number;
  paginasLength: number;
  currentPage: Pagina;
  prev: () => void;
  next: () => void;
  onOpenAjustes: () => void;
  onOpenBookmarks: () => void;
  onOpenAssistente: () => void;
  onOpenCompartilhar: () => void;
  toggleNarracao: () => void;
  speaking: boolean;
  audioPaginaAtual: string | null;
  isCurrentBookmarked: boolean;
  bookmarksCount: number;
  tema: {
    bg: string;
    text: string;
    border: string;
  };
  dark: boolean;
  width: number;
}

export const LeitorFnRailDesktop: React.FC<LeitorFnRailDesktopProps> = ({
  currentIndex,
  paginasLength,
  currentPage,
  prev,
  next,
  onOpenAjustes,
  onOpenBookmarks,
  onOpenAssistente,
  onOpenCompartilhar,
  toggleNarracao,
  speaking,
  audioPaginaAtual,
  isCurrentBookmarked,
  bookmarksCount,
  tema,
  dark,
  width,
}) => {
  return (
    <aside
      aria-label="Ferramentas de leitura"
      className="hidden md:flex md:flex-col fixed right-0 top-0 bottom-0 z-[1305] border-l backdrop-blur-md pt-[3.75rem] pb-4"
      style={{
        width,
        background: `${tema.bg}f2`,
        borderColor: tema.border,
        color: tema.text,
      }}
    >
      <div className="flex flex-col items-center gap-2 px-2 pt-3">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          aria-label="Página anterior"
          title="Página anterior"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-30 ${
            dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          disabled={currentIndex >= paginasLength - 1}
          aria-label="Próxima página"
          title="Próxima página"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-30 ${
            dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-8 h-px my-1" style={{ background: `${tema.text}22` }} />

        <button
          onClick={onOpenAjustes}
          aria-label="Ajustes de leitura"
          title="Ajustes"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
            dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
          }`}
        >
          <Sliders className="w-[20px] h-[20px]" />
        </button>

        <button
          onClick={toggleNarracao}
          aria-label={speaking ? 'Parar narração' : 'Ouvir narração'}
          title={speaking ? 'Parar narração' : audioPaginaAtual ? 'Ouvir narração' : 'Narração em breve'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
            speaking
              ? 'bg-primary text-primary-foreground'
              : dark
              ? 'bg-white/[0.06] hover:bg-white/10'
              : 'bg-black/[0.04] hover:bg-black/10'
          } ${!audioPaginaAtual && !speaking ? 'opacity-50' : ''}`}
        >
          {speaking ? <Square className="w-[18px] h-[18px]" /> : <Volume2 className="w-[20px] h-[20px]" />}
        </button>

        <button
          onClick={onOpenBookmarks}
          aria-label="Marcadores"
          title="Marcadores"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 relative ${
            dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
          }`}
        >
          {isCurrentBookmarked ? (
            <BookmarkCheck className="w-[20px] h-[20px] text-primary" />
          ) : (
            <Bookmark className="w-[20px] h-[20px]" />
          )}
          {bookmarksCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
              {bookmarksCount}
            </span>
          )}
        </button>

        {currentPage.kind === 'content' && (currentPage.md || '').trim().length > 40 && (
          <>
            <div className="w-8 h-px my-1" style={{ background: `${tema.text}22` }} />

            <button
              onClick={onOpenAssistente}
              aria-label="Assistente de leitura"
              title="Assistente IA"
              className="w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 shadow-lg"
              style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.5)',
              }}
            >
              <WandSparkles className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenCompartilhar}
              aria-label="Compartilhar frase"
              title="Compartilhar"
              className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
                dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
              }`}
            >
              <Share2 className="w-[18px] h-[18px]" />
            </button>
          </>
        )}
      </div>

      {/* Progresso vertical */}
      <div className="mt-auto flex flex-col items-center gap-2 px-2">
        <span className="text-[10px] opacity-60 tabular-nums">p.{currentPage.ocrPage}</span>
        <div
          className={`w-1 h-24 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-black/10'} relative`}
        >
          <motion.div
            className="absolute left-0 right-0 bottom-0 bg-primary rounded-full"
            style={{ transformOrigin: 'bottom' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: (currentIndex + 1) / paginasLength }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
          />
        </div>
        <span className="text-[10px] opacity-60 tabular-nums">
          {currentIndex + 1}/{paginasLength}
        </span>
      </div>
    </aside>
  );
};
