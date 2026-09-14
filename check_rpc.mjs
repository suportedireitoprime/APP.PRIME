import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const { data: rpcTemas, error } = await supabase.rpc('flashcards_temas', { _area: 'Filosofia do Direito' });
  console.log('rpcTemas:', rpcTemas, 'error:', error);

  const { data: cards, error: err2 } = await supabase
    .from('flashcards_cards')
    .select('id, area, tema')
    .eq('area', 'Filosofia do Direito')
    .limit(10);
  console.log('cards for Filosofia do Direito:', cards?.length, 'error:', err2);
  if (cards) console.log('Sample cards:', cards);
}

main().catch(console.error);
