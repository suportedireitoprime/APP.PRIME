import { useBibliotecaCapa } from '@/hooks/useBibliotecaAsset';
import { useIsPdfCached } from '@/hooks/useIsPdfCached';
import { CloudOff, CheckCircle2 } from 'lucide-react';

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

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[120px] snap-start group text-left relative"
    >
      <div className="w-[120px] h-[170px] rounded-lg overflow-hidden bg-muted border border-border shadow-sm group-hover:shadow-md transition-shadow relative">
        {isDownloaded && (
          <div className="absolute top-1.5 right-1.5 z-10 bg-black/60 backdrop-blur-sm p-1 rounded-full border border-white/10 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          </div>
        )}
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={livro.titulo}
            className="w-full h-full object-cover"
            loading={priority ? undefined : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 p-2">
            <span className="text-[10px] text-center text-muted-foreground font-medium leading-tight line-clamp-4">
              {livro.titulo}
            </span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
        {livro.titulo}
      </p>
      {livro.autor && (
        <p className="text-[10px] text-muted-foreground line-clamp-1">{livro.autor}</p>
      )}
    </button>
  );
};

export default LivroCard;
