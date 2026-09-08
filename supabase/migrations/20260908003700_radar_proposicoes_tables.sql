CREATE TABLE IF NOT EXISTS public.radar_proposicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_externo TEXT NOT NULL,
    fonte TEXT NOT NULL DEFAULT 'camara',
    sigla_tipo TEXT,
    numero TEXT,
    ano INTEGER,
    ementa TEXT,
    dados_json JSONB,
    autor TEXT,
    autor_foto TEXT,
    url_inteiro_teor TEXT,
    data_apresentacao TIMESTAMP WITH TIME ZONE,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(id_externo, fonte)
);

CREATE TABLE IF NOT EXISTS public.radar_pl_headlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_externo TEXT NOT NULL UNIQUE,
    headline TEXT,
    analise TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.radar_proposicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_pl_headlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.radar_proposicoes;
CREATE POLICY "Public Read Access" ON public.radar_proposicoes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.radar_pl_headlines;
CREATE POLICY "Public Read Access" ON public.radar_pl_headlines FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_radar_proposicoes_data_apresentacao ON public.radar_proposicoes (data_apresentacao);
CREATE INDEX IF NOT EXISTS idx_radar_proposicoes_sigla_tipo ON public.radar_proposicoes (sigla_tipo);

GRANT ALL ON public.radar_proposicoes TO service_role;
GRANT ALL ON public.radar_pl_headlines TO service_role;
GRANT ALL ON public.radar_proposicoes TO anon;
GRANT ALL ON public.radar_pl_headlines TO anon;
GRANT ALL ON public.radar_proposicoes TO authenticated;
GRANT ALL ON public.radar_pl_headlines TO authenticated;
