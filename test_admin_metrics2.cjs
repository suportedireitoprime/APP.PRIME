require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  const sql = `
CREATE OR REPLACE FUNCTION public.admin_metricas_dia_test(_dia date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
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
    'paywall', (SELECT COUNT(DISTINCT COALESCE(user_id::text, email, id::text)) FROM public.app_events
      WHERE event_name IN ('assinatura_aberta', 'paywall_view')
        AND created_at >= (_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < ((_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND (user_id IS NULL OR NOT public.is_admin_user(user_id)))
  );
$$;
  `;
  
  await supabase.functions.invoke('admin-sql', {
    body: { sql: sql, secret: 'super-secret-admin' }
  });
  
  const { data, error } = await supabase.rpc('admin_metricas_dia_test', { _dia: '2026-10-01' });
  console.log('Result without auth check:', data, error);
}

runTest();
