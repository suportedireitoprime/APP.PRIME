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

async function testFunctions() {
  const functions = [
    'audioaulas-sheets-sync',
    'audioaulas-sheets-links',
    'sync-github-secrets',
    'admin-download-secret'
  ];

  for (const fn of functions) {
    try {
      const { data, error } = await supabase.functions.invoke(fn, { body: {} });
      console.log(`Function ${fn}:`, { data, error: error ? error.message : null });
    } catch (e) {
      console.error(`Function ${fn} threw:`, e.message);
    }
  }
}

testFunctions().catch(console.error);
