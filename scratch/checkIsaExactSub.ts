import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

const USER_ID = '38b22d80-1a64-4504-9523-2ebd1b38948d';

async function run() {
  console.log(`Buscando assinaturas de Isabelle (ID: ${USER_ID})...`);

  const { data: asaas } = await supabase
    .from('asaas_subscriptions')
    .select('*')
    .eq('user_id', USER_ID);
  console.log("Asaas Subscriptions:", asaas);

  // Check Apple
  const { data: apple } = await supabase
    .from('apple_subscriptions')
    .select('*')
    .eq('user_id', USER_ID);
  console.log("Apple Subscriptions:", apple);

  // Check Google Play (check exact table name)
  const tables = ['google_subscriptions', 'google_play_subscriptions', 'playstore_subscriptions', 'user_subscriptions', 'subscriptions'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').eq('user_id', USER_ID);
    if (!error) {
      console.log(`Tabela ${t}:`, data);
    }
  }

  // Check payments/cobrancas
  const { data: cobrancas } = await supabase
    .from('asaas_cobrancas')
    .select('*')
    .eq('user_id', USER_ID);
  console.log("Asaas Cobranças:", cobrancas);
}
run();
