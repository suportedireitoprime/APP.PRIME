import { Network, BookOpen } from 'lucide-react';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

interface PilulaExtraActionsProps {
  livro: LivroNormalizado;
  onOpenGraph: () => void;
  onOpenText: () => void;
}

export function PilulaExtraActions({ livro, onOpenGraph, onOpenText }: PilulaExtraActionsProps) {
  if (!livro.isCP) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm mb-8 relative z-10">
      {livro.audio_grafo && (
        <button
          onClick={onOpenGraph}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold"
        >
          <Network className="w-4 h-4 text-primary" />
          Grafo de Conexões
        </button>
      )}
      <button
        onClick={onOpenText}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold"
      >
        <BookOpen className="w-4 h-4 text-primary" />
        Lei Seca
      </button>
    </div>
  );
}
