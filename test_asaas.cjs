const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const a = await s.from('asaas_subscriptions').select('id, plano, status, updated_at').gte('updated_at', '2026-09-22T00:00:00-03:00');
  const p = await s.from('play_subscriptions').select('id, created_at').gte('created_at', '2026-09-22T00:00:00-03:00');
  console.log('ASAAS_COUNT:', a.data.length);
  console.log('PLAY_COUNT:', p.data.length);
  console.log('ASAAS_DATA:', a.data);
  console.log('PLAY_DATA:', p.data);
}
run();
