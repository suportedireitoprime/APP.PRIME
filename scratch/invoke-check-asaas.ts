import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const id = "84c60aef-06ec-4173-b916-50914abe4988";
  
  const { data: play } = await supabase.from('play_subscriptions').select('*').eq('user_id', id);
  console.log("Play:", play);
  const { data: apple } = await supabase.from('apple_subscriptions').select('*').eq('user_id', id);
  console.log("Apple:", apple);
  const { data: asaas } = await supabase.from('asaas_subscriptions').select('*').eq('user_id', id);
  console.log("Asaas:", asaas);
  const { data: cancel } = await supabase.from('assinatura_cancelamentos').select('*').eq('user_id', id);
  console.log("Cancel:", cancel);
  const { data: legacy } = await supabase.from('legacy_subscribers').select('*').eq('email', 'beeldmscn@gmail.com');
  console.log("Legacy:", legacy);
}

run();
