-- Fase 1 (crítico)
-- 1) Bucket de narrações (todo áudio de narração de conteúdo é salvo aqui)
-- 2) Reagendamento dos cron jobs que não estavam ativos em produção
--    (apenas jobs cujas edge functions estão publicadas)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'narracoes-conteudo', 'narracoes-conteudo', false, 209715200,
  array['audio/wav','audio/mpeg','audio/mp3','audio/mp4','audio/aac','audio/ogg','audio/webm']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'narracoes_conteudo_read_auth'
  ) then
    create policy "narracoes_conteudo_read_auth" on storage.objects
      for select to authenticated using (bucket_id = 'narracoes-conteudo');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'narracoes_conteudo_write_service'
  ) then
    create policy "narracoes_conteudo_write_service" on storage.objects
      for all to service_role
      using (bucket_id = 'narracoes-conteudo')
      with check (bucket_id = 'narracoes-conteudo');
  end if;
end $$;

-- Cron jobs
do $$
declare
  fn text := 'https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1';
  anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';
  j record;
begin
  for j in
    select * from (values
      ('blog-push-manha',            '0 11 * * *',  'blog-push-slot',          '{"slot":"manha","automation_key":"blog_post_manha"}'),
      ('blog-push-tarde',            '0 16 * * *',  'blog-push-slot',          '{"slot":"tarde","automation_key":"blog_post_tarde"}'),
      ('blog-push-noite',            '0 22 * * *',  'blog-push-slot',          '{"slot":"noite","automation_key":"blog_post_noite"}'),
      ('boletim-leis-matinal-07brt', '0 10 * * *',  'boletim-leis-matinal',    '{}'),
      ('enviar-newsletter-diario',   '0 10 * * *',  'enviar-newsletter',       '{}'),
      ('gerar-global-tick',          '* * * * *',   'gerar-global',            '{"action":"tick"}'),
      ('trial-reminders-tick',       '*/15 * * * *','trial-reminders-tick',    '{}'),
      ('radar-leis-scrape-10h',      '0 13 * * *',  'scrape-resenha-diaria',   '{"origem":"cron","notify":true}'),
      ('radar-leis-scrape-20h',      '0 23 * * *',  'scrape-resenha-diaria',   '{"origem":"cron","notify":true}')
    ) as t(jobname, sched, fnname, body)
  loop
    if exists (select 1 from cron.job where jobname = j.jobname) then
      perform cron.unschedule(j.jobname);
    end if;
    perform cron.schedule(
      j.jobname,
      j.sched,
      format(
        $f$SELECT net.http_post(url:='%s/%s', headers:=jsonb_build_object('Content-Type','application/json','apikey','%s','Authorization','Bearer %s'), body:='%s'::jsonb)$f$,
        fn, j.fnname, anon, anon, j.body
      )
    );
  end loop;

  -- jobs puramente SQL
  if exists (select 1 from cron.job where jobname = 'refresh-ranking-semanal') then
    perform cron.unschedule('refresh-ranking-semanal');
  end if;
  perform cron.schedule('refresh-ranking-semanal', '0 3 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_semanal');

  if exists (select 1 from cron.job where jobname = 'limpar-cache-ai-antigo') then
    perform cron.unschedule('limpar-cache-ai-antigo');
  end if;
  perform cron.schedule('limpar-cache-ai-antigo', '0 4 * * 0',
    $q$DELETE FROM artigo_ai_cache WHERE created_at < now() - interval '90 days'$q$);
end $$;
