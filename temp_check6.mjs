import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data: nercino } = await supabase.from('profiles').select('id, display_name, is_premium').ilike('display_name', '%nercino%');
  console.log('Nercino:', nercino);

  const { data: ana } = await supabase.from('profiles').select('id, display_name, is_premium').ilike('display_name', '%ana%clara%');
  console.log('Ana:', ana);
}
checkUser();
