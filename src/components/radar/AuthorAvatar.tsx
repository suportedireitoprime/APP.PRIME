import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { fetchProposicaoAutores } from '@/services/radarService';

interface AuthorAvatarProps {
  proposicaoId: string | null;
}

export function AuthorAvatar({ proposicaoId }: AuthorAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proposicaoId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchProposicaoAutores(proposicaoId)
      .then((autores) => {
        if (!isMounted) return;
        if (autores && autores.length > 0) {
          if (autores[0].nome) {
            setAuthorName(autores[0].nome);
          }
          if (autores[0].uri) {
            const uri = autores[0].uri;
            const match = uri.match(/\/deputados\/(\d+)/);
            if (match && match[1]) {
              setPhotoUrl(`https://www.camara.leg.br/internet/deputado/bandep/${match[1]}.jpg`);
            }
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [proposicaoId]);

  return (
    <div className="flex flex-col items-center gap-1.5 w-[68px] shrink-0 pt-0.5">
      {loading ? (
        <div className="w-14 h-14 rounded-full bg-muted/50 animate-pulse flex items-center justify-center">
          <User className="w-6 h-6 text-muted-foreground/30" />
        </div>
      ) : photoUrl ? (
        <div className="w-14 h-14 rounded-full bg-muted overflow-hidden border border-border shrink-0">
          <img 
            src={photoUrl} 
            alt={authorName || 'Autor'} 
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              setPhotoUrl(null);
            }}
          />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
          <User className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      
      {authorName && !loading && (
        <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight line-clamp-2 w-full break-words">
          {authorName}
        </span>
      )}
      {!authorName && loading && (
        <div className="w-12 h-2.5 bg-muted/50 animate-pulse rounded mt-0.5" />
      )}
    </div>
  );
}
