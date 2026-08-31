require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const OLD_HOST = 'izspjvegxdfgkgibpyst';
const NEW_HOST = 'dnjrgpldcwcpoywamorr';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tabelas reais com colunas reais de imagem/áudio
const tables = [
  { name: 'biblioteca_estudos',            cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
  { name: 'biblioteca_classicos',          cols: ['imagem', 'capa_horizontal', 'audio_resumo_url'] },
  { name: 'biblioteca_oab',               cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
  { name: 'biblioteca_fora_da_toga',       cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
  { name: 'biblioteca_oratoria',           cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
  { name: 'biblioteca_lideranca',          cols: ['imagem', 'capa_horizontal', 'audio_resumo_url'] },
  { name: 'biblioteca_portugues',          cols: ['imagem', 'capa_horizontal', 'audio_resumo_url'] },
  { name: 'biblioteca_pesquisa_cientifica', cols: ['imagem', 'capa_horizontal', 'audio_resumo_url'] },
];

async function migrateFile(oldUrl) {
  const prefix = `https://${OLD_HOST}.supabase.co/storage/v1/object/public/`;
  if (!oldUrl.startsWith(prefix)) return null;

  const remainder = oldUrl.slice(prefix.length);
  const slashIdx = remainder.indexOf('/');
  if (slashIdx === -1) return null;

  const bucket = remainder.slice(0, slashIdx);
  const filePath = remainder.slice(slashIdx + 1);

  try {
    const resp = await fetch(oldUrl);
    if (!resp.ok) {
      process.stdout.write('×');
      return null;
    }

    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await resp.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, { upsert: true, contentType });

    if (uploadError) {
      process.stdout.write('!');
      console.log(`\n  UPLOAD ERR (${bucket}/${filePath}): ${uploadError.message}`);
      return null;
    }

    const newUrl = `https://${NEW_HOST}.supabase.co/storage/v1/object/public/${bucket}/${filePath}`;
    return newUrl;
  } catch (e) {
    process.stdout.write('E');
    return null;
  }
}

async function run() {
  let migrated = 0, skipped = 0, errors = 0;

  for (const t of tables) {
    console.log(`\n=== ${t.name} ===`);
    const { data: rows, error } = await supabase.from(t.name).select('id, ' + t.cols.join(', '));
    if (error) { console.error(`  Erro: ${error.message}`); continue; }
    if (!rows) continue;

    let count = 0;
    for (const r of rows) {
      const updates = {};
      let changed = false;

      for (const col of t.cols) {
        const val = r[col];
        if (!val || !val.includes(OLD_HOST)) continue;

        const newUrl = await migrateFile(val);
        if (newUrl) {
          updates[col] = newUrl;
          changed = true;
          migrated++;
          process.stdout.write('✓');
        } else {
          skipped++;
        }
      }

      if (changed) {
        const { error: dbErr } = await supabase.from(t.name).update(updates).eq('id', r.id);
        if (dbErr) { console.log(`\n  DB ERR id=${r.id}: ${dbErr.message}`); errors++; }
      }
      count++;
      if (count % 50 === 0) console.log(` [${count}/${rows.length}]`);
    }
    console.log(`\n  ${t.name}: ${count} registros processados`);
  }

  console.log(`\n=============================`);
  console.log(`Migrados: ${migrated}`);
  console.log(`Pulados: ${skipped}`);
  console.log(`Erros: ${errors}`);
  console.log(`=============================`);
}

run();
