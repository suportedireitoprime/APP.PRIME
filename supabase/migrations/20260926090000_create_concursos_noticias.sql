CREATE TABLE IF NOT EXISTS public.concursos_noticias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    link TEXT NOT NULL UNIQUE,
    resumo TEXT,
    data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.concursos_noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concursos_noticias_select_policy" ON public.concursos_noticias
    FOR SELECT USING (true);
