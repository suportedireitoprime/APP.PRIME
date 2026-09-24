-- Migration: 20260924134000_fix_admin_subscribers_started_at.sql
-- Atualiza admin_lista_dia para priorizar started_at na exibição de horário de assinaturas Asaas e Apple

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
      COALESCE(s.started_at, s.created_at, s.updated_at) AS at, NULL::int AS acessos,
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
      COALESCE(s.start_time, s.created_at) AS at, NULL::int AS acessos,
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
