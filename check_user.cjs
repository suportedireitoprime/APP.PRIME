const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  // Check profile
  const { data: profile } = await supabase.from('profiles').select('*').ilike('email', '%nercino%');
  console.log('--- Profile ---');
  console.log(profile);

  if (!profile) return;

  // Check subscription
  const { data: subs } = await supabase.from('asaas_subscriptions').select('*').eq('user_id', profile.id);
  console.log('--- Subscriptions ---');
  console.log(subs);

  // Check Asaas payments/webhooks (if we have a table for it)
  // Let's see if there is any table like asaas_webhooks or payments
  const { data: tables } = await supabase.rpc('get_tables').catch(() => ({ data: [] }));
  // We can just check the subscriptions table first.
}

checkUser();



