import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

const USER_ID = '38b22d80-1a64-4504-9523-2ebd1b38948d';

async function run() {
  console.log("--- 1. Vinculando Horus ao User ID da Isabelle ---");
  const { data: updH, error: errH } = await supabase
    .from('horus_whatsapp_users')
    .update({
      linked_user_id: USER_ID,
      user_id: USER_ID,
      linked_at: new Date().toISOString()
    })
    .eq('phone_e164', '555197563340');
  console.log("Vinculado horus_whatsapp_users:", updH, "Erro:", errH);

  console.log("--- 2. Atualizando plano para anual em asaas_subscriptions ---");
  const { data: updSub, error: errSub } = await supabase
    .from('asaas_subscriptions')
    .update({
      plano: 'anual'
    })
    .eq('user_id', USER_ID);
  console.log("Atualizado plano para anual:", updSub, "Erro:", errSub);

  console.log("--- 3. Verificando perfil ---");
  const { data: prof, error: errP } = await supabase
    .from('profiles')
    .update({
      is_premium: true
    })
    .eq('id', USER_ID);
  console.log("Profile da Isabelle atualizado:", prof, "Erro:", errP);

  // Consulta atualizada
  const { data: subFinal } = await supabase
    .from('asaas_subscriptions')
    .select('*')
    .eq('user_id', USER_ID);
  console.log("Assinatura Final:", subFinal);
}
run();
