import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

const USER_ID = '38b22d80-1a64-4504-9523-2ebd1b38948d';

async function run() {
  // 1. Apagar a linha fake/duplicada do WhatsApp sem user_id
  await supabase
    .from('horus_whatsapp_users')
    .delete()
    .eq('id', 'fec55dd9-f9b9-49fa-8f55-9d3b060d9e58');

  // 2. Atualizar a linha oficial dela (id: a8e1eb0d-137b-46b1-a7f7-20d7778a6419) para ter o phone_e164 que o WhatsApp usa: 555197563340
  const { data: updH, error: errH } = await supabase
    .from('horus_whatsapp_users')
    .update({
      phone_e164: '555197563340',
      display_name: 'Isabelle Severo',
      nome_preferido: 'Isabelle'
    })
    .eq('id', 'a8e1eb0d-137b-46b1-a7f7-20d7778a6419');
  console.log("Horus oficial atualizado com o telefone do WhatsApp:", updH, "Erro:", errH);

  // 3. Atualizar as conversas para ficarem com o phone_e164 555197563340
  // (já estão)

  // 4. Verificar se a assinatura dela está 'anual' e ativa
  const { data: sub } = await supabase
    .from('asaas_subscriptions')
    .select('*')
    .eq('user_id', USER_ID);
  console.log("Assinatura Asaas confirmada:", sub);

  // 5. Garantir que o perfil dela está com is_premium = true
  const { data: prof } = await supabase
    .from('profiles')
    .update({
      is_premium: true,
      display_name: 'Isabelle Severo'
    })
    .eq('id', USER_ID);
  console.log("Perfil atualizado:", prof);
}
run();
