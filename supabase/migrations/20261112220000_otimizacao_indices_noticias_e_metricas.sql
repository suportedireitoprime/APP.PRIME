-- ==============================================================================
-- MIGRAÇÃO: Otimização de Índices Críticos (Diagnóstico de Performance pg_stat_statements)
-- Projeto: ESTUDOS JURIDICOS - APP (dnjrgpldcwcpoywamorr)
-- ==============================================================================

-- 1. ÍNDICE CRÍTICO EM NOTÍCIAS JURÍDICAS (Elimina sequential scan em notificações e polling)
-- A central de notificações consulta: .gte('created_at', since).order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_noticias_juridicas_created_at 
  ON public.noticias_juridicas (created_at DESC);

-- 2. ÍNDICE COMPOSTO EM RESUMOS JURÍDICOS (Acelera busca e agrupamento por área e tema)
CREATE INDEX IF NOT EXISTS idx_resumos_juridicos_area_tema 
  ON public.resumos_juridicos (area, tema)
  WHERE area IS NOT NULL;

-- 3. ÍNDICES DE APOIO PARA ADMIN MÉTRICAS (Acelera filtros por data nas tabelas consultadas por admin_metricas_dia)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
  ON public.profiles (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at 
  ON public.user_sessions (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_last_seen 
  ON public.user_activity_log (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_events_event_created 
  ON public.app_events (event_name, created_at DESC);
