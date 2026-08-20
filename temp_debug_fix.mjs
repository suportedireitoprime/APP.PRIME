import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(url, key);

async function run() {
  const { error: updErr } = await supabase
    .from('boletins_juridicos')
    .update({ status: 'erro' })
    .eq('data_ref', '2026-08-19')
    .eq('status', 'gerando');
  
  if (updErr) console.error(updErr);
  else console.log("Updated stuck records to 'erro'.");
}

run();
