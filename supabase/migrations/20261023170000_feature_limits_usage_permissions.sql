-- Permissões completas e políticas RLS para tabelas de limites e consumos de cotas
GRANT ALL ON public.feature_limits TO anon, authenticated, service_role;
GRANT ALL ON public.feature_usage TO anon, authenticated, service_role;

ALTER TABLE public.feature_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de feature_limits para todos" ON public.feature_limits;
CREATE POLICY "Permitir leitura de feature_limits para todos" ON public.feature_limits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gravacao de feature_limits" ON public.feature_limits;
CREATE POLICY "Permitir gravacao de feature_limits" ON public.feature_limits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura de feature_usage" ON public.feature_usage;
CREATE POLICY "Permitir leitura de feature_usage" ON public.feature_usage FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao de feature_usage" ON public.feature_usage;
CREATE POLICY "Permitir insercao de feature_usage" ON public.feature_usage FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir alteracao de feature_usage" ON public.feature_usage;
CREATE POLICY "Permitir alteracao de feature_usage" ON public.feature_usage FOR ALL USING (true) WITH CHECK (true);
