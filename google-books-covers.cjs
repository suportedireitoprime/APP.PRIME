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

async function run() {
  const { data: classicos } = await supabase.from('biblioteca_classicos').select('id, livro, imagem');
  let ok = 0;
  let fail = 0;

  for (const c of classicos) {
    // If it's from the old supabase or 404 amazon
    if (c.imagem && c.imagem.includes('izspjvegxdfgkgibpyst')) {
      console.log(`Buscando: ${c.livro}`);
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(c.livro)}`);
        const json = await res.json();
        const thumbnailUrl = json.items?.[0]?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:');

        if (thumbnailUrl) {
          const resp = await fetch(thumbnailUrl);
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          
          const buffer = Buffer.from(await resp.arrayBuffer());
          const slug = slugify(c.livro);
          const filePath = `capas/${slug}_google.jpg`;

          const { error: uploadError } = await supabase.storage
            .from('biblioteca-obras')
            .upload(filePath, buffer, { upsert: true, contentType: 'image/jpeg' });

          if (uploadError) throw uploadError;

          const newUrl = `https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/${filePath}`;
          await supabase.from('biblioteca_classicos').update({ imagem: newUrl }).eq('id', c.id);
          
          console.log(`  ✓ Encontrado e salvo: ${newUrl}`);
          ok++;
        } else {
          console.log('  ✗ Nenhuma capa encontrada');
          // Set to null to remove broken image
          await supabase.from('biblioteca_classicos').update({ imagem: null }).eq('id', c.id);
          fail++;
        }
      } catch (e) {
        console.log(`  ✗ Erro: ${e.message}`);
        await supabase.from('biblioteca_classicos').update({ imagem: null }).eq('id', c.id);
        fail++;
      }
      
      // Delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  console.log(`Concluido! Recuperadas: ${ok}, Sem capa/Erro: ${fail}`);
}
run();
