import { createClient } from '@supabase/supabase-js';

const LEIS_SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const LEIS_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

const supabase = createClient(LEIS_SUPABASE_URL, LEIS_SUPABASE_ANON_KEY);

async function checkOabLaw() {
  const { data: leis } = await supabase
    .from('vade_mecum_leis')
    .select('id, nome, nome_curto, slug, total_artigos')
    .ilike('nome', '%advocacia%');
  console.log('Leis por advocacia:', leis);

  const { data: leis2 } = await supabase
    .from('vade_mecum_leis')
    .select('id, nome, nome_curto, slug, total_artigos')
    .ilike('slug', '%oab%');
  console.log('Leis por oab:', leis2);
}

checkOabLaw().catch(console.error);
