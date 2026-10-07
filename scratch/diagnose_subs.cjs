require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function run() {
  console.log("Checking subscriptions for today (2026-09-24)...");
  
  // 1. Asaas Subscriptions
  const { data: asaas, error: eAsaas } = await supabase
    .from('asaas_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log("\n--- Asaas Subscriptions (last 10) ---");
  console.log(asaas?.map(s => ({
    id: s.id,
    user_id: s.user_id,
    created_at: s.created_at,
    started_at: s.started_at,
    plano: s.plano,
    status: s.status,
    valor: s.valor
  })));

  // 2. Play Subscriptions
  const { data: play } = await supabase
    .from('play_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log("\n--- Play Subscriptions (last 10) ---");
  console.log(play?.map(s => ({
    id: s.id,
    user_id: s.user_id,
    created_at: s.created_at,
    product_id: s.product_id,
    status: s.status
  })));

  // 3. Apple Subscriptions
  const { data: apple } = await supabase
    .from('apple_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log("\n--- Apple Subscriptions (last 10) ---");
  console.log(apple?.map(s => ({
    id: s.id,
    user_id: s.user_id,
    created_at: s.created_at,
    start_time: s.start_time,
    product_id: s.product_id,
    status: s.status
  })));

  // 4. Legacy Subscribers
  const { data: leg } = await supabase
    .from('legacy_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log("\n--- Legacy Subscribers (last 10) ---");
  console.log(leg?.map(s => ({
    id: s.id,
    email: s.email,
    created_at: s.created_at,
    tipo: s.tipo,
    status: s.status,
    claimed_user_id: s.claimed_user_id
  })));

  // 5. Profiles with is_premium
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, display_name, email, is_premium, updated_at, created_at')
    .eq('is_premium', true)
    .order('updated_at', { ascending: false })
    .limit(10);
  console.log("\n--- Profiles is_premium=true (last 10) ---");
  console.log(profs);

  // 6. App Events
  const { data: events } = await supabase
    .from('app_events')
    .select('*')
    .in('event_name', ['trial_click', 'checkout_completed', 'assinatura_concluida', 'subscription_created', 'payment_confirmed'])
    .order('created_at', { ascending: false })
    .limit(10);
  console.log("\n--- App Events (last 10 relevant) ---");
  console.log(events?.map(e => ({
    id: e.id,
    user_id: e.user_id,
    event_name: e.event_name,
    created_at: e.created_at,
    metadata: e.metadata
  })));
}

run();
