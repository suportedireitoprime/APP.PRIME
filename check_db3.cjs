const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dnjrgpldcwcpoywamorr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w');

async function check() {
  const uid = 'c50d4d1d-c7c5-44e7-bab1-5116779d9a17';
  
  const { data: asaas } = await supabase.from('asaas_subscriptions').select('*').eq('user_id', uid);
  console.log('Asaas Subs:', asaas);
}
check().catch(console.error);
