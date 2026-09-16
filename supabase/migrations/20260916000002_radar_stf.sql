-- Migração para tabelas do STF (Ministros e Pautas)

CREATE TABLE IF NOT EXISTS public.radar_stf_ministros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    indicacao TEXT,
    data_posse DATE,
    foto_url TEXT,
    bio_resumo TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.radar_stf_pautas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    data_sessao DATE NOT NULL,
    tipo_sessao TEXT, -- Presencial ou Virtual
    relator_id UUID REFERENCES public.radar_stf_ministros(id),
    resumo TEXT,
    status TEXT DEFAULT 'agendado',
    link_processo TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE public.radar_stf_ministros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_stf_pautas ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Leitura publica de ministros do STF" ON public.radar_stf_ministros
    FOR SELECT USING (true);

CREATE POLICY "Leitura publica de pautas do STF" ON public.radar_stf_pautas
    FOR SELECT USING (true);

-- Permissões
GRANT ALL ON TABLE public.radar_stf_ministros TO service_role;
GRANT ALL ON TABLE public.radar_stf_pautas TO service_role;
GRANT SELECT ON TABLE public.radar_stf_ministros TO anon;
GRANT SELECT ON TABLE public.radar_stf_pautas TO anon;
GRANT SELECT ON TABLE public.radar_stf_ministros TO authenticated;
GRANT SELECT ON TABLE public.radar_stf_pautas TO authenticated;
