import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Search, List } from 'lucide-react';

interface PdfReaderFooterProps {
  currentPage: number;
  totalPages: number;
  progress: number;
  bookmark: number | null;
  onPrev: () => void;
  onNext: () => void;
  onToggleBookmark: () => void;
  onOpenBusca: () => void;
  onOpenSumario: () => void;
}

export default function PdfReaderFooter({
  currentPage,
  totalPages,
  progress,
  bookmark,
  onPrev,
  onNext,
  onToggleBookmark,
  onOpenBusca,
  onOpenSumario,
}: PdfReaderFooterProps) {
  if (totalPages <= 0) return null;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="fixed inset-x-0 bottom-0 z-[1310] border-t border-white/10 bg-neutral-950/95 backdrop-blur-xl shadow-2xl"
      style={{ paddingBottom: 'var(--sai-bottom)' }}
    >
      <div className="px-5 pt-3 pb-2 flex items-center gap-3 text-[11px] text-white/70">
        <span className="tabular-nums">{currentPage} / {totalPages}</span>
        <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
        <span className="tabular-nums">{Math.round(progress)}%</span>
      </div>

      <div className="flex items-center justify-around px-2 pb-3 pt-1">
        <button
          onClick={onPrev}
          disabled={currentPage <= 1}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleBookmark}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
          title="Marcador"
        >
          {bookmark === currentPage ? (
            <BookmarkCheck className="w-[18px] h-[18px] text-primary" />
          ) : (
            <Bookmark className="w-[18px] h-[18px]" />
          )}
        </button>
        <button
          onClick={onOpenBusca}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
          title="Procurar palavra"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenSumario}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
          title="Sumário"
        >
          <List className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
