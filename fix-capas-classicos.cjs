require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeamento manual: ID => URL de capa funcional (Open Library / Amazon / Google Books)
const CAPAS = {
  121: 'https://m.media-amazon.com/images/I/81YkqyaFVEL._AC_UF1000,1000_QL80_.jpg', // O Caso dos Exploradores de Cavernas
  122: 'https://m.media-amazon.com/images/I/71r1e0GDXFL._AC_UF1000,1000_QL80_.jpg', // Justiça: O que é fazer a coisa certa
  123: 'https://m.media-amazon.com/images/I/71d+TkGRNhL._AC_UF1000,1000_QL80_.jpg', // Dos Delitos e das Penas
  124: 'https://m.media-amazon.com/images/I/71mM8dw+lYL._AC_UF1000,1000_QL80_.jpg', // O Monge e o Executivo
  125: 'https://m.media-amazon.com/images/I/71QQ4TwjlxL._AC_UF1000,1000_QL80_.jpg', // A Arte da Guerra
  126: 'https://m.media-amazon.com/images/I/81n2ENHI9IL._AC_UF1000,1000_QL80_.jpg', // O Leviatã
  127: 'https://m.media-amazon.com/images/I/81bKEsMnwCL._AC_UF1000,1000_QL80_.jpg', // O que é Direito
  128: 'https://m.media-amazon.com/images/I/61BcsE3234L._AC_UF1000,1000_QL80_.jpg', // Acesso à Justiça
  129: 'https://m.media-amazon.com/images/I/81Xz+ReJGaL._AC_UF1000,1000_QL80_.jpg', // O Contrato Social
  130: 'https://m.media-amazon.com/images/I/71ZE6Xl4y6L._AC_UF1000,1000_QL80_.jpg', // O Espírito das Leis
  131: 'https://m.media-amazon.com/images/I/819js3EQwbL._AC_UF1000,1000_QL80_.jpg', // 1984
  132: 'https://m.media-amazon.com/images/I/81i1uq2AwSL._AC_UF1000,1000_QL80_.jpg', // O Advogado do Diabo
  133: 'https://m.media-amazon.com/images/I/71kR02LPXAL._AC_UF1000,1000_QL80_.jpg', // A Luta pelo Direito
  134: 'https://m.media-amazon.com/images/I/81YQOHbYDdL._AC_UF1000,1000_QL80_.jpg', // O Último Dia de um Condenado
  135: 'https://m.media-amazon.com/images/I/71+GlOEpJPL._AC_UF1000,1000_QL80_.jpg', // Como as Democracias Morrem
  136: 'https://m.media-amazon.com/images/I/81gTRv2HXrL._AC_UF1000,1000_QL80_.jpg', // O Processo
  137: 'https://m.media-amazon.com/images/I/81lyLfDJTQL._AC_UF1000,1000_QL80_.jpg', // O Mundo Assombrado pelos Demônios
  138: 'https://m.media-amazon.com/images/I/71JdICxnCdL._AC_UF1000,1000_QL80_.jpg', // Sobre a Liberdade
  139: 'https://m.media-amazon.com/images/I/81YozZE554L._AC_UF1000,1000_QL80_.jpg', // A República
  140: 'https://m.media-amazon.com/images/I/71P1aDiiI4L._AC_UF1000,1000_QL80_.jpg', // O Príncipe
  141: 'https://m.media-amazon.com/images/I/71Qi8s7k42L._AC_UF1000,1000_QL80_.jpg', // Ética a Nicômaco
  142: 'https://m.media-amazon.com/images/I/71e+E1wUMkL._AC_UF1000,1000_QL80_.jpg', // Eles os Juízes
  143: 'https://m.media-amazon.com/images/I/71CsFbpaRIL._AC_UF1000,1000_QL80_.jpg', // Virando a Própria Mesa
  144: 'https://m.media-amazon.com/images/I/61Iy2ESDDML._AC_UF1000,1000_QL80_.jpg', // Teoria Pura do Direito
  145: 'https://m.media-amazon.com/images/I/71fL3uXMxdL._AC_UF1000,1000_QL80_.jpg', // Vigiar e Punir
  146: 'https://m.media-amazon.com/images/I/91hJIR6GSTL._AC_UF1000,1000_QL80_.jpg', // A Meta
  147: 'https://m.media-amazon.com/images/I/71VvUOpWE3L._AC_UF1000,1000_QL80_.jpg', // Introdução ao Estudo do Direito
  148: 'https://m.media-amazon.com/images/I/71Dn7DzmGQL._AC_UF1000,1000_QL80_.jpg', // A Era dos Direitos
};

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

async function run() {
  let ok = 0, fail = 0;

  for (const [idStr, sourceUrl] of Object.entries(CAPAS)) {
    const id = parseInt(idStr);
    
    // Get book name for slug
    const { data: book } = await supabase.from('biblioteca_classicos').select('livro').eq('id', id).single();
    const slug = slugify(book?.livro || `classico_${id}`);
    
    console.log(`\n[${id}] ${book?.livro}`);
    console.log(`  Baixando de: ${sourceUrl.substring(0, 80)}...`);

    try {
      const resp = await fetch(sourceUrl);
      if (!resp.ok) { console.log(`  ✗ HTTP ${resp.status}`); fail++; continue; }

      const contentType = resp.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('webp') ? 'webp' : contentType.includes('png') ? 'png' : 'jpg';
      const buffer = Buffer.from(await resp.arrayBuffer());
      const filePath = `capas/${slug}.${ext}`;

      console.log(`  Enviando para biblioteca-obras/${filePath} (${(buffer.length/1024).toFixed(0)}KB)...`);

      const { error: uploadError } = await supabase.storage
        .from('biblioteca-obras')
        .upload(filePath, buffer, { upsert: true, contentType });

      if (uploadError) { console.log(`  ✗ Upload erro: ${uploadError.message}`); fail++; continue; }

      const newUrl = `https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/${filePath}`;

      const { error: dbErr } = await supabase
        .from('biblioteca_classicos')
        .update({ imagem: newUrl })
        .eq('id', id);

      if (dbErr) { console.log(`  ✗ DB erro: ${dbErr.message}`); fail++; continue; }

      console.log(`  ✓ OK => ${newUrl}`);
      ok++;
    } catch (e) {
      console.log(`  ✗ Erro: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n=============================`);
  console.log(`Sucesso: ${ok} | Falhas: ${fail}`);
  console.log(`=============================`);
}

run();
