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

async function checkAdmin() {
  // Verificar se há policies ou funções que permitem escrita em blog_edicao_posts
  // Vamos ver se o bucket 'blog-capas' no Supabase Storage ou R2 funciona
  console.log('Testando storage supabase...');
  const { data: bks, error: bkErr } = await supabase.storage.listBuckets();
  console.log('Buckets Supabase:', bks ? bks.map(b => b.name) : bkErr);
}

checkAdmin().catch(console.error);
