const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if(k && v) acc[k.trim()] = v.join('=').trim().replace(/['"']/g, '');
  return acc;
}, {});

fetch(env.VITE_SUPABASE_URL + '/rest/v1/rpc/flashcards_temas', {
  method: 'POST',
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + (env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ _area: null })
}).then(res => res.json()).then(data => {
  console.log('Returned data size:', data.length);
  const cps = data.filter(d => d.tema.toLowerCase().includes('penal'));
  console.log('Penal elements:', cps);
});
