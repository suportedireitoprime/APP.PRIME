import React from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import type { BookmarkItem } from '@/hooks/domain/useLeitorBookmarks';

interface LeitorBookmarksSheetProps {
  open: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  isCurrentBookmarked: boolean;
  toggleCurrentBookmark: () => void;
  jumpToOcrPage: (ocrPage: number) => void;
  removeBookmark: (ocrPage: number) => void;
  isDesktop: boolean;
  dark: boolean;
  tema: {
    bg: string;
    text: string;
    border: string;
  };
}

export const LeitorBookmarksSheet: React.FC<LeitorBookmarksSheetProps> = ({
  open,
  onClose,
  bookmarks,
  isCurrentBookmarked,
  toggleCurrentBookmark,
  jumpToOcrPage,
  removeBookmark,
  isDesktop,
  dark,
  tema,
}) => {
  if (!open) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[1324] ${isDesktop ? 'bg-black/25' : 'bg-black/50 backdrop-blur-sm'}`}
        onClick={onClose}
      />
      <motion.div
        initial={isDesktop ? { opacity: 0, x: 48, scale: 0.97 } : { y: '100%' }}
        animate={isDesktop ? { opacity: 1, x: 0, scale: 1 } : { y: 0 }}
        exit={isDesktop ? { opacity: 0, x: 48, scale: 0.97 } : { y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className={
          isDesktop
            ? 'fixed z-[1325] rounded-3xl shadow-2xl flex flex-col overflow-hidden'
            : 'fixed inset-x-0 bottom-0 z-[1325] mx-auto w-full md:max-w-[720px] rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh]'
        }
        style={
          isDesktop
            ? {
                background: tema.bg,
                color: tema.text,
                right: 'max(16px, var(--sai-right))',
                top: 'calc(var(--sai-top) + 5.25rem)',
                bottom: 'calc(var(--sai-bottom) + 1.5rem)',
                width: 'min(400px, calc(100vw - 32px))',
                border: `1px solid ${tema.border}`,
              }
            : {
                background: tema.bg,
                color: tema.text,
                paddingBottom: 'var(--sai-bottom)',
              }
        }
      >
        {!isDesktop && (
          <div className="flex justify-center pt-3 pb-1">
            <div className={`w-10 h-1 rounded-full ${dark ? 'bg-white/20' : 'bg-black/20'}`} />
          </div>
        )}
        <div className="px-5 pt-2 pb-3 flex items-center gap-3">
          <p className="text-base font-semibold flex-1">Marcadores</p>
          <button
            onClick={onClose}
            aria-label="Fechar marcadores"
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <button
            onClick={toggleCurrentBookmark}
            className={`w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-lg ${
              isCurrentBookmarked
                ? dark
                  ? 'bg-white/10 text-[#e8e2d4]'
                  : 'bg-black/5 text-[#2a2418]'
                : 'bg-primary text-primary-foreground shadow-primary/20'
            }`}
          >
            {isCurrentBookmarked ? (
              <>
                <Trash2 className="w-5 h-5" />
                Remover marcador desta página
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Marcar esta página
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
          {bookmarks.length === 0 && (
            <p className="text-xs opacity-60 px-4 py-6 text-center">
              Nenhuma página marcada ainda. Toque em "Marcar esta página" para começar.
            </p>
          )}
          {bookmarks.map((b) => (
            <div
              key={b.ocrPage}
              className={`flex items-center gap-2 rounded-2xl p-3 ${
                dark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'
              }`}
            >
              <button
                onClick={() => {
                  jumpToOcrPage(b.ocrPage);
                  onClose();
                }}
                className="flex-1 text-left min-w-0"
              >
                <p className="text-sm font-medium truncate">{b.chapterTitulo}</p>
                <p className="text-[11px] opacity-60 mt-0.5">Página {b.ocrPage}</p>
              </button>
              <button
                onClick={() => removeBookmark(b.ocrPage)}
                aria-label={`Remover marcador da página ${b.ocrPage}`}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
};
