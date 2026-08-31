require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-'); // use dash instead of underscore for area assets
}

async function run() {
  const assetsDir = path.join(__dirname, 'src', 'assets', 'biblioteca', 'areas');
  const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
  
  const tables = ['biblioteca_estudos', 'biblioteca_oab'];
  let ok = 0, fail = 0;

  for (const table of tables) {
    console.log(`\n=== Processando tabela: ${table} ===`);
    
    // Get unique areas
    const { data: areaData, error: areaErr } = await supabase.from(table).select('area');
    if (areaErr) {
      console.log(`Erro ao buscar áreas: ${areaErr.message}`);
      continue;
    }
    
    const areas = [...new Set(areaData.map(d => d.area).filter(Boolean))];
    console.log(`Encontradas ${areas.length} áreas únicas.`);

    for (const area of areas) {
      const slug = slugify(area);
      // Try to find exact match .jpg, .png, .webp
      let matchedFile = files.find(f => f === `${slug}.jpg`) || 
                        files.find(f => f === `${slug}.png`) || 
                        files.find(f => f === `${slug}.webp`);
      
      // Fallback loose match
      if (!matchedFile) {
        matchedFile = files.find(f => f.includes(slug) || slug.includes(f.replace(/\.[^/.]+$/, '')));
      }

      if (matchedFile) {
        console.log(`\nÁrea: ${area} => Arquivo: ${matchedFile}`);
        const filePath = path.join(assetsDir, matchedFile);
        const buffer = fs.readFileSync(filePath);
        
        const ext = path.extname(matchedFile).toLowerCase().replace('.', '');
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const storagePath = `areas/${slug}.${ext}`;

        console.log(`  Fazendo upload para biblioteca-obras/${storagePath}...`);
        
        const { error: uploadError } = await supabase.storage
          .from('biblioteca-obras')
          .upload(storagePath, buffer, { upsert: true, contentType: mime });

        if (uploadError) {
          console.log(`  ✗ Erro no upload: ${uploadError.message}`);
          fail++;
          continue;
        }

        const newUrl = `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/biblioteca-obras/${storagePath}`;
        
        // Update all books in this area in this table
        const { error: dbErr, data: updated } = await supabase
          .from(table)
          .update({ capa_livro: newUrl })
          .eq('area', area)
          .select('id');

        if (dbErr) {
          console.log(`  ✗ Erro no DB: ${dbErr.message}`);
          fail++;
        } else {
          console.log(`  ✓ Atualizados ${updated.length} livros no banco: ${newUrl}`);
          ok += updated.length;
        }
      } else {
        console.log(`\nÁrea: ${area} => ✗ Nenhum arquivo encontrado no código.`);
        // Try to set to null so it doesn't show broken image
        await supabase.from(table).update({ capa_livro: null }).eq('area', area);
      }
    }
  }

  console.log(`\n=============================`);
  console.log(`Concluído! ${ok} livros atualizados, ${fail} falhas.`);
  console.log(`=============================`);
}

run();
