import fetch from 'node-fetch';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n');
let url = '', key = '';
for (const line of env) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

async function main() {
  const res = await fetch(`${url}/functions/v1/play-billing?fn=funnel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ days: 1 })
  });
  const data = await res.json();
  console.log('Total events for 1 day (via ?fn=funnel):', data.funnel?.length);
  if (data.funnel) {
      const purchases = data.funnel.filter(e => e.event_name === 'purchase');
      console.log('Purchases in funnel for 1 day:', purchases.length);
  }
}
main();
