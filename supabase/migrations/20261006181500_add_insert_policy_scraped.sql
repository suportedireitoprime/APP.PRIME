-- Libera permissão total (INSERT, UPDATE, DELETE) para a tabela de atualizações
CREATE POLICY "Permite insercao e delecao scraped_updates" 
    ON public.scraped_article_updates 
    FOR ALL USING (true) WITH CHECK (true);
