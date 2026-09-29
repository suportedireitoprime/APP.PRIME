const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dnjrgpldcwcpoywamorr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w');

async function check() {
  const { data: logs } = await supabase.from('asaas_webhooks').select('id, event, created_at, payload').order('created_at', { ascending: false }).limit(5);
  console.log('Recent webhooks:', JSON.stringify(logs, null, 2));
}
check().catch(console.error);
