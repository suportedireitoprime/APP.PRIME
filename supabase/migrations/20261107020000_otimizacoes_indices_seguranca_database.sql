-- ==============================================================================
-- MIGRAÇÃO: Otimizações de Índices Críticos, Remoção de Duplicados e Segurança
-- Projeto: ESTUDOS JURIDICOS - APP (dnjrgpldcwcpoywamorr)
-- ==============================================================================

-- 1. NOVOS ÍNDICES CRÍTICOS (Elimina lentidão de 5s e timeouts)
CREATE INDEX IF NOT EXISTS idx_radar_proposicoes_atualizado_em 
  ON public.radar_proposicoes (atualizado_em DESC);

CREATE INDEX IF NOT EXISTS idx_user_sync_items_user_escopo_item_at 
  ON public.user_sync_items (user_id, escopo, item_at DESC);

CREATE INDEX IF NOT EXISTS idx_questoes_ativo_disciplina 
  ON public.questoes (ativo, disciplina) 
  WHERE ativo = true;

-- 2. REMOÇÃO DE ÍNDICES E CONSTRAINTS DUPLICADAS (Libera disco/RAM e acelera escrita)
DROP INDEX IF EXISTS public.idx_videoaulas_oab_segunda_fase_area;
DROP INDEX IF EXISTS public.idx_va_oab_area;
DROP INDEX IF EXISTS public.idx_va_ini_ordem;
DROP INDEX IF EXISTS public.idx_va_areas_area;
DROP INDEX IF EXISTS public.radar_impactos_leis_lei_status_idx;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'narracao_vozes_preview_uniq') THEN
    ALTER TABLE public.narracao_vozes_preview DROP CONSTRAINT narracao_vozes_preview_uniq;
  ELSE
    DROP INDEX IF EXISTS public.narracao_vozes_preview_uniq;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'narracao_livro_paginas_uniq') THEN
    ALTER TABLE public.narracao_livro_paginas DROP CONSTRAINT narracao_livro_paginas_uniq;
  ELSE
    DROP INDEX IF EXISTS public.narracao_livro_paginas_uniq;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'legislacao_alteracoes_upsert_key') THEN
    ALTER TABLE public.legislacao_alteracoes DROP CONSTRAINT legislacao_alteracoes_upsert_key;
  ELSE
    DROP INDEX IF EXISTS public.legislacao_alteracoes_upsert_key;
  END IF;
END $$;

-- 3. CORREÇÃO DE SEGURANÇA (Fix: Function Search Path Mutable no Advisor)
ALTER FUNCTION public.is_admin_user(_user_id uuid) 
  SET search_path = 'public';

ALTER FUNCTION public.set_device_token_admin(p_token text, p_is_admin boolean) 
  SET search_path = 'public';
