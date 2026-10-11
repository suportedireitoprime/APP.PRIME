const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

async function find() {
  const { data: sessions } = await sb.from('user_sessions')
    .select('user_id, started_at')
    .order('started_at', { ascending: false })
    .limit(100);

  const uids = [...new Set((sessions || []).map(s => s.user_id).filter(Boolean))];
  console.log('Recent unique session user_ids:', uids.length);

  const { data: profiles } = await sb.from('profiles').select('id, display_name, is_premium').in('id', uids);
  console.log('Sample profiles:', profiles?.slice(0, 10));

  // Procurar Leandro ou Wagner nos profiles
  const { data: pLeandro } = await sb.from('profiles').select('*').ilike('display_name', '%leandro%');
  console.log('Profiles com Leandro:', pLeandro);

  const { data: pWagner } = await sb.from('profiles').select('*').ilike('display_name', '%wagner%');
  console.log('Profiles com Wagner:', pWagner);
}

find().catch(console.error);
