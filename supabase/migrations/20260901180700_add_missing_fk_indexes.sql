-- =============================================================================
-- Adiciona índices em colunas de Foreign Key que não possuem índice cobridor.
-- Recomendação do Supabase Linter (lint 0001_unindexed_foreign_keys).
-- Sem índice, CASCADE deletes e JOINs fazem sequential scan na tabela filha.
-- =============================================================================

DO $$ BEGIN

-- aprender_dominio_area.area_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aprender_dominio_area' AND indexdef LIKE '%area_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aprender_dominio_area_area ON public.aprender_dominio_area(area_id);
END IF;

-- aprender_progresso_aula.aula_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aprender_progresso_aula' AND indexdef LIKE '%aula_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aprender_progresso_aula_aula ON public.aprender_progresso_aula(aula_id);
END IF;

-- aprender_progresso_bloco.bloco_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aprender_progresso_bloco' AND indexdef LIKE '%bloco_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aprender_progresso_bloco_bloco ON public.aprender_progresso_bloco(bloco_id);
END IF;

-- aprender_sumario_sugerido.area_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aprender_sumario_sugerido' AND indexdef LIKE '%area_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aprender_sumario_sugerido_area ON public.aprender_sumario_sugerido(area_id);
END IF;

-- aprender_sumario_sugerido.aula_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aprender_sumario_sugerido' AND indexdef LIKE '%aula_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aprender_sumario_sugerido_aula ON public.aprender_sumario_sugerido(aula_id);
END IF;

-- apresentacao_comentarios.apresentacao_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='apresentacao_comentarios' AND indexdef LIKE '%apresentacao_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apresentacao_comentarios_apres ON public.apresentacao_comentarios(apresentacao_id);
END IF;

-- aula_entidades.user_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aula_entidades' AND indexdef LIKE '%user_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aula_entidades_user ON public.aula_entidades(user_id);
END IF;

-- aula_marcadores.user_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aula_marcadores' AND indexdef LIKE '%user_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aula_marcadores_user ON public.aula_marcadores(user_id);
END IF;

-- aula_materiais.user_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aula_materiais' AND indexdef LIKE '%user_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aula_materiais_user ON public.aula_materiais(user_id);
END IF;

-- aula_midias.user_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aula_midias' AND indexdef LIKE '%user_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aula_midias_user ON public.aula_midias(user_id);
END IF;

-- aula_transcricoes.user_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='aula_transcricoes' AND indexdef LIKE '%user_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aula_transcricoes_user ON public.aula_transcricoes(user_id);
END IF;

-- blog_edicao_posts.tema_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='blog_edicao_posts' AND indexdef LIKE '%tema_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_edicao_posts_tema ON public.blog_edicao_posts(tema_id);
END IF;

-- erros_questoes.user_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='erros_questoes' AND indexdef LIKE '%user_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_erros_questoes_user ON public.erros_questoes(user_id);
END IF;

-- flashcards_deck_itens.card_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='flashcards_deck_itens' AND indexdef LIKE '%card_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flashcards_deck_itens_card ON public.flashcards_deck_itens(card_id);
END IF;

-- flashcards_desafios_progresso.desafio_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='flashcards_desafios_progresso' AND indexdef LIKE '%desafio_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flashcards_desafios_prog_desafio ON public.flashcards_desafios_progresso(desafio_id);
END IF;

-- flashcards_progresso.card_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='flashcards_progresso' AND indexdef LIKE '%card_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flashcards_progresso_card ON public.flashcards_progresso(card_id);
END IF;

-- forca_artigos_progresso.artigo_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='forca_artigos_progresso' AND indexdef LIKE '%artigo_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forca_artigos_prog_artigo ON public.forca_artigos_progresso(artigo_id);
END IF;

-- legacy_subscribers.claimed_user_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='legacy_subscribers' AND indexdef LIKE '%claimed_user_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_legacy_subscribers_claimed ON public.legacy_subscribers(claimed_user_id);
END IF;

-- lei_seca_progresso.licao_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='lei_seca_progresso' AND indexdef LIKE '%licao_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lei_seca_progresso_licao ON public.lei_seca_progresso(licao_id);
END IF;

