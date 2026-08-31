require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function slugify(text) {
  if (!text) return 'livro';
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

async function processTable(tableName, titleField) {
  console.log(`\n=== Processando tabela: ${tableName} ===`);
  const { data: livros, error } = await supabase
    .from(tableName)
    .select(`id, ${titleField}, download`);

  if (error) {
    console.error(`Erro ao buscar ${tableName}:`, error.message);
    return;
  }

  let ok = 0, fail = 0;

  for (const livro of livros) {
    const driveId = extractDriveId(livro.download);
    if (!driveId) continue; // Pula silenciosamente se não for GDrive

    try {
      // Usa w400 para gerar uma imagem mais leve/rápida (compressão natural do Google)
      const thumbUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
      
      const response = await fetch(thumbUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 3000) throw new Error('Arquivo muito pequeno');

      const slug = slugify(livro[titleField]);
      const storagePath = `capas/pdfs/all_${tableName}_${slug}_${livro.id}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('biblioteca-obras')
        .upload(storagePath, buffer, { upsert: true, contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const newUrl = `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/biblioteca-obras/${storagePath}`;
      
      // Alguns usam capa_livro, outros usam imagem
      const fieldToUpdate = (tableName === 'biblioteca_classicos' || tableName === 'biblioteca_lideranca' || tableName === 'biblioteca_portugues' || tableName === 'biblioteca_pesquisa_cientifica') ? 'imagem' : 'capa_livro';

      await supabase
        .from(tableName)
        .update({ [fieldToUpdate]: newUrl })
        .eq('id', livro.id);

      process.stdout.write('.');
      ok++;
    } catch (e) {
      process.stdout.write('x');
      fail++;
    }
    
    // Pequeno delay para evitar rate limits
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\n${tableName}: Sucesso: ${ok} | Falhas: ${fail}`);
}

async function run() {
  await processTable('biblioteca_estudos', 'tema'); // Áreas do direito
  await processTable('biblioteca_oab', 'tema');
  await processTable('biblioteca_fora_da_toga', 'livro');
  await processTable('biblioteca_oratoria', 'livro');
  await processTable('biblioteca_lideranca', 'livro');
  await processTable('biblioteca_portugues', 'livro');
  await processTable('biblioteca_pesquisa_cientifica', 'livro');
  
  console.log(`\nFIM!`);
}

run();
