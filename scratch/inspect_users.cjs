const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

async function inspect() {
  const emails = ['leandrofs2010@gmail.com', 'limadesouzawagner0@gmail.com'];
  
  for (const email of emails) {
    console.log('\n======================================================');
    console.log('AUDITANDO EMAIL:', email);
    console.log('======================================================');

    // 1. Auth Users
    const { data: users, error: uErr } = await sb.auth.admin.listUsers();
    const matchedUser = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    console.log('Auth user:', matchedUser ? {
      id: matchedUser.id,
      email: matchedUser.email,
      created_at: matchedUser.created_at,
      user_metadata: matchedUser.user_metadata,
      app_metadata: matchedUser.app_metadata
    } : 'NÃO ENCONTRADO EM AUTH.USERS');

    const userId = matchedUser?.id;

    if (userId) {
      // 2. Profiles
      const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
      console.log('Profile:', profile);

      // 3. Play Subscriptions
      const { data: play } = await sb.from('play_subscriptions').select('*').eq('user_id', userId);
      console.log('Play subscriptions:', play);

      // 4. Apple Subscriptions
      const { data: apple } = await sb.from('apple_subscriptions').select('*').eq('user_id', userId);
      console.log('Apple subscriptions:', apple);

      // 5. Asaas Subscriptions
      const { data: asaas } = await sb.from('asaas_subscriptions').select('*').eq('user_id', userId);
      console.log('Asaas subscriptions:', asaas);

      // 6. Legacy Subscribers
      const { data: legacy } = await sb.from('legacy_subscribers').select('*').or(`claimed_user_id.eq.${userId},email.ilike.${email}`);
      console.log('Legacy subscribers:', legacy);

      // 7. Cancelamentos
      const { data: cancel } = await sb.from('assinatura_cancelamentos').select('*').eq('user_id', userId);
      console.log('Cancelamentos:', cancel);

      // 8. Eventos de checkout/compra
      const { data: events } = await sb.from('app_events')
        .select('event_name, created_at, metadata')
        .eq('user_id', userId)
        .in('event_name', ['purchase', 'checkout_completed', 'checkout_success', 'trial_expired', 'assinatura_aberta'])
        .order('created_at', { ascending: false });
      console.log('Purchase/Checkout events:', events);
    }
  }
}

inspect().catch(console.error);
