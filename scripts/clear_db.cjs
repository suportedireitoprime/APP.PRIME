const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if(k && v) acc[k.trim()] = v.join('=').trim().replace(/['"']/g, '');
  return acc;
}, {});

fetch(env.VITE_SUPABASE_URL + '/rest/v1/flashcards_cards?tema=like.C%C3%B3digo%20Penal*', {
  method: 'DELETE',
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + (env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY)
  }
}).then(res => console.log('Status C:', res.status)).catch(err => console.error(err));

fetch(env.VITE_SUPABASE_URL + '/rest/v1/flashcards_cards?tema=like.C%C3%93DIGO%20PENAL*', {
  method: 'DELETE',
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + (env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY)
  }
}).then(res => console.log('Status UPPER:', res.status)).catch(err => console.error(err));
