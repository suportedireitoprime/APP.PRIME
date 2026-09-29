const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dnjrgpldcwcpoywamorr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w');

async function check() {
  const { data: users } = await supabase.from('auth.users').select('id, email').eq('email', 'reisecomerc@gmail.com');
  console.log('User:', users);
  
  if (users && users.length > 0) {
    const { data: asaas } = await supabase.from('asaas_subscriptions').select('*').eq('user_id', users[0].id);
    console.log('Asaas Subs:', asaas);
    
    // Also check webhook_logs
    const { data: logs } = await supabase.from('webhook_logs').select('*').ilike('payload', '%reisecomerc%').limit(5);
    console.log('Logs matching email:', logs);
  }
}
check().catch(console.error);
