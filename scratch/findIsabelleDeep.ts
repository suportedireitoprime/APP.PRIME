import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

async function run() {
  console.log("--- 1. Buscando em profiles por nome ou email ---");
  const { data: pByName, error: err1 } = await supabase
    .from('profiles')
    .select('id, email, nome, full_name, created_at, role, is_admin')
    .or('nome.ilike.%isabelle%,nome.ilike.%severo%,email.ilike.%isabelle%,email.ilike.%severo%');
  console.log("Por nome/email:", pByName, "Err:", err1);

  console.log("--- 2. Buscando em asaas_customers ---");
  const { data: asaasCust, error: err2 } = await supabase
    .from('asaas_customers')
    .select('*')
    .or('name.ilike.%isabelle%,email.ilike.%isabelle%,cpf_cnpj.ilike.%isabelle%,phone.ilike.%5197563340%');
  console.log("Asaas customers:", asaasCust, "Err:", err2);

  console.log("--- 3. Buscando em assinaturas recentes ---");
  const { data: allAsaasSubs } = await supabase
    .from('asaas_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Últimas 5 asaas_subscriptions:", allAsaasSubs);

  console.log("--- 4. Buscando em horus_whatsapp_users ---");
  const { data: hUser } = await supabase
    .from('horus_whatsapp_users')
    .select('*')
    .eq('phone_e164', '555197563340');
  console.log("horus_whatsapp_users:", hUser);
}
run();
