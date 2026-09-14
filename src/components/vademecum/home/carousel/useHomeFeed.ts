import { useState, useEffect } from 'react';
import { getNoticiasCache, subscribeNoticias, type Noticia } from '@/services/noticiasService';
import { newsImg, prefetchImages } from '@/lib/cdnImg';
import { FeedItem } from './carouselTypes';

export function useHomeFeed() {
  const [noticias, setNoticias] = useState<Noticia[]>(() => (getNoticiasCache() ?? []).slice(0, 10));

  // Subscrição em tempo real das notícias jurídicas (Migalhas e cache offline)
  useEffect(() => {
    let mounted = true;
    const unsub = subscribeNoticias((data) => {
      if (mounted && data.length > 0) {
        setNoticias(data.slice(0, 10));
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const feed: FeedItem[] = noticias.map((n) => ({
    kind: 'noticia' as const,
    id: `noticia-${n.id}`,
    data: n,
  }));

  // Pré-carrega as imagens das notícias para abertura instantânea (0ms)
  useEffect(() => {
    if (noticias.length > 0) {
      prefetchImages(
        noticias.map((n) => newsImg(n.imagem_url ?? '', 640))
      );
    }
  }, [noticias]);

  return {
    feed,
    feedMode: 'noticias' as const,
  };
}

