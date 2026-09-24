import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

async function run() {
  const { data: p } = await supabase
    .from('profiles')
    .select('*')
    .or('display_name.ilike.%isabelle%,telefone.ilike.%97563340%,whatsapp_number.ilike.%97563340%');
  console.log("Perfil encontrado por nome/telefone:", p);

  // Check the recent profile created today at 12:28:03: 92bd01c5-3fb6-4914-bccb-9f2ef919c087
  const { data: pToday } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '92bd01c5-3fb6-4914-bccb-9f2ef919c087')
    .single();
  console.log("Perfil criado hoje 12:28 (pouco antes de ela chamar no zap às 12:48):", pToday);
}
run();
