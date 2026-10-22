const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function testRpc() {
  // Let's test calling some known RPCs or test what functions exist
  const { data, error } = await supabase.rpc('get_service_role_status');
  console.log('Test RPC error:', error ? error.message : null);
}

testRpc().catch(console.error);
