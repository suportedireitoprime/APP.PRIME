require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.functions.invoke('push-aleatorio-audio', {
    body: { automation_key: 'push-aleatorio-audio-1' }
  });
  
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

run();
