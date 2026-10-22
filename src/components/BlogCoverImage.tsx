import { useEffect, useState, useRef, memo } from 'react';
import { getLocalCoverUri } from '@/services/blogAssetsPrefetch';
import fallbackCover from '@/assets/covers/fundamentos-da-lei.webp';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  postId: string;
  remoteUrl: string;
}

// Cache síncrono em memória para URIs locais e status de carregamento
const localUriCache = new Map<string, string | null>();
const preloadedUrls = new Set<string>();

/**
 * Renderiza a capa do blog com carregamento a 0ms priorizando cache local/remoto quente.
 * Evita engasgos na ponte nativa e previne troca prematura para capa padrão.
 */
function BlogCoverImageComponent({ postId, remoteUrl, className = '', ...rest }: Props) {
  const initialLocal = localUriCache.get(postId);
  const initialSrc = initialLocal || remoteUrl || fallbackCover;
  
  const [src, setSrc] = useState<string>(initialSrc);
  const [loaded, setLoaded] = useState<boolean>(() => preloadedUrls.has(initialSrc));
  const retryCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    
    // Se ainda não temos o cache local deste post e a plataforma é nativa
    if (!localUriCache.has(postId)) {
      getLocalCoverUri(postId)
        .then((local) => {
          if (cancelled) return;
          localUriCache.set(postId, local);
          if (local) {
            setSrc(local);
          } else if (remoteUrl) {
            setSrc(remoteUrl);
          }
        })
        .catch(() => {
          localUriCache.set(postId, null);
        });
    } else if (localUriCache.get(postId)) {
      setSrc(localUriCache.get(postId)!);
    } else if (remoteUrl) {
      setSrc(remoteUrl);
    }

    return () => {
      cancelled = true;
    };
  }, [postId, remoteUrl]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-900/60">
      {/* Esqueleto shimmer elegante de fundo enquanto carrega */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 animate-pulse pointer-events-none" />
      )}
      <img
        src={src}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => {
          setLoaded(true);
          preloadedUrls.add(src);
        }}
        onError={(e) => {
          if (retryCountRef.current < 1 && remoteUrl && src !== remoteUrl) {
            retryCountRef.current += 1;
            setSrc(remoteUrl);
            return;
          }
          if (src !== fallbackCover) {
            setSrc(fallbackCover);
            setLoaded(true);
          }
          rest.onError?.(e);
        }}
        {...rest}
      />
    </div>
  );
}

export default memo(BlogCoverImageComponent);

