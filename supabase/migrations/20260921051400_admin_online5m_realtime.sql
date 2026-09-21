-- Adiciona suporte para _tipo = 'online5m' na admin_lista_dia
-- Filtra por users com atividade nos últimos 5 minutos

CREATE OR REPLACE FUNCTION public.admin_lista_dia(_tipo text, _dia date)
 RETURNS TABLE(key text, user_id uuid, title text, email text, subtitle text, at timestamp with time zone, acessos integer, avatar_url text, is_premium boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    -- Online 5 min (tempo real)
    SELECT * FROM (
      SELECT DISTINCT ON (a.user_id)
        a.user_id::text AS key, a.user_id,
        COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário')::text AS title,
        u.email::text AS email, a.current_route::text AS subtitle, a.last_seen_at AS at,
        1::int AS acessos,
        COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
        (p.is_premium = true OR EXISTS(SELECT 1 FROM public.asaas_subscriptions s WHERE s.user_id = p.id AND s.status = 'ACTIVE') OR EXISTS(SELECT 1 FROM public.legacy_subscribers ls WHERE ls.claimed_user_id = p.id AND ls.status = 'active'))::boolean AS is_premium
      FROM public.user_activity_log a
      LEFT JOIN public.profiles p ON p.id = a.user_id
      LEFT JOIN auth.users u ON u.id = a.user_id
      WHERE _tipo = 'online5m' AND public.is_admin_user((select auth.uid()))
        AND a.last_seen_at >= now() - interval '5 minutes'
        AND NOT public.is_admin_user(a.user_id)
      ORDER BY a.user_id, a.last_seen_at DESC
    ) o5
    UNION ALL
    -- Online hoje (dia inteiro)
    SELECT * FROM (
      SELECT DISTINCT ON (a.user_id)
        a.user_id::text AS key, a.user_id,
        COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário')::text AS title,
        u.email::text AS email, a.current_route::text AS subtitle, a.last_seen_at AS at,
        GREATEST(1, (
          SELECT COUNT(*) FROM public.user_sessions s
          WHERE s.user_id = a.user_id
            AND s.started_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
            AND s.started_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        ))::int AS acessos,
        COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
        (p.is_premium = true OR EXISTS(SELECT 1 FROM public.asaas_subscriptions s WHERE s.user_id = p.id AND s.status = 'ACTIVE') OR EXISTS(SELECT 1 FROM public.legacy_subscribers ls WHERE ls.claimed_user_id = p.id AND ls.status = 'active'))::boolean AS is_premium
      FROM public.user_activity_log a
      LEFT JOIN public.profiles p ON p.id = a.user_id
      LEFT JOIN auth.users u ON u.id = a.user_id
      WHERE _tipo = 'online' AND public.is_admin_user((select auth.uid()))
        AND a.last_seen_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND a.last_seen_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND NOT public.is_admin_user(a.user_id)
      ORDER BY a.user_id, a.last_seen_at DESC
    ) o
    UNION ALL
    -- Cadastros
    SELECT p.id::text, p.id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário')::text,
      u.email::text, u.email::text, p.created_at, NULL::int,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      (p.is_premium = true OR EXISTS(SELECT 1 FROM public.asaas_subscriptions s WHERE s.user_id = p.id AND s.status = 'ACTIVE') OR EXISTS(SELECT 1 FROM public.legacy_subscribers ls WHERE ls.claimed_user_id = p.id AND ls.status = 'active'))::boolean AS is_premium
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE _tipo = 'cadastros' AND public.is_admin_user((select auth.uid()))
      AND p.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND p.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND NOT public.is_admin_user(p.id)
    UNION ALL
    -- Trial / Assinaturas (Google Play)
    SELECT s.id::text, s.user_id,
      COALESCE(p.display_name, split_part(u.email,'@',1), s.product_id, 'Assinatura')::text,
      u.email::text,
      (COALESCE(s.base_plan_id,'—') || ' · ' || replace(COALESCE(s.status::text,''),'SUBSCRIPTION_STATE_',''))::text,
      s.created_at, NULL::int,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      (p.is_premium = true OR EXISTS(SELECT 1 FROM public.asaas_subscriptions asub WHERE asub.user_id = p.id AND asub.status = 'ACTIVE') OR EXISTS(SELECT 1 FROM public.legacy_subscribers ls WHERE ls.claimed_user_id = p.id AND ls.status = 'active'))::boolean AS is_premium
    FROM public.play_subscriptions s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    LEFT JOIN auth.users u ON u.id = s.user_id
    WHERE _tipo = 'trial' AND public.is_admin_user((select auth.uid()))
      AND s.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND s.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND NOT public.is_admin_user(s.user_id)
    UNION ALL
    -- Paywall (quem abriu tela de assinaturas)
    SELECT * FROM (
      SELECT DISTINCT ON (COALESCE(e.user_id, e.id))
        e.id::text AS key, e.user_id,
        COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário (Visitante)')::text AS title,
        COALESCE(u.email, e.email, 'Visitante')::text AS email,
        'Abriu planos'::text AS subtitle,
        e.created_at AS at, NULL::int AS acessos,
        COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
        COALESCE((p.is_premium = true OR EXISTS(SELECT 1 FROM public.asaas_subscriptions asub WHERE asub.user_id = p.id AND asub.status = 'ACTIVE') OR EXISTS(SELECT 1 FROM public.legacy_subscribers ls WHERE ls.claimed_user_id = p.id AND ls.status = 'active')), false)::boolean AS is_premium
      FROM public.app_events e
      LEFT JOIN public.profiles p ON p.id = e.user_id
      LEFT JOIN auth.users u ON u.id = e.user_id
      WHERE _tipo = 'paywall' AND public.is_admin_user((select auth.uid()))
        AND e.event_name = 'assinatura_aberta'
        AND e.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND e.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND (e.user_id IS NULL OR NOT public.is_admin_user(e.user_id))
      ORDER BY COALESCE(e.user_id, e.id), e.created_at DESC
    ) pw
    UNION ALL
    -- Checkout (quem clicou em trial_click)
    SELECT * FROM (
      SELECT DISTINCT ON (COALESCE(e.user_id, e.id))
        e.id::text AS key, e.user_id,
        COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário (Visitante)')::text AS title,
        COALESCE(u.email, e.email, 'Visitante')::text AS email,
        'Iniciou checkout'::text AS subtitle,
        e.created_at AS at, NULL::int AS acessos,
        COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
        COALESCE((p.is_premium = true OR EXISTS(SELECT 1 FROM public.asaas_subscriptions asub WHERE asub.user_id = p.id AND asub.status = 'ACTIVE') OR EXISTS(SELECT 1 FROM public.legacy_subscribers ls WHERE ls.claimed_user_id = p.id AND ls.status = 'active')), false)::boolean AS is_premium
      FROM public.app_events e
      LEFT JOIN public.profiles p ON p.id = e.user_id
      LEFT JOIN auth.users u ON u.id = e.user_id
      WHERE _tipo = 'viu_planos' AND public.is_admin_user((select auth.uid()))
        AND e.event_name = 'trial_click'
        AND e.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND e.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND (e.user_id IS NULL OR NOT public.is_admin_user(e.user_id))
      ORDER BY COALESCE(e.user_id, e.id), e.created_at DESC
    ) vc
  ) t
  ORDER BY t.at DESC
  LIMIT 500;
$function$;

-- Também atualizar admin_metricas_dia para incluir online5m
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
    'online', (SELECT COUNT(DISTINCT user_id) FROM public.user_activity_log
      WHERE last_seen_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND last_seen_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND NOT public.is_admin_user(user_id)),
    'cadastros', (SELECT COUNT(*) FROM public.profiles
      WHERE created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND NOT public.is_admin_user(id)),
    'trial', (SELECT COUNT(*) FROM public.play_subscriptions
      WHERE created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND NOT public.is_admin_user(user_id)),
    'paywall', (SELECT COUNT(DISTINCT coalesce(user_id, (metadata->>'device_id')::uuid, id)) FROM public.app_events
      WHERE event_name = 'assinatura_aberta'
        AND created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND (user_id IS NULL OR NOT public.is_admin_user(user_id)))
  ) ELSE jsonb_build_object('online5m',0,'online',0,'cadastros',0,'trial',0,'paywall',0) END;
$function$;
