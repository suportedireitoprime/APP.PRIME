const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const fileData = fs.readFileSync('public/secret-agent-groove.mp3');
  
  console.log('Fazendo upload para o Supabase...');
  const { data, error } = await supabase.storage
    .from('audios')
    .upload('intros/secret-agent-groove.mp3', fileData, {
      contentType: 'audio/mpeg',
      upsert: true
    });

  if (error) {
    console.error('Erro no upload:', error);
    return;
  }

  const { data: publicData } = supabase.storage
    .from('audios')
    .getPublicUrl('intros/secret-agent-groove.mp3');

  console.log('Upload concluído! URL pública:');
  console.log(publicData.publicUrl);
}

run();
