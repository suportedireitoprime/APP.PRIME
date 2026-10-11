const fs = require('fs');
const https = require('https');

// Lê o arquivo client.ts para pegar a URL e Anon Key
const clientTs = fs.readFileSync('src/integrations/supabase/client.ts', 'utf-8');
const urlMatch = clientTs.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = clientTs.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*['"]([^'"]+)['"]/);

const SUPABASE_URL = urlMatch ? urlMatch[1] : 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = keyMatch ? keyMatch[1] : '';

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_KEY prefix:', SUPABASE_KEY.slice(0, 10));

function query(endpoint) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(SUPABASE_URL + endpoint);
    const req = https.request(fullUrl, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const emails = ['leandrofs2010@gmail.com', 'limadesouzawagner0@gmail.com'];
  for (const email of emails) {
    console.log('\n==============================');
    console.log('USUARIO:', email);
    console.log('==============================');
    const profiles = await query(`/rest/v1/profiles?email=ilike.${encodeURIComponent(email)}&select=*`);
    console.log('Profile:', JSON.stringify(profiles, null, 2));

    const userId = profiles && profiles[0] ? profiles[0].id : null;
    if (userId) {
      const play = await query(`/rest/v1/play_subscriptions?user_id=eq.${userId}&select=*`);
      console.log('Play:', JSON.stringify(play, null, 2));

      const apple = await query(`/rest/v1/apple_subscriptions?user_id=eq.${userId}&select=*`);
      console.log('Apple:', JSON.stringify(apple, null, 2));

      const asaas = await query(`/rest/v1/asaas_subscriptions?user_id=eq.${userId}&select=*`);
      console.log('Asaas:', JSON.stringify(asaas, null, 2));

      const legacy = await query(`/rest/v1/legacy_subscribers?email=ilike.${encodeURIComponent(email)}&select=*`);
      console.log('Legacy by email:', JSON.stringify(legacy, null, 2));

      const cancel = await query(`/rest/v1/assinatura_cancelamentos?user_id=eq.${userId}&select=*`);
      console.log('Cancelamentos:', JSON.stringify(cancel, null, 2));
    }
  }
}

run().catch(console.error);
