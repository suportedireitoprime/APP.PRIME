// Verificar policies e se RLS está habilitado
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Check if RLS is enabled and policies exist
  const { data: rlsInfo, error: e1 } = await supa.from('flashcards_cards')
    .select('id, tema, area')
    .limit(3);
  console.log('[SERVICE_ROLE] select 3 rows:', rlsInfo?.length, 'rows');
  rlsInfo?.forEach(r => console.log(`  id=${r.id} tema="${r.tema}" area="${r.area}"`));

  // Check flashcards_temas with Direito Penal - look for "Código Penal" temas
  const { data: temas } = await supa.rpc('flashcards_temas', { _area: 'Direito Penal' });
  const cpTemas = (temas || []).filter(t => t.tema.toLowerCase().includes('código penal'));
  console.log('\n[SERVICE_ROLE] Temas com "Código Penal" em Direito Penal:', cpTemas.length);
  cpTemas.forEach(t => console.log(`  - "${t.tema}" total: ${t.total}`));

  // Check all areas for Código Penal
  const { data: areas } = await supa.rpc('flashcards_resumo_areas');
  for (const area of (areas || [])) {
    const { data: areaTemas } = await supa.rpc('flashcards_temas', { _area: area.area });
    const cpInArea = (areaTemas || []).filter(t => t.tema.toLowerCase().includes('código penal'));
    if (cpInArea.length > 0) {
      console.log(`\n[SERVICE_ROLE] Área "${area.area}" tem ${cpInArea.length} temas com "Código Penal":`);
      cpInArea.slice(0, 5).forEach(t => console.log(`  - "${t.tema}" total: ${t.total}`));
    }
  }

  // Direct query for cards with tema starting with "Código Penal"
  const { data: directCards, count: directCount } = await supa
    .from('flashcards_cards')
    .select('tema, area', { count: 'exact' })
    .ilike('tema', '%código penal%')
    .limit(5);
  console.log('\n[SERVICE_ROLE] Direct query ilike "%código penal%":', directCount, 'cards');
  directCards?.forEach(c => console.log(`  tema="${c.tema}" area="${c.area}"`));

  // Check what tema format the CP cards are stored as
  const { data: cpCards } = await supa
    .from('flashcards_cards')
    .select('tema')
    .ilike('tema', '%penal%')
    .limit(20);
  const uniqueCpTemas = [...new Set((cpCards || []).map(c => c.tema))];
  console.log('\n[SERVICE_ROLE] Unique temas containing "penal":', uniqueCpTemas.length);
  uniqueCpTemas.forEach(t => console.log(`  - "${t}"`));
}

main().catch(console.error);
