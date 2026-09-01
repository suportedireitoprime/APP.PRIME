CREATE TABLE public.lei_seca_favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trilha_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, trilha_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lei_seca_favoritos TO authenticated;
GRANT ALL ON public.lei_seca_favoritos TO service_role;

ALTER TABLE public.lei_seca_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gerencia seus favoritos lei seca"
ON public.lei_seca_favoritos FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);