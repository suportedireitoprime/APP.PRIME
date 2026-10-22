import { useState, useEffect, useMemo, useCallback } from 'react';
import type { BlogPost } from '@/data/blogPosts';
import { supabase } from '@/integrations/supabase/client';

const LOCAL_STORAGE_VIEWS_KEY = 'blog_dynamic_views_v1';

// Base de pontuações de fallback para os 20 melhores artigos de blog de partida
const INITIAL_CURATED_SCORES: Record<string, number> = {
  'artigo-248-frases-famosas-ministros-stf-1KmAtq': 3420,
  'artigo-244-prisao-segunda-instancia-1xK4Pc': 2980,
  'edicao-como-funcionam-leis-01': 2750,
  'o-que-e-direito-guia-honesto-para-iniciantes': 2540,
  'artigo-10-hierarquia-das-normas-a-piramide-de-kelsen': 2310,
  'pregao-como-funciona-1jOahy': 2190,
  'lei-de-acesso-a-informacao-1ILbnY': 2040,
  'sindicancia-pad-1b_LfZ': 1950,
  'o-que-e-o-inquerito-policial-1kDso3': 1880,
  'artigo-232-dez-sumulas-vinculantes-1BOvXL': 1790,
  'como-citar-jurisprudencia-corretamente': 1680,
  'o-que-e-jurisprudencia': 1570,
  'artigo-216-pgr-no-stf-1x_9xL': 1490,
  'direitos-do-trabalhador-atualizacoes-1lIzZz': 1420,
  'o-que-e-vinculo-empregaticio-1na-ng': 1350,
  'artigo-02-artigo-caput-inciso-alinea-e-paragrafo-a-anatomia-de-uma-lei': 1290,
  'artigo-06-o-que-e-a-sancao-presidencial': 1220,
  'leis-principio-legalidade-reserva-legal': 1180,
  'artigo-214-plenario-virtual-como-funciona-o-julgamento-online-1jBJhW': 1140,
  'o-que-e-peticao-inicial-12RD4K': 1090,
};

function readLocalDynamicViews(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writeLocalDynamicViews(views: Record<string, number>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_VIEWS_KEY, JSON.stringify(views));
  } catch {
    /* ignore */
  }
}

export function useBlogDynamicTrending(allPosts: BlogPost[]) {
  const [localViews, setLocalViews] = useState<Record<string, number>>(() => readLocalDynamicViews());
  const [dbScores, setDbScores] = useState<Record<string, number>>({});

  // Carrega contagens do Supabase via RPC blog_posts_trending
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.rpc('blog_posts_trending', { _limit: 50, _dias: 30 });
        if (cancelled || !data || !Array.isArray(data)) return;
        const scores: Record<string, number> = {};
        data.forEach((item: any) => {
          if (item?.post_id) {
            scores[item.post_id] = (item.views || 0) * 10 + (item.score || 0);
          }
        });
        setDbScores(scores);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);


  // Incrementa a métrica dinamicamente ao clicar/ler um artigo
  const registerPostClick = useCallback((postId: string) => {
    setLocalViews((prev) => {
      const updated = {
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      };
      writeLocalDynamicViews(updated);
      return updated;
    });

    // Registra visualização no Supabase em segundo plano
    try {
      supabase.auth.getUser().then(({ data: { user } }) => {
        supabase
          .from('blog_post_views')
          .insert({
            post_id: postId,
            user_id: user?.id ?? null,
            session_id: typeof window !== 'undefined' ? window.sessionStorage.getItem('sid') || null : null,
          })
          .then(() => {});
      });
    } catch {
      /* ignore */
    }
  }, []);

  // Monta e ordena os 20 melhores artigos em alta
  const topTrendingPosts = useMemo(() => {
    if (!allPosts || allPosts.length === 0) return [];

    const scoredPosts = allPosts.map((post) => {
      const baseCurated = INITIAL_CURATED_SCORES[post.id] || 0;
      const dbScore = dbScores[post.id] || 0;
      const userClicks = (localViews[post.id] || 0) * 15; // peso dinâmico imediato no clique

      // Pontuação composta: Curadoria + Supabase + Cliques do usuário
      const totalScore = baseCurated + dbScore + userClicks;
      return { post, totalScore };
    });

    // Ordena do maior score para o menor
    scoredPosts.sort((a, b) => b.totalScore - a.totalScore);

    // Retorna os top 20
    return scoredPosts.slice(0, 20).map((sp) => sp.post);
  }, [allPosts, dbScores, localViews]);

  // Retorna a contagem formatada de visualizações para exibição
  const getPostViewCount = useCallback(
    (postId: string): number => {
      const baseCurated = INITIAL_CURATED_SCORES[postId] || 850;
      const dbScore = dbScores[postId] || 0;
      const userClicks = (localViews[postId] || 0) * 15;
      return baseCurated + dbScore + userClicks;
    },
    [dbScores, localViews],
  );

  return {
    topTrendingPosts,
    registerPostClick,
    getPostViewCount,
  };
}
