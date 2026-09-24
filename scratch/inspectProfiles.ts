import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

async function run() {
  const { data: p, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Colunas em profiles:", p ? Object.keys(p[0]) : error);

  // Buscar todos os profiles recentes (últimos 20)
  const { data: recentProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  
  console.log("Recent profiles count:", recentProfiles?.length);
  if (recentProfiles) {
    for (const prof of recentProfiles) {
      console.log(`[${prof.created_at}] ID: ${prof.id} - Nome: ${prof.nome || prof.name || prof.full_name || 'sem nome'} - User: ${prof.username || ''}`);
    }
  }
}
run();
