import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Pagina } from '@/hooks/domain/useLeitorPaginas';

interface LeitorTocDrawerMobileProps {
  open: boolean;
  onClose: () => void;
  tocItems: any[];
  currentPage?: Pagina;
  capitulos: any[];
  jumpToChapter: (chapterIdx: number) => void;
  jumpToOcrPage: (ocrPage: number) => void;
  dark: boolean;
  tema: {
    bg: string;
    text: string;
  };
}

export const LeitorTocDrawerMobile: React.FC<LeitorTocDrawerMobileProps> = ({
  open,
  onClose,
  tocItems,
  currentPage,
  capitulos,
  jumpToChapter,
  jumpToOcrPage,
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1322] md:hidden"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="fixed top-0 right-0 bottom-0 w-[90%] max-w-sm z-[1323] md:hidden shadow-2xl flex flex-col"
        style={{
          background: tema.bg,
          color: tema.text,
          paddingTop: 'var(--sai-top)',
        }}
      >
        <div className="px-4 h-14 flex items-center gap-3 border-b border-current/10 shrink-0">
          <p className="text-sm font-semibold flex-1">Sumário</p>
          <button
            onClick={onClose}
            aria-label="Fechar sumário"
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {tocItems.length === 0 && (
            <p className="text-xs opacity-60 px-2 py-4">Este livro não tem sumário detectado.</p>
          )}
          {tocItems.map((s: any, idx) => {
            const active = currentPage && s.chapterIdx === currentPage.chapterIdx;
            const onClick =
              typeof s.chapterIdx === 'number' && capitulos.length
                ? () => {
                    jumpToChapter(s.chapterIdx);
                    onClose();
                  }
                : () => {
                    jumpToOcrPage(s.ocrPage);
                    onClose();
                  };
            return (
              <button
                key={idx}
                onClick={onClick}
                className={`w-full text-left px-3 py-3 rounded-lg transition text-sm ${
                  active
                    ? dark
                      ? 'bg-primary/20 text-primary'
                      : 'bg-primary/15 text-primary'
                    : dark
                    ? 'hover:bg-white/5'
                    : 'hover:bg-black/5'
                }`}
                style={{ paddingLeft: 12 + (s.nivel - 1) * 14 }}
              >
                <span className="opacity-90">{s.titulo}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
};
