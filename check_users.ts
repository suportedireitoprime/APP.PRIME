import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("VITE_SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: globalThis.fetch } }
);

async function run() {
  const emails = ["marcelaemily003@gmail.com", "jader.galvaoo@gmail.com"];
  
  for (const email of emails) {
    console.log(`\n=== Checando ${email} ===`);
    
    // 1. Checa legacy_subscribers
    const { data: legacy } = await supabase.from('legacy_subscribers').select('*').ilike('email', email);
    console.log("Legacy Subscribers:", legacy);
    
    // 2. Tenta pegar id do auth.users (usando rpc list_users ou semelhante? Não temos list_users. Mas podemos usar o endpoint listUsers se corrigido, ou bypass)
    // Vamos usar a rpc claim_legacy_subscription? Não, vamos checar admin_lista_dia
    
    // Mas pera, vamos checar asaas_subscriptions procurando o user_id?
    // Precisamos do user_id. Como pegamos?
  }
}

run();
