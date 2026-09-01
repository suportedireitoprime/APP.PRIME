-- =============================================================================
-- Adiciona índices em colunas de Foreign Key que não possuem índice cobridor.
-- Recomendação do Supabase Linter (lint 0001_unindexed_foreign_keys).
-- Sem índice, CASCADE deletes e JOINs fazem sequential scan na tabela filha.
-- =============================================================================


-- aprender_dominio_area.area_id
  CREATE INDEX IF NOT EXISTS idx_aprender_dominio_area_area ON public.aprender_dominio_area(area_id);

-- aprender_progresso_aula.aula_id
  CREATE INDEX IF NOT EXISTS idx_aprender_progresso_aula_aula ON public.aprender_progresso_aula(aula_id);

-- aprender_progresso_bloco.bloco_id
  CREATE INDEX IF NOT EXISTS idx_aprender_progresso_bloco_bloco ON public.aprender_progresso_bloco(bloco_id);

-- aprender_sumario_sugerido.area_id
  CREATE INDEX IF NOT EXISTS idx_aprender_sumario_sugerido_area ON public.aprender_sumario_sugerido(area_id);

-- aprender_sumario_sugerido.aula_id
  CREATE INDEX IF NOT EXISTS idx_aprender_sumario_sugerido_aula ON public.aprender_sumario_sugerido(aula_id);

-- apresentacao_comentarios.apresentacao_id
  CREATE INDEX IF NOT EXISTS idx_apresentacao_comentarios_apres ON public.apresentacao_comentarios(apresentacao_id);

-- aula_entidades.user_id
  CREATE INDEX IF NOT EXISTS idx_aula_entidades_user ON public.aula_entidades(user_id);

-- aula_marcadores.user_id
  CREATE INDEX IF NOT EXISTS idx_aula_marcadores_user ON public.aula_marcadores(user_id);

-- aula_materiais.user_id
  CREATE INDEX IF NOT EXISTS idx_aula_materiais_user ON public.aula_materiais(user_id);

-- aula_midias.user_id
  CREATE INDEX IF NOT EXISTS idx_aula_midias_user ON public.aula_midias(user_id);

-- aula_transcricoes.user_id
  CREATE INDEX IF NOT EXISTS idx_aula_transcricoes_user ON public.aula_transcricoes(user_id);

-- blog_edicao_posts.tema_id
  CREATE INDEX IF NOT EXISTS idx_blog_edicao_posts_tema ON public.blog_edicao_posts(tema_id);

-- erros_questoes.user_id
  CREATE INDEX IF NOT EXISTS idx_erros_questoes_user ON public.erros_questoes(user_id);

-- flashcards_deck_itens.card_id
  CREATE INDEX IF NOT EXISTS idx_flashcards_deck_itens_card ON public.flashcards_deck_itens(card_id);

-- flashcards_desafios_progresso.desafio_id
  CREATE INDEX IF NOT EXISTS idx_flashcards_desafios_prog_desafio ON public.flashcards_desafios_progresso(desafio_id);

-- flashcards_progresso.card_id
  CREATE INDEX IF NOT EXISTS idx_flashcards_progresso_card ON public.flashcards_progresso(card_id);

-- forca_artigos_progresso.artigo_id
  CREATE INDEX IF NOT EXISTS idx_forca_artigos_prog_artigo ON public.forca_artigos_progresso(artigo_id);

-- legacy_subscribers.claimed_user_id
  CREATE INDEX IF NOT EXISTS idx_legacy_subscribers_claimed ON public.legacy_subscribers(claimed_user_id);

-- lei_seca_progresso.licao_id
  CREATE INDEX IF NOT EXISTS idx_lei_seca_progresso_licao ON public.lei_seca_progresso(licao_id);

-- locais_favoritos.local_id
  CREATE INDEX IF NOT EXISTS idx_locais_favoritos_local ON public.locais_favoritos(local_id);

-- locais_trilhas_progresso.trilha_id
  CREATE INDEX IF NOT EXISTS idx_locais_trilhas_prog_trilha ON public.locais_trilhas_progresso(trilha_id);

-- pilulas_cards.deck_id
  CREATE INDEX IF NOT EXISTS idx_pilulas_cards_deck ON public.pilulas_cards(deck_id);

-- praticar_progresso_artigo.artigo_id
  CREATE INDEX IF NOT EXISTS idx_praticar_prog_artigo ON public.praticar_progresso_artigo(artigo_id);

-- questoes_desafios_progresso.desafio_id
  CREATE INDEX IF NOT EXISTS idx_questoes_desafios_prog_desafio ON public.questoes_desafios_progresso(desafio_id);

-- questoes_favoritos.questao_id
  CREATE INDEX IF NOT EXISTS idx_questoes_favoritos_questao ON public.questoes_favoritos(questao_id);

-- questoes_planilhas.cargo_id
  CREATE INDEX IF NOT EXISTS idx_questoes_planilhas_cargo ON public.questoes_planilhas(cargo_id);

-- questoes_simulado_itens.questao_id
  CREATE INDEX IF NOT EXISTS idx_questoes_simulado_itens_questao ON public.questoes_simulado_itens(questao_id);

-- questoes_simulados.cargo_id
  CREATE INDEX IF NOT EXISTS idx_questoes_simulados_cargo ON public.questoes_simulados(cargo_id);

-- questoes_sync_log.planilha_id
  CREATE INDEX IF NOT EXISTS idx_questoes_sync_log_planilha ON public.questoes_sync_log(planilha_id);

-- questoes_trilha_progresso.trilha_id
  CREATE INDEX IF NOT EXISTS idx_questoes_trilha_prog_trilha ON public.questoes_trilha_progresso(trilha_id);

-- questoes_trilhas.cargo_id
  CREATE INDEX IF NOT EXISTS idx_questoes_trilhas_cargo ON public.questoes_trilhas(cargo_id);

-- radar_impactos_leis.artigo_id
  CREATE INDEX IF NOT EXISTS idx_radar_impactos_artigo ON public.radar_impactos_leis(artigo_id);

-- radar_impactos_leis.run_id
  CREATE INDEX IF NOT EXISTS idx_radar_impactos_run ON public.radar_impactos_leis(run_id);

-- radar_leis_runs.push_campaign_id
  CREATE INDEX IF NOT EXISTS idx_radar_leis_runs_campaign ON public.radar_leis_runs(push_campaign_id);

-- tematica_favoritos.obra_id
  CREATE INDEX IF NOT EXISTS idx_tematica_favoritos_obra ON public.tematica_favoritos(obra_id);

-- tematica_watchlist.obra_id
  CREATE INDEX IF NOT EXISTS idx_tematica_watchlist_obra ON public.tematica_watchlist(obra_id);

-- vade_mecum_leis_estaduais_catalog.lei_id
  CREATE INDEX IF NOT EXISTS idx_estadual_catalog_lei ON public.vade_mecum_leis_estaduais_catalog(lei_id);

-- vademecum_historico_alteracoes.lei_id
  CREATE INDEX IF NOT EXISTS idx_vademecum_hist_alt_lei ON public.vademecum_historico_alteracoes(lei_id);

-- visuais_juridicos.gerado_por
  CREATE INDEX IF NOT EXISTS idx_visuais_juridicos_gerado ON public.visuais_juridicos(gerado_por);

