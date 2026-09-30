const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

async function run() {
  const { data, error } = await supabase.rpc('is_admin_user', { _user_id: 'c8c1ace8-b5da-41e5-b8a1-1af34aca716c' });
  console.log('is_admin_user for genilde:', data, error);
}

run();
