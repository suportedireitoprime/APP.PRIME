-- Migration: 20260923030000_visao_geral_completa_e_apple.sql
-- Unificação de métricas, listas e totais de Visão Geral com suporte a Apple StoreKit, Asaas e Play Store

-- 1. admin_metricas_dia
CREATE OR REPLACE FUNCTION public.admin_metricas_dia(_dia date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN public.is_admin_user((select auth.uid())) THEN jsonb_build_object(
    'online5m', (SELECT COUNT(DISTINCT user_id) FROM public.user_activity_log
      WHERE last_seen_at >= now() - interval '5 minutes'
        AND NOT public.is_admin_user(user_id)),
    'online', (SELECT COUNT(DISTINCT user_id) FROM public.user_sessions
      WHERE started_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND started_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND NOT public.is_admin_user(user_id)),
    'cadastros', (SELECT COUNT(*) FROM public.profiles
      WHERE created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND NOT public.is_admin_user(id)),
    'trial', (
        -- Play Store
        COALESCE((SELECT COUNT(DISTINCT user_id) FROM public.play_subscriptions
         WHERE created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
           AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
           AND NOT public.is_admin_user(user_id)), 0)
        +
        -- Asaas
        COALESCE((SELECT COUNT(DISTINCT user_id) FROM public.asaas_subscriptions
         WHERE (
           (created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo') AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
           OR
           (started_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo') AND started_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
         )
           AND status = 'ACTIVE'
           AND NOT public.is_admin_user(user_id)), 0)
        +
        -- Apple App Store
        COALESCE((SELECT COUNT(DISTINCT user_id) FROM public.apple_subscriptions
         WHERE (
           (created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo') AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
           OR
           (start_time >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo') AND start_time < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
         )
           AND status IN ('active', 'in_grace')
           AND NOT public.is_admin_user(user_id)), 0)
    ),
    'paywall', (SELECT COUNT(DISTINCT COALESCE(user_id::text, email, id::text)) FROM public.app_events
      WHERE event_name IN ('assinatura_aberta', 'paywall_view')
        AND created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND (user_id IS NULL OR NOT public.is_admin_user(user_id))),
    'checkout', (SELECT COUNT(DISTINCT COALESCE(user_id::text, email, id::text)) FROM public.app_events
      WHERE event_name IN ('trial_click', 'checkout_view')
        AND created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND (user_id IS NULL OR NOT public.is_admin_user(user_id)))
  ) ELSE jsonb_build_object('online5m',0,'online',0,'cadastros',0,'trial',0,'paywall',0,'checkout',0) END;
$function$;

-- 2. admin_lista_dia
CREATE OR REPLACE FUNCTION public.admin_lista_dia(_tipo text, _dia date)
 RETURNS TABLE(
   key text, 
   user_id uuid, 
   title text, 
   email text, 
   subtitle text, 
   at timestamp with time zone, 
   acessos integer, 
   avatar_url text, 
   is_premium boolean,
   created_at timestamp with time zone
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    -- Online 5m (ignora _dia)
    SELECT l.id::text AS key, l.user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário(a)')::text AS title,
      u.email::text,
      COALESCE(l.current_route, 'App aberto')::text AS subtitle,
      l.last_seen_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      p.is_premium,
      COALESCE(p.created_at, u.created_at) AS created_at
    FROM public.user_activity_log l
    LEFT JOIN public.profiles p ON p.id = l.user_id
    LEFT JOIN auth.users u ON u.id = l.user_id
    WHERE _tipo = 'online5m' AND public.is_admin_user((select auth.uid()))
      AND l.last_seen_at >= now() - interval '5 minutes'
      AND NOT public.is_admin_user(l.user_id)

    UNION ALL

    -- Online Hoje
    SELECT MAX(s.id::text) AS key, s.user_id,
      COALESCE(p.display_name, split_part(MAX(u.email),'@',1), 'Usuário(a)')::text AS title,
      MAX(u.email)::text AS email,
      NULL::text AS subtitle,
      MAX(s.started_at) AS at,
      COUNT(*)::int AS acessos,
      COALESCE(MAX(u.raw_user_meta_data->>'avatar_url'), MAX(u.raw_user_meta_data->>'picture'))::text AS avatar_url,
      bool_or(p.is_premium) AS is_premium,
      COALESCE(p.created_at, MAX(u.created_at)) AS created_at
    FROM public.user_sessions s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    LEFT JOIN auth.users u ON u.id = s.user_id
    WHERE _tipo = 'online' AND public.is_admin_user((select auth.uid()))
      AND s.started_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND s.started_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND NOT public.is_admin_user(s.user_id)
    GROUP BY s.user_id, p.display_name, p.created_at

    UNION ALL

    -- Cadastros
    SELECT p.id::text AS key, p.id AS user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário(a)')::text AS title,
      u.email::text,
      NULL::text AS subtitle,
      p.created_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      p.is_premium,
      COALESCE(p.created_at, u.created_at) AS created_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE _tipo = 'cadastros' AND public.is_admin_user((select auth.uid()))
      AND p.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND p.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND NOT public.is_admin_user(p.id)

    UNION ALL

    -- Trial / Assinaturas (Play Store)
    SELECT s.id::text AS key, s.user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Assinante Play')::text AS title,
      u.email::text,
      (COALESCE(s.base_plan_id, 'Google Play') || ' · ' || replace(COALESCE(s.status::text,''),'SUBSCRIPTION_STATE_',''))::text AS subtitle,
      s.created_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      true::boolean AS is_premium,
      COALESCE(p.created_at, u.created_at, s.created_at) AS created_at
    FROM public.play_subscriptions s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    LEFT JOIN auth.users u ON u.id = s.user_id
    WHERE _tipo = 'trial' AND public.is_admin_user((select auth.uid()))
      AND s.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND s.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND NOT public.is_admin_user(s.user_id)

    UNION ALL

    -- Trial / Assinaturas (Asaas)
    SELECT s.id::text AS key, s.user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Assinante Asaas')::text AS title,
      u.email::text,
      ('Asaas · ' || CASE 
        WHEN lower(s.plano) LIKE '%promo%' THEN 'anual promocional'
        ELSE COALESCE(s.plano,'—')
      END || ' · ' || COALESCE(s.status::text,''))::text AS subtitle,
      COALESCE(s.created_at, s.started_at, s.updated_at) AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      true::boolean AS is_premium,
      COALESCE(p.created_at, u.created_at, s.created_at) AS created_at
    FROM public.asaas_subscriptions s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    LEFT JOIN auth.users u ON u.id = s.user_id
    WHERE _tipo = 'trial' AND public.is_admin_user((select auth.uid()))
      AND (
        (s.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo') AND s.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
        OR
        (s.started_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo') AND s.started_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
      )
      AND s.status = 'ACTIVE'
      AND NOT public.is_admin_user(s.user_id)

    UNION ALL

    -- Trial / Assinaturas (Apple App Store)
    SELECT s.id::text AS key, s.user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Assinante Apple')::text AS title,
      u.email::text,
      ('Apple · ' || COALESCE(s.product_id, 'Assinatura') || ' · ' || COALESCE(s.status::text,''))::text AS subtitle,
      COALESCE(s.created_at, s.start_time) AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      true::boolean AS is_premium,
      COALESCE(p.created_at, u.created_at, s.created_at, s.start_time) AS created_at
    FROM public.apple_subscriptions s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    LEFT JOIN auth.users u ON u.id = s.user_id
    WHERE _tipo = 'trial' AND public.is_admin_user((select auth.uid()))
      AND (
        (s.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo') AND s.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
        OR
        (s.start_time >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo') AND s.start_time < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
      )
      AND s.status IN ('active', 'in_grace')
      AND NOT public.is_admin_user(s.user_id)

    UNION ALL

    -- Paywall (Tela de Assinatura)
    SELECT e.id::text AS key, e.user_id,
      COALESCE(p.display_name, split_part(COALESCE(u.email, e.email),'@',1), 'Usuário(a)')::text AS title,
      COALESCE(u.email, e.email)::text AS email,
      'Visualizou Assinatura'::text AS subtitle,
      e.created_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      COALESCE(p.is_premium, false) AS is_premium,
      COALESCE(p.created_at, u.created_at, e.created_at) AS created_at
    FROM public.app_events e
    LEFT JOIN public.profiles p ON p.id = e.user_id
    LEFT JOIN auth.users u ON u.id = e.user_id
    WHERE _tipo = 'paywall' AND public.is_admin_user((select auth.uid()))
      AND e.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND e.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND e.event_name IN ('assinatura_aberta', 'paywall_view')
      AND (e.user_id IS NULL OR NOT public.is_admin_user(e.user_id))

    UNION ALL

    -- Checkout / Viu Planos
    SELECT e.id::text AS key, e.user_id,
      COALESCE(p.display_name, split_part(COALESCE(u.email, e.email),'@',1), 'Usuário(a)')::text AS title,
      COALESCE(u.email, e.email)::text AS email,
      'Clicou no Plano (Checkout)'::text AS subtitle,
      e.created_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      COALESCE(p.is_premium, false) AS is_premium,
      COALESCE(p.created_at, u.created_at, e.created_at) AS created_at
    FROM public.app_events e
    LEFT JOIN public.profiles p ON p.id = e.user_id
    LEFT JOIN auth.users u ON u.id = e.user_id
    WHERE _tipo = 'viu_planos' AND public.is_admin_user((select auth.uid()))
      AND e.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND e.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND e.event_name IN ('trial_click', 'checkout_view')
      AND (e.user_id IS NULL OR NOT public.is_admin_user(e.user_id))
  ) sub
  ORDER BY at DESC;
$function$;

-- 3. admin_totais
CREATE OR REPLACE FUNCTION public.admin_totais(_tipo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ids uuid[];
  res jsonb;
  hoje timestamptz := date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo');
BEGIN
  IF NOT public.is_admin_user((select auth.uid())) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF _tipo = 'online' OR _tipo = 'online5m' THEN
    SELECT array_agg(DISTINCT user_id) INTO ids FROM public.user_activity_log WHERE user_id IS NOT NULL AND NOT public.is_admin_user(user_id);
    res := jsonb_build_object(
      'total', coalesce(array_length(ids,1),0),
      'hoje', (SELECT count(DISTINCT user_id) FROM public.user_activity_log WHERE last_seen_at >= hoje AND NOT public.is_admin_user(user_id)),
      'd7',   (SELECT count(DISTINCT user_id) FROM public.user_activity_log WHERE last_seen_at >= now() - interval '7 days' AND NOT public.is_admin_user(user_id)),
      'd30',  (SELECT count(DISTINCT user_id) FROM public.user_activity_log WHERE last_seen_at >= now() - interval '30 days' AND NOT public.is_admin_user(user_id))
    );

  ELSIF _tipo = 'trial' THEN
    -- Unifica assinantes do Play Store, Asaas e Apple
    SELECT array_agg(DISTINCT sub_uid) INTO ids FROM (
      SELECT user_id AS sub_uid FROM public.play_subscriptions WHERE user_id IS NOT NULL AND NOT public.is_admin_user(user_id)
      UNION
      SELECT user_id AS sub_uid FROM public.asaas_subscriptions WHERE user_id IS NOT NULL AND status = 'ACTIVE' AND NOT public.is_admin_user(user_id)
      UNION
      SELECT user_id AS sub_uid FROM public.apple_subscriptions WHERE user_id IS NOT NULL AND status IN ('active', 'in_grace') AND NOT public.is_admin_user(user_id)
    ) un;

    res := jsonb_build_object(
      'total', coalesce(array_length(ids,1),0),
      'hoje', (
        (SELECT count(DISTINCT user_id) FROM public.play_subscriptions WHERE created_at >= hoje AND NOT public.is_admin_user(user_id)) +
        (SELECT count(DISTINCT user_id) FROM public.asaas_subscriptions WHERE (created_at >= hoje OR started_at >= hoje) AND status = 'ACTIVE' AND NOT public.is_admin_user(user_id)) +
        (SELECT count(DISTINCT user_id) FROM public.apple_subscriptions WHERE (created_at >= hoje OR start_time >= hoje) AND status IN ('active', 'in_grace') AND NOT public.is_admin_user(user_id))
      ),
      'd7',   (
        (SELECT count(DISTINCT user_id) FROM public.play_subscriptions WHERE created_at >= now() - interval '7 days' AND NOT public.is_admin_user(user_id)) +
        (SELECT count(DISTINCT user_id) FROM public.asaas_subscriptions WHERE (created_at >= now() - interval '7 days' OR started_at >= now() - interval '7 days') AND status = 'ACTIVE' AND NOT public.is_admin_user(user_id)) +
        (SELECT count(DISTINCT user_id) FROM public.apple_subscriptions WHERE (created_at >= now() - interval '7 days' OR start_time >= now() - interval '7 days') AND status IN ('active', 'in_grace') AND NOT public.is_admin_user(user_id))
      ),
      'd30',  (
        (SELECT count(DISTINCT user_id) FROM public.play_subscriptions WHERE created_at >= now() - interval '30 days' AND NOT public.is_admin_user(user_id)) +
        (SELECT count(DISTINCT user_id) FROM public.asaas_subscriptions WHERE (created_at >= now() - interval '30 days' OR started_at >= now() - interval '30 days') AND status = 'ACTIVE' AND NOT public.is_admin_user(user_id)) +
        (SELECT count(DISTINCT user_id) FROM public.apple_subscriptions WHERE (created_at >= now() - interval '30 days' OR start_time >= now() - interval '30 days') AND status IN ('active', 'in_grace') AND NOT public.is_admin_user(user_id))
      )
    );

  ELSIF _tipo = 'paywall' THEN
    SELECT array_agg(DISTINCT user_id) INTO ids FROM public.app_events WHERE event_name IN ('assinatura_aberta', 'paywall_view') AND user_id IS NOT NULL AND NOT public.is_admin_user(user_id);
    res := jsonb_build_object(
      'total', coalesce(array_length(ids,1),0),
      'hoje', (SELECT count(DISTINCT coalesce(user_id::text, email, id::text)) FROM public.app_events WHERE event_name IN ('assinatura_aberta', 'paywall_view') AND created_at >= hoje AND (user_id IS NULL OR NOT public.is_admin_user(user_id))),
      'd7',   (SELECT count(DISTINCT coalesce(user_id::text, email, id::text)) FROM public.app_events WHERE event_name IN ('assinatura_aberta', 'paywall_view') AND created_at >= now() - interval '7 days' AND (user_id IS NULL OR NOT public.is_admin_user(user_id))),
      'd30',  (SELECT count(DISTINCT coalesce(user_id::text, email, id::text)) FROM public.app_events WHERE event_name IN ('assinatura_aberta', 'paywall_view') AND created_at >= now() - interval '30 days' AND (user_id IS NULL OR NOT public.is_admin_user(user_id)))
    );

  ELSIF _tipo = 'viu_planos' THEN
    SELECT array_agg(DISTINCT user_id) INTO ids FROM public.app_events WHERE event_name IN ('trial_click', 'checkout_view') AND user_id IS NOT NULL AND NOT public.is_admin_user(user_id);
    res := jsonb_build_object(
      'total', coalesce(array_length(ids,1),0),
      'hoje', (SELECT count(DISTINCT coalesce(user_id::text, email, id::text)) FROM public.app_events WHERE event_name IN ('trial_click', 'checkout_view') AND created_at >= hoje AND (user_id IS NULL OR NOT public.is_admin_user(user_id))),
      'd7',   (SELECT count(DISTINCT coalesce(user_id::text, email, id::text)) FROM public.app_events WHERE event_name IN ('trial_click', 'checkout_view') AND created_at >= now() - interval '7 days' AND (user_id IS NULL OR NOT public.is_admin_user(user_id))),
      'd30',  (SELECT count(DISTINCT coalesce(user_id::text, email, id::text)) FROM public.app_events WHERE event_name IN ('trial_click', 'checkout_view') AND created_at >= now() - interval '30 days' AND (user_id IS NULL OR NOT public.is_admin_user(user_id)))
    );

  ELSE
    -- Cadastros / geral
    SELECT array_agg(id) INTO ids FROM auth.users WHERE NOT public.is_admin_user(id);
    res := jsonb_build_object(
      'total', coalesce(array_length(ids,1),0),
      'hoje', (SELECT count(*) FROM auth.users WHERE created_at >= hoje AND NOT public.is_admin_user(id)),
      'd7',   (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '7 days' AND NOT public.is_admin_user(id)),
      'd30',  (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '30 days' AND NOT public.is_admin_user(id))
    );
  END IF;

  RETURN res
    || jsonb_build_object(
      'providers', coalesce((
        SELECT jsonb_object_agg(p, c) FROM (
          SELECT CASE
                   WHEN u.raw_app_meta_data->>'provider' IN ('google','apple') THEN u.raw_app_meta_data->>'provider'
                   ELSE 'email'
                 END AS p,
                 count(*) AS c
          FROM auth.users u
          WHERE u.id = ANY(ids)
          GROUP BY 1
        ) t
      ), '{}'::jsonb),
      'premium', (SELECT count(*) FROM public.profiles WHERE id = ANY(ids) AND is_premium),
      'com_telefone', (SELECT count(*) FROM public.profiles WHERE id = ANY(ids) AND coalesce(whatsapp_number, telefone) IS NOT NULL),
      'onboarding', (SELECT count(*) FROM public.profiles WHERE id = ANY(ids) AND onboarding_completed_at IS NOT NULL),
      'paises', coalesce((
        SELECT jsonb_agg(jsonb_build_object('pais', pais, 'total', c) ORDER BY c DESC)
        FROM (
          SELECT coalesce(pais, 'BR') AS pais, count(*) AS c
          FROM public.profiles
          WHERE id = ANY(ids)
          GROUP BY 1
          LIMIT 10
        ) p
      ), '[]'::jsonb)
    );
END;
$function$;

-- 4. admin_lista_provider
CREATE OR REPLACE FUNCTION public.admin_lista_provider(_tipo text, _provider text)
RETURNS TABLE(user_id uuid, email text, nome text, criado_em timestamptz, provider text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ids uuid[];
BEGIN
  IF NOT public.is_admin_user((select auth.uid())) THEN
    RETURN;
  END IF;

  IF _tipo = 'online' OR _tipo = 'online5m' THEN
    SELECT array_agg(DISTINCT l.user_id) INTO ids FROM public.user_activity_log l WHERE l.user_id IS NOT NULL;
  ELSIF _tipo = 'trial' THEN
    SELECT array_agg(DISTINCT sub_uid) INTO ids FROM (
      SELECT s.user_id AS sub_uid FROM public.play_subscriptions s WHERE s.user_id IS NOT NULL
      UNION
      SELECT a.user_id AS sub_uid FROM public.asaas_subscriptions a WHERE a.user_id IS NOT NULL AND a.status = 'ACTIVE'
      UNION
      SELECT ap.user_id AS sub_uid FROM public.apple_subscriptions ap WHERE ap.user_id IS NOT NULL AND ap.status IN ('active', 'in_grace')
    ) un;
  ELSIF _tipo = 'paywall' THEN
    SELECT array_agg(DISTINCT e.user_id) INTO ids FROM public.app_events e WHERE e.event_name IN ('assinatura_aberta', 'paywall_view') AND e.user_id IS NOT NULL;
  ELSIF _tipo = 'viu_planos' THEN
    SELECT array_agg(DISTINCT e.user_id) INTO ids FROM public.app_events e WHERE e.event_name IN ('trial_click', 'checkout_view') AND e.user_id IS NOT NULL;
  ELSE
    SELECT array_agg(u.id) INTO ids FROM auth.users u;
  END IF;

  RETURN QUERY
  SELECT u.id,
         u.email::text,
         COALESCE(p.nome_completo, split_part(u.email::text, '@', 1))::text,
         u.created_at,
         CASE WHEN u.raw_app_meta_data->>'provider' IN ('google','apple')
              THEN u.raw_app_meta_data->>'provider' ELSE 'email' END::text
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = ANY(ids)
    AND (CASE WHEN u.raw_app_meta_data->>'provider' IN ('google','apple')
              THEN u.raw_app_meta_data->>'provider' ELSE 'email' END) = lower(_provider)
  ORDER BY u.created_at DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_metricas_dia(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_lista_dia(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_totais(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_lista_provider(text, text) TO authenticated;
