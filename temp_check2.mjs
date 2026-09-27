import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data: users, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error(error);
    return;
  }
  const user = users.users.find(u => u.email === 'nercinofilho@gmail.com');
  if (!user) {
    console.log('User not found in Auth even with 1000 limit.');
    return;
  }
  console.log('User ID:', user.id);
  console.log('User App Metadata:', user.app_metadata);
  console.log('User User Metadata:', user.user_metadata);
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  console.log('Profile:', profile);
  
  const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', user.id);
  console.log('Roles:', roles);
  
  const { data: subs } = await supabase.from('subscriptions').select('*').eq('user_id', user.id);
  console.log('Subs:', subs);
}
checkUser();
