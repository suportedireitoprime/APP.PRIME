const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function inspectVisuais() {
  const { data } = await supabase
    .from('visuais_juridicos')
    .select('id, tipo, categoria, item_key, item_label, titulo')
    .eq('categoria', 'materias');

  console.log(`Total de visuais de matérias existentes: ${data?.length}`);
  console.log('Exemplos de item_key e item_label:');
  console.table(data?.slice(0, 15));
}

inspectVisuais().catch(console.error);
