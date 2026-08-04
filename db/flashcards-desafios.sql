-- Desafios de Flashcards: trilhas progressivas com meta diária e dias seguidos.
-- Rode este arquivo no SQL Editor do Supabase (ou via psql) para criar a estrutura.

CREATE TABLE IF NOT EXISTS public.flashcards_desafios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha text NOT NULL DEFAULT 'inicio',
  trilha_label text,
  titulo text NOT NULL,
  subtitulo text,
  area text,
  tema text,
  meta_diaria integer NOT NULL,
  dias integer NOT NULL DEFAULT 1,
  nivel text NOT NULL DEFAULT 'facil',
  cor text NOT NULL DEFAULT '#c2274a',
  premium boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trilha, ordem)
);

GRANT SELECT ON public.flashcards_desafios TO anon;
GRANT SELECT ON public.flashcards_desafios TO authenticated;
GRANT ALL ON public.flashcards_desafios TO service_role;

ALTER TABLE public.flashcards_desafios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Desafios de flashcards sao publicos" ON public.flashcards_desafios;
CREATE POLICY "Desafios de flashcards sao publicos"
  ON public.flashcards_desafios FOR SELECT
  USING (ativo = true);

CREATE INDEX IF NOT EXISTS flashcards_desafios_trilha_ordem_idx
  ON public.flashcards_desafios (trilha, ordem);

CREATE TABLE IF NOT EXISTS public.flashcards_desafios_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  desafio_id uuid NOT NULL REFERENCES public.flashcards_desafios(id) ON DELETE CASCADE,
  dias_concluidos integer NOT NULL DEFAULT 0,
  ultimo_dia_contado date,
  status text NOT NULL DEFAULT 'ativo',
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  concluido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, desafio_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards_desafios_progresso TO authenticated;
GRANT ALL ON public.flashcards_desafios_progresso TO service_role;

ALTER TABLE public.flashcards_desafios_progresso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Progresso proprio de desafios de flashcards" ON public.flashcards_desafios_progresso;
CREATE POLICY "Progresso proprio de desafios de flashcards"
  ON public.flashcards_desafios_progresso FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Status por desafio para o usuário logado.
