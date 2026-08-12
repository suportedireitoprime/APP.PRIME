import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { fetchProposicaoAutores } from '@/services/radarService';

interface AuthorAvatarProps {
  proposicaoId: string | null;
}

export function AuthorAvatar({ proposicaoId }: AuthorAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
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
        if (autores && autores.length > 0 && autores[0].uri) {
          const uri = autores[0].uri;
          const match = uri.match(/\/deputados\/(\d+)/);
          if (match && match[1]) {
            setPhotoUrl(`https://www.camara.leg.br/internet/deputado/bandep/${match[1]}.jpg`);
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

  if (loading) {
    return (
      <div className="w-14 h-14 rounded-full bg-muted/50 animate-pulse shrink-0 flex items-center justify-center">
        <User className="w-6 h-6 text-muted-foreground/30" />
      </div>
    );
  }

  if (photoUrl) {
    return (
      <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
        <img 
          src={photoUrl} 
          alt="Autor" 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            setPhotoUrl(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-full bg-secondary shrink-0 flex items-center justify-center border border-border">
      <User className="w-6 h-6 text-muted-foreground" />
    </div>
  );
}
