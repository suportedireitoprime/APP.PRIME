DO $$
DECLARE
  v_md text;
  v_pages text[];
  v_txt text;
  v_n int;
  v_page_txt text[] := ARRAY[]::text[];
  caps jsonb := '[]'::jsonb;
  conteudo text := '';
  parte text;
  final_md text := '';
  prelim text := '';
  i int; p int;
  titulos text[] := ARRAY[
    'Introdução',
    'A Evolução do Conceito Teórico de Acesso à Justiça',
    'O Significado de um Direito ao Acesso Efetivo à Justiça: os Obstáculos a Serem Transpostos',
    'As Soluções Práticas para os Problemas de Acesso à Justiça',
    'Tendências no Uso do Enfoque do Acesso à Justiça',
    'Limitações e Riscos do Enfoque de Acesso à Justiça: uma Advertência Final'
  ];
  inicios int[] := ARRAY[8,10,14,24,49,94];
  fins int[]    := ARRAY[9,13,23,48,93,99];
  palavras int; minutos int; capa text;
BEGIN
  SELECT COALESCE(conteudo_md_refinado, conteudo_md) INTO v_md
  FROM biblioteca_leitura_nativa
  WHERE livro_id = '128' AND livro_tabela = 'biblioteca_classicos';

  IF v_md IS NULL THEN RAISE EXCEPTION 'leitura nativa nao encontrada'; END IF;

  v_page_txt := array_fill(''::text, ARRAY[99]);
  v_pages := string_to_array(v_md, '<!-- page:');

  FOR i IN 1..array_length(v_pages,1) LOOP
    IF v_pages[i] ~ '^[0-9]+ -->' THEN
      v_n := (regexp_match(v_pages[i], '^([0-9]+) -->'))[1]::int;
      v_txt := regexp_replace(v_pages[i], '^[0-9]+ -->', '');
      -- remove blocos de capa de capítulo colados ao fim da página
      v_txt := regexp_replace(v_txt, '\n+-{3,}\s*\n+<!-- capa-capitulo -->.*$', '', 'sn');
      v_txt := regexp_replace(v_txt, '<!-- capa-capitulo -->.*$', '', 'sn');
      -- remove numeração romana isolada de abertura de capítulo
      v_txt := regexp_replace(v_txt, '^\s*#{1,6}\s*[IVX]{1,4}\s*$', '', 'ng');
      -- corrige capitular duplicada do OCR ("O O SIGNIFICADO")
      v_txt := regexp_replace(v_txt, '^\s*O O (SIGNIFICADO)', '\1', 'ng');
      IF v_n BETWEEN 1 AND 99 THEN
        v_page_txt[v_n] := btrim(v_txt);
      END IF;
    END IF;
  END LOOP;

  -- preliminares: páginas 1 a 7
  FOR p IN 1..7 LOOP
    IF btrim(COALESCE(v_page_txt[p],'')) <> '' THEN
      prelim := prelim || CASE WHEN prelim = '' THEN '' ELSE E'\n\n---\n\n' END || v_page_txt[p];
    END IF;
  END LOOP;

  FOR i IN 1..array_length(titulos,1) LOOP
    conteudo := '';
    FOR p IN inicios[i]..fins[i] LOOP
      IF btrim(COALESCE(v_page_txt[p],'')) <> '' THEN
        parte := '<!-- page:' || p || E' -->\n\n' || v_page_txt[p];
        conteudo := conteudo || CASE WHEN conteudo = '' THEN '' ELSE E'\n\n' END || parte;
      END IF;
    END LOOP;
    palavras := array_length(regexp_split_to_array(btrim(conteudo), '\s+'), 1);
    minutos := GREATEST(1, ROUND(palavras / 220.0));
    capa := '<!-- capa-capitulo -->' || E'\n# Capítulo ' || i || E'\n\n## ' || titulos[i]
      || E'\n\n*' || (fins[i] - inicios[i] + 1) || ' páginas · ~' || minutos || ' min de leitura*';
    caps := caps || jsonb_build_array(jsonb_build_object(
      'numero', i,
      'titulo', titulos[i],
      'capa_md', capa,
      'paginas', jsonb_build_array(inicios[i], fins[i]),
      'conteudo_md', conteudo
    ));
    final_md := final_md || CASE WHEN final_md = '' THEN '' ELSE E'\n\n---\n\n' END || capa || E'\n\n' || conteudo;
  END LOOP;

  UPDATE biblioteca_leitura_nativa
  SET conteudo_md_refinado = final_md,
      capitulos_json = caps,
      preliminares_md = NULLIF(prelim, ''),
      refino_status = 'pronto',
      refino_erro = NULL,
      refino_updated_at = now(),
      refino_modelo = 'manual+google/gemini-2.5-flash-lite',
      status = 'pronto',
      etapa = 'Concluído',
      progresso = 6,
      total_etapas = 6
  WHERE livro_id = '128' AND livro_tabela = 'biblioteca_classicos';
END $$;