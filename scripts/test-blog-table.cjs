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

async function testBlogTable() {
  const testId = 'teste-perm-antigravity';
  const row = {
    id: testId,
    titulo: 'Artigo de Teste Permissao',
    resumo: 'Resumo teste',
    conteudo_md: '# Teste',
    imagem_url: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/teste.png',
    categoria: 'Direito Administrativo',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 3,
    publicado: true,
    data_publicacao: new Date().toISOString()
  };

  console.log('Tentando insert...');
  const { data: insData, error: insErr } = await supabase.from('blog_edicao_posts').insert([row]).select();
  if (insErr) {
    console.error('Insert error:', insErr);
    return;
  }
  console.log('Insert OK:', insData[0].id);

  console.log('Tentando delete...');
  const { error: delErr } = await supabase.from('blog_edicao_posts').delete().eq('id', testId);
  if (delErr) {
    console.error('Delete error:', delErr);
    return;
  }
  console.log('Delete OK!');
}

testBlogTable().catch(console.error);
