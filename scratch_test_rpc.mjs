import fetch from 'node-fetch';

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';

const rawSql = `
CREATE OR REPLACE FUNCTION public.admin_metricas_dia(_dia date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN public.is_admin_user(auth.uid()) THEN jsonb_build_object(
    'online', (SELECT COUNT(DISTINCT user_id) FROM public.user_activity_log
      WHERE last_seen_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND last_seen_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')),
    'online5m', (SELECT COUNT(DISTINCT user_id) FROM public.user_activity_log
      WHERE last_seen_at >= (now() - interval '5 minutes')),
    'cadastros', (SELECT COUNT(*) FROM public.profiles
      WHERE created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')),
    'trial', (SELECT COUNT(*) FROM public.play_subscriptions
      WHERE created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
  ) ELSE jsonb_build_object('online',0,'online5m',0,'cadastros',0,'trial',0) END;
$function$;

DROP FUNCTION IF EXISTS public.admin_lista_dia(text, date);

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
      WHERE (_tipo = 'online' OR _tipo = 'online5m') AND public.is_admin_user(auth.uid())
        AND (
          (_tipo = 'online' AND a.last_seen_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo') AND a.last_seen_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'))
          OR
          (_tipo = 'online5m' AND a.last_seen_at >= (now() - interval '5 minutes'))
        )
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
  ) t
  ORDER BY t.at DESC
  LIMIT 500;
$function$;
`;

async function run() {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: 'super-secret-admin', sql: rawSql })
  });
  console.log("Status:", res.status);
  console.log("Text:", await res.text());
}

run();
