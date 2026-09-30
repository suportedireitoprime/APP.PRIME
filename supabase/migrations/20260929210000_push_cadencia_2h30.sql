-- Sincronização da cadência estrita de 2h30m para as notificações push diárias
-- 07:00 BRT (10:00 UTC) -> Radar de Leis & DOU
-- 09:30 BRT (12:30 UTC) -> Boletim Jurídico & Tribunais (+2h30)
-- 12:00 BRT (15:00 UTC) -> Artigo Doutrinário & Blog (+2h30)
-- 14:30 BRT (17:30 UTC) -> Audioaula Estratégica (+2h30)
-- 17:00 BRT (20:00 UTC) -> Videoaula do Dia (+2h30)
-- 19:30 BRT (22:30 UTC) -> Fixação & Questão do Dia (+2h30)
-- 22:00 BRT (01:00 UTC) -> Síntese Noturna dos Tribunais (+2h30)

DO $$
DECLARE
  fn_url_base text := 'https://iftdrbxvekrhzstayjwp.supabase.co/functions/v1';
  anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdGRyYnh2ZWtyaHpzdGF5andwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mzc5OTksImV4cCI6MjA5OTQxMzk5OX0.7nyvQlO5IDI6E4dLYHl6yrqqaNd53RxJcDOTQ7yNh40';
BEGIN
  -- Atualizar ou inserir registros nas automações
  INSERT INTO public.push_automations (key, nome, descricao, enabled, default_url, emoji)
  VALUES
    ('boletim_leis_matinal',   'Radar de Leis & DOU',           'Push matinal com novos atos normativos das últimas 24h.', true, '/radar-360', '📜'),
    ('boletim_juridico_diario', 'Boletim Jurídico & Tribunais',  'Boletim matinal com principais notícias STF e STJ.',       true, '/noticias',  '📰'),
    ('push-aleatorio-blog',    'Artigo Doutrinário & Blog',     'Destaque do meio-dia para a pausa de almoço e estudo.',    true, '/blog',      '✍️'),
    ('push-aleatorio-audio',   'Audioaula Estratégica',         'Notificação de revisão passiva no fone de ouvido.',       true, '/aprender',  '🎧'),
    ('push-aleatorio-video',   'Videoaula do Dia',              'Convite no final de tarde para aula em vídeo focada.',     true, '/aprender',  '📺'),
    ('push-simulado-desafio',  'Fixação & Questão do Dia',      'Desafio noturno de resolução de questões de concurso.',    true, '/simulados', '🎯'),
    ('boletim_noticias_diario', 'Síntese Noturna dos Tribunais', 'Fechamento do expediente com as notícias mais lidas.',   true, '/noticias',  '🌙')
  ON CONFLICT (key) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    default_url = EXCLUDED.default_url,
    emoji = EXCLUDED.emoji;

  -- 12:00 BRT = 15:00 UTC (Slot Blog)
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-aleatorio-blog') THEN PERFORM cron.unschedule('push-aleatorio-blog'); END IF;
  PERFORM cron.schedule('push-aleatorio-blog','0 15 * * *',
    format($f$SELECT net.http_post(url:='%s/push-aleatorio-blog', headers:=jsonb_build_object('Content-Type','application/json','apikey','%s'))$f$, fn_url_base, anon));

  -- 14:30 BRT = 17:30 UTC (Slot Audioaula - 2h30 após as 12:00)
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-aleatorio-audio') THEN PERFORM cron.unschedule('push-aleatorio-audio'); END IF;
  PERFORM cron.schedule('push-aleatorio-audio','30 17 * * *',
    format($f$SELECT net.http_post(url:='%s/push-aleatorio-audio', headers:=jsonb_build_object('Content-Type','application/json','apikey','%s'))$f$, fn_url_base, anon));

  -- 17:00 BRT = 20:00 UTC (Slot Videoaula - 2h30 após as 14:30)
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-aleatorio-video') THEN PERFORM cron.unschedule('push-aleatorio-video'); END IF;
  PERFORM cron.schedule('push-aleatorio-video','0 20 * * *',
    format($f$SELECT net.http_post(url:='%s/push-aleatorio-video', headers:=jsonb_build_object('Content-Type','application/json','apikey','%s'))$f$, fn_url_base, anon));
END $$;
