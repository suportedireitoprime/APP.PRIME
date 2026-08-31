require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function extractDriveId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  return idMatch ? idMatch[1] : null;
}

async function run() {
  console.log('Buscando livros de Direito Administrativo...');
  
  const { data: livros, error } = await supabase
    .from('biblioteca_estudos')
    .select('id, tema, download')
    .eq('area', 'Direito Administrativo');

  if (error) {
    console.error('Erro ao buscar:', error.message);
    return;
  }

  console.log(`Encontrados ${livros.length} livros. Iniciando extração de capas via Google Drive...`);

  let ok = 0;
  let fail = 0;

  for (const livro of livros) {
    console.log(`\n[${livro.id}] ${livro.tema}`);
    
    const driveId = extractDriveId(livro.download);
    if (!driveId) {
      console.log(`  ✗ URL inválida ou não é do Google Drive: ${livro.download}`);
      fail++;
      continue;
    }

    try {
      const thumbUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
      console.log(`  Baixando miniatura do Drive (${driveId})...`);
      
      const response = await fetch(thumbUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 5000) {
        throw new Error('Arquivo retornado muito pequeno (provavelmente ícone genérico ou erro)');
      }

      const slug = slugify(livro.tema);
      const storagePath = `capas/pdfs/administrativo_${slug}_${livro.id}.png`;
      
      console.log(`  Fazendo upload para biblioteca-obras/${storagePath}...`);
      const { error: uploadError } = await supabase.storage
        .from('biblioteca-obras')
        .upload(storagePath, buffer, { upsert: true, contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const newUrl = `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/biblioteca-obras/${storagePath}`;
      
      const { error: dbErr } = await supabase
        .from('biblioteca_estudos')
        .update({ capa_livro: newUrl })
        .eq('id', livro.id);

      if (dbErr) throw dbErr;

      console.log(`  ✓ Sucesso! Capa atualizada: ${newUrl}`);
      ok++;
    } catch (e) {
      console.log(`  ✗ Falha: ${e.message}`);
      fail++;
    }
    
    // Pequeno delay para evitar rate limits do Google Drive e Supabase
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=============================`);
  console.log(`Finalizado! Sucesso: ${ok} | Falhas: ${fail}`);
  console.log(`=============================`);
}

run();
