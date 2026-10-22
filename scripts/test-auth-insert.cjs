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

async function testAuthInsert() {
  const email = `test_agent_${Date.now()}@example.com`;
  const password = `TestPass_${Date.now()}!`;
  console.log('Tentando cadastrar usuário temporário:', email);

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });

  if (authError) {
    console.log('SignUp error:', authError.message);
    return;
  }

  console.log('Usuário criado com sucesso. Session:', authData.session ? 'Sim' : 'Não (precisa confirmação de e-mail)');
  
  if (authData.session) {
    const authClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });

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

    const { data: insData, error: insError } = await authClient.from('audioaulas_acervo').insert([row]).select();
    if (insError) {
      console.log('Auth user insert error:', insError);
    } else {
      console.log('Auth user insert SUCESSO! ID:', insData[0].id);
      await authClient.from('audioaulas_acervo').delete().eq('id', insData[0].id);
    }
  }
}

testAuthInsert().catch(console.error);
