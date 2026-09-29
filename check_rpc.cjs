const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dnjrgpldcwcpoywamorr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w');

async function check() {
  const { data } = await supabase.rpc('admin_lista_dia');
  console.log('admin_lista_dia:', data?.length);
  
  // also let's query the specific 3 subscriptions from yesterday 
  // maybe from app_events purchase?
  const { data: evts } = await supabase.from('app_events').select('*').eq('event_name', 'purchase').gte('created_at', '2026-09-28T00:00:00Z');
  console.log('purchase events:', evts?.length);
}
check().catch(console.error);
