// @ts-nocheck
import { Network, BookOpen, FileText } from 'lucide-react';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { haptic } from '@/lib/nativeHaptics';

interface PilulaExtraActionsProps {
  livro: LivroNormalizado;
  onOpenGraph: () => void;
  onOpenText: () => void;
  onOpenPdf?: () => void;
}

export function PilulaExtraActions({ livro, onOpenGraph, onOpenText, onOpenPdf }: PilulaExtraActionsProps) {
  const hasText = Boolean(livro.sobre || livro.analiseDetalhada);
  const hasGraph = Boolean(livro.audio_grafo);
  const pdfUrl = livro.fichaCornellPdf || livro.download;
  const hasPdf = Boolean(pdfUrl && onOpenPdf);

  if (!hasText && !hasGraph && !hasPdf) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm mb-8 relative z-10">
      {hasPdf && (
        <button
          onClick={() => {
            haptic.selection();
            onOpenPdf();
          }}
          className="flex items-center gap-2 px-4 min-h-[44px] py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold active:opacity-70 shadow-sm"
          aria-label="Abrir Ficha Cornell em PDF"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          Ficha Cornell
        </button>
      )}
      {hasGraph && (
        <button
          onClick={() => {
            haptic.selection();
            onOpenGraph();
          }}
          className="flex items-center gap-2 px-4 min-h-[44px] py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold active:opacity-70"
          aria-label="Abrir Grafo de Conexões"
        >
          <Network className="w-4 h-4 text-primary" />
          Grafo de Conexões
        </button>
      )}
      {hasText && (
        <button
          onClick={() => {
            haptic.selection();
            onOpenText();
          }}
          className="flex items-center gap-2 px-4 min-h-[44px] py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold active:opacity-70"
          aria-label="Ler Resumo da Obra"
        >
          <BookOpen className="w-4 h-4 text-primary" />
          Resumo da Obra
        </button>
      )}
    </div>
  );
}
