const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if(k && v) acc[k.trim()] = v.join('=').trim().replace(/['"']/g, '');
  return acc;
}, {});

async function run() {
  const headers = {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + (env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY)
  };
  
  const res = await fetch(env.VITE_SUPABASE_URL + '/rest/v1/flashcards_cards?select=tema&tema=ilike.*penal*', { headers });
  const data = await res.json();
  
  const counts = {};
  data.forEach(d => counts[d.tema] = (counts[d.tema] || 0) + 1);
  console.log('Current items in DB containing "penal":', counts);

  // Now delete them
  for (const tema of Object.keys(counts)) {
    console.log('Deleting:', tema);
    const delRes = await fetch(env.VITE_SUPABASE_URL + '/rest/v1/flashcards_cards?tema=eq.' + encodeURIComponent(tema), {
      method: 'DELETE',
      headers
    });
    console.log('Delete status:', delRes.status);
  }
}

run();
