-- Tabelas de interações das Animações Jurídicas (avaliações 1-5, comentários e favoritos)

CREATE TABLE IF NOT EXISTS public.animacoes_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animacao_slug text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota smallint NOT NULL CHECK (nota BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (animacao_slug, user_id)
);

CREATE INDEX IF NOT EXISTS idx_animacoes_avaliacoes_slug ON public.animacoes_avaliacoes (animacao_slug);
CREATE INDEX IF NOT EXISTS idx_animacoes_avaliacoes_user ON public.animacoes_avaliacoes (user_id);

CREATE TABLE IF NOT EXISTS public.animacoes_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animacao_slug text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nome text NOT NULL,
  texto text NOT NULL CHECK (char_length(trim(texto)) > 0 AND char_length(texto) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_animacoes_comentarios_slug_created ON public.animacoes_comentarios (animacao_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_animacoes_comentarios_user ON public.animacoes_comentarios (user_id);

CREATE TABLE IF NOT EXISTS public.animacoes_favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animacao_slug text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (animacao_slug, user_id)
);

CREATE INDEX IF NOT EXISTS idx_animacoes_favoritos_slug ON public.animacoes_favoritos (animacao_slug);
CREATE INDEX IF NOT EXISTS idx_animacoes_favoritos_user ON public.animacoes_favoritos (user_id);

-- Row Level Security
ALTER TABLE public.animacoes_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animacoes_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animacoes_favoritos ENABLE ROW LEVEL SECURITY;

-- Leitura pública para ranking, médias e comentários
DROP POLICY IF EXISTS "animacoes_avaliacoes_select_all" ON public.animacoes_avaliacoes;
CREATE POLICY "animacoes_avaliacoes_select_all"
  ON public.animacoes_avaliacoes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "animacoes_avaliacoes_insert_own" ON public.animacoes_avaliacoes;
CREATE POLICY "animacoes_avaliacoes_insert_own"
  ON public.animacoes_avaliacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "animacoes_avaliacoes_update_own" ON public.animacoes_avaliacoes;
CREATE POLICY "animacoes_avaliacoes_update_own"
  ON public.animacoes_avaliacoes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "animacoes_avaliacoes_delete_own" ON public.animacoes_avaliacoes;
CREATE POLICY "animacoes_avaliacoes_delete_own"
  ON public.animacoes_avaliacoes FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "animacoes_comentarios_select_all" ON public.animacoes_comentarios;
CREATE POLICY "animacoes_comentarios_select_all"
  ON public.animacoes_comentarios FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "animacoes_comentarios_insert_own" ON public.animacoes_comentarios;
CREATE POLICY "animacoes_comentarios_insert_own"
  ON public.animacoes_comentarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "animacoes_comentarios_delete_own" ON public.animacoes_comentarios;
CREATE POLICY "animacoes_comentarios_delete_own"
  ON public.animacoes_comentarios FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "animacoes_favoritos_select_all" ON public.animacoes_favoritos;
CREATE POLICY "animacoes_favoritos_select_all"
  ON public.animacoes_favoritos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "animacoes_favoritos_insert_own" ON public.animacoes_favoritos;
CREATE POLICY "animacoes_favoritos_insert_own"
  ON public.animacoes_favoritos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "animacoes_favoritos_delete_own" ON public.animacoes_favoritos;
CREATE POLICY "animacoes_favoritos_delete_own"
  ON public.animacoes_favoritos FOR DELETE
  USING (auth.uid() = user_id);
