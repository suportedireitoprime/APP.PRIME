-- Permissões para geração e gestão dos visuais jurídicos (mapas mentais, infográficos, fluxogramas, diagramas)
GRANT ALL ON public.visuais_juridicos TO anon, authenticated, service_role;

ALTER TABLE public.visuais_juridicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura publica de visuais juridicos" ON public.visuais_juridicos;
CREATE POLICY "Permitir leitura publica de visuais juridicos" ON public.visuais_juridicos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gravacao de visuais juridicos" ON public.visuais_juridicos;
CREATE POLICY "Permitir gravacao de visuais juridicos" ON public.visuais_juridicos FOR ALL USING (true) WITH CHECK (true);
