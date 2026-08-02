CREATE OR REPLACE FUNCTION public.aprender_home_resumo()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH uid AS (SELECT auth.uid() AS u),
areas AS (
  SELECT a.id, a.slug, a.nome, a.cor, a.ordem
  FROM aprender_areas a
  WHERE a.slug <> 'livros'
),
aulas AS (
  SELECT au.id, au.titulo, au.ordem, m.area_id
  FROM aprender_aulas au
  JOIN aprender_modulos m ON m.id = au.modulo_id
  WHERE au.status = 'published'
),
blocos AS (
  SELECT b.aula_id, COUNT(*)::int AS total
  FROM aprender_blocos b
  JOIN aulas au ON au.id = b.aula_id
  GROUP BY b.aula_id
),
prog AS (
  SELECT p.aula_id, p.blocos_concluidos, p.concluida_em, p.updated_at
  FROM aprender_progresso_aula p, uid
  WHERE uid.u IS NOT NULL AND p.user_id = uid.u
),
calc AS (
  SELECT
    au.id,
    au.titulo,
    au.ordem,
    au.area_id,
    COALESCE(bl.total, 0) AS blocos_total,
    COALESCE(pr.blocos_concluidos, 0) AS blocos_feitos,
    (pr.concluida_em IS NOT NULL) AS concluida,
    pr.updated_at,
    CASE
      WHEN pr.concluida_em IS NOT NULL THEN 1::numeric
      WHEN COALESCE(bl.total, 0) = 0 THEN 0::numeric
      ELSE LEAST(1::numeric, COALESCE(pr.blocos_concluidos, 0)::numeric / bl.total)
    END AS frac
  FROM aulas au
  LEFT JOIN blocos bl ON bl.aula_id = au.id
  LEFT JOIN prog pr ON pr.aula_id = au.id
),
area_stats AS (
  SELECT
    ar.id, ar.slug, ar.nome, ar.cor, ar.ordem,
    COUNT(c.id)::int AS total_aulas,
    COUNT(c.id) FILTER (WHERE c.concluida)::int AS concluidas,
    COALESCE(ROUND(AVG(c.frac) * 100)::int, 0) AS pct
  FROM areas ar
  LEFT JOIN calc c ON c.area_id = ar.id
  GROUP BY ar.id, ar.slug, ar.nome, ar.cor, ar.ordem
),
andamento AS (
  SELECT c.*, ar.nome AS area_nome, ar.slug AS area_slug, ar.cor AS area_cor
  FROM calc c JOIN areas ar ON ar.id = c.area_id
  WHERE NOT c.concluida AND c.frac > 0
  ORDER BY c.updated_at DESC NULLS LAST
  LIMIT 12
),
proxima AS (
  SELECT c.*, ar.nome AS area_nome, ar.slug AS area_slug, ar.cor AS area_cor
  FROM calc c JOIN areas ar ON ar.id = c.area_id
  WHERE NOT c.concluida AND c.frac = 0
  ORDER BY ar.ordem NULLS LAST, c.ordem NULLS LAST
  LIMIT 1
)
SELECT jsonb_build_object(
  'areas', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', s.id, 'slug', s.slug, 'nome', s.nome, 'cor', s.cor,
      'totalAulas', s.total_aulas, 'concluidas', s.concluidas, 'pct', s.pct
    ) ORDER BY s.ordem NULLS LAST, s.nome) FROM area_stats s), '[]'::jsonb),
  'emAndamento', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'aulaId', a.id, 'titulo', a.titulo, 'areaNome', a.area_nome, 'areaSlug', a.area_slug,
      'areaCor', a.area_cor, 'blocosTotal', a.blocos_total, 'blocosFeitos', a.blocos_feitos,
      'pct', ROUND(a.frac * 100)::int, 'atualizadoEm', a.updated_at
    )) FROM andamento a), '[]'::jsonb),
  'proxima', (SELECT jsonb_build_object(
      'aulaId', p.id, 'titulo', p.titulo, 'areaNome', p.area_nome, 'areaSlug', p.area_slug,
      'areaCor', p.area_cor, 'blocosTotal', p.blocos_total, 'blocosFeitos', 0, 'pct', 0
    ) FROM proxima p),
  'totalAulas', (SELECT COUNT(*)::int FROM calc),
  'totalConcluidas', (SELECT COUNT(*)::int FROM calc WHERE concluida),
  'pctGeral', COALESCE((SELECT ROUND(AVG(frac) * 100)::int FROM calc), 0)
);
$$;

GRANT EXECUTE ON FUNCTION public.aprender_home_resumo() TO anon, authenticated, service_role;