CREATE OR REPLACE FUNCTION public.flashcards_desafio_status()
RETURNS TABLE (
  desafio_id uuid,
  trilha text,
  trilha_label text,
  titulo text,
  subtitulo text,
  area text,
  tema text,
  meta_diaria integer,
  dias integer,
  nivel text,
  cor text,
  premium boolean,
  ordem integer,
  respondidas_hoje integer,
  dias_concluidos integer,
  status text,
  desbloqueado boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  WITH base AS (
    SELECT d.*, p.dias_concluidos AS p_dias, p.status AS p_status
    FROM public.flashcards_desafios d
    LEFT JOIN public.flashcards_desafios_progresso p
      ON p.desafio_id = d.id AND p.user_id = auth.uid()
    WHERE d.ativo
  ),
  hoje AS (
    SELECT fp.area, count(*)::int AS total
    FROM public.flashcards_progresso fp
    WHERE fp.user_id = auth.uid()
      AND fp.ultima_resposta_em >= date_trunc('day', now())
    GROUP BY fp.area
  ),
  hoje_total AS (
    SELECT coalesce(sum(total), 0)::int AS total FROM hoje
  )
  SELECT
    b.id,
    b.trilha,
    coalesce(b.trilha_label, b.trilha),
    b.titulo,
    b.subtitulo,
    b.area,
    b.tema,
    b.meta_diaria,
    b.dias,
    b.nivel,
    b.cor,
    b.premium,
    b.ordem,
    CASE
      WHEN b.area IS NULL THEN (SELECT total FROM hoje_total)
      ELSE coalesce((SELECT h.total FROM hoje h WHERE h.area = b.area), 0)
    END,
    coalesce(b.p_dias, 0),
    coalesce(b.p_status, 'pendente'),
    (
      b.ordem = 1
      OR EXISTS (
        SELECT 1
        FROM public.flashcards_desafios d2
        JOIN public.flashcards_desafios_progresso p2
          ON p2.desafio_id = d2.id AND p2.user_id = auth.uid()
        WHERE d2.trilha = b.trilha
          AND d2.ordem = b.ordem - 1
          AND p2.status = 'concluido'
      )
    )
  FROM base b
  ORDER BY b.trilha, b.ordem;
$fn$;

GRANT EXECUTE ON FUNCTION public.flashcards_desafio_status() TO authenticated;

-- ============================ SEED ============================
DELETE FROM public.flashcards_desafios;

INSERT INTO public.flashcards_desafios (trilha, trilha_label, titulo, subtitulo, meta_diaria, dias, nivel, cor, premium, ordem)
VALUES
  ('inicio', 'Início', 'Primeiro passo',     '5 cards hoje',             5, 1,  'facil',   '#22c55e', false, 1),
  ('inicio', 'Início', 'Três dias seguidos', '5 cards por dia, 3 dias',  5, 3,  'facil',   '#22c55e', false, 2),
  ('inicio', 'Início', 'Uma semana',         '5 cards por dia, 7 dias',  5, 7,  'medio',   '#22c55e', false, 3),
  ('inicio', 'Início', 'Duas semanas',       '5 cards por dia, 14 dias', 5, 14, 'medio',   '#f59e0b', false, 4),
  ('inicio', 'Início', 'Um mês de rotina',   '5 cards por dia, 30 dias', 5, 30, 'dificil', '#f59e0b', false, 5);

INSERT INTO public.flashcards_desafios (trilha, trilha_label, titulo, subtitulo, meta_diaria, dias, nivel, cor, premium, ordem)
VALUES
  ('constancia', 'Constância', 'Ritmo firme',   '10 cards por dia, 7 dias',   10, 7,   'medio',   '#3b82f6', false, 1),
  ('constancia', 'Constância', 'Duas semanas',  '10 cards por dia, 14 dias',  10, 14,  'medio',   '#3b82f6', true,  2),
  ('constancia', 'Constância', 'Trinta dias',   '10 cards por dia, 30 dias',  10, 30,  'dificil', '#3b82f6', true,  3),
  ('constancia', 'Constância', 'Sessenta dias', '15 cards por dia, 60 dias',  15, 60,  'dificil', '#a78bfa', true,  4),
  ('constancia', 'Constância', 'Cem dias',      '15 cards por dia, 100 dias', 15, 100, 'expert',  '#a78bfa', true,  5);

INSERT INTO public.flashcards_desafios (trilha, trilha_label, titulo, subtitulo, meta_diaria, dias, nivel, cor, premium, ordem)
VALUES
  ('volume', 'Volume', '20 por dia',  '20 cards por dia, 5 dias',   20,  5,  'medio',   '#f97316', true, 1),
  ('volume', 'Volume', '30 por dia',  '30 cards por dia, 7 dias',   30,  7,  'medio',   '#f97316', true, 2),
  ('volume', 'Volume', '50 por dia',  '50 cards por dia, 7 dias',   50,  7,  'dificil', '#f97316', true, 3),
  ('volume', 'Volume', '80 por dia',  '80 cards por dia, 10 dias',  80,  10, 'dificil', '#f87171', true, 4),
  ('volume', 'Volume', '100 por dia', '100 cards por dia, 14 dias', 100, 14, 'expert',  '#f87171', true, 5);

-- Trilhas por área: escalam conforme o total de cards da área.
DO $seed$
DECLARE
  r record;
  i integer;
  metas integer[] := ARRAY[5, 5, 10, 10, 20, 20, 30, 50, 80, 100];
  dias_arr integer[] := ARRAY[1, 3, 7, 14, 7, 21, 30, 30, 30, 30];
  niveis text[] := ARRAY['facil','facil','medio','medio','dificil','dificil','expert','expert','expert','expert'];
  slug text;
BEGIN
  FOR r IN
    SELECT area, count(*)::int AS total
    FROM public.flashcards_cards
    WHERE area IS NOT NULL
    GROUP BY area
    ORDER BY area
  LOOP
    slug := 'area:' || r.area;
    FOR i IN 1..10 LOOP
      IF r.total >= metas[i] * LEAST(dias_arr[i], 7) THEN
        INSERT INTO public.flashcards_desafios
          (trilha, trilha_label, titulo, subtitulo, area, meta_diaria, dias, nivel, cor, premium, ordem)
        VALUES (
          slug,
          r.area,
          r.area || ' - nível ' || i,
          metas[i] || ' cards de ' || r.area || ' por dia, ' || dias_arr[i] || ' dia' ||
            CASE WHEN dias_arr[i] > 1 THEN 's' ELSE '' END,
          r.area,
          metas[i],
          dias_arr[i],
          niveis[i],
          '#c2274a',
          i > 3,
          i
        )
        ON CONFLICT (trilha, ordem) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $seed$;

INSERT INTO public.flashcards_desafios (trilha, trilha_label, titulo, subtitulo, meta_diaria, dias, nivel, cor, premium, ordem)
VALUES
  ('maratona', 'Maratonas', 'Maratona 500',   '25 cards por dia, 20 dias',  25,  20, 'dificil', '#a81f40', true, 1),
  ('maratona', 'Maratonas', 'Maratona 1.000', '50 cards por dia, 20 dias',  50,  20, 'expert',  '#a81f40', true, 2),
  ('maratona', 'Maratonas', 'Maratona 3.000', '100 cards por dia, 30 dias', 100, 30, 'expert',  '#a81f40', true, 3)
ON CONFLICT (trilha, ordem) DO NOTHING;
