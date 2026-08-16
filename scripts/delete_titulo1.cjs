const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if(k && v) acc[k.trim()] = v.join('=').trim().replace(/['"']/g, '');
  return acc;
}, {});

fetch(env.VITE_SUPABASE_URL + '/rest/v1/flashcards_cards?tema=ilike.*T%C3%8DTULO%20I%0A*', {
  method: 'DELETE',
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + (env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY)
  }
}).then(res => console.log('Status 1:', res.status));

fetch(env.VITE_SUPABASE_URL + '/rest/v1/flashcards_cards?tema=ilike.*T%C3%8DTULO%20I%20*', {
  method: 'DELETE',
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + (env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY)
  }
}).then(res => console.log('Status 2:', res.status));
