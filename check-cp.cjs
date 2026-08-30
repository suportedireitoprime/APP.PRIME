require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('vade_mecum_artigos').select('id, numero, texto, ordem').eq('lei_id', 'cf9e9292-4fe0-4b23-ae89-611edbb92503').limit(10).order('ordem', { ascending: true });
  console.log("Artigos:", data, error);
}
check();
