import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(url, key);

async function run() {
  console.log("=== Logs AI ===");
  const { data: logs, error: bErr } = await supabase
    .from('ai_usage_log')
    .select('*')
    .eq('function_name', 'boletim-noticias-gerar')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (bErr) {
    console.log("Error:", bErr.message);
  } else {
    console.table(logs.map(l => ({ 
        created_at: l.created_at, kind: l.kind, success: l.success, error: l.error 
    })));
  }
}

run();
