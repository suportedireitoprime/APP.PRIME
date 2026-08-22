const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: sessions, error } = await supabase.from('user_sessions')
    .select('initial_route, user_id, created_at')
    .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
    
  const { data: profiles } = await supabase.from('profiles').select('id, is_premium');
  
  if (error) {
    console.error(error);
  } else {
    const profMap = new Map();
    if(profiles) profiles.forEach(p => profMap.set(p.id, p.is_premium));
    
    const counts = {};
    if(sessions) {
      sessions.forEach(s => {
        const isPremium = profMap.get(s.user_id);
        if (isPremium === false && s.initial_route) {
          counts[s.initial_route] = (counts[s.initial_route] || 0) + 1;
        }
      });
    }
    
    console.log("Top Routes by Free Users Today:");
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    console.log(JSON.stringify(sorted.slice(0, 10), null, 2));
  }
}
run();
