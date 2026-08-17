const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supa = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await supa.rpc('exec_sql', {
    query: `SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'flashcards_resumo_areas'`
  });
  console.log("Resumo Areas:", data?.[0]?.def);

  const { data: d2 } = await supa.rpc('exec_sql', {
    query: `SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'flashcards_temas'`
  });
  console.log("Temas:", d2?.[0]?.def);
}

main().catch(console.error);
