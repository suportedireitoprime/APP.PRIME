const fs = require('fs');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => {
  const p = l.split('=');
  if (p.length >= 2) env[p[0].trim()] = p.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
});

async function test() {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/blog_edicao_posts?select=id,categoria&limit=2`;
  console.log('Testando fetch direto em:', url);
  const t0 = Date.now();
  const res = await fetch(url, {
    headers: {
      apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  console.log('Tempo (ms):', Date.now() - t0);
  console.log('HTTP Status:', res.status);
  const json = await res.json();
  console.log('Data:', json);
}

test().catch(console.error);
