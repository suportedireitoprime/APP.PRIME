import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const { data: areas } = await supabase.rpc('flashcards_resumo_areas');
  const sectionContent = fs.readFileSync('src/components/aprender/MateriaFlashcardsDeckSection.tsx', 'utf8');
  
  console.log('Total areas from flashcards_resumo_areas:', areas.length);
  for (const a of areas) {
    const inCanonical = sectionContent.includes(`'${a.slug}':`);
    const { data: rpcTemas } = await supabase.rpc('flashcards_temas', { _area: a.area });
    console.log(`Area: "${a.area}" | slug: "${a.slug}" | cards: ${a.total_cards} | inCanonical: ${inCanonical} | rpcTemasCount: ${rpcTemas?.length ?? 0}`);
  }
}

main().catch(console.error);
