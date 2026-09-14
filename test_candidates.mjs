import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testArea(slug) {
  console.log('\n================ Testing slug:', slug);
  const { data: flashcardsAreasResumo } = await supabase.rpc('flashcards_resumo_areas');
  
  const map = {
    'filosofia-do-direito': 'Filosofia do Direito',
    'teoria-e-filosofia-do-direito': 'Filosofia do Direito',
  };
  const effectiveAreaName = map[slug] || slug;

  const found =
    flashcardsAreasResumo.find((a) => a.slug === slug) ||
    flashcardsAreasResumo.find((a) => a.area.toLowerCase() === effectiveAreaName.toLowerCase()) ||
    flashcardsAreasResumo.find((a) => slug && (a.slug.includes(slug) || slug.includes(a.slug))) ||
    flashcardsAreasResumo.find((a) => slug && a.area.toLowerCase().includes(slug.replace(/-/g, ' ')));

  const officialFlashcardArea = found ? found.area : effectiveAreaName;
  console.log('found in resumo:', found);
  console.log('officialFlashcardArea:', officialFlashcardArea);

  const candidates = Array.from(
    new Set(
      [
        officialFlashcardArea,
        effectiveAreaName,
        officialFlashcardArea?.startsWith('Direito ')
          ? officialFlashcardArea.replace('Direito ', '')
          : `Direito ${officialFlashcardArea}`,
        effectiveAreaName?.startsWith('Direito ')
          ? effectiveAreaName.replace('Direito ', '')
          : `Direito ${effectiveAreaName}`,
      ].filter(Boolean)
    )
  );

  console.log('candidates:', candidates);

  for (const cand of candidates) {
    const { data: res, error } = await supabase.rpc('flashcards_temas', { _area: cand });
    console.log(`RPC for candidate "${cand}": error=${error?.message}, count=${res?.length}`);
    if (res && res.length > 0) {
      console.log('Returned items:', res.map(r => r.tema));
    }
  }
}

async function run() {
  await testArea('filosofia-do-direito');
  await testArea('teoria-e-filosofia-do-direito');
}

run().catch(console.error);
