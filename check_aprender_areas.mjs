import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const { data: a1 } = await supabase.from('aprender_areas').select('id, nome, slug').eq('slug', 'filosofia-do-direito').maybeSingle();
  console.log('aprender_areas for "filosofia-do-direito":', a1);

  const { data: allAreas } = await supabase.from('aprender_areas').select('id, nome, slug').ilike('nome', '%filosofia%');
  console.log('aprender_areas with %filosofia%:', allAreas);
}

main().catch(console.error);
