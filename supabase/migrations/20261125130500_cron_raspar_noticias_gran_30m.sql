-- Agenda raspagem automática de Notícias OAB e Concursos (Gran Cursos) a cada 30 minutos
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'raspar-noticias-gran-30m') THEN
    PERFORM cron.unschedule('raspar-noticias-gran-30m');
  END IF;

  PERFORM cron.schedule(
    'raspar-noticias-gran-30m',
    '*/30 * * * *',
    $cmd$
      SELECT net.http_post(
        url := 'https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/raspar-noticias-gran',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
      );
    $cmd$
  );
END $$;
