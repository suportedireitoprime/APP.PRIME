-- RPC segura para deploy dos agendamentos pg_cron dos boletins.
-- Chamada pela Edge Function boletim-cron-deploy com service_role.
-- Recebe um JSON array com os crons a serem agendados.
-- Formato: [{ "name": "...", "schedule": "M H * * *", "function_name": "...", "body": "{...}" }]

CREATE OR REPLACE FUNCTION public.admin_deploy_boletim_crons(
  crons_json text,
  anon_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  result jsonb := '[]'::jsonb;
  supabase_url text;
  sql_body text;
BEGIN
  -- Obtém a URL do projeto a partir das configurações existentes
  SELECT value INTO supabase_url
  FROM boletim_config
  WHERE id = 1
  LIMIT 1;

  -- Fallback: usa a URL hardcoded do projeto
  supabase_url := 'https://dnjrgpldcwcpoywamorr.supabase.co';

  FOR item IN SELECT jsonb_array_elements(crons_json::jsonb)
  LOOP
    -- Remove o cron existente (ignora erro se não existir)
    BEGIN
      PERFORM cron.unschedule(item->>'name');
    EXCEPTION WHEN OTHERS THEN
      -- Job não existia, ok
      NULL;
    END;

    -- Monta o corpo do net.http_post
    sql_body := format(
      $$select net.http_post(
        url:='%s/functions/v1/%s',
        headers:='{"Content-Type": "application/json", "apikey": "%s"}'::jsonb,
        body:='%s'::jsonb
      );$$,
      supabase_url,
      item->>'function_name',
      anon_key,
      item->>'body'
    );

    -- Agenda o novo cron
    PERFORM cron.schedule(
      item->>'name',
      item->>'schedule',
      sql_body
    );

    result := result || jsonb_build_object(
      'name', item->>'name',
      'schedule', item->>'schedule',
      'status', 'deployed'
    );
  END LOOP;

  RETURN result;
END;
$$;

-- Permissão: somente service_role pode chamar
REVOKE ALL ON FUNCTION public.admin_deploy_boletim_crons(text, text) FROM public;
REVOKE ALL ON FUNCTION public.admin_deploy_boletim_crons(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_deploy_boletim_crons(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_deploy_boletim_crons(text, text) TO service_role;
