const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.from('stf_noticias_folha').delete().neq('id', 0);
  console.log('Deleted:', data, 'Error:', error);
}
run();
