-- ============ CATÁLOGOS ============
CREATE TABLE public.videoaulas_areas_direito (
  id BIGINT PRIMARY KEY,
  video_id TEXT NOT NULL,
  playlist_id TEXT,
  area TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  sobre_aula TEXT,
  thumb TEXT,
  ordem INTEGER,
  duracao_segundos INTEGER,
  publicado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videoaulas_areas_direito TO anon;
GRANT SELECT ON public.videoaulas_areas_direito TO authenticated;
GRANT ALL ON public.videoaulas_areas_direito TO service_role;
ALTER TABLE public.videoaulas_areas_direito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catálogo de videoaulas é público" ON public.videoaulas_areas_direito FOR SELECT USING (true);
CREATE INDEX idx_va_areas_area ON public.videoaulas_areas_direito (area, ordem);
CREATE INDEX idx_va_areas_video ON public.videoaulas_areas_direito (video_id);

CREATE TABLE public.videoaulas_iniciante (
  id UUID PRIMARY KEY,
  video_id TEXT NOT NULL,
  playlist_id TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  sobre_aula TEXT,
  thumbnail TEXT,
  ordem INTEGER,
  duracao_segundos INTEGER,
  publicado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videoaulas_iniciante TO anon;
GRANT SELECT ON public.videoaulas_iniciante TO authenticated;
GRANT ALL ON public.videoaulas_iniciante TO service_role;
ALTER TABLE public.videoaulas_iniciante ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catálogo iniciante é público" ON public.videoaulas_iniciante FOR SELECT USING (true);
CREATE INDEX idx_va_ini_ordem ON public.videoaulas_iniciante (ordem);
CREATE INDEX idx_va_ini_video ON public.videoaulas_iniciante (video_id);

CREATE TABLE public.videoaulas_oab_primeira_fase (
  id BIGINT PRIMARY KEY,
  video_id TEXT NOT NULL,
  playlist_id TEXT,
  area TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  sobre_aula TEXT,
  thumbnail TEXT,
  ordem INTEGER,
  duracao_segundos INTEGER,
  publicado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videoaulas_oab_primeira_fase TO anon;
GRANT SELECT ON public.videoaulas_oab_primeira_fase TO authenticated;
GRANT ALL ON public.videoaulas_oab_primeira_fase TO service_role;
ALTER TABLE public.videoaulas_oab_primeira_fase ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catálogo OAB é público" ON public.videoaulas_oab_primeira_fase FOR SELECT USING (true);
CREATE INDEX idx_va_oab_area ON public.videoaulas_oab_primeira_fase (area, ordem);
CREATE INDEX idx_va_oab_video ON public.videoaulas_oab_primeira_fase (video_id);

-- ============ CACHES DE IA ============
CREATE TABLE public.videoaulas_resumo_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT NOT NULL,
  video_id TEXT NOT NULL,
  area TEXT,
  tema TEXT,
  markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tabela, video_id)
);
GRANT SELECT ON public.videoaulas_resumo_cache TO anon;
GRANT SELECT ON public.videoaulas_resumo_cache TO authenticated;
GRANT ALL ON public.videoaulas_resumo_cache TO service_role;
ALTER TABLE public.videoaulas_resumo_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resumos de videoaula são públicos" ON public.videoaulas_resumo_cache FOR SELECT USING (true);

CREATE TABLE public.videoaulas_acao_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT NOT NULL,
  video_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tabela, video_id, tipo)
);
GRANT SELECT ON public.videoaulas_acao_cache TO anon;
GRANT SELECT ON public.videoaulas_acao_cache TO authenticated;
GRANT ALL ON public.videoaulas_acao_cache TO service_role;
ALTER TABLE public.videoaulas_acao_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ações de IA de videoaula são públicas" ON public.videoaulas_acao_cache FOR SELECT USING (true);

-- ============ PROGRESSO / FAVORITOS ============
CREATE TABLE public.videoaulas_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tabela TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  tempo_atual NUMERIC NOT NULL DEFAULT 0,
  duracao NUMERIC NOT NULL DEFAULT 0,
  percentual NUMERIC NOT NULL DEFAULT 0,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tabela, registro_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videoaulas_progresso TO authenticated;
GRANT ALL ON public.videoaulas_progresso TO service_role;
ALTER TABLE public.videoaulas_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário gerencia próprio progresso de videoaula"
  ON public.videoaulas_progresso FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE INDEX idx_va_prog_user ON public.videoaulas_progresso (user_id, updated_at DESC);

CREATE TABLE public.videoaulas_favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tabela TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  titulo TEXT,
  area TEXT,
  thumb TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tabela, registro_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videoaulas_favoritos TO authenticated;
GRANT ALL ON public.videoaulas_favoritos TO service_role;
ALTER TABLE public.videoaulas_favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário gerencia próprios favoritos de videoaula"
  ON public.videoaulas_favoritos FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE INDEX idx_va_fav_user ON public.videoaulas_favoritos (user_id, created_at DESC);

-- ============ TRIGGERS updated_at ============
CREATE OR REPLACE FUNCTION public.videoaulas_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_va_areas_updated BEFORE UPDATE ON public.videoaulas_areas_direito FOR EACH ROW EXECUTE FUNCTION public.videoaulas_touch_updated_at();
CREATE TRIGGER trg_va_ini_updated BEFORE UPDATE ON public.videoaulas_iniciante FOR EACH ROW EXECUTE FUNCTION public.videoaulas_touch_updated_at();
CREATE TRIGGER trg_va_oab_updated BEFORE UPDATE ON public.videoaulas_oab_primeira_fase FOR EACH ROW EXECUTE FUNCTION public.videoaulas_touch_updated_at();
CREATE TRIGGER trg_va_resumo_updated BEFORE UPDATE ON public.videoaulas_resumo_cache FOR EACH ROW EXECUTE FUNCTION public.videoaulas_touch_updated_at();
CREATE TRIGGER trg_va_acao_updated BEFORE UPDATE ON public.videoaulas_acao_cache FOR EACH ROW EXECUTE FUNCTION public.videoaulas_touch_updated_at();
CREATE TRIGGER trg_va_prog_updated BEFORE UPDATE ON public.videoaulas_progresso FOR EACH ROW EXECUTE FUNCTION public.videoaulas_touch_updated_at();