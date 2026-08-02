select cron.schedule('scrape-resenha-diaria','0 11 * * 1-5',$$
  select net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/scrape-resenha-diaria',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{}'::jsonb
  );
$$);
select cron.schedule('boletim-juridico-diario','0 12 * * *',$$
  select net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/boletim-juridico-gerar',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"triggeredBy":"cron"}'::jsonb
  );
$$);
select cron.schedule('boletim-noticias-diario','30 22 * * *',$$
  select net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/boletim-noticias-gerar',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"triggeredBy":"cron"}'::jsonb
  );
$$);
update public.boletim_config set noticias_max_itens = 8 where id = 1;