import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

interface PilulaArtworkProps {
  livro: LivroNormalizado;
}

export function PilulaArtwork({ livro }: PilulaArtworkProps) {
  return (
    <>
      <div className="w-56 sm:w-72 rounded-2xl overflow-hidden shadow-2xl mb-8 border border-white/10 shrink-0 bg-black/40 relative z-10">
        {livro.capa ? (
          <img src={livro.capa} alt={livro.titulo} className="w-full h-auto block" />
        ) : (
          <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-white/20">
            <BookOpen className="w-16 h-16" />
          </div>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 leading-tight relative z-10">
        {livro.titulo}
      </h1>
      {livro.autor && (
        <p className="text-base text-white/50 text-center mb-8 relative z-10">{livro.autor}</p>
      )}
    </>
  );
}
