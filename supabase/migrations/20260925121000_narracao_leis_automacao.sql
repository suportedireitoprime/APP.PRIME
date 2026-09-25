-- ============================================================================
-- MIGRATION: Configuração de Automação de Narração de Leis e Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.narracao_leis_config (
  id integer PRIMARY KEY DEFAULT 1,
  ativa boolean NOT NULL DEFAULT false,
  intervalo_minutos integer NOT NULL DEFAULT 10,
  lei_id text NOT NULL DEFAULT 'cp',
  tabela_nome text NOT NULL DEFAULT 'CP_CODIGO_PENAL',
  prioridade text NOT NULL DEFAULT 'artigos_maiores',
  voz_padrao text NOT NULL DEFAULT 'Kore',
  estilo_tom text NOT NULL DEFAULT 'Animado e envolvente, como professora jovem de Direito',
  lote_tamanho integer NOT NULL DEFAULT 1,
  artigos_gerados_total integer NOT NULL DEFAULT 0,
  ultimo_disparo timestamptz,
  ultimo_artigo_gerado text,
  ultimo_status text,
  updated_at timestamptz DEFAULT now()
);

-- Insere linha padrão se não existir
INSERT INTO public.narracao_leis_config (id, ativa, intervalo_minutos, lei_id, tabela_nome, prioridade, voz_padrao, estilo_tom)
VALUES (1, false, 10, 'cp', 'CP_CODIGO_PENAL', 'artigos_maiores', 'Kore', 'Animado e envolvente, como professora jovem de Direito')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.narracao_leis_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  tabela_nome text NOT NULL,
  artigo_numero text NOT NULL,
  partes_geradas integer NOT NULL DEFAULT 1,
  status text NOT NULL, -- 'sucesso' | 'erro'
  mensagem text,
  duracao_ms integer
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_narracao_logs_timestamp ON public.narracao_leis_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_narracao_logs_tabela ON public.narracao_leis_logs(tabela_nome);

-- RLS
ALTER TABLE public.narracao_leis_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narracao_leis_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "narracao_leis_config_select_all" ON public.narracao_leis_config;
CREATE POLICY "narracao_leis_config_select_all" ON public.narracao_leis_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "narracao_leis_config_update_all" ON public.narracao_leis_config;
CREATE POLICY "narracao_leis_config_update_all" ON public.narracao_leis_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "narracao_leis_logs_select_all" ON public.narracao_leis_logs;
CREATE POLICY "narracao_leis_logs_select_all" ON public.narracao_leis_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "narracao_leis_logs_insert_all" ON public.narracao_leis_logs;
CREATE POLICY "narracao_leis_logs_insert_all" ON public.narracao_leis_logs FOR INSERT WITH CHECK (true);

GRANT SELECT, UPDATE, INSERT ON public.narracao_leis_config TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.narracao_leis_logs TO anon, authenticated, service_role;

-- RPC para agendamento seguro no pg_cron
CREATE OR REPLACE FUNCTION public.admin_deploy_narracao_cron(
  intervalo_min integer DEFAULT 10,
  habilitar boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cron_name text := 'narracao-leis-automacao-job';
  cron_schedule text;
  supabase_url text := 'https://dnjrgpldcwcpoywamorr.supabase.co';
  anon_key text;
  sql_body text;
BEGIN
  -- Desagenda qualquer job anterior com este nome
  BEGIN
    PERFORM cron.unschedule(cron_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF NOT habilitar THEN
    UPDATE public.narracao_leis_config SET ativa = false, updated_at = now() WHERE id = 1;
    RETURN jsonb_build_object('ok', true, 'status', 'desativado');
  END IF;

  -- Formata o cron: de 10 em 10 min -> */10 * * * *
  IF intervalo_min <= 1 THEN
    cron_schedule := '* * * * *';
  ELSIF intervalo_min >= 60 THEN
    cron_schedule := '0 * * * *';
  ELSE
    cron_schedule := format('*/%s * * * *', intervalo_min);
  END IF;

  -- Monta a chamada HTTP para a edge function
  sql_body := format(
    'SELECT net.http_post(' ||
      'url:=''%s/functions/v1/narracao-leis-automacao'', ' ||
      'headers:=''{"Content-Type": "application/json"}''::jsonb, ' ||
      'body:=''{"triggeredBy": "pg_cron"}''::jsonb' ||
    ');',
    supabase_url
  );

  -- Agenda no cron
  PERFORM cron.schedule(
    cron_name,
    cron_schedule,
    sql_body
  );

  UPDATE public.narracao_leis_config 
  SET ativa = true, intervalo_minutos = intervalo_min, updated_at = now() 
  WHERE id = 1;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'agendado',
    'cron_name', cron_name,
    'schedule', cron_schedule
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_deploy_narracao_cron(integer, boolean) TO anon, authenticated, service_role;
