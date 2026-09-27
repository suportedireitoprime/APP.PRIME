import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data: profile, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Profile Error:', error);
    return;
  }
  console.log('Profile columns:', Object.keys(profile[0]));
  
  // Try to search by full_name
  const { data: profilesByName } = await supabase.from('profiles').select('*').ilike('full_name', '%nercino%');
  console.log('Found by name Nercino:', profilesByName);

  const { data: profilesByNameAna } = await supabase.from('profiles').select('*').ilike('full_name', '%anaclara%');
  console.log('Found by name Ana:', profilesByNameAna);
}
checkUser();
