
-- 1. Extensões essenciais no schema extensions
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- 2. Garantir que public.f_unaccent exista e chame extensions.unaccent
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
SET search_path TO 'public', 'extensions'
AS $$
  SELECT extensions.unaccent(coalesce($1, ''));
$$;
GRANT EXECUTE ON FUNCTION public.f_unaccent(text) TO anon, authenticated, service_role;

-- 3. Correção de buscar_conteudo (remove dependência de tematica_juridica_obras)
CREATE OR REPLACE FUNCTION public.buscar_conteudo(_termo text, _tipo text DEFAULT NULL::text, _limit integer DEFAULT 40)
 RETURNS TABLE(entity_type text, entity_id text, entity_table text, title text, subtitle text, snippet text, thumb_url text, route text, score real)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  q text := lower(public.f_unaccent(coalesce(_termo, '')));
  pat text := '%' || q || '%';
  tipos text[];
  is_tudo boolean;
  is_conteudo boolean;
  is_juris boolean;
BEGIN
  IF length(q) < 2 THEN RETURN; END IF;

  IF _tipo IS NULL OR _tipo = 'tudo' THEN
    is_tudo := true;
    tipos := ARRAY['videoaula','livro','blog','resumo','noticia','obra','dicionario','artigo','sumula','tese','informativo','pesquisa'];
  ELSIF _tipo = 'conteudo' THEN
    is_conteudo := true;
    tipos := ARRAY['videoaula','livro','blog','resumo','noticia','obra','dicionario','artigo'];
  ELSIF _tipo = 'jurisprudencia' THEN
    is_juris := true;
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
           (similarity(lower(public.f_unaccent(coalesce(v.titulo,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(v.resumo_md,''))), q))::real AS score
    FROM public.videoaula_conteudo v
    WHERE ('videoaula' = ANY(tipos))
      AND (lower(public.f_unaccent(coalesce(v.titulo,'') || ' ' || coalesce(v.canal,'') || ' ' || coalesce(v.resumo_md,''))) LIKE pat)
    ORDER BY score DESC LIMIT LEAST(_limit, 10)
  ),
  livros AS (
    SELECT * FROM (
      SELECT 'livro'::text AS entity_type, l.id::text AS entity_id, 'biblioteca_classicos'::text AS entity_table,
             l.livro AS title, l.autor AS subtitle, left(coalesce(l.sobre,''),180) AS snippet,
             coalesce(l.capa_horizontal, l.imagem) AS thumb_url, ('/bibliotecas/classicos?livro=' || l.id) AS route,
             (similarity(lower(public.f_unaccent(coalesce(l.livro,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(l.sobre,''))), q))::real AS score
      FROM public.biblioteca_classicos l
      WHERE ('livro' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(l.livro,'')||' '||coalesce(l.autor,'')||' '||coalesce(l.sobre,'')||' '||coalesce(l.area,''))) LIKE pat
      UNION ALL
      SELECT 'livro', l.id::text, 'biblioteca_estudos', l.tema, l.area, left(coalesce(l.sobre,''),180),
             coalesce(l.capa_horizontal, l.capa_livro), ('/bibliotecas/areas?livro=' || l.id),
             (similarity(lower(public.f_unaccent(coalesce(l.tema,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(l.sobre,''))), q))::real
      FROM public.biblioteca_estudos l
      WHERE ('livro' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(l.tema,'')||' '||coalesce(l.area,'')||' '||coalesce(l.sobre,''))) LIKE pat
      UNION ALL
      SELECT 'livro', l.id::text, 'biblioteca_oab', l.tema, l.area, left(coalesce(l.sobre,''),180),
             coalesce(l.capa_horizontal, l.capa_livro), ('/bibliotecas/oab?livro=' || l.id),
             (similarity(lower(public.f_unaccent(coalesce(l.tema,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(l.sobre,''))), q))::real
      FROM public.biblioteca_oab l
      WHERE ('livro' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(l.tema,'')||' '||coalesce(l.area,'')||' '||coalesce(l.sobre,''))) LIKE pat
      UNION ALL
      SELECT 'livro', l.id::text, 'biblioteca_portugues', l.livro, l.autor, left(coalesce(l.sobre,''),180),
             coalesce(l.capa_horizontal, l.imagem), ('/bibliotecas/portugues?livro=' || l.id),
             (similarity(lower(public.f_unaccent(coalesce(l.livro,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(l.sobre,''))), q))::real
      FROM public.biblioteca_portugues l
      WHERE ('livro' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(l.livro,'')||' '||coalesce(l.autor,'')||' '||coalesce(l.sobre,''))) LIKE pat
      UNION ALL
      SELECT 'livro', l.id::text, 'biblioteca_pesquisa_cientifica', l.livro, l.autor, left(coalesce(l.sobre,''),180),
             coalesce(l.capa_horizontal, l.imagem), ('/bibliotecas/pesquisa?livro=' || l.id),
             (similarity(lower(public.f_unaccent(coalesce(l.livro,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(l.sobre,''))), q))::real
      FROM public.biblioteca_pesquisa_cientifica l
      WHERE ('livro' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(l.livro,'')||' '||coalesce(l.autor,'')||' '||coalesce(l.sobre,''))) LIKE pat
      UNION ALL
      SELECT 'livro', l.id::text, 'biblioteca_lideranca', l.livro, l.autor, left(coalesce(l.sobre,''),180),
             coalesce(l.capa_horizontal, l.imagem), ('/bibliotecas/lideranca?livro=' || l.id),
             (similarity(lower(public.f_unaccent(coalesce(l.livro,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(l.sobre,''))), q))::real
      FROM public.biblioteca_lideranca l
      WHERE ('livro' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(l.livro,'')||' '||coalesce(l.autor,'')||' '||coalesce(l.sobre,''))) LIKE pat
      UNION ALL
      SELECT 'livro', l.id::text, 'biblioteca_fora_da_toga', l.livro, l.autor, left(coalesce(l.sobre,''),180),
             coalesce(l.capa_horizontal, l.capa_livro), ('/bibliotecas/fora-da-toga?livro=' || l.id),
             (similarity(lower(public.f_unaccent(coalesce(l.livro,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(l.sobre,''))), q))::real
      FROM public.biblioteca_fora_da_toga l
      WHERE ('livro' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(l.livro,'')||' '||coalesce(l.autor,'')||' '||coalesce(l.sobre,''))) LIKE pat
    ) x
    WHERE ('livro' = ANY(tipos))
    ORDER BY score DESC LIMIT LEAST(_limit, 10)
  ),
  blog AS (
    SELECT 'blog'::text, b.id::text, 'blog_edicao_posts'::text,
           b.titulo, b.categoria, left(coalesce(b.resumo, b.headline_push,''),180),
           coalesce(b.imagem_thumb_url, b.imagem_url), ('/blog/' || b.id),
           (similarity(lower(public.f_unaccent(coalesce(b.titulo,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(b.resumo,''))), q))::real
    FROM public.blog_edicao_posts b
    WHERE ('blog' = ANY(tipos)) AND b.publicado = true
      AND lower(public.f_unaccent(coalesce(b.titulo,'')||' '||coalesce(b.resumo,''))) LIKE pat
    ORDER BY 9 DESC LIMIT LEAST(_limit, 10)
  ),
  resumos AS (
    SELECT 'resumo'::text, r.id::text, 'resumos_juridicos'::text,
           r.tema, coalesce(r.subtema, r.area), left(coalesce(r.markdown,''),180), NULL::text, ('/resumos/' || r.id),
           (similarity(lower(public.f_unaccent(coalesce(r.tema,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(r.subtema,''))), q))::real
    FROM public.resumos_juridicos r
    WHERE ('resumo' = ANY(tipos))
      AND lower(public.f_unaccent(coalesce(r.tema,'')||' '||coalesce(r.subtema,'')||' '||coalesce(r.area,''))) LIKE pat
    ORDER BY 9 DESC LIMIT LEAST(_limit, 10)
  ),
  noticias AS (
    SELECT 'noticia'::text, n.id::text, 'noticias_juridicas'::text,
           n.titulo, coalesce(n.fonte, n.categoria), left(coalesce(n.resumo,''),180), n.imagem_url, ('/noticias?item=' || n.id),
           (similarity(lower(public.f_unaccent(coalesce(n.titulo,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(n.resumo,''))), q))::real
    FROM public.noticias_juridicas n
    WHERE ('noticia' = ANY(tipos))
      AND lower(public.f_unaccent(coalesce(n.titulo,'')||' '||coalesce(n.resumo,''))) LIKE pat
    ORDER BY 9 DESC LIMIT LEAST(_limit, 10)
  ),
  obras AS (
    SELECT NULL::text AS entity_type, NULL::text AS entity_id, NULL::text AS entity_table,
           NULL::text AS title, NULL::text AS subtitle, NULL::text AS snippet,
           NULL::text AS thumb_url, NULL::text AS route, 0::real AS score
    WHERE false
  ),
  dicionario AS (
    SELECT 'dicionario'::text, d.id::text, 'dicionario_juridico'::text,
           d.palavra, 'DicionÃ¡rio jurÃ­dico'::text, left(coalesce(d.significado, d.exemplo_pratico, ''), 220), NULL::text,
           ('/ferramentas/dicionario?termo=' || replace(d.palavra, ' ', '%20')),
           (similarity(lower(public.f_unaccent(coalesce(d.palavra,''))), q) * 4
            + similarity(lower(public.f_unaccent(coalesce(d.significado,''))), q)
            + CASE WHEN lower(public.f_unaccent(coalesce(d.palavra,''))) = q THEN 3 ELSE 0 END
            + CASE WHEN lower(public.f_unaccent(coalesce(d.palavra,''))) LIKE q || '%' THEN 1.5 ELSE 0 END)::real
    FROM public.dicionario_juridico d
    WHERE ('dicionario' = ANY(tipos))
      AND lower(public.f_unaccent(coalesce(d.palavra,'')||' '||coalesce(d.significado,''))) LIKE pat
    ORDER BY 9 DESC LIMIT LEAST(_limit, 10)
  ),
  artigos AS (
    SELECT 'artigo'::text, (l.slug || '#' || a.numero), 'vade_mecum_artigos'::text,
           ('Art. ' || a.numero || ' - ' || coalesce(l.nome_curto, l.nome)), l.nome,
           left(coalesce(a.texto,''), 220), NULL::text,
           ('/legislacao/artigo/' || l.slug || '/' || a.numero),
           (similarity(lower(public.f_unaccent(coalesce(a.texto,''))), q) * 1.5
            + similarity(lower(public.f_unaccent(coalesce(l.nome,''))), q)
            + CASE WHEN lower(public.f_unaccent(coalesce(a.epigrafe,''))) LIKE pat THEN 1.2 ELSE 0 END)::real
    FROM public.vade_mecum_artigos a
    JOIN public.vade_mecum_leis l ON l.id = a.lei_id
    WHERE ('artigo' = ANY(tipos)) AND coalesce(a.revogado, false) = false
      AND lower(public.f_unaccent(coalesce(a.texto,'')||' '||coalesce(a.epigrafe,''))) LIKE pat
    ORDER BY 9 DESC LIMIT LEAST(_limit, 12)
  ),
  sumulas AS (
    SELECT * FROM (
      SELECT 'sumula'::text AS entity_type, ('stf-' || s.numero) AS entity_id, 'sumulas_stf'::text AS entity_table,
             ('SÃºmula ' || s.numero || ' do STF') AS title, coalesce(s.ramo_direito, s.situacao) AS subtitle,
             left(coalesce(s.enunciado,''), 220) AS snippet, NULL::text AS thumb_url,
             ('/jurisprudencia/sumulas-stf?q=' || s.numero) AS route,
             (similarity(lower(public.f_unaccent(coalesce(s.enunciado,''))), q) * 2 + CASE WHEN q = s.numero::text THEN 4 ELSE 0 END)::real AS score
      FROM public.sumulas_stf s
      WHERE ('sumula' = ANY(tipos)) AND (lower(public.f_unaccent(coalesce(s.enunciado,'')||' '||coalesce(s.ramo_direito,''))) LIKE pat OR q = s.numero::text)
      UNION ALL
      SELECT 'sumula', ('stj-' || s.numero), 'sumulas_stj',
             ('SÃºmula ' || s.numero || ' do STJ'), coalesce(s.orgao_julgador, s.situacao),
             left(coalesce(s.enunciado,''), 220), NULL::text,
             ('/jurisprudencia/sumulas-stj?q=' || s.numero),
             (similarity(lower(public.f_unaccent(coalesce(s.enunciado,''))), q) * 2 + CASE WHEN q = s.numero::text THEN 4 ELSE 0 END)::real
      FROM public.sumulas_stj s
      WHERE ('sumula' = ANY(tipos)) AND (lower(public.f_unaccent(coalesce(s.enunciado,'')||' '||coalesce(s.orgao_julgador,''))) LIKE pat OR q = s.numero::text)
    ) y
    WHERE ('sumula' = ANY(tipos))
    ORDER BY score DESC LIMIT LEAST(_limit, 10)
  ),
  teses AS (
    SELECT 'tese'::text, t.id::text, 'jurisprudencia_teses_itens'::text,
           ('Tese ' || t.numero || ' - EdiÃ§Ã£o ' || t.edicao), ('JurisprudÃªncia em Teses - ' || t.tribunal),
           left(coalesce(t.tese,''), 220), NULL::text,
           ('/jurisprudencia/teses-' || lower(t.tribunal) || '?edicao=' || t.edicao),
           (similarity(lower(public.f_unaccent(coalesce(t.tese,''))), q) * 2)::real
    FROM public.jurisprudencia_teses_itens t
    WHERE ('tese' = ANY(tipos))
      AND lower(public.f_unaccent(coalesce(t.tese,'')||' '||coalesce(t.julgados,''))) LIKE pat
    ORDER BY 9 DESC LIMIT LEAST(_limit, 10)
  ),
  informativos AS (
    SELECT * FROM (
      SELECT 'informativo'::text AS entity_type, i.id::text AS entity_id, 'informativos_stj'::text AS entity_table,
             coalesce(i.tema, i.destaque, ('Informativo ' || i.edicao)) AS title,
             ('Informativo STJ n. ' || i.edicao || coalesce(' - ' || i.ramo_direito, '')) AS subtitle,
             left(coalesce(i.destaque, i.inteiro_teor, ''), 220) AS snippet, NULL::text AS thumb_url,
             ('/jurisprudencia/informativos-stj?edicao=' || i.edicao) AS route,
             (similarity(lower(public.f_unaccent(coalesce(i.tema,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(i.destaque,''))), q))::real AS score
      FROM public.informativos_stj i
      WHERE ('informativo' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(i.tema,'')||' '||coalesce(i.destaque,''))) LIKE pat
      UNION ALL
      SELECT 'informativo', i.id::text, 'informativos_stf',
             coalesce(i.tema, i.destaque, ('Informativo ' || i.edicao)),
             ('Informativo STF n. ' || i.edicao || coalesce(' - ' || i.ramo_direito, '')),
             left(coalesce(i.destaque, i.inteiro_teor, ''), 220), NULL::text,
             ('/jurisprudencia/informativos-stf?edicao=' || i.edicao),
             (similarity(lower(public.f_unaccent(coalesce(i.tema,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(i.destaque,''))), q))::real
      FROM public.informativos_stf i
      WHERE ('informativo' = ANY(tipos)) AND lower(public.f_unaccent(coalesce(i.tema,'')||' '||coalesce(i.destaque,''))) LIKE pat
    ) z
    WHERE ('informativo' = ANY(tipos))
    ORDER BY score DESC LIMIT LEAST(_limit, 10)
  ),
  prontas AS (
    SELECT 'pesquisa'::text, p.id::text, 'jurisprudencia_prontas'::text,
           p.titulo, ('Pesquisa pronta - ' || coalesce(p.tribunal, 'STJ') || coalesce(' - ' || p.ramo, '')),
           coalesce(p.assunto, ''), NULL::text,
           ('/jurisprudencia/prontas/' || lower(coalesce(p.tribunal, 'stj')) || '/' || p.slug),
           (similarity(lower(public.f_unaccent(coalesce(p.titulo,''))), q) * 2 + similarity(lower(public.f_unaccent(coalesce(p.assunto,''))), q))::real
    FROM public.jurisprudencia_prontas p
    WHERE ('pesquisa' = ANY(tipos))
      AND lower(public.f_unaccent(coalesce(p.titulo,'')||' '||coalesce(p.assunto,'')||' '||coalesce(p.ramo,''))) LIKE pat
    ORDER BY 9 DESC LIMIT LEAST(_limit, 10)
  )
  SELECT * FROM vids
  UNION ALL SELECT * FROM livros
  UNION ALL SELECT * FROM blog
  UNION ALL SELECT * FROM resumos
  UNION ALL SELECT * FROM noticias
  UNION ALL SELECT * FROM obras
  UNION ALL SELECT * FROM dicionario
  UNION ALL SELECT * FROM artigos
  UNION ALL SELECT * FROM sumulas
  UNION ALL SELECT * FROM teses
  UNION ALL SELECT * FROM informativos
  UNION ALL SELECT * FROM prontas
  ORDER BY score DESC NULLS LAST
  LIMIT _limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.buscar_conteudo(text, text, integer) TO anon, authenticated, service_role;

-- 4. Correção de sugerir_busca (adiciona 'extensions' no search_path e usa f_unaccent)
CREATE OR REPLACE FUNCTION public.sugerir_busca(_prefix text, _limit integer DEFAULT 6)
RETURNS TABLE(termo_display text, top_title text, top_subtitle text, top_thumb_url text, top_route text, top_entity_type text, clicks integer, hits integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  WITH q AS (SELECT lower(public.f_unaccent(coalesce(_prefix, ''))) AS p)
  SELECT sl.termo_display, sl.top_title, sl.top_subtitle, sl.top_thumb_url,
         sl.top_route, sl.top_entity_type, sl.clicks, sl.hits
  FROM public.search_learning sl, q
  WHERE length(q.p) >= 2
    AND sl.top_route IS NOT NULL
    AND (sl.termo_norm LIKE q.p || '%'
         OR sl.termo_norm LIKE '%' || q.p || '%'
         OR q.p = ANY(sl.tags))
  ORDER BY (sl.termo_norm LIKE q.p || '%') DESC, sl.clicks DESC, sl.hits DESC
  LIMIT greatest(_limit, 1);
$$;
GRANT EXECUTE ON FUNCTION public.sugerir_busca(text, integer) TO anon, authenticated, service_role;

-- 5. Correção de registrar_busca_click (adiciona 'extensions' no search_path e usa f_unaccent)
CREATE OR REPLACE FUNCTION public.registrar_busca_click(_termo text, _entity_type text, _entity_id text, _entity_table text, _title text, _subtitle text, _thumb_url text, _route text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  norm_termo text := lower(public.f_unaccent(coalesce(_termo,'')));
  new_tags text[];
BEGIN
  IF length(norm_termo) < 2 OR _entity_id IS NULL OR _route IS NULL THEN RETURN; END IF;

  new_tags := ARRAY(
    SELECT DISTINCT lower(public.f_unaccent(t))
    FROM regexp_split_to_table(coalesce(_title,'') || ' ' || coalesce(_subtitle,''), '\s+') AS t
    WHERE length(t) >= 3
    LIMIT 20
  );

  INSERT INTO public.search_learning AS sl
    (termo_norm, termo_display, hits, clicks,
     top_entity_type, top_entity_id, top_entity_table, top_title, top_subtitle, top_thumb_url, top_route, top_clicks, tags)
  VALUES
    (norm_termo, _termo, 1, 1,
     _entity_type, _entity_id, _entity_table, _title, _subtitle, _thumb_url, _route, 1, new_tags)
  ON CONFLICT (termo_norm) DO UPDATE SET
    hits = sl.hits + 1,
    clicks = sl.clicks + 1,
    termo_display = EXCLUDED.termo_display,
    tags = ARRAY(SELECT DISTINCT unnest(sl.tags || EXCLUDED.tags)),
    top_entity_type = CASE WHEN sl.top_entity_id = EXCLUDED.top_entity_id THEN sl.top_entity_type ELSE
                        CASE WHEN sl.top_clicks < 1 THEN EXCLUDED.top_entity_type ELSE sl.top_entity_type END END,
    top_entity_id = CASE WHEN sl.top_entity_id = EXCLUDED.top_entity_id THEN sl.top_entity_id ELSE
                      CASE WHEN sl.top_clicks < 1 THEN EXCLUDED.top_entity_id ELSE sl.top_entity_id END END,
    top_entity_table = CASE WHEN sl.top_entity_id = EXCLUDED.top_entity_id THEN sl.top_entity_table ELSE
                         CASE WHEN sl.top_clicks < 1 THEN EXCLUDED.top_entity_table ELSE sl.top_entity_table END END,
    top_title = CASE WHEN sl.top_entity_id = EXCLUDED.top_entity_id THEN EXCLUDED.top_title ELSE
                  CASE WHEN sl.top_clicks < 1 THEN EXCLUDED.top_title ELSE sl.top_title END END,
    top_subtitle = CASE WHEN sl.top_entity_id = EXCLUDED.top_entity_id THEN EXCLUDED.top_subtitle ELSE
                     CASE WHEN sl.top_clicks < 1 THEN EXCLUDED.top_subtitle ELSE sl.top_subtitle END END,
    top_thumb_url = CASE WHEN sl.top_entity_id = EXCLUDED.top_entity_id THEN EXCLUDED.top_thumb_url ELSE
                      CASE WHEN sl.top_clicks < 1 THEN EXCLUDED.top_thumb_url ELSE sl.top_thumb_url END END,
    top_route = CASE WHEN sl.top_entity_id = EXCLUDED.top_entity_id THEN EXCLUDED.top_route ELSE
                  CASE WHEN sl.top_clicks < 1 THEN EXCLUDED.top_route ELSE sl.top_route END END,
    top_clicks = CASE WHEN sl.top_entity_id = EXCLUDED.top_entity_id THEN sl.top_clicks + 1 ELSE
                   CASE WHEN sl.top_clicks < 1 THEN 1 ELSE sl.top_clicks END END;
END;
$$;
GRANT EXECUTE ON FUNCTION public.registrar_busca_click(text, text, text, text, text, text, text, text) TO anon, authenticated, service_role;

-- 6. Criação de increment_simulado_acertos para salvar acertos de simulados
CREATE OR REPLACE FUNCTION public.increment_simulado_acertos(h_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_simulados_historico
  SET acertos = coalesce(acertos, 0) + 1
  WHERE id = h_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_simulado_acertos(uuid) TO anon, authenticated, service_role;
