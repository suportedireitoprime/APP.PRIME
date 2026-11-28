-- RPC agregada para estatísticas das Animações Jurídicas (evita baixar todas as linhas no client)

CREATE OR REPLACE FUNCTION public.get_animacoes_resumo()
RETURNS TABLE (
  animacao_slug text,
  media numeric,
  total_votos bigint,
  total_favoritos bigint,
  total_comentarios bigint,
  minha_nota smallint,
  favoritada boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH uid AS (
    SELECT auth.uid() AS id
  ),
  av AS (
    SELECT
      a.animacao_slug,
      ROUND(AVG(a.nota)::numeric, 1) AS media,
      COUNT(*)::bigint AS total_votos,
      MAX(CASE WHEN a.user_id = (SELECT id FROM uid) THEN a.nota ELSE NULL END)::smallint AS minha_nota
    FROM public.animacoes_avaliacoes a
    GROUP BY a.animacao_slug
  ),
  fav AS (
    SELECT
      f.animacao_slug,
      COUNT(*)::bigint AS total_favoritos,
      BOOL_OR(f.user_id = (SELECT id FROM uid)) AS favoritada
    FROM public.animacoes_favoritos f
    GROUP BY f.animacao_slug
  ),
  com AS (
    SELECT
      c.animacao_slug,
      COUNT(*)::bigint AS total_comentarios
    FROM public.animacoes_comentarios c
    GROUP BY c.animacao_slug
  ),
  slugs AS (
    SELECT animacao_slug FROM av
    UNION
    SELECT animacao_slug FROM fav
    UNION
    SELECT animacao_slug FROM com
  )
  SELECT
    s.animacao_slug,
    COALESCE(av.media, 0) AS media,
    COALESCE(av.total_votos, 0) AS total_votos,
    COALESCE(fav.total_favoritos, 0) AS total_favoritos,
    COALESCE(com.total_comentarios, 0) AS total_comentarios,
    av.minha_nota,
    COALESCE(fav.favoritada, false) AS favoritada
  FROM slugs s
  LEFT JOIN av ON av.animacao_slug = s.animacao_slug
  LEFT JOIN fav ON fav.animacao_slug = s.animacao_slug
  LEFT JOIN com ON com.animacao_slug = s.animacao_slug;
$$;

GRANT EXECUTE ON FUNCTION public.get_animacoes_resumo() TO anon, authenticated;
