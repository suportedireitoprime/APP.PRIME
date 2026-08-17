// Script para diagnosticar flashcards zerados
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('=== 1. vade_mecum_leis (Códigos) ===');
  const { data: vmLeis, error: vmErr } = await supabase
    .from('vade_mecum_leis')
    .select('nome, nome_curto, categoria, ordem')
    .ilike('nome', '%código%')
    .order('ordem');
  
  if (vmErr) { console.error('Erro vmLeis:', vmErr); return; }
  console.log('Leis encontradas:', vmLeis?.length);
  vmLeis?.forEach(l => console.log(`  - nome: "${l.nome}" | nome_curto: "${l.nome_curto}" | cat: "${l.categoria}"`));

  console.log('\n=== 2. flashcards_resumo_areas ===');
  const { data: areas, error: areasErr } = await supabase.rpc('flashcards_resumo_areas');
  if (areasErr) { console.error('Erro areas:', areasErr); return; }
  console.log('Áreas:', areas?.length);
  areas?.forEach(a => console.log(`  - area: "${a.area}" total: ${a.total}`));

  console.log('\n=== 3. flashcards_temas com "Código Penal" ===');
  // Try each area to find themes containing "Código Penal"
  for (const area of (areas || [])) {
    const { data: temas } = await supabase.rpc('flashcards_temas', { _area: area.area });
    const cps = (temas || []).filter(t => t.tema.toLowerCase().includes('código penal'));
    if (cps.length > 0) {
      console.log(`  Área "${area.area}":`);
      cps.forEach(t => console.log(`    tema: "${t.tema}" total: ${t.total}`));
    }
  }

  console.log('\n=== 4. flashcards_cards com tema "Código Penal%" ===');
  const { data: cards, count } = await supabase
    .from('flashcards_cards')
    .select('tema, artigo_numero', { count: 'exact' })
    .ilike('tema', 'Código Penal%')
    .limit(10);
  
  console.log('Cards encontrados (count):', count);
  cards?.forEach(c => console.log(`  - tema: "${c.tema}" artigo: "${c.artigo_numero}"`));

  console.log('\n=== 5. flashcards_cards com tema "código penal%" (case-insensitive) ===');
  const { count: count2 } = await supabase
    .from('flashcards_cards')
    .select('*', { count: 'exact', head: true })
    .ilike('tema', '%código penal%');
  console.log('Cards com "código penal" (ilike):', count2);

  console.log('\n=== 6. flashcards_cards com tema "Código Civil%" ===');
  const { count: count3 } = await supabase
    .from('flashcards_cards')
    .select('*', { count: 'exact', head: true })
    .ilike('tema', '%código civil%');
  console.log('Cards com "código civil" (ilike):', count3);

  console.log('\n=== 7. Amostra de temas distintos de flashcards_cards (limit 30) ===');
  const { data: distinctTemas } = await supabase
    .from('flashcards_cards')
    .select('tema')
    .limit(200);
  
  const uniqueTemas = [...new Set((distinctTemas || []).map(d => d.tema))].sort();
  console.log('Temas únicos (amostra):', uniqueTemas.length);
  uniqueTemas.slice(0, 30).forEach(t => console.log(`  - "${t}"`));
}

main().catch(console.error);
