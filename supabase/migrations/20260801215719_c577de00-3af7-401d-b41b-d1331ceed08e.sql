-- ===== Leis Cantadas =====
CREATE TABLE public.leis_cantadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  tabela_codigo TEXT NOT NULL,
  artigo_id BIGINT,
  numero_artigo TEXT,
  lei_nome TEXT,
  titulo TEXT,
  letra TEXT,
  letra_emojis JSONB,
  letra_sync JSONB,
  audio_url TEXT NOT NULL,
  storage_path TEXT,
  duracao_seg INTEGER,
  ordem INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leis_cantadas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leis_cantadas TO authenticated;
GRANT ALL ON public.leis_cantadas TO service_role;
ALTER TABLE public.leis_cantadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leis cantadas visiveis para todos" ON public.leis_cantadas FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam leis cantadas" ON public.leis_cantadas FOR ALL TO authenticated USING (public.is_admin_user((select auth.uid()))) WITH CHECK (public.is_admin_user((select auth.uid())));
CREATE INDEX idx_leis_cantadas_slug ON public.leis_cantadas(slug);
CREATE INDEX idx_leis_cantadas_artigo ON public.leis_cantadas(artigo_id);

CREATE TABLE public.resumos_cantados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL,
  materia TEXT NOT NULL,
  tema TEXT NOT NULL,
  resumo_texto TEXT,
  letra TEXT,
  letra_emojis JSONB,
  letra_sync JSONB,
  audio_url TEXT NOT NULL,
  storage_path TEXT,
  duracao_seg INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resumos_cantados TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumos_cantados TO authenticated;
GRANT ALL ON public.resumos_cantados TO service_role;
ALTER TABLE public.resumos_cantados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resumos cantados visiveis para todos" ON public.resumos_cantados FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam resumos cantados" ON public.resumos_cantados FOR ALL TO authenticated USING (public.is_admin_user((select auth.uid()))) WITH CHECK (public.is_admin_user((select auth.uid())));

CREATE TABLE public.leis_cantadas_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  area TEXT NOT NULL,
  materia TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (created_by, area, materia)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leis_cantadas_favoritos TO authenticated;
GRANT ALL ON public.leis_cantadas_favoritos TO service_role;
ALTER TABLE public.leis_cantadas_favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gerencia seus favoritos cantados" ON public.leis_cantadas_favoritos FOR ALL TO authenticated USING ((select auth.uid()) = created_by) WITH CHECK ((select auth.uid()) = created_by);

CREATE TABLE public.leis_cantadas_reacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lei_cantada_id UUID NOT NULL REFERENCES public.leis_cantadas(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lei_cantada_id, created_by, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leis_cantadas_reacoes TO authenticated;
GRANT ALL ON public.leis_cantadas_reacoes TO service_role;
ALTER TABLE public.leis_cantadas_reacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reacoes cantadas visiveis para autenticados" ON public.leis_cantadas_reacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuario gerencia suas reacoes cantadas" ON public.leis_cantadas_reacoes FOR ALL TO authenticated USING ((select auth.uid()) = created_by) WITH CHECK ((select auth.uid()) = created_by);

CREATE TABLE public.leis_cantadas_stats (
  lei_cantada_id UUID NOT NULL PRIMARY KEY REFERENCES public.leis_cantadas(id) ON DELETE CASCADE,
  plays INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leis_cantadas_stats TO anon;
GRANT SELECT, INSERT, UPDATE ON public.leis_cantadas_stats TO authenticated;
GRANT ALL ON public.leis_cantadas_stats TO service_role;
ALTER TABLE public.leis_cantadas_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stats cantadas visiveis para todos" ON public.leis_cantadas_stats FOR SELECT USING (true);
CREATE POLICY "Autenticados atualizam stats cantadas" ON public.leis_cantadas_stats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados incrementam stats cantadas" ON public.leis_cantadas_stats FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.leis_cantadas_resumo_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artigo_id BIGINT NOT NULL,
  tabela_codigo TEXT NOT NULL,
  resumo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (artigo_id, tabela_codigo)
);
GRANT SELECT ON public.leis_cantadas_resumo_cache TO anon;
GRANT SELECT, INSERT, UPDATE ON public.leis_cantadas_resumo_cache TO authenticated;
GRANT ALL ON public.leis_cantadas_resumo_cache TO service_role;
ALTER TABLE public.leis_cantadas_resumo_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cache resumo cantado visivel" ON public.leis_cantadas_resumo_cache FOR SELECT USING (true);
CREATE POLICY "Autenticados gravam cache resumo cantado" ON public.leis_cantadas_resumo_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados atualizam cache resumo cantado" ON public.leis_cantadas_resumo_cache FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ===== Audioaulas (acervo importado) =====
CREATE TABLE public.audioaulas_acervo (
  id BIGSERIAL PRIMARY KEY,
  area TEXT,
  tema TEXT,
  sequencia INTEGER,
  titulo TEXT,
  descricao TEXT,
  url_audio TEXT,
  imagem_miniatura TEXT,
  tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audioaulas_acervo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audioaulas_acervo TO authenticated;
GRANT ALL ON public.audioaulas_acervo TO service_role;
ALTER TABLE public.audioaulas_acervo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audioaulas visiveis para todos" ON public.audioaulas_acervo FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam audioaulas acervo" ON public.audioaulas_acervo FOR ALL TO authenticated USING (public.is_admin_user((select auth.uid()))) WITH CHECK (public.is_admin_user((select auth.uid())));
CREATE INDEX idx_audioaulas_acervo_area ON public.audioaulas_acervo(area);

CREATE TABLE public.audioaulas_stats (
  audio_id BIGINT NOT NULL PRIMARY KEY REFERENCES public.audioaulas_acervo(id) ON DELETE CASCADE,
  plays INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audioaulas_stats TO anon;
GRANT SELECT, INSERT, UPDATE ON public.audioaulas_stats TO authenticated;
GRANT ALL ON public.audioaulas_stats TO service_role;
ALTER TABLE public.audioaulas_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stats audioaulas visiveis para todos" ON public.audioaulas_stats FOR SELECT USING (true);
CREATE POLICY "Autenticados criam stats audioaulas" ON public.audioaulas_stats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados atualizam stats audioaulas" ON public.audioaulas_stats FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- timestamps
CREATE OR REPLACE FUNCTION public.lc_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trg_leis_cantadas_updated BEFORE UPDATE ON public.leis_cantadas FOR EACH ROW EXECUTE FUNCTION public.lc_touch_updated_at();
CREATE TRIGGER trg_resumos_cantados_updated BEFORE UPDATE ON public.resumos_cantados FOR EACH ROW EXECUTE FUNCTION public.lc_touch_updated_at();
CREATE TRIGGER trg_audioaulas_acervo_updated BEFORE UPDATE ON public.audioaulas_acervo FOR EACH ROW EXECUTE FUNCTION public.lc_touch_updated_at();