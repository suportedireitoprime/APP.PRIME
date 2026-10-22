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

async function checkCurrentPosts() {
  const { data: posts, count, error } = await supabase
    .from('blog_edicao_posts')
    .select('id, titulo, categoria, publicado, created_at', { count: 'exact' });

  if (error) {
    console.error('Erro ao buscar posts:', error.message);
    return;
  }

  console.log(`Total de posts existentes em blog_edicao_posts: ${posts ? posts.length : 0}`);
  if (posts && posts.length > 0) {
    const cats = {};
    posts.forEach(p => {
      cats[p.categoria] = (cats[p.categoria] || 0) + 1;
    });
    console.log('Posts por categoria atual:', cats);
    console.log('Primeiros 3 posts:', posts.slice(0, 3));
  }

  const { data: temas } = await supabase.from('blog_edicao_temas').select('*');
  console.log(`Total de temas em blog_edicao_temas: ${temas ? temas.length : 0}`);
}

checkCurrentPosts();
