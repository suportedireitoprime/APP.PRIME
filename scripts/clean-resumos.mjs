import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clean() {
  const { data, error } = await supabase.from('resumos_juridicos').delete().eq('tabela_codigo', 'codigo_civil');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Cleaned successfully');
  }
}

clean();
