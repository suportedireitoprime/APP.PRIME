const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://dnjrgpldcwcpoywamorr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w');

async function run() {
  const { data, error } = await sb.rpc('admin_lista_dia', { _tipo: 'online5m', _dia: '2026-09-29' });
  console.log('online5m:', data, error);
}
run();
