require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('push_campaigns').select('id, title, status, automation_key, created_at').order('created_at', { ascending: false }).limit(20);
  console.log(JSON.stringify(data, null, 2));
}

run();
