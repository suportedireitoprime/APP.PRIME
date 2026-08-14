const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
const url = lines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].replace(/"/g, '').trim();
const key = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].replace(/"/g, '').trim();

fetch(url + '/functions/v1/legacy-sync', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'sync', sources: ['asaas'], apply: true })
}).then(r => r.json()).then(d => {
  console.log('Sync result:', JSON.stringify(d, null, 2));
}).catch(console.error);
