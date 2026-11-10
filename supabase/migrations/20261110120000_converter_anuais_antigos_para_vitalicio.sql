-- ==============================================================================
-- MIGRAÇÃO: Converter todas as assinaturas ANUAIS anteriores a 10/11/2026 para VITALÍCIO
-- Regra de negócio:
-- 1. Qualquer assinatura ANUAL adquirida ANTES de 10/11/2026 vira VITALÍCIA (sem expiração).
-- 2. Assinaturas ANUAIS novas (adquiridas de 10/11/2026 em diante) contam 1 ano.
-- 3. Assinaturas MENSAIS continuam sendo mensais normalmente.
-- ==============================================================================

-- 1. Atualizar asaas_subscriptions: todos os anuais anteriores a 10/11/2026 viram vitalício
UPDATE public.asaas_subscriptions
SET plano = 'vitalicio',
    status = 'ACTIVE',
    expires_at = NULL,
    updated_at = NOW()
WHERE (plano ILIKE '%anual%' OR plano = 'anual_promocional')
  AND (
    started_at < '2026-11-10 00:00:00+00'
    OR created_at < '2026-11-10 00:00:00+00'
    OR started_at IS NULL
  );

-- 2. Atualizar legacy_subscribers: todos os anuais anteriores a 10/11/2026 viram vitalício
UPDATE public.legacy_subscribers
SET tipo = 'vitalicio',
    status = 'active',
    expires_at = NULL
WHERE (tipo ILIKE '%anual%' OR tipo = 'anual_promocional')
  AND created_at < '2026-11-10 00:00:00+00';

-- 3. Atualizar play_subscriptions: anuais anteriores a 10/11/2026 viram ativos sem expiração
UPDATE public.play_subscriptions
SET expires_at = NULL,
    status = 'SUBSCRIPTION_STATE_ACTIVE'
WHERE product_id ILIKE '%anual%'
  AND created_at < '2026-11-10 00:00:00+00';

-- 4. Atualizar apple_subscriptions: anuais anteriores a 10/11/2026 viram ativos sem expiração
UPDATE public.apple_subscriptions
SET expires_at = NULL,
    status = 'active'
WHERE product_id ILIKE '%anual%'
  AND created_at < '2026-11-10 00:00:00+00';

-- 5. Atualizar user_subscriptions: anuais anteriores a 10/11/2026 viram premium_lifetime
UPDATE public.user_subscriptions
SET product_id = 'premium_lifetime',
    expires_at = '2099-12-31 23:59:59+00',
    status = 'active',
    updated_at = NOW()
WHERE product_id ILIKE '%anual%'
  AND created_at < '2026-11-10 00:00:00+00';

-- 6. Atualizar profiles: conceder is_premium = true a todos os usuários de planos anuais/vitalícios
UPDATE public.profiles p
SET is_premium = true,
    updated_at = NOW()
WHERE id IN (
  SELECT user_id FROM public.asaas_subscriptions WHERE plano = 'vitalicio'
  UNION
  SELECT claimed_user_id FROM public.legacy_subscribers WHERE tipo = 'vitalicio' AND claimed_user_id IS NOT NULL
  UNION
  SELECT u.id FROM public.legacy_subscribers l JOIN auth.users u ON lower(u.email) = lower(l.email) WHERE l.tipo = 'vitalicio'
  UNION
  SELECT user_id FROM public.play_subscriptions WHERE product_id ILIKE '%anual%' AND (expires_at IS NULL OR expires_at > NOW())
  UNION
  SELECT user_id FROM public.user_subscriptions WHERE product_id = 'premium_lifetime' OR product_id ILIKE '%anual%'
);

-- 7. Atualizar a trigger / função de vencimento do Asaas
-- Garante que se um plano anual for de antes de 10/11/2026, ele é mantido como vitalício
CREATE OR REPLACE FUNCTION public.asaas_corrigir_vencimento_pagamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ciclo interval;
  novo timestamptz;
  mail text;
  is_anual boolean;
  is_antigo boolean;
