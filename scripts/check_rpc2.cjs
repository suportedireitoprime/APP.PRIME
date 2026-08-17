const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supa = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supa.rpc('flashcards_resumo_areas');
  console.log("data:", data, "error:", error);
}

main().catch(console.error);
