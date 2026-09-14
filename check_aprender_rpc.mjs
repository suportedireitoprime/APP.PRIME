import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const { data, error } = await supabase.rpc('get_aprender_areas_com_progresso');
  console.log('rpc get_aprender_areas_com_progresso:', data?.length, 'error:', error);
  if (data) {
    console.log(data.map(d => ({ nome: d.nome, slug: d.slug })));
  }

  const { data: d2, error: e2 } = await supabase.from('aprender_areas').select('*');
  console.log('from aprender_areas:', d2?.length, 'error:', e2);
}

main().catch(console.error);
