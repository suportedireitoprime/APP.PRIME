const fs = require('fs');
const https = require('https');

const clientTs = fs.readFileSync('src/integrations/supabase/client.ts', 'utf-8');
const urlMatch = clientTs.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = clientTs.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch ? urlMatch[1] : 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = keyMatch ? keyMatch[1] : '';

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
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- BUSCANDO EVENTOS LEANDRO ---');
  const events1 = await query('/rest/v1/app_events?email=ilike.*leandrofs2010*&select=user_id,email,event_name,created_at&limit=10');
  console.log('Events Leandro:', JSON.stringify(events1, null, 2));

  console.log('--- BUSCANDO EVENTOS WAGNER ---');
  const events2 = await query('/rest/v1/app_events?email=ilike.*limadesouzawagner0*&select=user_id,email,event_name,created_at&limit=10');
  console.log('Events Wagner:', JSON.stringify(events2, null, 2));

  const userIdLeandro = events1 && events1[0] ? events1[0].user_id : null;
  const userIdWagner = events2 && events2[0] ? events2[0].user_id : null;

  console.log('User ID Leandro:', userIdLeandro);
  console.log('User ID Wagner:', userIdWagner);

  if (userIdLeandro) {
    const profile = await query(`/rest/v1/profiles?id=eq.${userIdLeandro}&select=*`);
    console.log('Profile Leandro:', JSON.stringify(profile, null, 2));
    const asaas = await query(`/rest/v1/asaas_subscriptions?user_id=eq.${userIdLeandro}&select=*`);
    console.log('Asaas Leandro:', JSON.stringify(asaas, null, 2));
    const play = await query(`/rest/v1/play_subscriptions?user_id=eq.${userIdLeandro}&select=*`);
    console.log('Play Leandro:', JSON.stringify(play, null, 2));
  }

  if (userIdWagner) {
    const profile = await query(`/rest/v1/profiles?id=eq.${userIdWagner}&select=*`);
    console.log('Profile Wagner:', JSON.stringify(profile, null, 2));
    const asaas = await query(`/rest/v1/asaas_subscriptions?user_id=eq.${userIdWagner}&select=*`);
    console.log('Asaas Wagner:', JSON.stringify(asaas, null, 2));
    const play = await query(`/rest/v1/play_subscriptions?user_id=eq.${userIdWagner}&select=*`);
    console.log('Play Wagner:', JSON.stringify(play, null, 2));
  }
}

run().catch(console.error);
