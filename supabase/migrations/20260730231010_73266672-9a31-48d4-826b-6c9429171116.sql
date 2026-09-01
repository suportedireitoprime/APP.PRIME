CREATE OR REPLACE FUNCTION public.flashcards_sessao(
  _areas text[] DEFAULT NULL,
  _temas text[] DEFAULT NULL,
  _modo text DEFAULT 'todos',
  _deck_id uuid DEFAULT NULL,
  _limit integer DEFAULT 30
)
RETURNS TABLE(
  id uuid, area text, tema text, subtema text, pergunta text, resposta text,
  exemplo text, base_legal text, dica text, reforco_conteudo text,
  artigo_numero text, status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.area, c.tema, c.subtema, c.pergunta, c.resposta,
         c.exemplo, c.base_legal, c.dica, c.reforco_conteudo,
         c.artigo_numero, p.status
  FROM public.flashcards_cards c
  LEFT JOIN public.flashcards_progresso p
    ON p.card_id = c.id AND p.user_id = (select auth.uid())
  WHERE (_deck_id IS NULL OR c.id IN (
          SELECT di.card_id FROM public.flashcards_deck_itens di
          JOIN public.flashcards_decks d ON d.id = di.deck_id
          WHERE di.deck_id = _deck_id AND d.user_id = (select auth.uid())))
    AND (_areas IS NULL OR array_length(_areas,1) IS NULL OR c.area = ANY(_areas))
    AND (_temas IS NULL OR array_length(_temas,1) IS NULL OR c.tema = ANY(_temas))
    AND (
      _modo = 'todos'
      OR (_modo = 'novos' AND p.status IS NULL)
      OR (_modo = 'revisar' AND p.status = 'revisar')
      OR (_modo = 'compreendidos' AND p.status = 'compreendido')
    )
  ORDER BY random()
  LIMIT greatest(coalesce(_limit, 30), 1);
$$;

GRANT EXECUTE ON FUNCTION public.flashcards_sessao(text[], text[], text, uuid, integer) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.flashcards_temas(_area text)
RETURNS TABLE(tema text, total bigint, compreendidos bigint, a_revisar bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(c.tema, 'Geral') AS tema,
         COUNT(*)::bigint,
         COUNT(*) FILTER (WHERE p.status = 'compreendido')::bigint,
         COUNT(*) FILTER (WHERE p.status = 'revisar')::bigint
  FROM public.flashcards_cards c
  LEFT JOIN public.flashcards_progresso p
    ON p.card_id = c.id AND p.user_id = (select auth.uid())
  WHERE c.area = _area
  GROUP BY 1
  ORDER BY 2 DESC;
$$;

GRANT EXECUTE ON FUNCTION public.flashcards_temas(text) TO authenticated, anon, service_role;