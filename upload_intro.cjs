const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');


const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function upload() {
  const file = fs.readFileSync('docs/intro.mp3');
  const { data, error } = await supabase.storage.from('audios').upload('audio-intro-2.mp3', file, { contentType: 'audio/mpeg', upsert: true });
  if (error) console.error(error);
  else console.log('Success:', data);
}
upload();
