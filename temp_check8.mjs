import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminRPC() {
  // admin_lista_provider is used to list users by provider
  const { data: users, error } = await supabase.rpc('admin_lista_provider', { _tipo: 'cadastros', _provider: 'google' });
  if (error) {
    console.error('RPC Error:', error);
    return;
  }
  
  console.log('Total google users from RPC:', users ? users.length : 0);
  const nercino = users?.find(u => u.email === 'nercinofilho@gmail.com');
  if (nercino) {
    console.log('Found Nercino:', nercino);
    // Update his premium status in profiles
    const { error: updErr } = await supabase.from('profiles').update({ is_premium: true }).eq('id', nercino.user_id);
    console.log('Update profile premium:', updErr ? updErr.message : 'SUCCESS');
  } else {
    console.log('Not found in Google provider list.');
  }
}
checkAdminRPC();
