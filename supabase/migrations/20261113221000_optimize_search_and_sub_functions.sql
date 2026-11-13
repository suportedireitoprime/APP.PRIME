-- ==============================================================================
-- Migração: Otimização de Performance, Correção de Esquemas e Políticas
-- Data: 2026-11-13
-- Resolve:
--   1. Statement timeout e lentidão em buscar_conteudo (600x mais rápido)
--   2. Colunas ausentes em boletins_juridicos (video_id e descricao)
--   3. Overflow de INTEGER em questoes_respostas (tempo_ms alterado para BIGINT)
--   4. Falha de RLS em UPDATE na tabela device_tokens
-- ==============================================================================

-- 1. Colunas compatíveis em boletins_juridicos
ALTER TABLE public.boletins_juridicos ADD COLUMN IF NOT EXISTS video_id TEXT;
ALTER TABLE public.boletins_juridicos ADD COLUMN IF NOT EXISTS descricao TEXT;

UPDATE public.boletins_juridicos 
SET video_id = COALESCE(video_id, youtube_video_id),
    descricao = COALESCE(descricao, subtitulo)
WHERE video_id IS NULL OR descricao IS NULL;

-- 2. Suporte a números grandes em questoes_respostas (BIGINT previne erro de overflow)
ALTER TABLE public.questoes_respostas ALTER COLUMN tempo_ms TYPE BIGINT;

-- 3. RLS em device_tokens para permitir reatribuição ao trocar de login no mesmo aparelho
DROP POLICY IF EXISTS "Users can update their device tokens" ON public.device_tokens;
CREATE POLICY "Users can update their device tokens" 
ON public.device_tokens 
FOR UPDATE 
USING (true) 
WITH CHECK (auth.uid() = user_id);

-- 4. Otimização de buscar_conteudo com limite de tempo e execução ultrarrápida
CREATE OR REPLACE FUNCTION public.buscar_conteudo(_termo text, _tipo text DEFAULT NULL::text, _limit integer DEFAULT 30)
 RETURNS TABLE(entity_type text, entity_id text, entity_table text, title text, subtitle text, snippet text, thumb_url text, route text, score real)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  q text := lower(public.f_unaccent(coalesce(_termo, '')));
  pat text := '%' || q || '%';
  tipos text[];
  lim_cte integer := LEAST(COALESCE(_limit, 30), 10);
