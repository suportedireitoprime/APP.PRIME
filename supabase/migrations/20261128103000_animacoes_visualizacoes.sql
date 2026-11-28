-- Tabela de controle de animações já assistidas pelo usuário (Single Source of Truth no Supabase)

CREATE TABLE IF NOT EXISTS public.animacoes_visualizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animacao_slug text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visto_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (animacao_slug, user_id)
);

CREATE INDEX IF NOT EXISTS idx_animacoes_visualizacoes_user ON public.animacoes_visualizacoes (user_id);
CREATE INDEX IF NOT EXISTS idx_animacoes_visualizacoes_slug ON public.animacoes_visualizacoes (animacao_slug);

ALTER TABLE public.animacoes_visualizacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "animacoes_visualizacoes_select_own" ON public.animacoes_visualizacoes;
CREATE POLICY "animacoes_visualizacoes_select_own"
  ON public.animacoes_visualizacoes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "animacoes_visualizacoes_insert_own" ON public.animacoes_visualizacoes;
CREATE POLICY "animacoes_visualizacoes_insert_own"
  ON public.animacoes_visualizacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "animacoes_visualizacoes_update_own" ON public.animacoes_visualizacoes;
CREATE POLICY "animacoes_visualizacoes_update_own"
  ON public.animacoes_visualizacoes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "animacoes_visualizacoes_delete_own" ON public.animacoes_visualizacoes;
CREATE POLICY "animacoes_visualizacoes_delete_own"
  ON public.animacoes_visualizacoes FOR DELETE
  USING (auth.uid() = user_id);
