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

async function test() {
  const row = {
    tabela_nome: 'CC_CODIGO_CIVIL',
    artigo_numero: '1',
    lei_nome: 'CC - Código Civil',
    audio_url: 'https://pub-3e6045d435904ae1916a15ad03bd222b.r2.dev/CC_CODIGO_CIVIL/Art.%200001.mp3',
    r2_key: 'CC_CODIGO_CIVIL/Art. 0001.mp3',
    titulo_artigo: 'Art. 1'
  };

  // Test insert or upsert
  const { data, error } = await supabase.from('narracoes_artigos').upsert(row, {
    onConflict: 'tabela_nome,artigo_numero'
  }).select();

  console.log('Upsert result:', { error, data });
}

test();
