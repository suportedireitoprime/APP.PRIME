import { PrimeImage } from '@/components/ui/PrimeImage';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

interface PilulaArtworkProps {
  livro: LivroNormalizado;
}

export function PilulaArtwork({ livro }: PilulaArtworkProps) {
  return (
    <>
      <div className="w-56 sm:w-72 rounded-2xl overflow-hidden shadow-2xl mb-8 border border-white/10 shrink-0 bg-black/40 relative z-10">
        <PrimeImage
          src={livro.capa}
          alt={livro.titulo}
          aspectRatio="2/3"
          priority={true}
          targetWidth={600}
          containerClassName="w-full h-full rounded-2xl"
          fallbackIcon={<BookOpen className="w-16 h-16 text-amber-500/70" />}
          fallbackText={livro.titulo}
        />
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
