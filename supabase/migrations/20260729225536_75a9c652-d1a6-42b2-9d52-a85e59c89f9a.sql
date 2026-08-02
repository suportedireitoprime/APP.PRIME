DO $$
DECLARE
  caps jsonb; nova jsonb := '[]'::jsonb; item jsonb; c text; final_md text := '';
BEGIN
  SELECT capitulos_json INTO caps FROM biblioteca_leitura_nativa
  WHERE livro_id='128' AND livro_tabela='biblioteca_classicos';

  FOR item IN SELECT * FROM jsonb_array_elements(caps) LOOP
    c := item->>'conteudo_md';
    -- remove heading/linha em CAIXA ALTA logo após o marcador da primeira página
    c := regexp_replace(c, '^(<!-- page:\d+ -->)\s*\n+#{0,6}\s*[A-ZÁÂÃÀÉÊÍÓÔÕÚÇ][A-ZÁÂÃÀÉÊÍÓÔÕÚÇ0-9 ,;:”“"\-–—''\.]{12,}\s*\n', E'\\1\n', 'n');
    c := regexp_replace(c, '^(<!-- page:\d+ -->)\s*\n+##\s+Em Geral\s*\n', E'\\1\n', 'n');
    c := regexp_replace(c, '\n{3,}', E'\n\n', 'g');
    item := jsonb_set(item, '{conteudo_md}', to_jsonb(btrim(c)));
    nova := nova || jsonb_build_array(item);
    final_md := final_md || CASE WHEN final_md='' THEN '' ELSE E'\n\n---\n\n' END
      || (item->>'capa_md') || E'\n\n' || btrim(c);
  END LOOP;

  UPDATE biblioteca_leitura_nativa
  SET capitulos_json = nova, conteudo_md_refinado = final_md, refino_updated_at = now()
  WHERE livro_id='128' AND livro_tabela='biblioteca_classicos';
END $$;