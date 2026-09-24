import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

async function run() {
  console.log(`Buscando perfil de Isabelle...`);
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'isabelleseverodireito@gmail.com')
    .maybeSingle();
      
  console.log("Profile:", profile);

  if (profile) {
    console.log(`Buscando inscrições de Asaas para: ${profile.id}`);
    const { data: asaas } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', profile.id);
    console.log("Asaas:", asaas);

    console.log(`Buscando inscrições de Apple para: ${profile.id}`);
    const { data: apple } = await supabase
      .from('apple_subscriptions')
      .select('*')
      .eq('user_id', profile.id);
    console.log("Apple:", apple);

    console.log(`Buscando inscrições de Google para: ${profile.id}`);
    const { data: google } = await supabase
      .from('google_subscriptions')
      .select('*')
      .eq('user_id', profile.id);
    console.log("Google:", google);

    const { data: asaasCust } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', profile.id);
    console.log("Asaas Customers:", asaasCust);
  }
}
run();
