CREATE TABLE public.audioaulas_cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL,
  livro_id text NOT NULL,
  livro_tabela text NOT NULL DEFAULT 'biblioteca_estudos',
  titulo text NOT NULL,
  descricao text,
  capa_url text,
  publicado boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  total_aulas integer NOT NULL DEFAULT 0,
  gerado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (livro_tabela, livro_id)
);

CREATE TABLE public.audioaulas_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id uuid NOT NULL REFERENCES public.audioaulas_cursos(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  titulo text NOT NULL,
  resumo text,
  prompt text,
  conteudo text,
  audio_url text,
  duracao_segundos integer,
  publicado boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (curso_id, numero)
);

CREATE INDEX idx_audioaulas_cursos_area ON public.audioaulas_cursos (area);
CREATE INDEX idx_audioaulas_itens_curso ON public.audioaulas_itens (curso_id, ordem);

GRANT SELECT ON public.audioaulas_cursos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audioaulas_cursos TO authenticated;
GRANT ALL ON public.audioaulas_cursos TO service_role;

GRANT SELECT ON public.audioaulas_itens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audioaulas_itens TO authenticated;
GRANT ALL ON public.audioaulas_itens TO service_role;

ALTER TABLE public.audioaulas_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audioaulas_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cursos publicados visiveis"
  ON public.audioaulas_cursos FOR SELECT
  USING (publicado = true OR public.is_admin_user((select auth.uid())));

CREATE POLICY "Admins gerenciam cursos"
  ON public.audioaulas_cursos FOR ALL
  USING (public.is_admin_user((select auth.uid())))
  WITH CHECK (public.is_admin_user((select auth.uid())));

CREATE POLICY "Aulas publicadas visiveis"
  ON public.audioaulas_itens FOR SELECT
  USING (
    public.is_admin_user((select auth.uid()))
    OR (publicado = true AND EXISTS (
      SELECT 1 FROM public.audioaulas_cursos c
      WHERE c.id = curso_id AND c.publicado = true
    ))
  );

CREATE POLICY "Admins gerenciam aulas"
  ON public.audioaulas_itens FOR ALL
  USING (public.is_admin_user((select auth.uid())))
  WITH CHECK (public.is_admin_user((select auth.uid())));

CREATE TRIGGER trg_audioaulas_cursos_updated
  BEFORE UPDATE ON public.audioaulas_cursos
  FOR EACH ROW EXECUTE FUNCTION public.fc_touch_updated_at();

CREATE TRIGGER trg_audioaulas_itens_updated
  BEFORE UPDATE ON public.audioaulas_itens
  FOR EACH ROW EXECUTE FUNCTION public.fc_touch_updated_at();