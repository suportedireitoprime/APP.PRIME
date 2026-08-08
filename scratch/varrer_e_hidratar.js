import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function varrerEHidratar() {
  console.log('=== Varrer e Hidratar Fotos do Google Maps para Universidades ===');

  // Buscar todos os locais da categoria universidades que não têm a foto lh3.googleusercontent.com
  const { data: locais, error } = await supabase
    .from('locais_juridicos')
    .select('id, nome, cidade, uf, photo_url')
    .eq('categoria', 'universidades')
    .limit(200);

  if (error) {
    console.error('Erro ao buscar universidades:', error.message);
    return;
  }

  const pendentes = (locais || []).filter(
    (l) => !l.photo_url || !l.photo_url.includes('lh3.googleusercontent.com')
  );

  console.log(`Encontrados ${locais.length} locais de universidades. Pendentes de foto do Google: ${pendentes.length}`);

  const ids = pendentes.map((l) => l.id);
  const chunkSize = 40;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const batch = ids.slice(i, i + chunkSize);
    console.log(`\n-> Hidratando lote ${i / chunkSize + 1} com ${batch.length} faculdades...`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/locais-overpass-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        action: 'photos',
        local_ids: batch,
        force: true,
      }),
    });

    if (!response.ok) {
      console.error(`Falha no lote ${i / chunkSize + 1}: ${response.status}`, await response.text());
    } else {
      const resJson = await response.json();
      const photos = resJson.photos || [];
      console.log(`✅ Lote ${i / chunkSize + 1} concluído com sucesso! Fotos recebidas: ${photos.length}`);
      for (const p of photos.slice(0, 5)) {
        console.log(`  - ID ${p.id}: photo_url = ${p.photo_url ? 'PÚBLICA GOOGLE PLACES ✅' : 'NULADA ❌'}`);
      }
    }
  }

  console.log('\n=== Varredura Massiva Concluída! ===');
}

varrerEHidratar();
