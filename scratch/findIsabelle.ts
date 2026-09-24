import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

async function run() {
  console.log(`Buscando perfis com Isabelle ou Severo...`);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, nome, created_at, updated_at')
    .or('email.ilike.%isabelle%,email.ilike.%severo%,nome.ilike.%isabelle%,nome.ilike.%severo%');
  console.log("Profiles encontrados:", profiles);

  // Também verificar assinaturas recentes (hoje) em asaas_subscriptions, google_subscriptions, apple_subscriptions
  console.log("Buscando assinaturas de hoje no Google Play...");
  const { data: googleSubs } = await supabase
    .from('google_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Google subs:", googleSubs);

  console.log("Buscando assinaturas de hoje na Apple...");
  const { data: appleSubs } = await supabase
    .from('apple_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Apple subs:", appleSubs);

  console.log("Buscando assinaturas de hoje no Asaas...");
  const { data: asaasSubs } = await supabase
    .from('asaas_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Asaas subs:", asaasSubs);
}
run();
