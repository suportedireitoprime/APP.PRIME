-- Permissões para importação e gestão dos posts do blog
GRANT ALL ON public.blog_edicao_posts TO anon, authenticated, service_role;

ALTER TABLE public.blog_edicao_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura publica de posts do blog" ON public.blog_edicao_posts;
CREATE POLICY "Permitir leitura publica de posts do blog" ON public.blog_edicao_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gravacao de posts do blog" ON public.blog_edicao_posts;
CREATE POLICY "Permitir gravacao de posts do blog" ON public.blog_edicao_posts FOR ALL USING (true) WITH CHECK (true);
