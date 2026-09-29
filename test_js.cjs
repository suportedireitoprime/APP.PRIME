const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dnjrgpldcwcpoywamorr.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('user_activity_log')
    .select('*')
    .in('action', ['/assinatura', '/pagamento/sucesso', 'checkout', 'assinou'])
    .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
    .order('created_at', { ascending: false });

  console.log('Error:', error);
  console.log(JSON.stringify(data, null, 2));
}

run();
