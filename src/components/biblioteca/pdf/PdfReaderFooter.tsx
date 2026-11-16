import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Search,
  List,
  WandSparkles,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface PdfReaderFooterProps {
  currentPage: number;
  totalPages: number;
  progress: number;
  bookmark: number | null;
  bookmarksCount?: number;
  onPrev: () => void;
  onNext?: () => void;
  onToggleBookmark: () => void;
  onOpenBusca: () => void;
  onOpenSumario: () => void;
  onOpenAssistente?: () => void;
}

export default function PdfReaderFooter({
  currentPage,
  totalPages,
  progress,
  bookmark,
  bookmarksCount = 0,
  onPrev,
  onNext,
  onToggleBookmark,
  onOpenBusca,
  onOpenSumario,
  onOpenAssistente,
}: PdfReaderFooterProps) {
  if (totalPages <= 0) return null;

  const isCurrentBookmarked = bookmark === currentPage;
  const progressRatio = Math.min(1, Math.max(0, currentPage / totalPages));

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'tween', duration: 0.2 }}
      className="fixed z-[1310] inset-x-0 bottom-0 border-t border-white/10 bg-[#0b0b0b] shadow-2xl backdrop-blur-xl"
      style={{
        paddingBottom: 'var(--sai-bottom)',
      }}
    >
      {/* ── Linha 1: Progresso tabular idêntico ao Leitor Nativo ── */}
      <div className="px-5 pt-3 pb-2 flex items-center gap-3 text-[11px] text-white">
        <span className="opacity-60 tabular-nums">
          {currentPage} / {totalPages}
        </span>
        <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full w-full bg-primary"
            style={{ transformOrigin: 'left' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progressRatio }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
          />
        </div>
        <span className="opacity-60 tabular-nums">{Math.round(progress)}%</span>
      </div>

      {/* ── Linha 2: 5 Botões circulares generosos padrão Leitor Nativo (56x56) ── */}
      <div className="flex items-center justify-around px-2 pb-4 pt-2 gap-1 text-white">
        {/* Botão 1: Página Anterior */}
        <button
          onClick={() => {
            haptic.selection();
            onPrev();
          }}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="w-14 h-14 rounded-full flex items-center justify-center transition active:opacity-70 disabled:opacity-30 bg-white/[0.06] hover:bg-white/10 text-white cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Botão 2: Busca no Documento */}
        <button
          onClick={() => {
            haptic.selection();
            onOpenBusca();
          }}
          aria-label="Procurar no PDF"
          title="Buscar no documento"
          className="w-14 h-14 rounded-full flex items-center justify-center transition active:opacity-70 bg-white/[0.06] hover:bg-white/10 text-white cursor-pointer"
        >
          <Search className="w-[22px] h-[22px]" />
        </button>

        {/* Botão 3: Assistente IA Central em Destaque */}
        <button
          onClick={() => {
            haptic.selection();
            if (onOpenAssistente) {
              onOpenAssistente();
            } else {
              onOpenBusca();
            }
          }}
          aria-label="Assistente IA"
          title="Assistente IA"
          className="w-14 h-14 rounded-full flex items-center justify-center transition active:opacity-70 text-white shadow-lg cursor-pointer"
          style={{
            background: 'hsl(var(--primary))',
            boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.5)',
          }}
        >
          <WandSparkles className="w-[20px] h-[20px]" />
        </button>

        {/* Botão 4: Marcadores */}
        <button
          onClick={() => {
            haptic.selection();
            onToggleBookmark();
          }}
          aria-label="Marcador"
          title={isCurrentBookmarked ? 'Página marcada' : 'Marcar página'}
          className="w-14 h-14 rounded-full flex items-center justify-center transition active:opacity-70 relative bg-white/[0.06] hover:bg-white/10 text-white cursor-pointer"
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

        {/* Botão 5: Sumário / TOC */}
        <button
          onClick={() => {
            haptic.selection();
            onOpenSumario();
          }}
          aria-label="Sumário"
          title="Sumário da obra"
          className="w-14 h-14 rounded-full flex items-center justify-center transition active:opacity-70 bg-white/[0.06] hover:bg-white/10 text-white cursor-pointer"
        >
          <List className="w-[22px] h-[22px]" />
        </button>
      </div>
    </motion.div>
  );
}
