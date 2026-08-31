require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeStr(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

async function run() {
  const docsDir = path.join(__dirname, 'docs');
  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
  
  const { data: classicos } = await supabase.from('biblioteca_classicos').select('id, livro');
  
  let ok = 0, fail = 0;

  for (const c of classicos) {
    const bookNorm = normalizeStr(c.livro);
    let matchedFile = null;
    
    // Find matching file
    for (const f of files) {
      const fileNorm = normalizeStr(path.parse(f).name);
      if (fileNorm === bookNorm || fileNorm.includes(bookNorm) || bookNorm.includes(fileNorm)) {
        matchedFile = f;
        break;
      }
    }
    
    // Some manual fallback matchers due to user typos in file names
    if (!matchedFile) {
      if (bookNorm === 'justicaoqueefazeracoisacerta' && files.find(f => normalizeStr(f).includes('justicaoqueefazer'))) matchedFile = 'Justiça O que é fazer a coisa certa.jpg';
      else if (bookNorm === 'ocasodosexploradoresdecavernas' && files.find(f => normalizeStr(f).includes('exploradoresdecaverna'))) matchedFile = 'o caso dos exploradores de caverna.jpg';
      else if (bookNorm === 'ametaumprocessodemelhoriacontinua' && files.find(f => normalizeStr(f).includes('ameta'))) matchedFile = 'A Meta Um Processo de Melhoria Contínua.jpg';
      else if (bookNorm === 'vigiarepunirnascimentodaprisao' && files.find(f => normalizeStr(f).includes('vigiarepunir'))) matchedFile = 'Vigiar e Punir Nascimento da Prisão.jpg';
      else if (bookNorm === 'oespiritodasleis' && files.find(f => normalizeStr(f).includes('doespirito'))) matchedFile = 'Do espirito das leis.jpg';
      else if (bookNorm === 'elesosjuizesvistospornososadvogados' && files.find(f => normalizeStr(f).includes('elesosjuizes'))) matchedFile = 'Eles, os Juízes, Vistos por Nós, os Advogados.jpg';
      else if (bookNorm === 'ateoriadasformasdegoverno' && files.find(f => normalizeStr(f).includes('teoriadasformas'))) matchedFile = 'A teoria das formas de governo.jpg';
      else if (bookNorm === 'ofuturodademocracia' && files.find(f => normalizeStr(f).includes('futurodademocracia'))) matchedFile = 'O futuro da democracia.jpg';
    }

    if (matchedFile) {
      console.log(`\n[${c.id}] ${c.livro} => Encontrado arquivo: ${matchedFile}`);
      const filePath = path.join(docsDir, matchedFile);
      const buffer = fs.readFileSync(filePath);
      
      const ext = path.extname(matchedFile).toLowerCase().replace('.', '');
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const slug = slugify(c.livro);
      const storagePath = `capas/${slug}_manual.${ext}`;

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
      
      const { error: dbErr } = await supabase
        .from('biblioteca_classicos')
        .update({ imagem: newUrl })
        .eq('id', c.id);

      if (dbErr) {
        console.log(`  ✗ Erro no DB: ${dbErr.message}`);
        fail++;
      } else {
        console.log(`  ✓ Atualizado no banco: ${newUrl}`);
        ok++;
      }
    } else {
      console.log(`\n[${c.id}] ${c.livro} => ✗ Nenhum arquivo correspondente encontrado.`);
    }
  }

  console.log(`\n=============================`);
  console.log(`Concluído! ${ok} atualizados, ${fail} falhas.`);
  console.log(`=============================`);
}

run();
