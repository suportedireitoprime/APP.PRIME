-- Adiciona colunas para suporte a multi-leis intercaladas e ordem round-robin
ALTER TABLE public.narracao_leis_config 
ADD COLUMN IF NOT EXISTS leis_ativas jsonb DEFAULT '["CP_CODIGO_PENAL"]'::jsonb,
ADD COLUMN IF NOT EXISTS indice_lei_atual integer DEFAULT 0;

-- Permissões na tabela narracoes_artigos
GRANT ALL ON public.narracoes_artigos TO anon, authenticated, service_role;

-- Atualizar RLS em narracoes_artigos
ALTER TABLE public.narracoes_artigos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "narracoes_select_public" ON public.narracoes_artigos;
DROP POLICY IF EXISTS "narracoes_select_all" ON public.narracoes_artigos;
DROP POLICY IF EXISTS "narracoes_insert_all" ON public.narracoes_artigos;
DROP POLICY IF EXISTS "narracoes_update_all" ON public.narracoes_artigos;
DROP POLICY IF EXISTS "narracoes_delete_all" ON public.narracoes_artigos;

CREATE POLICY "narracoes_select_all" ON public.narracoes_artigos FOR SELECT USING (true);
CREATE POLICY "narracoes_insert_all" ON public.narracoes_artigos FOR INSERT WITH CHECK (true);
CREATE POLICY "narracoes_update_all" ON public.narracoes_artigos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "narracoes_delete_all" ON public.narracoes_artigos FOR DELETE USING (true);

-- Permissões para atualizar narracao_url em vade_mecum_artigos
GRANT UPDATE ON public.vade_mecum_artigos TO anon, authenticated;
DROP POLICY IF EXISTS "vade_mecum_artigos_update_all" ON public.vade_mecum_artigos;
CREATE POLICY "vade_mecum_artigos_update_all" ON public.vade_mecum_artigos FOR UPDATE USING (true) WITH CHECK (true);
