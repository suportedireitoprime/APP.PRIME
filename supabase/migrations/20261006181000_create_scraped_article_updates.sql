CREATE TABLE public.scraped_article_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lei_id TEXT NOT NULL,
    artigo TEXT NOT NULL,
    motivo TEXT NOT NULL,
    ano INTEGER NOT NULL,
    mes TEXT,
    mes_ano TEXT,
    mes_completo TEXT,
    mes_index INTEGER,
    texto_antigo TEXT,
    texto_novo TEXT,
    link_lei TEXT,
    data_completa TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_scraped_article_updates_lei_id ON public.scraped_article_updates(lei_id);
CREATE INDEX idx_scraped_article_updates_ano ON public.scraped_article_updates(ano DESC);

ALTER TABLE public.scraped_article_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura publica de scraped_article_updates" 
    ON public.scraped_article_updates FOR SELECT USING (true);
