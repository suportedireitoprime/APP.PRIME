DO $$
DECLARE
  fn_url_base text := 'https://iftdrbxvekrhzstayjwp.supabase.co/functions/v1';
  anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdGRyYnh2ZWtyaHpzdGF5andwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mzc5OTksImV4cCI6MjA5OTQxMzk5OX0.7nyvQlO5IDI6E4dLYHl6yrqqaNd53RxJcDOTQ7yNh40';
BEGIN
  INSERT INTO public.push_automations (key, nome, descricao, enabled, default_url, emoji)
  VALUES
    ('push-aleatorio-blog',  'Artigo de Blog Aleatório', 'Destaque do meio-dia: seleciona um artigo de doutrina ou jurisprudência aleatoriamente.', true, '/blog', '✍️'),
    ('push-aleatorio-audio', 'Audioaula Aleatória',      'Notificação à tarde incentivando o estudo multitarefa com uma audioaula.', true, '/aprender', '🎧'),
    ('push-aleatorio-video', 'Videoaula Aleatória',      'Convite visual no início da noite para assistir a uma videoaula estratégica.', true, '/aprender', '📺')
  ON CONFLICT (key) DO NOTHING;

  -- 12:00 BRT = 15:00 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-aleatorio-blog') THEN PERFORM cron.unschedule('push-aleatorio-blog'); END IF;
  PERFORM cron.schedule('push-aleatorio-blog','0 15 * * *',
    format($f$SELECT net.http_post(url:='%s/push-aleatorio-blog', headers:=jsonb_build_object('Content-Type','application/json','apikey','%s'))$f$, fn_url_base, anon));

  -- 15:00 BRT = 18:00 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-aleatorio-audio') THEN PERFORM cron.unschedule('push-aleatorio-audio'); END IF;
  PERFORM cron.schedule('push-aleatorio-audio','0 18 * * *',
    format($f$SELECT net.http_post(url:='%s/push-aleatorio-audio', headers:=jsonb_build_object('Content-Type','application/json','apikey','%s'))$f$, fn_url_base, anon));

  -- 18:00 BRT = 21:00 UTC
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-aleatorio-video') THEN PERFORM cron.unschedule('push-aleatorio-video'); END IF;
  PERFORM cron.schedule('push-aleatorio-video','0 21 * * *',
    format($f$SELECT net.http_post(url:='%s/push-aleatorio-video', headers:=jsonb_build_object('Content-Type','application/json','apikey','%s'))$f$, fn_url_base, anon));
END $$;
