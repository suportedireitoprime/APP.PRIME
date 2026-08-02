-- Áreas disponíveis com contagem
CREATE OR REPLACE FUNCTION public.questoes_areas(_nivel text DEFAULT NULL, _cargo_id uuid DEFAULT NULL)
RETURNS TABLE(area text, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(TRIM(q.disciplina), ''), 'Outros') AS area, COUNT(*) AS total
  FROM public.questoes q
  WHERE q.ativo = true
    AND (_nivel IS NULL OR q.nivel = _nivel)
    AND (_cargo_id IS NULL OR q.cargo_id = _cargo_id)
  GROUP BY 1
  ORDER BY 2 DESC;
$$;
GRANT EXECUTE ON FUNCTION public.questoes_areas(text, uuid) TO anon, authenticated, service_role;

-- Sorteia questões para praticar / simulado
CREATE OR REPLACE FUNCTION public.questoes_sortear(
  _nivel text DEFAULT NULL,
  _area text DEFAULT NULL,
  _cargo_id uuid DEFAULT NULL,
  _limit integer DEFAULT 10,
  _excluir_respondidas boolean DEFAULT false
)
RETURNS SETOF public.questoes
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.* FROM public.questoes q
  WHERE q.ativo = true
    AND (_nivel IS NULL OR q.nivel = _nivel)
    AND (_area IS NULL OR COALESCE(NULLIF(TRIM(q.disciplina), ''), 'Outros') = _area)
    AND (_cargo_id IS NULL OR q.cargo_id = _cargo_id)
    AND (
      _excluir_respondidas = false
      OR auth.uid() IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.questoes_respostas r
        WHERE r.questao_id = q.id AND r.user_id = auth.uid() AND r.acertou = true
      )
    )
  ORDER BY random()
  LIMIT GREATEST(1, LEAST(_limit, 100));
$$;
GRANT EXECUTE ON FUNCTION public.questoes_sortear(text, text, uuid, integer, boolean) TO anon, authenticated, service_role;

-- Questões que o usuário errou (aba Revisar)
CREATE OR REPLACE FUNCTION public.questoes_para_revisar(_limit integer DEFAULT 10)
RETURNS SETOF public.questoes
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.* FROM public.questoes q
  WHERE q.ativo = true
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.questoes_respostas r
      WHERE r.questao_id = q.id AND r.user_id = auth.uid() AND r.acertou = false
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.questoes_respostas r2
      WHERE r2.questao_id = q.id AND r2.user_id = auth.uid() AND r2.acertou = true
        AND r2.created_at > (
          SELECT MAX(r3.created_at) FROM public.questoes_respostas r3
          WHERE r3.questao_id = q.id AND r3.user_id = auth.uid() AND r3.acertou = false
        )
    )
  ORDER BY random()
  LIMIT GREATEST(1, LEAST(_limit, 100));
$$;
GRANT EXECUTE ON FUNCTION public.questoes_para_revisar(integer) TO authenticated, service_role;

-- Resumo de desempenho do usuário
CREATE OR REPLACE FUNCTION public.questoes_desempenho()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT COUNT(*) FROM public.questoes_respostas WHERE user_id = auth.uid()), 0),
    'acertos', COALESCE((SELECT COUNT(*) FROM public.questoes_respostas WHERE user_id = auth.uid() AND acertou), 0),
    'hoje', COALESCE((SELECT COUNT(*) FROM public.questoes_respostas WHERE user_id = auth.uid() AND created_at::date = CURRENT_DATE), 0),
    'simulados', COALESCE((SELECT COUNT(*) FROM public.questoes_simulados WHERE user_id = auth.uid() AND status = 'concluido'), 0),
    'por_area', COALESCE((
      SELECT jsonb_agg(x ORDER BY (x->>'total')::int DESC) FROM (
        SELECT jsonb_build_object(
          'area', COALESCE(NULLIF(TRIM(q.disciplina), ''), 'Outros'),
          'total', COUNT(*),
          'acertos', COUNT(*) FILTER (WHERE r.acertou)
        ) AS x
        FROM public.questoes_respostas r
        JOIN public.questoes q ON q.id = r.questao_id
        WHERE r.user_id = auth.uid()
        GROUP BY COALESCE(NULLIF(TRIM(q.disciplina), ''), 'Outros')
      ) s
    ), '[]'::jsonb)
  );
$$;
GRANT EXECUTE ON FUNCTION public.questoes_desempenho() TO authenticated, service_role;