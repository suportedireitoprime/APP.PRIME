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

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(url, key);

async function run() {
  const { count: narracoesCount } = await supabase
    .from('narracoes_artigos')
    .select('*', { count: 'exact', head: true });

  const { count: vadeCount } = await supabase
    .from('vade_mecum_leis')
    .select('*', { count: 'exact', head: true });

  const { count: audioCount } = await supabase
    .from('audioaulas_acervo')
    .select('*', { count: 'exact', head: true });

  console.log('Contagens:', { narracoesCount, vadeCount, audioCount });
}

run();
