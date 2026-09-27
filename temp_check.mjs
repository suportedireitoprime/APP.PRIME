import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  const user = users.users.find(u => u.email === 'nercinofilho@gmail.com');
  if (!user) {
    console.log('User not found in Auth.');
    return;
  }
  console.log('User ID:', user.id);
  console.log('App Metadata:', user.app_metadata);
  console.log('User Metadata:', user.user_metadata);
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError) {
    console.error('Profile Error:', profileError.message);
  } else {
    console.log('Profile Data:', profile);
  }

  // Check roles table if exists
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id);
  if (!rolesError) {
    console.log('Roles Data:', roles);
  }
  
  // Check subscriptions table if exists
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id);
  if (!subsError) {
    console.log('Subscriptions Data:', subs);
  }
}
checkUser();
