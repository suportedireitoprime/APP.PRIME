const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  console.log("=== asaas_subscriptions ===");
  const { data: asaas, error: asaasError } = await supabase.from('asaas_subscriptions').select('id, user_id, created_at, plano, status, asaas_customer_id').order('created_at', { ascending: false }).limit(5);
  console.log(asaas, asaasError);

  console.log("=== play_subscriptions ===");
  const { data: play, error: playError } = await supabase.from('play_subscriptions').select('id, user_id, status, created_at').order('created_at', { ascending: false }).limit(5);
  console.log(play, playError);

  console.log("=== legacy_subscribers ===");
  const { data: leg, error: legError } = await supabase.from('legacy_subscribers').select('id, email, status, created_at').order('created_at', { ascending: false }).limit(5);
  console.log(leg, legError);

  console.log("=== trial_click app_events ===");
  const { data: vpEvents } = await supabase.from('app_events').select('user_id, email, event_name, created_at').in('event_name', ['trial_click', 'assinatura_aberta']).order('created_at', {ascending: false}).limit(5);
  console.log(vpEvents);

  console.log("=== admin_lista_dia ===");
  const { data: rpc, error: rpcError } = await supabase.rpc('admin_lista_dia', { _tipo: 'trial', _dia: '2026-09-22' });
  console.log(rpc, rpcError);
}

run();
