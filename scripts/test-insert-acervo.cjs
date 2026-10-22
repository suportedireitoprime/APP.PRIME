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

async function testInsert() {
  const row = {
    area: 'Direito Civil',
    tema: '01. Pessoas no Código Civil',
    sequencia: 1,
    titulo: 'Pessoas Naturais (Teste)',
    descricao: '',
    url_audio: 'https://pub-0c1a0e4ebbdd44dfa883dd36c269f19f.r2.dev/narracoes/areas/direito-civil/01.%20Pessoas%20no%20C%C3%B3digo%20Civil/teste.mp3',
    tag: 'Civil',
    r2_key: 'narracoes/areas/direito-civil/01. Pessoas no Código Civil/teste.mp3'
  };

  const { data, error } = await supabase.from('audioaulas_acervo').insert([row]).select();
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success! Inserted ID:', data[0].id);
    await supabase.from('audioaulas_acervo').delete().eq('id', data[0].id);
    console.log('Cleanup success!');
  }
}

testInsert().catch(console.error);
