-- ==============================================================================
-- MIGRAÇÃO: Função flashcards_sessao em PL/pgSQL com branches limpos de execução
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.flashcards_sessao(
  _areas text[] DEFAULT NULL,
  _temas text[] DEFAULT NULL,
  _modo text DEFAULT 'todos',
  _deck_id uuid DEFAULT NULL,
  _limit integer DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  area text,
  tema text,
  subtema text,
  pergunta text,
  resposta text,
  exemplo text,
  base_legal text,
  dica text,
  reforco_conteudo text,
  artigo_numero text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
STABLE
AS $$
BEGIN
  IF _deck_id IS NOT NULL THEN
    RETURN QUERY
    SELECT c.id, c.area, c.tema, c.subtema, c.pergunta, c.resposta,
           c.exemplo, c.base_legal, c.dica, c.reforco_conteudo,
           c.artigo_numero, p.status
    FROM public.flashcards_cards c
    JOIN public.flashcards_deck_itens di ON di.card_id = c.id
    JOIN public.flashcards_decks d ON d.id = di.deck_id AND d.user_id = auth.uid()
    LEFT JOIN public.flashcards_progresso p
      ON p.card_id = c.id AND p.user_id = auth.uid()
    WHERE di.deck_id = _deck_id
      AND (_modo = 'todos'
        OR (_modo = 'novos' AND p.status IS NULL)
        OR (_modo = 'revisar' AND p.status = 'revisar')
        OR (_modo = 'compreendidos' AND p.status = 'compreendido'))
    ORDER BY random()
    LIMIT greatest(coalesce(_limit, 30), 1);
  ELSE
    RETURN QUERY
    SELECT c.id, c.area, c.tema, c.subtema, c.pergunta, c.resposta,
           c.exemplo, c.base_legal, c.dica, c.reforco_conteudo,
           c.artigo_numero, p.status
    FROM public.flashcards_cards c
    LEFT JOIN public.flashcards_progresso p
      ON p.card_id = c.id AND p.user_id = auth.uid()
    WHERE (_areas IS NULL OR array_length(_areas, 1) IS NULL OR c.area = ANY(_areas))
      AND (_temas IS NULL OR array_length(_temas, 1) IS NULL OR c.tema = ANY(_temas))
      AND (
        _modo = 'todos'
        OR (_modo = 'novos' AND p.status IS NULL)
        OR (_modo = 'revisar' AND p.status = 'revisar')
        OR (_modo = 'compreendidos' AND p.status = 'compreendido')
      )
    ORDER BY random()
    LIMIT greatest(coalesce(_limit, 30), 1);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.flashcards_sessao(text[], text[], text, uuid, integer) TO authenticated, anon;
