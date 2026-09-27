const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: profiles, error: err1 } = await supabase.from('profiles').select('*').ilike('email', '%nercino%');
  if (err1) console.error(err1);
  console.log('Profiles:', profiles);
  
  if (profiles && profiles.length > 0) {
    const userId = profiles[0].id;
    const { data: asaasSubs } = await supabase.from('asaas_subscriptions').select('*').eq('user_id', userId);
    console.log('Asaas Subs:', asaasSubs);
  }
}
checkData();
