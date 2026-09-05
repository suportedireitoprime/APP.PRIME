import { Network, BookOpen } from 'lucide-react';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { haptic } from '@/lib/nativeHaptics';

interface PilulaExtraActionsProps {
  livro: LivroNormalizado;
  onOpenGraph: () => void;
  onOpenText: () => void;
}

export function PilulaExtraActions({ livro, onOpenGraph, onOpenText }: PilulaExtraActionsProps) {
  const hasText = Boolean(livro.sobre || livro.analiseDetalhada);
  const hasGraph = Boolean(livro.audio_grafo);

  if (!hasText && !hasGraph) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm mb-8 relative z-10">
      {hasGraph && (
        <button
          onClick={() => {
            haptic.selection();
            onOpenGraph();
          }}
          className="flex items-center gap-2 px-4 min-h-[44px] py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold active:scale-95"
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
          className="flex items-center gap-2 px-4 min-h-[44px] py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold active:scale-95"
          aria-label="Ler Lei Seca"
        >
          <BookOpen className="w-4 h-4 text-primary" />
          Lei Seca
        </button>
      )}
    </div>
  );
}