BEGIN
  -- Se for vitalício, nunca expira
  IF new.plano = 'vitalicio' THEN
    new.expires_at := NULL;
    UPDATE public.profiles SET is_premium = true WHERE id = new.user_id;
    RETURN new;
  END IF;

  is_anual := (new.plano IN ('anual', 'anual_promocional') OR new.plano ILIKE '%anual%');
  is_antigo := (coalesce(new.started_at, new.created_at, now()) < '2026-11-10 00:00:00+00');

  -- Regra: Qualquer anual adquirido antes de 10/11/2026 vira vitalício
  IF is_anual AND is_antigo THEN
    new.plano := 'vitalicio';
    new.status := 'ACTIVE';
    new.expires_at := NULL;
    UPDATE public.profiles SET is_premium = true WHERE id = new.user_id;
    RETURN new;
  END IF;

  -- Só age quando um pagamento é registrado (started_at novo + ACTIVE)
  IF new.status <> 'ACTIVE' OR new.started_at IS NULL THEN
    RETURN new;
  END IF;
  IF tg_op = 'UPDATE' AND new.started_at IS NOT DISTINCT FROM old.started_at THEN
    RETURN new;
  END IF;

  -- Anuais a partir de 10/11/2026 contam 370 dias. Mensais contam 34 dias.
  ciclo := CASE
    WHEN is_anual THEN interval '370 days'
    WHEN new.plano = 'semestral' THEN interval '190 days'
    ELSE interval '34 days'
  END;
  novo := new.started_at + ciclo;

  IF new.expires_at IS NULL OR new.expires_at < novo THEN
    new.expires_at := novo;
  END IF;

  SELECT email INTO mail FROM auth.users WHERE id = new.user_id;
  UPDATE public.legacy_subscribers l
     SET status = 'active',
         expires_at = greatest(coalesce(l.expires_at, novo), novo)
   WHERE l.tipo <> 'vitalicio'
     AND (l.claimed_user_id = new.user_id OR (mail IS NOT NULL AND lower(l.email) = lower(mail)));

  UPDATE public.profiles SET is_premium = true WHERE id = new.user_id;
  RETURN new;
END $$;

REVOKE EXECUTE ON FUNCTION public.asaas_corrigir_vencimento_pagamento() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_asaas_corrigir_vencimento ON public.asaas_subscriptions;
CREATE TRIGGER trg_asaas_corrigir_vencimento
BEFORE INSERT OR UPDATE ON public.asaas_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.asaas_corrigir_vencimento_pagamento();

-- 8. Atualizar a rotina de corte de inadimplentes para nunca cortar quem tem vitalício ou anual antigo
CREATE OR REPLACE FUNCTION public.cortar_inadimplentes_asaas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  n integer;
BEGIN
  -- Nunca corta quem é vitalício ou quem adquiriu anual antes de 10/11/2026
  WITH cortados AS (
    UPDATE public.legacy_subscribers l
       SET status='inactive',
           observacao = coalesce(l.observacao,'') || ' | corte automatico inadimplencia >3d em ' || now()::date
     WHERE l.status='active'
       AND l.tipo <> 'vitalicio'
       AND NOT (l.tipo ILIKE '%anual%' AND coalesce(l.created_at, now()) < '2026-11-10 00:00:00+00')
       AND l.expires_at IS NOT NULL
       AND l.expires_at < now()
       AND NOT EXISTS (
         SELECT 1 FROM public.asaas_subscriptions s
         LEFT JOIN auth.users u ON u.id = s.user_id
         WHERE (s.user_id = l.claimed_user_id OR lower(u.email) = lower(l.email))
           AND s.status IN ('ACTIVE','ACTIVE_GRACE')
           AND (
             s.plano = 'vitalicio'
             OR (s.plano ILIKE '%anual%' AND coalesce(s.started_at, s.created_at, now()) < '2026-11-10 00:00:00+00')
             OR s.started_at > now() - CASE
                  WHEN l.tipo IN ('anual','anual_promocional') THEN interval '370 days'
                  WHEN l.tipo = 'semestral' THEN interval '190 days'
                  ELSE interval '34 days'
                END
           )
       )
    RETURNING claimed_user_id
  )
  SELECT count(*) INTO n FROM cortados;

  -- Para assinaturas Asaas, apenas corta MENSAIS ou ANUAIS pós-10/11/2026 vencidos
  UPDATE public.asaas_subscriptions s
     SET status='CANCELED', expires_at=now(), updated_at=now()
    FROM public.legacy_subscribers l
   WHERE l.claimed_user_id = s.user_id
     AND l.status='inactive'
     AND s.status='ACTIVE'
     AND s.plano <> 'vitalicio'
     AND NOT (s.plano ILIKE '%anual%' AND coalesce(s.started_at, s.created_at, now()) < '2026-11-10 00:00:00+00')
     AND s.started_at < now() - interval '34 days';

  RETURN n;
END $function$;
