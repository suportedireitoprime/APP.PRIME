-- CADERNOS
CREATE TABLE public.questoes_cadernos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT NOT NULL DEFAULT '#8B5CF6',
  icone TEXT NOT NULL DEFAULT 'notebook',
  filtros JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_estimado INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_cadernos TO authenticated;
GRANT ALL ON public.questoes_cadernos TO service_role;

ALTER TABLE public.questoes_cadernos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cadernos_owner_all" ON public.questoes_cadernos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_questoes_cadernos_user ON public.questoes_cadernos(user_id, created_at DESC);

-- DESAFIOS (catálogo)
CREATE TABLE public.questoes_desafios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  nivel TEXT NOT NULL DEFAULT 'iniciante',
  meta_diaria INTEGER NOT NULL,
  dias INTEGER NOT NULL DEFAULT 7,
  cor TEXT NOT NULL DEFAULT '#8B5CF6',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.questoes_desafios TO authenticated;
GRANT ALL ON public.questoes_desafios TO service_role;

ALTER TABLE public.questoes_desafios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "desafios_read_all" ON public.questoes_desafios
  FOR SELECT TO authenticated USING (ativo);

CREATE UNIQUE INDEX idx_questoes_desafios_ordem ON public.questoes_desafios(ordem);

-- PROGRESSO
CREATE TABLE public.questoes_desafios_progresso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  desafio_id UUID NOT NULL REFERENCES public.questoes_desafios(id) ON DELETE CASCADE,
  dias_concluidos INTEGER NOT NULL DEFAULT 0,
  ultimo_dia_contado DATE,
  iniciado_em DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  concluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, desafio_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_desafios_progresso TO authenticated;
GRANT ALL ON public.questoes_desafios_progresso TO service_role;

ALTER TABLE public.questoes_desafios_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "desafios_prog_owner_all" ON public.questoes_desafios_progresso
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- triggers updated_at
CREATE OR REPLACE FUNCTION public.questoes_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_cadernos_updated BEFORE UPDATE ON public.questoes_cadernos
  FOR EACH ROW EXECUTE FUNCTION public.questoes_touch_updated_at();
CREATE TRIGGER trg_desafios_updated BEFORE UPDATE ON public.questoes_desafios
  FOR EACH ROW EXECUTE FUNCTION public.questoes_touch_updated_at();
CREATE TRIGGER trg_desafios_prog_updated BEFORE UPDATE ON public.questoes_desafios_progresso
  FOR EACH ROW EXECUTE FUNCTION public.questoes_touch_updated_at();

-- STATUS
CREATE OR REPLACE FUNCTION public.questoes_desafio_status()
RETURNS TABLE(
  desafio_id UUID, ordem INTEGER, titulo TEXT, subtitulo TEXT, nivel TEXT,
  meta_diaria INTEGER, dias INTEGER, cor TEXT,
  respondidas_hoje INTEGER, dias_concluidos INTEGER, status TEXT, desbloqueado BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _hoje INTEGER;
BEGIN
  SELECT COUNT(*)::int INTO _hoje
  FROM public.questoes_respostas r
  WHERE r.user_id = _uid AND r.created_at::date = CURRENT_DATE;

  RETURN QUERY
  WITH base AS (
    SELECT d.id, d.ordem, d.titulo, d.subtitulo, d.nivel, d.meta_diaria, d.dias, d.cor,
           COALESCE(p.dias_concluidos, 0) AS dc,
           COALESCE(p.status, 'ativo') AS st
    FROM public.questoes_desafios d
    LEFT JOIN public.questoes_desafios_progresso p
      ON p.desafio_id = d.id AND p.user_id = _uid
    WHERE d.ativo
  )
  SELECT b.id, b.ordem, b.titulo, b.subtitulo, b.nivel, b.meta_diaria, b.dias, b.cor,
         _hoje, b.dc,
         CASE WHEN b.dc >= b.dias THEN 'concluido' ELSE b.st END,
         (b.ordem = 1) OR EXISTS (
           SELECT 1 FROM base b2 WHERE b2.ordem = b.ordem - 1 AND b2.dc >= b2.dias
         )
  FROM base b
  ORDER BY b.ordem;
END; $$;

GRANT EXECUTE ON FUNCTION public.questoes_desafio_status() TO authenticated;

INSERT INTO public.questoes_desafios (ordem, titulo, subtitulo, nivel, meta_diaria, dias, cor) VALUES
 (1, 'Semana 1', '5 questões por dia', 'iniciante', 5, 7, '#22C55E'),
 (2, 'Semana 2', '7 questões por dia', 'iniciante', 7, 7, '#10B981'),
 (3, 'Semana 3', '9 questões por dia', 'constante', 9, 7, '#3B82F6'),
 (4, 'Semana 4', '11 questões por dia', 'constante', 11, 7, '#2563EB'),
 (5, 'Semana 5', '15 questões por dia', 'disciplinado', 15, 7, '#8B5CF6'),
 (6, 'Semana 6', '20 questões por dia', 'disciplinado', 20, 7, '#7C3AED'),
 (7, 'Semana 7', '30 questões por dia', 'implacavel', 30, 7, '#F59E0B'),
 (8, 'Semana 8', '50 questões por dia', 'implacavel', 50, 7, '#EF4444'),
 (9, 'Aprovada de Primeira', '100 questões por dia', 'lendario', 100, 7, '#EAB308');