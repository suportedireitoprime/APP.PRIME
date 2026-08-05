ALTER TABLE public.aprender_sumario_sugerido
  ADD COLUMN IF NOT EXISTS gerado_por uuid,
  ADD COLUMN IF NOT EXISTS gerado_em timestamptz;

GRANT SELECT ON public.aprender_sumario_sugerido TO authenticated;
GRANT ALL ON public.aprender_sumario_sugerido TO service_role;

DROP POLICY IF EXISTS "Sugestoes visiveis para autenticados" ON public.aprender_sumario_sugerido;
CREATE POLICY "Sugestoes visiveis para autenticados"
  ON public.aprender_sumario_sugerido FOR SELECT
  TO authenticated
  USING (true);