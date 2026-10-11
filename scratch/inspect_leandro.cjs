const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

async function inspectLeandro() {
  const leandroId = 'dcc26886-5e48-46ac-bd77-5bd539df549b';
  console.log('=== INVESTIGANDO LEANDRO FERREIRA DA SILVA (' + leandroId + ') ===');

  const { data: p } = await sb.from('profiles').select('*').eq('id', leandroId).single();
  console.log('Profile is_premium:', p.is_premium);

  const { data: play } = await sb.from('play_subscriptions').select('*').eq('user_id', leandroId);
  console.log('Play Subscriptions:', play);

  const { data: apple } = await sb.from('apple_subscriptions').select('*').eq('user_id', leandroId);
  console.log('Apple Subscriptions:', apple);

  const { data: asaas } = await sb.from('asaas_subscriptions').select('*').eq('user_id', leandroId);
  console.log('Asaas Subscriptions:', asaas);

  const { data: leg } = await sb.from('legacy_subscribers').select('*').eq('claimed_user_id', leandroId);
  console.log('Legacy Subscriptions:', leg);

  const { data: cancel } = await sb.from('assinatura_cancelamentos').select('*').eq('user_id', leandroId);
  console.log('Assinatura Cancelamentos:', cancel);

  // Também buscar Wagner (limadesouzawagner0) procurando por display_name ou por sessões
  console.log('\n=== INVESTIGANDO WAGNER ===');
  const { data: wagnerProfiles } = await sb.from('profiles').select('*').ilike('display_name', '%limadesouzawagner%');
  console.log('Wagner profiles ilike:', wagnerProfiles);

  const { data: wagnerByPhone } = await sb.from('profiles').select('*').ilike('telefone', '%limadesouza%');
  console.log('Wagner by phone:', wagnerByPhone);
}

inspectLeandro().catch(console.error);
