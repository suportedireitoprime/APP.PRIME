const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const { data: areas, error: e1 } = await supabase.rpc('flashcards_resumo_areas');
  console.log('--- flashcards_resumo_areas ---');
  if (areas) {
    const filo = areas.filter(a => a.area.toLowerCase().includes('filosofia') || (a.slug && a.slug.includes('filosofia')));
    console.log('Filosofia areas in resumo:', filo);
  } else {
    console.log('Error e1:', e1);
  }

  const { data: cards, error: e2 } = await supabase
    .from('flashcards_cards')
    .select('area, tema')
    .ilike('area', '%filosofia%')
    .limit(5);
  console.log('--- sample cards with filosofia ---', cards, 'error:', e2);

  // Check unique areas with filosofia
  const { data: allFilo } = await supabase
    .from('flashcards_cards')
    .select('area')
    .ilike('area', '%filosofia%');
  if (allFilo) {
    const unique = [...new Set(allFilo.map(c => c.area))];
    console.log('Unique area names in flashcards_cards matching %filosofia%:', unique);
    console.log('Total cards count:', allFilo.length);
  }

  // Check unique temas for those areas
  if (allFilo && allFilo.length > 0) {
    const uniqueArea = allFilo[0].area;
    const { data: rpcTemas } = await supabase.rpc('flashcards_temas', { _area: uniqueArea });
    console.log(`flashcards_temas for "${uniqueArea}":`, rpcTemas);

    const { data: rpcTemasFilo } = await supabase.rpc('flashcards_temas', { _area: 'Filosofia do Direito' });
    console.log(`flashcards_temas for "Filosofia do Direito":`, rpcTemasFilo);
  }
}

main().catch(console.error);
