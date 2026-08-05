-- Funções RPC para agregação ultra-rápida de áreas e temas de resumos jurídicos
CREATE OR REPLACE FUNCTION public.get_resumos_areas_counts()
RETURNS TABLE (area text, total int)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    area, 
    count(*)::int AS total
  FROM public.resumos_juridicos
  WHERE area IS NOT NULL
  GROUP BY area
  ORDER BY area ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_resumos_areas_counts() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_resumos_temas_counts(p_area text)
RETURNS TABLE (tema text, ordem_tema int, total int)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    tema, 
    min(ordem_tema)::int AS ordem_tema, 
    count(*)::int AS total
  FROM public.resumos_juridicos
  WHERE area = p_area AND tema IS NOT NULL
  GROUP BY tema
  ORDER BY min(ordem_tema) ASC NULLS LAST, tema ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_resumos_temas_counts(text) TO anon, authenticated, service_role;
