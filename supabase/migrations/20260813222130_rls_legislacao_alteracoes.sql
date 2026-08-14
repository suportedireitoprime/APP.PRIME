CREATE POLICY "Allow public read on legislacao_alteracoes"
  ON public.legislacao_alteracoes
  FOR SELECT
  USING (true);
