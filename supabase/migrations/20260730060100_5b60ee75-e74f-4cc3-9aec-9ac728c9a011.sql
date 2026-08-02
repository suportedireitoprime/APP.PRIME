UPDATE public.biblioteca_classicos
SET download = 'https://drive.google.com/file/d/1DMxpIYP6cN2CVByPrnHH-J8ViZZYVNyZ/view?usp=sharing'
WHERE id = 125;

UPDATE public.biblioteca_leitura_nativa
SET status = 'pendente', erro_detalhe = NULL, etapa = NULL, progresso = 0,
    conteudo_md = NULL, conteudo_md_refinado = NULL, sumario_json = NULL,
    capitulos_json = NULL, refino_status = NULL, refino_erro = NULL,
    total_paginas = NULL, updated_at = now()
WHERE livro_tabela = 'biblioteca_classicos' AND livro_id = '125';