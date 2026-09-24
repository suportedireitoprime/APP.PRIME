require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function run() {
  const uid = '38b22d80-1a64-4504-9523-2ebd1b38948d';
  console.log("=== Checking Full Status for Isabelle Severo ===");

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  console.log("\n1. Profile:", profile);

  const { data: asaas } = await supabase.from('asaas_subscriptions').select('*').eq('user_id', uid);
  console.log("\n2. asaas_subscriptions:", asaas);

  const { data: legacy } = await supabase.from('legacy_subscribers').select('*').eq('claimed_user_id', uid);
  console.log("\n3. legacy_subscribers:", legacy);

  const { data: play } = await supabase.from('play_subscriptions').select('*').eq('user_id', uid);
  console.log("\n4. play_subscriptions:", play);

  const { data: apple } = await supabase.from('apple_subscriptions').select('*').eq('user_id', uid);
  console.log("\n5. apple_subscriptions:", apple);

  const { data: userSub } = await supabase.from('user_subscriptions').select('*').eq('user_id', uid);
  console.log("\n6. user_subscriptions:", userSub);
}

run();
