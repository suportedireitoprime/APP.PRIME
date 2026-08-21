CREATE OR REPLACE FUNCTION public.admin_metricas_dia(_dia date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN public.is_admin_user(auth.uid()) THEN jsonb_build_object(
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
  ) ELSE jsonb_build_object('online',0,'cadastros',0,'trial',0,'paywall',0) END;
$function$;

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
  IF NOT public.is_admin_user(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF _tipo = 'online' THEN
    SELECT array_agg(DISTINCT user_id) INTO ids FROM public.user_activity_log WHERE user_id IS NOT NULL AND NOT public.is_admin_user(user_id);
    res := jsonb_build_object(
      'total', coalesce(array_length(ids,1),0),
      'hoje', (SELECT count(DISTINCT user_id) FROM public.user_activity_log WHERE last_seen_at >= hoje AND NOT public.is_admin_user(user_id)),
      'd7',   (SELECT count(DISTINCT user_id) FROM public.user_activity_log WHERE last_seen_at >= now() - interval '7 days' AND NOT public.is_admin_user(user_id)),
      'd30',  (SELECT count(DISTINCT user_id) FROM public.user_activity_log WHERE last_seen_at >= now() - interval '30 days' AND NOT public.is_admin_user(user_id))
    );
  ELSIF _tipo = 'trial' THEN
    SELECT array_agg(DISTINCT user_id) INTO ids FROM public.play_subscriptions WHERE user_id IS NOT NULL AND NOT public.is_admin_user(user_id);
    res := jsonb_build_object(
      'total', coalesce(array_length(ids,1),0),
      'hoje', (SELECT count(DISTINCT user_id) FROM public.play_subscriptions WHERE created_at >= hoje AND NOT public.is_admin_user(user_id)),
      'd7',   (SELECT count(DISTINCT user_id) FROM public.play_subscriptions WHERE created_at >= now() - interval '7 days' AND NOT public.is_admin_user(user_id)),
      'd30',  (SELECT count(DISTINCT user_id) FROM public.play_subscriptions WHERE created_at >= now() - interval '30 days' AND NOT public.is_admin_user(user_id))
    );
  ELSIF _tipo = 'paywall' THEN
    SELECT array_agg(DISTINCT user_id) INTO ids FROM public.app_events WHERE event_name = 'assinatura_aberta' AND user_id IS NOT NULL AND NOT public.is_admin_user(user_id);
    res := jsonb_build_object(
      'total', coalesce(array_length(ids,1),0),
      'hoje', (SELECT count(DISTINCT coalesce(user_id, id)) FROM public.app_events WHERE event_name = 'assinatura_aberta' AND created_at >= hoje AND (user_id IS NULL OR NOT public.is_admin_user(user_id))),
      'd7',   (SELECT count(DISTINCT coalesce(user_id, id)) FROM public.app_events WHERE event_name = 'assinatura_aberta' AND created_at >= now() - interval '7 days' AND (user_id IS NULL OR NOT public.is_admin_user(user_id))),
      'd30',  (SELECT count(DISTINCT coalesce(user_id, id)) FROM public.app_events WHERE event_name = 'assinatura_aberta' AND created_at >= now() - interval '30 days' AND (user_id IS NULL OR NOT public.is_admin_user(user_id)))
    );
  ELSE
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
          SELECT coalesce(pais,'Não informado') AS pais, count(*) AS c
          FROM public.profiles WHERE id = ANY(ids) GROUP BY 1 ORDER BY 2 DESC LIMIT 6
        ) g
      ), '[]'::jsonb)
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_lista_dia(_tipo text, _dia date)
 RETURNS TABLE(key text, user_id uuid, title text, email text, subtitle text, at timestamp with time zone, acessos integer, avatar_url text, is_premium boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM (
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
      WHERE _tipo = 'online' AND public.is_admin_user(auth.uid())
        AND a.last_seen_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND a.last_seen_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY a.user_id, a.last_seen_at DESC
    ) o
    UNION ALL
    SELECT p.id::text, p.id,
      COALESCE(p.display_name, split_part(u.email,'@',1), 'Usuário')::text,
      u.email::text, u.email::text, p.created_at, NULL::int,
      COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text AS avatar_url,
      (p.is_premium = true OR EXISTS(SELECT 1 FROM public.asaas_subscriptions s WHERE s.user_id = p.id AND s.status = 'ACTIVE') OR EXISTS(SELECT 1 FROM public.legacy_subscribers ls WHERE ls.claimed_user_id = p.id AND ls.status = 'active'))::boolean AS is_premium
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE _tipo = 'cadastros' AND public.is_admin_user(auth.uid())
      AND p.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND p.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
    UNION ALL
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
    WHERE _tipo = 'trial' AND public.is_admin_user(auth.uid())
      AND s.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      AND s.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
    UNION ALL
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
      WHERE _tipo = 'paywall' AND public.is_admin_user(auth.uid())
        AND e.event_name = 'assinatura_aberta'
        AND e.created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND e.created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND (e.user_id IS NULL OR NOT public.is_admin_user(e.user_id))
      ORDER BY COALESCE(e.user_id, e.id), e.created_at DESC
    ) pw
  ) t
  ORDER BY t.at DESC
  LIMIT 500;
$function$;
