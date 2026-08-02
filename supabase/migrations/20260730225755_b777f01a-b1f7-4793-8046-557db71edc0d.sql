-- =========================
-- FLASHCARDS: estrutura base
-- =========================

CREATE TABLE public.flashcards_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  ordem integer NOT NULL DEFAULT 0,
  total_cards integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.flashcards_areas TO anon;
GRANT SELECT ON public.flashcards_areas TO authenticated;
GRANT ALL ON public.flashcards_areas TO service_role;

ALTER TABLE public.flashcards_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Areas de flashcards sao publicas para leitura"
ON public.flashcards_areas FOR SELECT USING (true);


CREATE TABLE public.flashcards_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL,
  tema text,
  subtema text,
  pergunta text NOT NULL,
  resposta text NOT NULL,
  exemplo text,
  base_legal text,
  dica text,
  reforco_conteudo text,
  resumo_ia text,
  lei_id uuid,
  artigo_id uuid,
  artigo_numero text,
  origem text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.flashcards_cards TO authenticated;
GRANT ALL ON public.flashcards_cards TO service_role;

ALTER TABLE public.flashcards_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cards visiveis para usuarios autenticados"
ON public.flashcards_cards FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_fc_cards_area ON public.flashcards_cards (area);
CREATE INDEX idx_fc_cards_area_tema ON public.flashcards_cards (area, tema);
CREATE INDEX idx_fc_cards_area_tema_sub ON public.flashcards_cards (area, tema, subtema);
CREATE INDEX idx_fc_cards_pergunta_trgm ON public.flashcards_cards USING gin (pergunta gin_trgm_ops);


CREATE TABLE public.flashcards_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id uuid NOT NULL REFERENCES public.flashcards_cards(id) ON DELETE CASCADE,
  area text NOT NULL,
  tema text,
  status text NOT NULL DEFAULT 'revisar',
  vezes_revisado integer NOT NULL DEFAULT 0,
  ultima_resposta_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards_progresso TO authenticated;
GRANT ALL ON public.flashcards_progresso TO service_role;

ALTER TABLE public.flashcards_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gerencia seu proprio progresso"
ON public.flashcards_progresso FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_fc_prog_user_status ON public.flashcards_progresso (user_id, status);
CREATE INDEX idx_fc_prog_user_area ON public.flashcards_progresso (user_id, area);
CREATE INDEX idx_fc_prog_user_data ON public.flashcards_progresso (user_id, ultima_resposta_em DESC);


CREATE TABLE public.flashcards_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_cards integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards_decks TO authenticated;
GRANT ALL ON public.flashcards_decks TO service_role;

ALTER TABLE public.flashcards_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gerencia seus proprios decks"
ON public.flashcards_decks FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


CREATE TABLE public.flashcards_deck_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.flashcards_decks(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.flashcards_cards(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deck_id, card_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards_deck_itens TO authenticated;
GRANT ALL ON public.flashcards_deck_itens TO service_role;

ALTER TABLE public.flashcards_deck_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gerencia itens dos seus decks"
ON public.flashcards_deck_itens FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.flashcards_decks d WHERE d.id = deck_id AND d.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.flashcards_decks d WHERE d.id = deck_id AND d.user_id = auth.uid()));

CREATE INDEX idx_fc_deck_itens_deck ON public.flashcards_deck_itens (deck_id);


-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.fc_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_fc_areas_updated BEFORE UPDATE ON public.flashcards_areas
FOR EACH ROW EXECUTE FUNCTION public.fc_touch_updated_at();
CREATE TRIGGER trg_fc_prog_updated BEFORE UPDATE ON public.flashcards_progresso
FOR EACH ROW EXECUTE FUNCTION public.fc_touch_updated_at();
CREATE TRIGGER trg_fc_decks_updated BEFORE UPDATE ON public.flashcards_decks
FOR EACH ROW EXECUTE FUNCTION public.fc_touch_updated_at();


-- =========================
-- FUNÇÕES DE AGREGAÇÃO
-- =========================

CREATE OR REPLACE FUNCTION public.flashcards_resumo_areas()
RETURNS TABLE(area text, slug text, ordem integer, total_cards integer, compreendidos bigint, a_revisar bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.area, a.slug, a.ordem, a.total_cards,
         COALESCE(p.compreendidos, 0), COALESCE(p.a_revisar, 0)
  FROM public.flashcards_areas a
  LEFT JOIN (
    SELECT pr.area,
           COUNT(*) FILTER (WHERE pr.status = 'compreendido') AS compreendidos,
           COUNT(*) FILTER (WHERE pr.status = 'revisar') AS a_revisar
    FROM public.flashcards_progresso pr
    WHERE pr.user_id = auth.uid()
    GROUP BY pr.area
  ) p ON p.area = a.area
  ORDER BY a.ordem, a.area;
$$;

CREATE OR REPLACE FUNCTION public.flashcards_streak()
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d date;
  streak integer := 0;
  cursor_day date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  FOR d IN
    SELECT DISTINCT (ultima_resposta_em AT TIME ZONE 'America/Sao_Paulo')::date AS dia
    FROM public.flashcards_progresso
    WHERE user_id = auth.uid()
    ORDER BY dia DESC
  LOOP
    IF d = cursor_day THEN
      streak := streak + 1;
      cursor_day := cursor_day - 1;
    ELSIF d = cursor_day - 1 AND streak = 0 THEN
      streak := 1;
      cursor_day := d - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  RETURN streak;
END; $$;

CREATE OR REPLACE FUNCTION public.flashcards_dashboard()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'total_cards', (SELECT COUNT(*) FROM public.flashcards_cards),
    'estudados', (SELECT COUNT(*) FROM public.flashcards_progresso WHERE user_id = auth.uid()),
    'compreendidos', (SELECT COUNT(*) FROM public.flashcards_progresso WHERE user_id = auth.uid() AND status = 'compreendido'),
    'a_revisar', (SELECT COUNT(*) FROM public.flashcards_progresso WHERE user_id = auth.uid() AND status = 'revisar'),
    'hoje', (SELECT COUNT(*) FROM public.flashcards_progresso
             WHERE user_id = auth.uid()
               AND ultima_resposta_em >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'),
    'streak', public.flashcards_streak(),
    'atividade_30d', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('dia', dia, 'total', total) ORDER BY dia)
      FROM (
        SELECT (ultima_resposta_em AT TIME ZONE 'America/Sao_Paulo')::date AS dia, COUNT(*) AS total
        FROM public.flashcards_progresso
        WHERE user_id = auth.uid() AND ultima_resposta_em > now() - interval '30 days'
        GROUP BY 1
      ) t
    ), '[]'::jsonb),
    'temas_criticos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('area', area, 'tema', tema, 'total', total) ORDER BY total DESC)
      FROM (
        SELECT area, COALESCE(tema, 'Geral') AS tema, COUNT(*) AS total
        FROM public.flashcards_progresso
        WHERE user_id = auth.uid() AND status = 'revisar'
        GROUP BY 1, 2
        ORDER BY total DESC
        LIMIT 10
      ) t
    ), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.flashcards_resumo_areas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.flashcards_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.flashcards_streak() TO authenticated;