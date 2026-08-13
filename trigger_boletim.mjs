import { readFileSync, existsSync } from 'fs';

let url, key;
if (existsSync('.env')) {
  const env = readFileSync('.env', 'utf8');
  url = (env.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || env.match(/SUPABASE_URL=(.*)/)?.[1] || '').trim().replace(/['"]/g, '');
  key = (env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1] || env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1] || '').trim().replace(/['"]/g, '');
}

async function trigger() {
  console.log(`Triggering boletim-juridico-gerar on ${url}...`);
  const res = await fetch(`${url}/functions/v1/boletim-juridico-gerar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text}`);
}

trigger();
