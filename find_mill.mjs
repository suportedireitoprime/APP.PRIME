import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

async function run() {
  const { data, error } = await supabase
    .from('biblioteca_classicos')
    .select('*')
    .ilike('autor', '%John Stuart Mill%');

  if (error) {
    console.log(error);
  } else {
    console.log(data);
  }
}

run();
