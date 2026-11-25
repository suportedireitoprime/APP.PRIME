import { useState, useEffect, useMemo } from 'react';
import { getNoticiasCache, subscribeNoticias, type Noticia } from '@/services/noticiasService';
import { AUDIOBOOKS_CATALOGO_META } from '@/data/audiobooksMeta';
import { supabase } from '@/integrations/supabase/client';
import { newsImg, directImg, prefetchImages } from '@/lib/cdnImg';
import bibliotecaFilosofoCover from '@/assets/biblioteca-filosofo-cover.webp';
import audiobooksHeroCover from '@/assets/covers/audiobooks-hero-cover.webp';
import pilulasHeroCover from '@/assets/covers/pilulas-hero-cover.webp';
import bibliotecaCoverImg from '@/assets/biblioteca-cover.webp';
import senadoHeroImg from '@/assets/radar/senado-hero.webp';
import { FeedItem, formatTime } from './carouselTypes';

interface BlogHighlight {
  id: string;
  titulo: string;
  imagem_url: string | null;
  tema: string | null;
  tempo_leitura_min: number | null;
}

export function useHomeFeed() {
  const [noticias, setNoticias] = useState<Noticia[]>(() => (getNoticiasCache() ?? []).slice(0, 3));
  const [blogPost, setBlogPost] = useState<BlogHighlight | null>(null);

  // Subscrição em tempo real das notícias jurídicas
  useEffect(() => {
    let mounted = true;
    const unsub = subscribeNoticias((data) => {
      if (mounted && data.length > 0) {
        setNoticias(data.slice(0, 3));
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Busca leve do artigo mais recente do Blog Jurídico
  useEffect(() => {
    let mounted = true;
    void supabase
      .from('blog_edicao_posts')
      .select('id, titulo, imagem_url, tema, tempo_leitura_min')
      .order('data_publicacao', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (mounted && data && data.length > 0) {
          setBlogPost(data[0] as BlogHighlight);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const feed: FeedItem[] = useMemo(() => {
    const topNoticia = noticias[0];
    const topAudiobook = AUDIOBOOKS_CATALOGO_META[0];

    const noticiaItem: FeedItem = topNoticia
      ? {
          kind: 'noticia',
          id: `explorar-noticia-${topNoticia.id}`,
          badge: 'Notícias',
          title: topNoticia.titulo,
          meta: `${formatTime(topNoticia.data_publicacao)} · Migalhas`,
          image: topNoticia.imagem_url ? newsImg(topNoticia.imagem_url, 640) : senadoHeroImg,
          route: '/noticias',
          noticiaData: topNoticia,
        }
      : {
          kind: 'noticia',
          id: 'explorar-noticia-default',
          badge: 'Notícias',
          title: 'Acompanhe as últimas notícias e julgamentos dos tribunais',
          meta: 'Atualizações diárias · Tribunais',
          image: senadoHeroImg,
          route: '/noticias',
        };

    const livroItem: FeedItem = {
      kind: 'livro',
      id: 'explorar-livro-classicos',
      badge: 'Recomendação de Livro',
      title: 'Clássicos do Direito & Filosofia Jurídica',
      meta: 'Acervo completo · Biblioteca',
      image: bibliotecaFilosofoCover,
      route: '/bibliotecas/classicos',
    };

    const audiobookItem: FeedItem = topAudiobook
      ? {
          kind: 'audiobook',
          id: `explorar-audiobook-${topAudiobook.id}`,
          badge: 'Audiobook',
          title: topAudiobook.titulo,
          meta: `${topAudiobook.autor} · ${topAudiobook.duracaoTotalFormatada || `${topAudiobook.totalCapitulos} caps`}`,
          image: audiobooksHeroCover,
          route: '/audiobooks',
        }
      : {
          kind: 'audiobook',
          id: 'explorar-audiobook-default',
          badge: 'Audiobook',
          title: 'O Caso dos Exploradores de Cavernas',
          meta: 'Lon L. Fuller · Audiobooks',
          image: audiobooksHeroCover,
          route: '/audiobooks',
        };

    const blogItem: FeedItem = blogPost
      ? {
          kind: 'blog',
          id: `explorar-blog-${blogPost.id}`,
          badge: 'Artigo de Blog',
          title: blogPost.titulo,
          meta: `${blogPost.tempo_leitura_min || 4} min · ${blogPost.tema || 'Blog Jurídico'}`,
          image: blogPost.imagem_url ? directImg(blogPost.imagem_url, 640) : bibliotecaCoverImg,
          route: '/blog',
        }
      : {
          kind: 'blog',
          id: 'explorar-blog-default',
          badge: 'Artigo de Blog',
          title: 'Artigos, análises e conceitos essenciais do Direito',
          meta: 'Leitura rápida · Blog Jurídico',
          image: bibliotecaCoverImg,
          route: '/blog',
        };

    const pilulaItem: FeedItem = {
      kind: 'pilula',
      id: 'explorar-pilula-penal',
      badge: 'Pílulas',
      title: 'Pílulas Jurídicas: revise temas-chave em minutos',
      meta: 'Áudio curto + ficha · Pílulas',
      image: pilulasHeroCover,
      route: '/pilulas',
    };

    return [noticiaItem, livroItem, audiobookItem, blogItem, pilulaItem];
  }, [noticias, blogPost]);

  // Pré-carrega as imagens dos 5 cards para exibição instantânea
  useEffect(() => {
    const urls = feed.map((item) => item.image).filter(Boolean);
    if (urls.length > 0) {
      prefetchImages(urls);
    }
  }, [feed]);

  return {
    feed,
    feedMode: 'explorar' as const,
  };
}

