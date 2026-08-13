import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

let url, key;
if (existsSync('.env')) {
  const env = readFileSync('.env', 'utf8');
  url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
  key = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();
}

if (!url || !key) {
  console.log("No Supabase URL/Key found in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`Checking data for today: ${today}`);

  const { data: resenha } = await supabase.from('resenha_diaria').select('*').order('created_at', { ascending: false }).limit(5);
  console.log(`\nLast 5 items in resenha_diaria:`);
  console.log(resenha?.map(r => `${r.data_dou} - ${r.tipo_ato} ${r.numero_ato}`));

  const { data: noticias } = await supabase.from('noticias_juridicas').select('*').order('data_publicacao', { ascending: false }).limit(2);
  console.log(`\nLast 2 items in noticias_juridicas:`);
  console.log(noticias?.map(n => `${n.data_publicacao} - ${n.titulo}`));

  const { data: blogs } = await supabase.from('blog_edicao_posts').select('*').order('data_publicacao', { ascending: false }).limit(2);
  console.log(`\nLast 2 items in blog_edicao_posts:`);
  console.log(blogs?.map(b => `${b.data_publicacao} - ${b.titulo}`));
}

check();
