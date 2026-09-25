-- ============================================================================
-- MIGRATION: Cache e Persistência de Testes de Narração e Vozes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.narracao_testes_cache (
  id text PRIMARY KEY,
  voz text NOT NULL,
  estilo_id text NOT NULL,
  estilo_nome text,
  texto text NOT NULL,
  texto_hash text NOT NULL,
  audio_url text NOT NULL,
  storage_path text NOT NULL,
  duracao_segundos numeric,
  created_at timestamptz DEFAULT now()
);

-- Índices para busca rápida por voz e texto_hash
CREATE INDEX IF NOT EXISTS idx_narracao_testes_voz_hash ON public.narracao_testes_cache(voz, texto_hash);
CREATE INDEX IF NOT EXISTS idx_narracao_testes_created_at ON public.narracao_testes_cache(created_at DESC);

-- RLS
ALTER TABLE public.narracao_testes_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "narracao_testes_cache_select" ON public.narracao_testes_cache;
CREATE POLICY "narracao_testes_cache_select" ON public.narracao_testes_cache FOR SELECT USING (true);

DROP POLICY IF EXISTS "narracao_testes_cache_all" ON public.narracao_testes_cache;
CREATE POLICY "narracao_testes_cache_all" ON public.narracao_testes_cache FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.narracao_testes_cache TO anon, authenticated, service_role;
