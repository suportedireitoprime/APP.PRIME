const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function check() {
  const areas = ['Direito Civil', 'Direito Processual Civil', 'Direito Tributário'];
  for (const a of areas) {
    const { count, error } = await supabase.from('audioaulas_acervo').select('*', { count: 'exact', head: true }).eq('area', a);
    console.log(a, 'count:', count, 'error:', error ? error.message : null);
  }

  // Also sample 1 existing row from any area to see all columns
  const { data } = await supabase.from('audioaulas_acervo').select('*').limit(1);
  console.log('\nSample row from audioaulas_acervo:', data);
}

check().catch(console.error);
