import { createClient } from '@supabase/supabase-js';

const LEIS_SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const LEIS_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

const supabase = createClient(LEIS_SUPABASE_URL, LEIS_SUPABASE_ANON_KEY);

async function checkAreas() {
  const { data } = await supabase
    .from('audioaulas_acervo')
    .select('area')
    .limit(1000);

  const areas = [...new Set((data || []).map(d => d.area))];
  console.log('Áreas existentes em audioaulas_acervo:', areas);
}

checkAreas().catch(console.error);
