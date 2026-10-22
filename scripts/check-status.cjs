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

async function check() {
  const { data, count, error } = await supabase
    .from('blog_edicao_posts')
    .select('id, categoria', { count: 'exact' });

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log('Total de artigos ativos no Supabase:', count);
  const byCat = {};
  (data || []).forEach(r => {
    byCat[r.categoria] = (byCat[r.categoria] || 0) + 1;
  });
  console.table(byCat);
}

check();