-- locais_favoritos.local_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='locais_favoritos' AND indexdef LIKE '%local_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_locais_favoritos_local ON public.locais_favoritos(local_id);
END IF;

-- locais_trilhas_progresso.trilha_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='locais_trilhas_progresso' AND indexdef LIKE '%trilha_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_locais_trilhas_prog_trilha ON public.locais_trilhas_progresso(trilha_id);
END IF;

-- pilulas_cards.deck_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='pilulas_cards' AND indexdef LIKE '%deck_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pilulas_cards_deck ON public.pilulas_cards(deck_id);
END IF;

-- praticar_progresso_artigo.artigo_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='praticar_progresso_artigo' AND indexdef LIKE '%artigo_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_praticar_prog_artigo ON public.praticar_progresso_artigo(artigo_id);
END IF;

-- questoes_desafios_progresso.desafio_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='questoes_desafios_progresso' AND indexdef LIKE '%desafio_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questoes_desafios_prog_desafio ON public.questoes_desafios_progresso(desafio_id);
END IF;

-- questoes_favoritos.questao_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='questoes_favoritos' AND indexdef LIKE '%questao_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questoes_favoritos_questao ON public.questoes_favoritos(questao_id);
END IF;

-- questoes_planilhas.cargo_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='questoes_planilhas' AND indexdef LIKE '%cargo_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questoes_planilhas_cargo ON public.questoes_planilhas(cargo_id);
END IF;

-- questoes_simulado_itens.questao_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='questoes_simulado_itens' AND indexdef LIKE '%questao_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questoes_simulado_itens_questao ON public.questoes_simulado_itens(questao_id);
END IF;

-- questoes_simulados.cargo_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='questoes_simulados' AND indexdef LIKE '%cargo_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questoes_simulados_cargo ON public.questoes_simulados(cargo_id);
END IF;

-- questoes_sync_log.planilha_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='questoes_sync_log' AND indexdef LIKE '%planilha_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questoes_sync_log_planilha ON public.questoes_sync_log(planilha_id);
END IF;

-- questoes_trilha_progresso.trilha_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='questoes_trilha_progresso' AND indexdef LIKE '%trilha_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questoes_trilha_prog_trilha ON public.questoes_trilha_progresso(trilha_id);
END IF;

-- questoes_trilhas.cargo_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='questoes_trilhas' AND indexdef LIKE '%cargo_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questoes_trilhas_cargo ON public.questoes_trilhas(cargo_id);
END IF;

-- radar_impactos_leis.artigo_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='radar_impactos_leis' AND indexdef LIKE '%artigo_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_radar_impactos_artigo ON public.radar_impactos_leis(artigo_id);
END IF;

-- radar_impactos_leis.run_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='radar_impactos_leis' AND indexdef LIKE '%run_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_radar_impactos_run ON public.radar_impactos_leis(run_id);
END IF;

-- radar_leis_runs.push_campaign_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='radar_leis_runs' AND indexdef LIKE '%push_campaign_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_radar_leis_runs_campaign ON public.radar_leis_runs(push_campaign_id);
END IF;

-- tematica_favoritos.obra_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='tematica_favoritos' AND indexdef LIKE '%obra_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tematica_favoritos_obra ON public.tematica_favoritos(obra_id);
END IF;

-- tematica_watchlist.obra_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='tematica_watchlist' AND indexdef LIKE '%obra_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tematica_watchlist_obra ON public.tematica_watchlist(obra_id);
END IF;

-- vade_mecum_leis_estaduais_catalog.lei_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='vade_mecum_leis_estaduais_catalog' AND indexdef LIKE '%lei_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estadual_catalog_lei ON public.vade_mecum_leis_estaduais_catalog(lei_id);
END IF;

-- vademecum_historico_alteracoes.lei_id
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='vademecum_historico_alteracoes' AND indexdef LIKE '%lei_id%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vademecum_hist_alt_lei ON public.vademecum_historico_alteracoes(lei_id);
END IF;

-- visuais_juridicos.gerado_por
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='visuais_juridicos' AND indexdef LIKE '%gerado_por%') THEN
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visuais_juridicos_gerado ON public.visuais_juridicos(gerado_por);
END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erro ao criar índices FK: %', SQLERRM;
END $$;
