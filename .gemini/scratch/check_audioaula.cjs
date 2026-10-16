const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await sb
    .from('audioaulas_acervo')
    .select('id, area, tema, titulo, url_audio')
    .ilike('titulo', '%8-A%');
  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log('Result:', JSON.stringify(data, null, 2));
  }
}
run();
