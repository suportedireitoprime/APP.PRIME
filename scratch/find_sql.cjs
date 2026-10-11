const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

async function findSql() {
  const { data, error } = await sb.rpc('exec_sql', {
    query: `
      SELECT u.id, u.email, u.created_at, p.display_name, p.is_premium
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      WHERE u.email ILIKE '%leandrofs2010%' OR u.email ILIKE '%limadesouzawagner0%'
    `
  });
  console.log('SQL Results Users:', data, error);

  if (data && data.length > 0) {
    for (const u of data) {
      console.log('\n--- VERIFICANDO USUARIO:', u.email, '---');
      const { data: asaas } = await sb.rpc('exec_sql', { query: `SELECT * FROM public.asaas_subscriptions WHERE user_id = '${u.id}'` });
      console.log('Asaas:', asaas);
      const { data: play } = await sb.rpc('exec_sql', { query: `SELECT * FROM public.play_subscriptions WHERE user_id = '${u.id}'` });
      console.log('Play:', play);
      const { data: apple } = await sb.rpc('exec_sql', { query: `SELECT * FROM public.apple_subscriptions WHERE user_id = '${u.id}'` });
      console.log('Apple:', apple);
      const { data: leg } = await sb.rpc('exec_sql', { query: `SELECT * FROM public.legacy_subscribers WHERE claimed_user_id = '${u.id}' OR email ILIKE '${u.email}'` });
      console.log('Legacy:', leg);
      const { data: cancel } = await sb.rpc('exec_sql', { query: `SELECT * FROM public.assinatura_cancelamentos WHERE user_id = '${u.id}'` });
      console.log('Cancelamentos:', cancel);
    }
  }
}

findSql().catch(console.error);
