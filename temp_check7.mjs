import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUser() {
  let foundUser = null;
  for (let page = 1; page <= 50; page++) {
    const { data: users, error } = await supabase.auth.admin.listUsers({ page, perPage: 10 });
    if (error) {
      console.log('Error page', page);
      continue; // try next
    }
    if (!users || !users.users || users.users.length === 0) break;
    const user = users.users.find(u => u.email === 'nercinofilho@gmail.com');
    if (user) {
      foundUser = user;
      break;
    }
  }

  if (foundUser) {
    console.log('Found user!', foundUser.id);
    const { error } = await supabase.from('profiles').update({ is_premium: true }).eq('id', foundUser.id);
    console.log('Update profile premium:', error ? error.message : 'SUCCESS');
  } else {
    console.log('Not found by email iteration.');
  }
}
fixUser();
