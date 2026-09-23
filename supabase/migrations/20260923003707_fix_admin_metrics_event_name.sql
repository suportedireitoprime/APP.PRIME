-- Fix event_type to event_name in admin_metricas_dia
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
        (SELECT COUNT(*) FROM public.play_subscriptions
         WHERE created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
           AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
           AND NOT public.is_admin_user(user_id))
        +
        (SELECT COUNT(*) FROM public.asaas_subscriptions
         WHERE updated_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
           AND updated_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
           AND status = 'ACTIVE'
           AND NOT public.is_admin_user(user_id))
    ),
    'paywall', (SELECT COUNT(DISTINCT user_id) FROM public.app_events
      WHERE event_name = 'paywall_view'
        AND created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND NOT public.is_admin_user(user_id))
  ) ELSE jsonb_build_object('online5m',0,'online',0,'cadastros',0,'trial',0,'paywall',0) END;
$function$;

-- Fix event_type to event_name in admin_lista_dia
CREATE OR REPLACE FUNCTION public.admin_lista_dia(_tipo text, _dia date)
 RETURNS TABLE(key text, user_id uuid, title text, email text, subtitle text, at timestamp with time zone, acessos integer, avatar_url text, is_premium boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    -- Online 5m (ignoramos _dia)
    SELECT l.id::text AS key, l.user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário(a)')::text AS title,
      u.email::text,
      NULL::text AS subtitle,
      l.last_seen_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      p.is_premium
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
      MAX(u.email)::text,
      NULL::text AS subtitle,
      MAX(s.started_at) AS at,
      COUNT(*)::int AS acessos,
      COALESCE(MAX(u.raw_user_meta_data->>'avatar_url'), MAX(u.raw_user_meta_data->>'picture'))::text AS avatar_url,
      bool_or(p.is_premium) AS is_premium
    FROM public.user_sessions s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    LEFT JOIN auth.users u ON u.id = s.user_id
    WHERE _tipo = 'online' AND public.is_admin_user((select auth.uid()))
      AND s.started_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND s.started_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND NOT public.is_admin_user(s.user_id)
    GROUP BY s.user_id, p.display_name

    UNION ALL

    -- Cadastros
    SELECT p.id::text AS key, p.id AS user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário(a)')::text AS title,
      u.email::text,
      NULL::text AS subtitle,
      p.created_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      p.is_premium
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE _tipo = 'cadastros' AND public.is_admin_user((select auth.uid()))
      AND p.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND p.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND NOT public.is_admin_user(p.id)

    UNION ALL

    -- Trial / Assinaturas (Play)
    SELECT s.id::text AS key, s.user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Assinante Play')::text AS title,
      u.email::text,
      (COALESCE(s.base_plan_id,'—') || ' · ' || replace(COALESCE(s.status::text,''),'SUBSCRIPTION_STATE_',''))::text AS subtitle,
      s.created_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      true::boolean AS is_premium
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
      ('Asaas · ' || COALESCE(s.plano,'—') || ' · ' || COALESCE(s.status::text,''))::text AS subtitle,
      s.updated_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      true::boolean AS is_premium
    FROM public.asaas_subscriptions s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    LEFT JOIN auth.users u ON u.id = s.user_id
    WHERE _tipo = 'trial' AND public.is_admin_user((select auth.uid()))
      AND s.updated_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND s.updated_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND s.status = 'ACTIVE'
      AND NOT public.is_admin_user(s.user_id)

    UNION ALL

    -- Paywall
    SELECT e.id::text AS key, e.user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário(a)')::text AS title,
      u.email::text,
      'Visualizou Paywall'::text AS subtitle,
      e.created_at AS at, NULL::int AS acessos,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      p.is_premium
    FROM public.app_events e
    LEFT JOIN public.profiles p ON p.id = e.user_id
    LEFT JOIN auth.users u ON u.id = e.user_id
    WHERE _tipo = 'paywall' AND public.is_admin_user((select auth.uid()))
      AND e.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND e.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND e.event_name = 'paywall_view'
      AND NOT public.is_admin_user(e.user_id)
  ) sub
  ORDER BY at DESC;
$function$;
