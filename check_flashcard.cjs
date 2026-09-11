const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await supabase.from('aprender_blocos').select('*').eq('tipo', 'flashcard').limit(1);
  if (data) {
     console.log(JSON.stringify(data[0], null, 2));
  }
}

run().catch(console.error);
