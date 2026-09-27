import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  let foundUser = null;
  for (let page = 1; page <= 50; page++) {
    const { data: users, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      console.error('Error on page', page, error);
      break;
    }
    if (!users.users || users.users.length === 0) {
      break;
    }
    const user = users.users.find(u => u.email === 'nercinofilho@gmail.com');
    if (user) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    console.log('User not found in Auth after searching all pages.');
    return;
  }
  console.log('User ID:', foundUser.id);
  console.log('User Metadata:', foundUser.user_metadata);
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', foundUser.id).single();
  console.log('Profile:', profile);
  
  const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', foundUser.id);
  console.log('Roles:', roles);
  
  const { data: subs } = await supabase.from('subscriptions').select('*').eq('user_id', foundUser.id);
  console.log('Subs:', subs);
}
checkUser();
