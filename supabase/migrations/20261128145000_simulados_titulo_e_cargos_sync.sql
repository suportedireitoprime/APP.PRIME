-- Adiciona coluna titulo em simulados, popula os 94 títulos e sincroniza questoes_cargos

ALTER TABLE public.simulados
  ADD COLUMN IF NOT EXISTS titulo text;

-- Popula título das Conceituais a partir de observacao (nome do Livro) e OAB a partir do número do exame em id_externo
WITH info AS (
  SELECT DISTINCT ON (sq.simulado_id)
    sq.simulado_id,
    sq.fonte,
    sq.observacao,
    sq.id_externo,
    s.year
  FROM public.simulado_questions sq
  JOIN public.simulados s ON s.id = sq.simulado_id
  ORDER BY sq.simulado_id, sq.numero_questao NULLS LAST
)
UPDATE public.simulados s
SET titulo = CASE
  WHEN info.fonte = 'Planilha Conceituais' AND NULLIF(TRIM(info.observacao), '') IS NOT NULL
    THEN TRIM(info.observacao)
  WHEN info.id_externo ~ '^OABV2-([0-9]+)-'
    THEN (regexp_match(info.id_externo, '^OABV2-([0-9]+)-'))[1] || 'º Exame OAB (' || COALESCE(info.year::text, '') || ')'
  ELSE 'Simulado ' || COALESCE(info.year::text, '')
END
FROM info
WHERE s.id = info.simulado_id;

-- Sincroniza questoes_cargos: desativa cargos sem questões e atualiza totais reais (OAB e Conceituais)
UPDATE public.questoes_cargos
SET ativo = false, total_questoes = 0
WHERE slug <> 'oab';

UPDATE public.questoes_cargos
SET ativo = true,
    total_questoes = (SELECT count(*)::integer FROM public.questoes WHERE nivel = 'oab' AND ativo = true)
WHERE slug = 'oab';

INSERT INTO public.questoes_cargos (nome, slug, cor, icone, ativo, ordem, total_questoes)
SELECT
  'Conceituais (Direito Penal)',
  'conceituais',
  '#E11D48',
  'BookOpen',
  true,
  2,
  (SELECT count(*)::integer FROM public.questoes WHERE nivel = 'conceitual' AND ativo = true)
WHERE NOT EXISTS (SELECT 1 FROM public.questoes_cargos WHERE slug = 'conceituais');

UPDATE public.questoes_cargos
SET ativo = true,
    total_questoes = (SELECT count(*)::integer FROM public.questoes WHERE nivel = 'conceitual' AND ativo = true)
WHERE slug = 'conceituais';
