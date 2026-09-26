SELECT cron.schedule(
  'scrape-concursos-job',
  '*/10 * * * *',
  $$
    SELECT net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/concursos-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
      timeout_milliseconds:=60000
    );
  $$
);
