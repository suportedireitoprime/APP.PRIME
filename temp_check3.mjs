import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data: profile, error } = await supabase.from('profiles').select('*').ilike('email', '%nercinofilho%');
  if (error) {
    console.error('Profile Error:', error);
    return;
  }
  console.log('Profiles:', profile);
  
  if (profile && profile.length > 0) {
    const userId = profile[0].id;
    const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', userId);
    console.log('Roles:', roles);
    
    const { data: subs } = await supabase.from('subscriptions').select('*').eq('user_id', userId);
    console.log('Subs:', subs);
  }
}
checkUser();
