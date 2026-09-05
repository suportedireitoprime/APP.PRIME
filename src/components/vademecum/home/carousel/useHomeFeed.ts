import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getNoticiasCache, subscribeNoticias, type Noticia } from '@/services/noticiasService';
import { newsImg, cdnImg, prefetchImages } from '@/lib/cdnImg';
import { BLOG_POSTS, type BlogPost } from '@/data/blogPosts';
import { FeedItem, Livro, MAX_NEWS, shuffle } from './carouselTypes';

export function useHomeFeed() {
  const location = useLocation();
  const [noticias, setNoticias] = useState<Noticia[]>(() => (getNoticiasCache() ?? []).slice(0, MAX_NEWS));
  const [livros, setLivros] = useState<Livro[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [feedMode, setFeedMode] = useState<'initial' | 'with_news'>('initial');
  const hasNavigatedRef = useRef(false);

  // Monitora a navegação para mudar o modo do feed ao voltar para a Home
  useEffect(() => {
    if (location.pathname !== '/') {
      hasNavigatedRef.current = true;
    } else if (location.pathname === '/' && hasNavigatedRef.current && feedMode === 'initial') {
      setFeedMode('with_news');
    }
  }, [location.pathname, feedMode]);

  // Busca os dados apenas uma vez (livros e subscrição de notícias)
  useEffect(() => {
    let mounted = true;

    supabase
      .from('biblioteca_classicos')
      .select('id, livro, autor, area, imagem, sobre, link, download, capa_horizontal, ano_lancamento, editora, curiosidades, analise_detalhada, audio_resumo_url, paginas, minutos_leitura')
      .not('imagem', 'is', null)
      .limit(30)
      .then((res) => {
        if (mounted && res.data) {
          setLivros(res.data as unknown as Livro[]);
          setDataLoaded(true);
        }
      });

    const unsub = subscribeNoticias((data) => {
      if (mounted) {
        setNoticias(data.slice(0, 20));
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Constrói o feed de itens do carrossel baseado no modo atual
  useEffect(() => {
    if (!dataLoaded && feedMode === 'initial') {
      const pool: FeedItem[] = BLOG_POSTS.slice(0, 8).map((x) => ({
        kind: 'blog',
        id: `blog-${x.id}-${Math.random()}`,
        data: x,
      }));
      setFeed(shuffle(pool));
      return;
    }

    const pool: FeedItem[] = [];
    const pick = (arr: any[], kind: string, count: number) => {
      return shuffle(arr)
        .slice(0, count)
        .map((x) => ({ kind, id: `${kind}-${x.id}-${Math.random()}`, data: x } as FeedItem));
    };

    if (feedMode === 'initial') {
      pool.push(...pick(livros, 'livro', 4));
      pool.push(...pick(BLOG_POSTS, 'blog', 4));
    } else {
      const maxNoticias = Math.min(noticias.length, 4);
      pool.push(...pick(noticias, 'noticia', maxNoticias));
      pool.push(...pick(livros, 'livro', 2));
      pool.push(...pick(BLOG_POSTS, 'blog', Math.max(2, 8 - pool.length)));
    }

    if (pool.length < 8) {
      const missing = 8 - pool.length;
      const remainingBlogs = BLOG_POSTS.filter((b) => !pool.find((p) => p.kind === 'blog' && p.data.id === b.id));
      pool.push(...pick(remainingBlogs, 'blog', missing));
    }

    const selectedFeed = shuffle(pool).slice(0, 8);
    setFeed(selectedFeed);

    // Prefetch all covers/images for the active feed to ensure 0ms load
    prefetchImages(
      selectedFeed.map((item) => {
        if (item.kind === 'livro') return cdnImg(item.data.imagem, 240);
        if (item.kind === 'blog') return cdnImg((item.data as BlogPost).imagem_url ?? '', 640);
        if (item.kind === 'noticia') return newsImg((item.data as Noticia).imagem_url ?? '', 640);
        return null;
      })
    );
  }, [feedMode, dataLoaded, livros, noticias.length]);

  return {
    feed,
    feedMode,
  };
}
