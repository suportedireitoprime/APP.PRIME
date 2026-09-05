import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sliders,
  WandSparkles,
  Bookmark,
  BookmarkCheck,
  List,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Pagina } from '@/hooks/domain/useLeitorPaginas';

interface LeitorBottomBarMobileProps {
  currentIndex: number;
  paginasLength: number;
  currentPage: Pagina;
  prev: () => void;
  next: () => void;
  onOpenAjustes: () => void;
  onOpenAssistente: () => void;
  onOpenBookmarks: () => void;
  onOpenToc: () => void;
  isCurrentBookmarked: boolean;
  bookmarksCount: number;
  railExpanded: boolean;
  tema: {
    bg: string;
    text: string;
    border: string;
  };
  dark: boolean;
}

export const LeitorBottomBarMobile: React.FC<LeitorBottomBarMobileProps> = ({
  currentIndex,
  paginasLength,
  currentPage,
  prev,
  next,
  onOpenAjustes,
  onOpenAssistente,
  onOpenBookmarks,
  onOpenToc,
  isCurrentBookmarked,
  bookmarksCount,
  railExpanded,
  tema,
  dark,
}) => {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'tween', duration: 0.2 }}
      className="fixed z-[1310] inset-x-0 bottom-0 border-t shadow-2xl"
      style={{
        paddingBottom: 'var(--sai-bottom)',
        maxWidth:
          typeof window !== 'undefined' && window.innerWidth >= 768
            ? `min(720px, calc(100vw - ${(railExpanded ? 380 : 56) + 32}px))`
            : undefined,
        background: dark ? '#0b0b0b' : tema.bg,
        borderColor: tema.border,
        color: tema.text,
      }}
    >
      <div className="px-5 pt-3 pb-2 flex items-center gap-3 text-[11px]">
        <span className="opacity-60 tabular-nums">
          {currentIndex + 1} / {paginasLength}
        </span>
        <div
          className={`flex-1 h-1 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-black/10'}`}
        >
          <motion.div
            className="h-full w-full bg-primary"
            style={{ transformOrigin: 'left' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (currentIndex + 1) / paginasLength }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
          />
        </div>
        <span className="opacity-60 tabular-nums">p.{currentPage.ocrPage}</span>
      </div>

      <div className="flex items-center justify-around px-2 pb-4 pt-2 gap-1">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          aria-label="Página anterior"
          className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-30 ${
            dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenAjustes}
          aria-label="Ajustes de leitura"
          className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 ${
            dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
          }`}
        >
          <Sliders className="w-[22px] h-[22px]" />
        </button>

        <button
          onClick={onOpenAssistente}
          aria-label="Assistente IA"
          title="Assistente IA"
          className="w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 text-white shadow-lg"
          style={{
            background: 'hsl(var(--primary))',
            boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.5)',
          }}
        >
          <WandSparkles className="w-[20px] h-[20px]" />
        </button>

        <button
          onClick={onOpenBookmarks}
          aria-label="Marcadores"
          className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 relative ${
            dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
          }`}
        >
          {isCurrentBookmarked ? (
            <BookmarkCheck className="w-[22px] h-[22px] text-primary" />
          ) : (
            <Bookmark className="w-[22px] h-[22px]" />
          )}
          {bookmarksCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
              {bookmarksCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenToc}
          aria-label="Sumário"
          className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 ${
            dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
          }`}
        >
          <List className="w-[22px] h-[22px]" />
        </button>

        <button
          onClick={next}
          disabled={currentIndex >= paginasLength - 1}
          aria-label="Próxima página"
          className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-30 ${
            dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
};
