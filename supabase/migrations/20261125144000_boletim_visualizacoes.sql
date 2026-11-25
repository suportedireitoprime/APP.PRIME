-- Tabela para registrar boletins já visualizados por cada usuário
CREATE TABLE IF NOT EXISTS public.boletim_visualizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boletim_id uuid NOT NULL REFERENCES public.boletins_juridicos(id) ON DELETE CASCADE,
  visto_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, boletim_id)
);

CREATE INDEX IF NOT EXISTS idx_boletim_visualizacoes_user_id
  ON public.boletim_visualizacoes (user_id);

ALTER TABLE public.boletim_visualizacoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'boletim_visualizacoes'
      AND policyname = 'Users can view own boletim views'
  ) THEN
    CREATE POLICY "Users can view own boletim views"
      ON public.boletim_visualizacoes
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'boletim_visualizacoes'
      AND policyname = 'Users can insert own boletim views'
  ) THEN
    CREATE POLICY "Users can insert own boletim views"
      ON public.boletim_visualizacoes
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'boletim_visualizacoes'
      AND policyname = 'Users can update own boletim views'
  ) THEN
    CREATE POLICY "Users can update own boletim views"
      ON public.boletim_visualizacoes
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
