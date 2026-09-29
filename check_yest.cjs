const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dnjrgpldcwcpoywamorr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w');

async function check() {
  const { data: asaas } = await supabase.from('asaas_subscriptions').select('id, user_id, status, created_at, started_at').or(nd(created_at.gte.2026-09-28T00:00:00Z,created_at.lt.2026-09-29T00:00:00Z),and(started_at.gte.2026-09-28T00:00:00Z,started_at.lt.2026-09-29T00:00:00Z));
  console.log('Yesterday asaas:', asaas);
}
check().catch(console.error);
