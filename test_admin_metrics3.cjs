require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  const sql = `
  SELECT jsonb_build_object(
    'online5m', (SELECT COUNT(DISTINCT user_id) FROM public.user_activity_log
      WHERE last_seen_at >= now() - interval '5 minutes'
        AND NOT public.is_admin_user(user_id)),
    'online', (SELECT COUNT(DISTINCT user_id) FROM public.user_sessions
      WHERE started_at >= ('2026-10-01'::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND started_at < (('2026-10-01'::date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND NOT public.is_admin_user(user_id)),
    'cadastros', (SELECT COUNT(*) FROM public.profiles
      WHERE created_at >= ('2026-10-01'::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < (('2026-10-01'::date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND NOT public.is_admin_user(id)),
    'paywall', (SELECT COUNT(DISTINCT COALESCE(user_id::text, email, id::text)) FROM public.app_events
      WHERE event_name IN ('assinatura_aberta', 'paywall_view')
        AND created_at >= ('2026-10-01'::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND created_at < (('2026-10-01'::date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
        AND (user_id IS NULL OR NOT public.is_admin_user(user_id)))
  ) as result;
  `;
  
  const { data, error } = await supabase.functions.invoke('admin-sql', {
    body: { sql: sql, secret: 'super-secret-admin' }
  });
  
  console.log('Direct SQL Result:', JSON.stringify(data, null, 2), error);
}

runTest();
