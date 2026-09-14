import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function simulateAprenderArea(slug) {
  console.log('--- Simulating AprenderArea with slug:', slug);
  const map = {
    'filosofia-do-direito': 'Filosofia do Direito',
    'teoria-e-filosofia-do-direito': 'Filosofia do Direito',
  };
  const effectiveAreaName = map[slug] || slug;

  // 1. fetchAprenderAreaFromNetwork
  const { data: a, error: aErr } = await supabase
    .from('aprender_areas')
    .select('id, nome, descricao, cor')
    .eq('slug', slug)
    .maybeSingle();
  console.log('aprender_areas record:', a, 'error:', aErr);

  // 2. useFlashcardsResumoAreas
  const { data: flashcardsAreasResumo, error: rErr } = await supabase.rpc('flashcards_resumo_areas');
  console.log('flashcardsAreasResumo length:', flashcardsAreasResumo?.length, 'error:', rErr);

  const found =
    flashcardsAreasResumo?.find((item) => item.slug === slug) ||
    flashcardsAreasResumo?.find((item) => item.area.toLowerCase() === (a?.nome || effectiveAreaName).toLowerCase()) ||
    flashcardsAreasResumo?.find((item) => slug && (item.slug.includes(slug) || slug.includes(item.slug))) ||
    flashcardsAreasResumo?.find((item) => slug && item.area.toLowerCase().includes(slug.replace(/-/g, ' ')));

  const officialFlashcardArea = found ? found.area : effectiveAreaName;
  console.log('found in resumo:', found);
  console.log('officialFlashcardArea:', officialFlashcardArea);

  const candidates = Array.from(
    new Set(
      [
        officialFlashcardArea,
        effectiveAreaName,
        a?.nome,
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

  let temas = [];
  for (const cand of candidates) {
    try {
      const { data: res, error } = await supabase.rpc('flashcards_temas', { _area: cand });
      console.log(`rpc flashcards_temas for "${cand}": error=${error?.message}, count=${res?.length}`);
      if (!error && res && res.length > 0) {
        temas = res;
        break;
      }
    } catch (e) {
      console.log('caught:', e);
    }
  }

  console.log('Resolved temas:', temas);
}

simulateAprenderArea('filosofia-do-direito').catch(console.error);
