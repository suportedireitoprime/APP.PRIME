ALTER TABLE public.questoes_desafios
  ADD COLUMN IF NOT EXISTS trilha text NOT NULL DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS trilha_label text;

UPDATE public.questoes_desafios SET trilha = 'geral', trilha_label = 'Geral' WHERE trilha_label IS NULL;

CREATE INDEX IF NOT EXISTS idx_questoes_desafios_trilha_ordem ON public.questoes_desafios (trilha, ordem);
DROP INDEX IF EXISTS public.idx_questoes_desafios_ordem;
CREATE UNIQUE INDEX IF NOT EXISTS uq_questoes_desafios_trilha_ordem ON public.questoes_desafios (trilha, ordem);

DO $$
DECLARE
  t RECORD;
  n RECORD;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('constitucional','Constitucional','Direito Constitucional'),
      ('penal','Penal','Direito Penal'),
      ('processual-penal','Proc. Penal','Direito Processual Penal'),
      ('administrativo','Administrativo','Direito Administrativo'),
      ('civil','Civil','Direito Civil'),
      ('processual-civil','Proc. Civil','Direito Processual Civil - Novo Código de Processo Civil - CPC 2015'),
      ('tributario','Tributário','Direito Tributário'),
      ('portugues','Português','Português'),
      ('direitos-humanos','Direitos Humanos','Direitos Humanos')
    ) AS x(slug, label, area)
  LOOP
    FOR n IN
      SELECT * FROM (VALUES
        (1,'Nível 1','iniciante',5,'#22C55E'),
        (2,'Nível 2','iniciante',7,'#10B981'),
        (3,'Nível 3','constante',10,'#3B82F6'),
        (4,'Nível 4','disciplinado',15,'#8B5CF6'),
        (5,'Nível 5','implacavel',20,'#F59E0B')
      ) AS y(ordem, titulo, nivel, meta, cor)
    LOOP
      INSERT INTO public.questoes_desafios (ordem, titulo, subtitulo, nivel, meta_diaria, dias, cor, ativo, trilha, trilha_label, area)
      VALUES (n.ordem, n.titulo || ' · ' || t.label, n.meta || ' questões por dia', n.nivel, n.meta, 7, n.cor, true, t.slug, t.label, t.area)
      ON CONFLICT (trilha, ordem) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.questoes_desafio_status();
CREATE FUNCTION public.questoes_desafio_status()
RETURNS TABLE(desafio_id uuid, ordem integer, titulo text, subtitulo text, nivel text, meta_diaria integer, dias integer, cor text, respondidas_hoje integer, dias_concluidos integer, status text, desbloqueado boolean, trilha text, trilha_label text, area text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := (select auth.uid());
BEGIN
  RETURN QUERY
  WITH hoje AS (
    SELECT q.area AS a, COUNT(*)::int AS n
    FROM public.questoes_respostas r
    JOIN public.questoes q ON q.id = r.questao_id
    WHERE r.user_id = _uid AND r.created_at::date = CURRENT_DATE
    GROUP BY q.area
  ),
  total_hoje AS (
    SELECT COALESCE(SUM(n), 0)::int AS n FROM hoje
  ),
  base AS (
    SELECT d.id, d.ordem, d.titulo, d.subtitulo, d.nivel, d.meta_diaria, d.dias, d.cor,
           d.trilha, d.trilha_label, d.area,
           COALESCE(p.dias_concluidos, 0) AS dc,
           COALESCE(p.status, 'ativo') AS st,
           CASE
             WHEN d.area IS NULL THEN (SELECT n FROM total_hoje)
             ELSE COALESCE((SELECT h.n FROM hoje h WHERE h.a = d.area), 0)
           END AS rh
    FROM public.questoes_desafios d
    LEFT JOIN public.questoes_desafios_progresso p
      ON p.desafio_id = d.id AND p.user_id = _uid
    WHERE d.ativo
  )
  SELECT b.id, b.ordem, b.titulo, b.subtitulo, b.nivel, b.meta_diaria, b.dias, b.cor,
         b.rh, b.dc,
         CASE WHEN b.dc >= b.dias THEN 'concluido' ELSE b.st END,
         (b.ordem = 1) OR EXISTS (
           SELECT 1 FROM base b2 WHERE b2.trilha = b.trilha AND b2.ordem = b.ordem - 1 AND b2.dc >= b2.dias
         ),
         b.trilha, b.trilha_label, b.area
  FROM base b
  ORDER BY (b.trilha = 'geral') DESC, b.trilha_label, b.ordem;
END; $function$;