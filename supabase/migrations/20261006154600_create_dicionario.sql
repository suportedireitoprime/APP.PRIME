-- Tabela Dicionário Jurídico
CREATE TABLE IF NOT EXISTS public.dicionario_juridico (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  termo text NOT NULL,
  definicao text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.dicionario_juridico TO authenticated;
GRANT SELECT ON public.dicionario_juridico TO anon;
GRANT ALL ON public.dicionario_juridico TO service_role;

-- Inserir alguns termos básicos para teste
INSERT INTO public.dicionario_juridico (termo, definicao) VALUES
('Jurisprudência', 'Conjunto das decisões e interpretações das leis feitas pelos tribunais.'),
('Habeas Corpus', 'Garantia constitucional concedida sempre que alguém sofrer ou se achar ameaçado de sofrer violência ou coação em sua liberdade de locomoção.'),
('Petição Inicial', 'Peça processual que dá início ao processo judicial, formulando o pedido do autor ao juiz.')
ON CONFLICT DO NOTHING;

-- Limpar automações antigas "aleatórias" (JIT) que enviavam no horário exato
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-aleatorio-blog') THEN PERFORM cron.unschedule('push-aleatorio-blog'); END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-aleatorio-audio') THEN PERFORM cron.unschedule('push-aleatorio-audio'); END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-aleatorio-video') THEN PERFORM cron.unschedule('push-aleatorio-video'); END IF;
END $$;

-- Agendar a nova rotina "Planner" para rodar todo dia à 1h da manhã (BRT = 4h UTC)
DO $$
DECLARE
  fn_url_base text := 'https://iftdrbxvekrhzstayjwp.supabase.co/functions/v1';
  anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdGRyYnh2ZWtyaHpzdGF5andwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mzc5OTksImV4cCI6MjA5OTQxMzk5OX0.7nyvQlO5IDI6E4dLYHl6yrqqaNd53RxJcDOTQ7yNh40';
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='push-planner-diario') THEN PERFORM cron.unschedule('push-planner-diario'); END IF;
  PERFORM cron.schedule('push-planner-diario','0 4 * * *',
    format($f$SELECT net.http_post(url:='%s/push-planner', headers:=jsonb_build_object('Content-Type','application/json','apikey','%s'))$f$, fn_url_base, anon));
END $$;
