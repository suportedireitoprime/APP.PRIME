CREATE OR REPLACE FUNCTION public.admin_metricas_dia(_dia date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN public.is_admin_user((select auth.uid())) THEN jsonb_build_object(
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
        AND NOT public.is_admin_user(user_id))
  ) ELSE jsonb_build_object('online',0,'cadastros',0,'trial',0) END;
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
  IF NOT public.is_admin_user((select auth.uid())) THEN
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
