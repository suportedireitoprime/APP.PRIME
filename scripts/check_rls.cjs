// Verificar contagem via SERVICE_ROLE_KEY vs ANON_KEY
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  // 1. Via Service Role (bypassa RLS)
  if (SERVICE_ROLE_KEY) {
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { count, error } = await supa
      .from('flashcards_cards')
      .select('*', { count: 'exact', head: true });
    console.log('[SERVICE_ROLE] total flashcards_cards:', count, error ? `ERRO: ${error.message}` : '');

    // Amostra de temas
    const { data } = await supa.from('flashcards_cards').select('tema').limit(5);
    console.log('[SERVICE_ROLE] amostra:', data?.map(d => d.tema));
  } else {
    console.log('SERVICE_ROLE_KEY não encontrada no .env');
  }

  // 2. Via Anon Key (sujeito a RLS)
  if (ANON_KEY) {
    const supa2 = createClient(SUPABASE_URL, ANON_KEY);
    const { count: count2, error: error2 } = await supa2
      .from('flashcards_cards')
      .select('*', { count: 'exact', head: true });
    console.log('[ANON_KEY] total flashcards_cards:', count2, error2 ? `ERRO: ${error2.message}` : '');
  }
}

main().catch(console.error);
