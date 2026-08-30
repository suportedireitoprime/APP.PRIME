require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('vade_mecum_leis').select('id, slug, nome').ilike('nome', '%Penal%');
  console.log("Leis:", data, error);
}
check();
