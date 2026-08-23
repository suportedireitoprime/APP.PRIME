-- Migration: Add missing performance indexes for cron background jobs
-- These indexes prevent sequential scans during high-frequency Edge Function executions

-- 1) Index for Horus Outbound Log checking if a user/phone has already received a message today
CREATE INDEX IF NOT EXISTS idx_horus_outbound_log_phone_created_tipo
ON public.horus_outbound_log(phone_e164, created_at DESC, tipo);

CREATE INDEX IF NOT EXISTS idx_horus_outbound_log_user_created_tipo
ON public.horus_outbound_log(user_id, created_at DESC, tipo);

-- 2) GIN Index for querying array of peak hours efficiently 
-- (Used by notificacao-personalizada to find candidates for the current hour)
CREATE INDEX IF NOT EXISTS idx_horus_user_stats_horarios_pico
ON public.horus_user_stats USING gin (horarios_pico_app);

-- 3) Partial index for filtering users that allow notifications
CREATE INDEX IF NOT EXISTS idx_horus_user_stats_notif_permitidas
ON public.horus_user_stats(notificacoes_permitidas)
WHERE notificacoes_permitidas = true;
