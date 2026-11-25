-- Índices compostos para reduzir latência de leitura/ordenação em resumos_juridicos e questoes_sessoes_historico
CREATE INDEX IF NOT EXISTS idx_resumos_juridicos_area_tema
  ON public.resumos_juridicos (area, tema);

CREATE INDEX IF NOT EXISTS idx_questoes_sessoes_historico_user_acesso
  ON public.questoes_sessoes_historico (user_id, data_ultimo_acesso DESC);
