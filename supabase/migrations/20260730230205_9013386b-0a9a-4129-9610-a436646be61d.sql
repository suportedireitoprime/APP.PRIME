CREATE OR REPLACE FUNCTION public.flashcards_recontar_areas()
RETURNS TABLE(area text, total integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.flashcards_areas (area, slug, total_cards, ordem)
  SELECT c.area,
         regexp_replace(
           regexp_replace(lower(unaccent_fallback(c.area)), '[^a-z0-9]+', '-', 'g'),
           '(^-|-$)', '', 'g'
         ) AS slug,
         COUNT(*)::int,
         0
  FROM public.flashcards_cards c
  GROUP BY c.area
  ON CONFLICT (area) DO UPDATE SET total_cards = EXCLUDED.total_cards, updated_at = now();

  UPDATE public.flashcards_areas a
  SET ordem = s.rn
  FROM (SELECT id, row_number() OVER (ORDER BY total_cards DESC) AS rn FROM public.flashcards_areas) s
  WHERE s.id = a.id;

  RETURN QUERY SELECT a.area, a.total_cards FROM public.flashcards_areas a ORDER BY a.ordem;
END; $$;

CREATE OR REPLACE FUNCTION public.unaccent_fallback(t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(t,
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
$$;

GRANT EXECUTE ON FUNCTION public.flashcards_recontar_areas() TO service_role;