-- Drop existing old crons se existirem
SELECT cron.unschedule('push-aleatorio-audio-old');
SELECT cron.unschedule('push-aleatorio-video-old');
SELECT cron.unschedule('push-aleatorio-audio');
SELECT cron.unschedule('push-aleatorio-video');
SELECT cron.unschedule('boletim-0600');

-- 06:00 - Boletim Jurídico Matinal
SELECT cron.unschedule('boletim-juridico-0600');
SELECT cron.schedule(
  'boletim-juridico-0600',
  '0 6 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/boletim-juridico-gerar',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 08:00 - Audioaula Matinal (1)
SELECT cron.unschedule('audioaula-matinal-0800');
SELECT cron.schedule(
  'audioaula-matinal-0800',
  '0 8 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-aleatorio-audio',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{"automation_key": "push-aleatorio-audio-1"}'::jsonb
    ) as request_id;
  $$
);

-- 10:00 - Videoaula Matinal (1)
SELECT cron.unschedule('videoaula-matinal-1000');
SELECT cron.schedule(
  'videoaula-matinal-1000',
  '0 10 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-aleatorio-video',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{"automation_key": "push-aleatorio-video-1"}'::jsonb
    ) as request_id;
  $$
);

-- 12:00 - Artigo de Blog
SELECT cron.unschedule('artigo-blog-1200');
SELECT cron.schedule(
  'artigo-blog-1200',
  '0 12 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-aleatorio-blog',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{"automation_key": "push-aleatorio-blog"}'::jsonb
    ) as request_id;
  $$
);

-- 14:00 - Livro da Biblioteca
SELECT cron.unschedule('livro-biblioteca-1400');
SELECT cron.schedule(
  'livro-biblioteca-1400',
  '0 14 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-aleatorio-livro',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{"automation_key": "push-aleatorio-livro"}'::jsonb
    ) as request_id;
  $$
);

-- 16:00 - Audioaula Tarde (2)
SELECT cron.unschedule('audioaula-tarde-1600');
SELECT cron.schedule(
  'audioaula-tarde-1600',
  '0 16 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-aleatorio-audio',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{"automation_key": "push-aleatorio-audio-2"}'::jsonb
    ) as request_id;
  $$
);

-- 18:00 - Videoaula Noite (2)
SELECT cron.unschedule('videoaula-noite-1800');
SELECT cron.schedule(
  'videoaula-noite-1800',
  '0 18 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-aleatorio-video',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{"automation_key": "push-aleatorio-video-2"}'::jsonb
    ) as request_id;
  $$
);

-- 20:00 - Audioaula Noturna (3)
SELECT cron.unschedule('audioaula-noturna-2000');
SELECT cron.schedule(
  'audioaula-noturna-2000',
  '0 20 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-aleatorio-audio',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{"automation_key": "push-aleatorio-audio-3"}'::jsonb
    ) as request_id;
  $$
);

-- 22:00 - Notícias / Boletim Giro Final
SELECT cron.unschedule('noticias-giro-2200');
SELECT cron.schedule(
  'noticias-giro-2200',
  '0 22 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/boletim-noticias-gerar',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 00:00 - Hórus Coruja
SELECT cron.unschedule('horus-coruja-0000');
SELECT cron.schedule(
  'horus-coruja-0000',
  '0 0 * * *',
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-estudo-madrugada',
      headers:=(select '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.secret') || '"}'::jsonb),
      body:='{"automation_key": "push-estudo-madrugada"}'::jsonb
    ) as request_id;
  $$
);
