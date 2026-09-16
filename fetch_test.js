const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if(k) acc[k] = v?.replace(/["'\r]/g, '');
  return acc;
}, {});
fetch(env.VITE_SUPABASE_URL + '/rest/v1/radar_deputados?select=dados_json&limit=1', {
  headers: { apikey: env.VITE_SUPABASE_ANON_KEY }
}).then(r => r.json()).then(d => console.log(JSON.stringify(d)));
