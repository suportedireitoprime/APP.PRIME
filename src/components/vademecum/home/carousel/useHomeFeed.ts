import { useState, useEffect, useMemo } from 'react';
import {
  getNoticiasCache,
  prefetchNoticias,
  subscribeNoticias,
  type Noticia,
} from '@/services/noticiasService';
import { newsImg, prefetchImages } from '@/lib/cdnImg';
import { FeedItem } from './carouselTypes';

function interleaveByFonte(items: Noticia[], maxTotal = 12): Noticia[] {
  const juridicas = items.filter((n) => n.fonte === 'migalhas');
  const oab = items.filter((n) => n.fonte === 'gran_oab');
  const concursos = items.filter((n) => n.fonte === 'gran_concursos');

  const result: Noticia[] = [];
  const maxLen = Math.max(juridicas.length, oab.length, concursos.length);

  for (let i = 0; i < maxLen && result.length < maxTotal; i++) {
    if (juridicas[i] && result.length < maxTotal) result.push(juridicas[i]);
    if (oab[i] && result.length < maxTotal) result.push(oab[i]);
    if (concursos[i] && result.length < maxTotal) result.push(concursos[i]);
  }

  return result;
}

export function useHomeFeed() {
  const [noticias, setNoticias] = useState<Noticia[]>(() => getNoticiasCache() ?? []);

  useEffect(() => {
    let mounted = true;
    const unsub = subscribeNoticias((data) => {
      if (mounted && data.length > 0) {
        setNoticias(data);
      }
    });

    void prefetchNoticias();

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const feed: FeedItem[] = useMemo(() => {
    const selected = interleaveByFonte(noticias, 12);
    return selected.map((n) => ({
      kind: 'noticia' as const,
      id: `explorar-${n.id}`,
      data: n,
    }));
  }, [noticias]);

  useEffect(() => {
    if (feed.length > 0) {
      prefetchImages(
        feed.map((item) => newsImg(item.data.imagem_url ?? '', 640)).filter(Boolean)
      );
    }
  }, [feed]);

  return {
    feed,
    feedMode: 'explorar' as const,
  };
}

