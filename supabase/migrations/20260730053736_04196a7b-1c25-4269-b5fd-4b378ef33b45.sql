UPDATE public.biblioteca_leitura_nativa
SET status = 'pronto',
    etapa = 'Finalizado',
    progresso = 6,
    total_etapas = 6,
    erro_detalhe = NULL
WHERE status = 'erro'
  AND refino_status = 'pronto'
  AND conteudo_md_refinado IS NOT NULL;