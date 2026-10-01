require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  const startIso = new Date('2026-10-01T00:00:00-03:00').toISOString();
  
  console.log(`Buscando dados após: ${startIso}`);
  
  const [events, sessions, profiles, activity] = await Promise.all([
    supabase.from('app_events').select('count', { count: 'exact' }).gte('created_at', startIso),
    supabase.from('user_sessions').select('count', { count: 'exact' }).gte('last_seen', startIso),
    supabase.from('profiles').select('count', { count: 'exact' }).gte('created_at', startIso),
    supabase.from('user_activity_log').select('count', { count: 'exact' }).gte('created_at', startIso)
  ]);
  
  console.log('App Events:', events.count, events.error);
  console.log('User Sessions:', sessions.count, sessions.error);
  console.log('Profiles:', profiles.count, profiles.error);
  console.log('Activity Log:', activity.count, activity.error);
}

checkData();
