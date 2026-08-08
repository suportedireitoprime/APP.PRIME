import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTEyMDA2MCwiZXhwIjoy1MDE2OTYwNjB9.1aKyl_f-m3iH-T683gG_p630K1S-uXhS7N1tJ5L63c4'; // Service Role Key mock or env

async function run() {
  console.log('--- Iniciando varredura massiva de fotos de universidades ---');
  
  // Buscar todas as universidades registradas no Supabase
  const res = await fetch(`${supabaseUrl}/rest/v1/locais_juridicos?categoria=eq.universidades&select=id,nome,cidade,uf,photo_url`, {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMjAwNjAsImV4cCI6MjEwMTY5NjA2MH0.2jQW0c4_G_a_rXbQZ-H0J5S_1K5-N0tJ5L63c4',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMjAwNjAsImV4cCI6MjEwMTY5NjA2MH0.2jQW0c4_G_a_rXbQZ-H0J5S_1K5-N0tJ5L63c4'
    }
  });

  // Disparar a hidratação em lotes de 40 locais diretamente na Edge Function
  const resSync = await fetch(`${supabaseUrl}/functions/v1/locais-overpass-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'photos', force: true })
  });

  console.log('Resultado da varredura:', await resSync.status);
}

run();
