const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

async function find() {
  let allUsers = [];
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error('Error listUsers:', error); break; }
    if (!data?.users || data.users.length === 0) break;
    allUsers.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }

  console.log('Total auth users:', allUsers.length);
  const l = allUsers.find(u => (u.email || '').toLowerCase().includes('leandrofs2010'));
  console.log('Found Leandro in all auth users:', l);
  const w = allUsers.find(u => (u.email || '').toLowerCase().includes('limadesouzawagner0'));
  console.log('Found Wagner in all auth users:', w);

  // Se encontrou Leandro
  if (l) {
    console.log('\n--- DADOS DETALHADOS LEANDRO ---');
    const { data: p } = await sb.from('profiles').select('*').eq('id', l.id).maybeSingle();
    console.log('Profile:', p);
    const { data: asaas } = await sb.from('asaas_subscriptions').select('*').eq('user_id', l.id);
    console.log('Asaas:', asaas);
    const { data: play } = await sb.from('play_subscriptions').select('*').eq('user_id', l.id);
    console.log('Play:', play);
    const { data: apple } = await sb.from('apple_subscriptions').select('*').eq('user_id', l.id);
    console.log('Apple:', apple);
    const { data: leg } = await sb.from('legacy_subscribers').select('*').or(`claimed_user_id.eq.${l.id},email.ilike.${l.email}`);
    console.log('Legacy:', leg);
  }

  // Se encontrou Wagner
  if (w) {
    console.log('\n--- DADOS DETALHADOS WAGNER ---');
    const { data: p } = await sb.from('profiles').select('*').eq('id', w.id).maybeSingle();
    console.log('Profile:', p);
    const { data: asaas } = await sb.from('asaas_subscriptions').select('*').eq('user_id', w.id);
    console.log('Asaas:', asaas);
    const { data: play } = await sb.from('play_subscriptions').select('*').eq('user_id', w.id);
    console.log('Play:', play);
    const { data: apple } = await sb.from('apple_subscriptions').select('*').eq('user_id', w.id);
    console.log('Apple:', apple);
    const { data: leg } = await sb.from('legacy_subscribers').select('*').or(`claimed_user_id.eq.${w.id},email.ilike.${w.email}`);
    console.log('Legacy:', leg);
  }
}

find().catch(console.error);
