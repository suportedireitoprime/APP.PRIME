const{createClient}=require('@supabase/supabase-js');
const sb=createClient('https://dnjrgpldcwcpoywamorr.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w');

async function main() {
  const {data, error} = await sb.from('horus_conversations')
    .select('phone_e164,role,content,created_at')
    .order('created_at',{ascending:false})
    .limit(30);
  if (error) { console.log('ERR', error); process.exit(1); }
  data.forEach(m => {
    const t = (m.content||'').substring(0,100);
    console.log(m.created_at?.substring(11,19), m.role?.padEnd(10), (m.phone_e164||'').slice(-4).padStart(8), t);
  });
  process.exit(0);
}
main();
