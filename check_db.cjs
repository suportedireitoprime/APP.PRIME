const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dnjrgpldcwcpoywamorr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w');

async function check() {
  const { data: users } = await supabase.from('auth.users').select('id, email').eq('email', 'reisecomerc@gmail.com');
  console.log('Users:', users);
  
  const { data: subs } = await supabase.from('asaas_subscriptions').select('*').limit(5).order('created_at', { ascending: false });
  const { data: mSub } = await supabase.from('asaas_subscriptions').select('*').eq('email', 'reisecomerc@gmail.com');
  console.log('Subs for user:', mSub);
  
  if (!mSub || mSub.length === 0) {
     const { data: profiles } = await supabase.from('profiles').select('id').eq('email', 'reisecomerc@gmail.com');
     if (profiles && profiles.length > 0) {
        const { data: pSub } = await supabase.from('asaas_subscriptions').select('*').eq('user_id', profiles[0].id);
        console.log('Subs by user_id:', pSub);
     }
  }

  // Check webhook logs
  const { data: logs } = await supabase.from('webhook_logs').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent logs:', logs ? logs.length : 'no table');
  
  const { data: logs2 } = await supabase.from('asaas_webhooks').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent asaas_webhooks:', logs2 ? logs2.length : 'no table');
  
  // also app_events
  const { data: events } = await supabase.from('app_events').select('*').eq('email', 'reisecomerc@gmail.com').order('created_at', { ascending: false }).limit(10);
  console.log('App events:', events);
}
check().catch(console.error);
