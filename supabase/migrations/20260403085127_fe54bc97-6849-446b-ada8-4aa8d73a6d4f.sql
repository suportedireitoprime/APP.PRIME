SELECT cron.schedule(
  'popular-leis-ordinarias-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-leis-ordinarias',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"ano": 2026}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'popular-decretos-6h',
  '10 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-decretos',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"ano": 2026}'::jsonb
  ) as request_id;
  $$
);