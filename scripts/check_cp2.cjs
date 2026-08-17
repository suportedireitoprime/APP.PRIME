const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supa = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Quantos cards com "Código Penal" no tema sobreviveram?
  const { count } = await supa
    .from('flashcards_cards')
    .select('*', { count: 'exact', head: true })
    .ilike('tema', '%código penal%');
  console.log('Cards com "Código Penal" no tema:', count);

  // Temas distintos desses cards
  const { data } = await supa
    .from('flashcards_cards')
    .select('tema, area')
    .ilike('tema', '%código penal%')
    .limit(500);
  
  const uniq = {};
  (data || []).forEach(c => { uniq[c.tema] = (uniq[c.tema] || 0) + 1; });
  console.log('\nTemas distintos com "Código Penal":');
  Object.entries(uniq).sort((a,b) => b[1] - a[1]).forEach(([t, c]) => {
    console.log(`  [${c} cards] "${t.replace(/\n/g, ' | ')}" area="${data.find(d=>d.tema===t)?.area}"`);
  });

  // Quantos cards total existem com area = "Direito Penal"?
  const { count: penalCount } = await supa
    .from('flashcards_cards')
    .select('*', { count: 'exact', head: true })
    .eq('area', 'Direito Penal');
  console.log('\nTotal cards com area = "Direito Penal":', penalCount);

  // Quantos com area = "codigo"?
  const { count: codigoCount } = await supa
    .from('flashcards_cards')
    .select('*', { count: 'exact', head: true })
    .eq('area', 'codigo');
  console.log('Total cards com area = "codigo":', codigoCount);
}

main().catch(console.error);
