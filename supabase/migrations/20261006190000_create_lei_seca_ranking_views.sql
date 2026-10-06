-- Criação das funções de Ranking para a Lei Seca (RPCs com acesso à foto em auth.users)

-- 1. Ranking Geral
CREATE OR REPLACE FUNCTION public.lei_seca_ranking_geral()
RETURNS TABLE (
  user_id uuid,
  total_estrelas bigint,
  total_licoes_concluidas bigint,
  nome text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    p.user_id,
    SUM(p.estrelas)::bigint as total_estrelas,
    COUNT(p.licao_id) FILTER (WHERE p.concluida = true) as total_licoes_concluidas,
    pr.display_name as nome,
    COALESCE(
      (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id = p.user_id),
      (SELECT raw_user_meta_data->>'picture' FROM auth.users WHERE id = p.user_id)
    ) as avatar_url
  FROM public.lei_seca_progresso p
  JOIN public.profiles pr ON p.user_id = pr.id
  GROUP BY p.user_id, pr.display_name
  ORDER BY total_estrelas DESC;
$$;

-- 2. Ranking por Lei Específica
CREATE OR REPLACE FUNCTION public.lei_seca_ranking_por_lei(trilha_slug text)
RETURNS TABLE (
  user_id uuid,
  total_estrelas bigint,
  total_licoes_concluidas bigint,
  nome text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    p.user_id,
    SUM(p.estrelas)::bigint as total_estrelas,
    COUNT(p.licao_id) FILTER (WHERE p.concluida = true) as total_licoes_concluidas,
    pr.display_name as nome,
    COALESCE(
      (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id = p.user_id),
      (SELECT raw_user_meta_data->>'picture' FROM auth.users WHERE id = p.user_id)
    ) as avatar_url
  FROM public.lei_seca_progresso p
  JOIN public.lei_seca_licoes l ON p.licao_id = l.id
  JOIN public.profiles pr ON p.user_id = pr.id
  WHERE l.trilha_slug = $1
  GROUP BY p.user_id, pr.display_name
  ORDER BY total_estrelas DESC;
$$;
