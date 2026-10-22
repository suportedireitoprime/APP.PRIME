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

async function run() {
  const { data, error } = await supabase
    .from('blog_edicao_posts')
    .select('id, titulo, categoria, conteudo_md')
    .limit(2);

  if (error) {
    console.error('Erro:', error);
    return;
  }

  for (const post of data) {
    console.log('==============================================');
    console.log('ID:', post.id);
    console.log('TITULO:', post.titulo);
    console.log('CATEGORIA:', post.categoria);
    console.log('TAMANHO MD:', post.conteudo_md ? post.conteudo_md.length : 0);
    console.log('CONTEUDO AMOSTRA:\n', post.conteudo_md ? post.conteudo_md.slice(0, 800) : 'vazio');
    console.log('\nIMAGENS ENCONTRADAS NO MD:');
    const matches = (post.conteudo_md || '').match(/!\[.*?\]\(.*?\)/g) || [];
    console.log(matches);
  }
}

run();
