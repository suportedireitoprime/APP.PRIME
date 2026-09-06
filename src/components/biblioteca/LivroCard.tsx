import { PrimeImage } from '@/components/ui/PrimeImage';
import { useBibliotecaCapa } from '@/hooks/useBibliotecaAsset';
import { useIsPdfCached } from '@/hooks/useIsPdfCached';
import { CloudOff, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export interface LivroUnificado {
  id: string | number;
  titulo: string;
  autor?: string | null;
  sinopse?: string | null;
  capa?: string | null;
  link?: string | null;
  download?: string | null;
  categoria: string;
  area?: string | null;
}

interface LivroCardProps {
  livro: LivroUnificado;
  onClick: () => void;
  priority?: boolean;
}

const LivroCard = ({ livro, onClick, priority }: LivroCardProps) => {
  const capaUrl = useBibliotecaCapa(livro.capa, 300);
  const isDownloaded = useIsPdfCached(livro.download);
  // Cálculo de estimativa de tempo (fallback pseudo-realista até termos dados do backend)
  const tempoEstimado = Math.max(12, Math.floor((livro.titulo.length + (livro.sinopse?.length || 0) * 0.1) * 0.5)) + " min";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-label={`Abrir livro ${livro.titulo}${livro.autor ? ` de ${livro.autor}` : ''}`}
      className="flex-shrink-0 w-[120px] snap-start group text-left relative rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="w-[120px] h-[170px] rounded-lg overflow-hidden bg-muted border border-border shadow-sm group-hover:shadow-md transition-shadow relative">
        {isDownloaded && (
          <div className="absolute top-1.5 right-1.5 z-20 bg-black/60 backdrop-blur-sm p-1 rounded-full border border-white/10 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          </div>
        )}
        <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10 shadow-sm">
          <span className="text-[9px] font-medium text-white/90 tracking-wide">{tempoEstimado}</span>
        </div>
        <PrimeImage
          src={capaUrl}
          alt={`Capa do livro: ${livro.titulo}`}
          aspectRatio="auto"
          targetWidth={300}
          priority={priority}
          fallbackText={livro.titulo}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover"
        />
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
        {livro.titulo}
      </p>
      {livro.autor && (
        <p className="text-[10px] text-muted-foreground line-clamp-1">{livro.autor}</p>
      )}
    </motion.button>
  );
};

export default LivroCard;