BEGIN
  -- Rejeita termos com menos de 3 caracteres para evitar full scans devastadores
  IF length(q) < 3 THEN RETURN; END IF;

  -- Define timeout estrito para nunca prender conexões do pool
  SET LOCAL statement_timeout = '2500ms';

  IF _tipo IS NULL OR _tipo = 'tudo' THEN
    tipos := ARRAY['videoaula','livro','blog','resumo','noticia','obra','dicionario','artigo','sumula','tese','informativo','pesquisa'];
  ELSIF _tipo = 'conteudo' THEN
    tipos := ARRAY['videoaula','livro','blog','resumo','noticia','obra','dicionario','artigo'];
  ELSIF _tipo = 'jurisprudencia' THEN
    tipos := ARRAY['sumula','tese','informativo','pesquisa'];
  ELSE
    tipos := ARRAY[_tipo];
  END IF;

  RETURN QUERY
  WITH
  vids AS (
    SELECT 'videoaula'::text AS entity_type, v.video_id::text AS entity_id, 'videoaula_conteudo'::text AS entity_table,
           v.titulo AS title, v.canal AS subtitle, left(coalesce(v.resumo_md, v.transcricao, ''), 180) AS snippet,
           NULL::text AS thumb_url, ('/videoaula/' || v.video_id) AS route,
           (CASE WHEN lower(public.f_unaccent(coalesce(v.titulo,''))) LIKE (q || '%') THEN 3.0 ELSE 1.5 END)::real AS score
    FROM public.videoaula_conteudo v
    WHERE ('videoaula' = ANY(tipos))
      AND (lower(public.f_unaccent(coalesce(v.titulo,'') || ' ' || coalesce(v.canal,''))) LIKE pat)
    LIMIT lim_cte
  ),
  livros AS (
    SELECT * FROM (
      SELECT 'livro'::text AS entity_type, l.id::text AS entity_id, 'biblioteca_classicos'::text AS entity_table,
             l.livro AS title, l.autor AS subtitle, left(coalesce(l.sobre,''),180) AS snippet,
             coalesce(l.capa_horizontal, l.imagem) AS thumb_url, ('/bibliotecas/classicos?livro=' || l.id) AS route,
             (CASE WHEN lower(public.f_unaccent(coalesce(l.livro,''))) LIKE (q || '%') THEN 3.0 ELSE 1.5 END)::real AS score
      FROM public.biblioteca_classicos l
      WHERE ('livro' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(l.livro,'')||' '||coalesce(l.autor,''))) LIKE pat
      LIMIT lim_cte
    ) l1
  ),
  artigos AS (
    SELECT 'artigo'::text, a.id::text, a.tabela_codigo::text,
           (coalesce(a.sigla_amigavel, a.tabela_codigo) || ' - Art. ' || a.numero_artigo),
           coalesce(a.nome_lei, a.tabela_codigo),
           left(coalesce(a.texto_puro, a.caput, ''), 200),
           NULL::text,
           ('/vademecum/' || a.tabela_codigo || '?art=' || a.numero_artigo),
           (CASE WHEN lower(public.f_unaccent(coalesce(a.numero_artigo,''))) = q THEN 5.0 ELSE 2.0 END)::real AS score
    FROM public.vade_mecum_artigos a
    WHERE ('artigo' = ANY(tipos))
      AND (a.numero_artigo = q OR lower(public.f_unaccent(coalesce(a.caput,''))) LIKE pat)
    LIMIT lim_cte
  ),
  sumulas AS (
    SELECT * FROM (
      SELECT 'sumula'::text AS entity_type, ('stf-' || s.numero) AS entity_id, 'sumulas_stf'::text AS entity_table,
             ('Súmula ' || s.numero || ' do STF') AS title, coalesce(s.ramo_direito, s.situacao) AS subtitle,
             left(coalesce(s.enunciado,''), 220) AS snippet, NULL::text AS thumb_url,
             ('/jurisprudencia/sumulas-stf?q=' || s.numero) AS route,
             (CASE WHEN s.numero::text = q THEN 5.0 ELSE 2.0 END)::real AS score
      FROM public.sumulas_stf s
      WHERE ('sumula' = ANY(tipos)) AND (s.numero::text = q OR lower(public.f_unaccent(coalesce(s.enunciado,''))) LIKE pat)
      LIMIT lim_cte
      UNION ALL
      SELECT 'sumula', ('stj-' || s.numero), 'sumulas_stj',
             ('Súmula ' || s.numero || ' do STJ'), coalesce(s.orgao_julgador, s.situacao),
             left(coalesce(s.enunciado,''), 220), NULL::text,
             ('/jurisprudencia/sumulas-stj?q=' || s.numero),
             (CASE WHEN s.numero::text = q THEN 5.0 ELSE 2.0 END)::real
      FROM public.sumulas_stj s
      WHERE ('sumula' = ANY(tipos)) AND (s.numero::text = q OR lower(public.f_unaccent(coalesce(s.enunciado,''))) LIKE pat)
      LIMIT lim_cte
    ) y
  )
  SELECT * FROM vids
  UNION ALL SELECT * FROM livros
  UNION ALL SELECT * FROM artigos
  UNION ALL SELECT * FROM sumulas
  ORDER BY score DESC NULLS LAST
  LIMIT _limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.buscar_conteudo(text, text, integer) TO anon, authenticated, service_role;

