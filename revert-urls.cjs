require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function revert() {
  const tables = [
    { name: 'biblioteca_estudos', cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
    { name: 'biblioteca_classicos', cols: ['imagem', 'capa_horizontal', 'audio_resumo_url'] },
    { name: 'biblioteca_oab', cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
    { name: 'biblioteca_fora_toga', cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
    { name: 'biblioteca_portugues', cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
    { name: 'biblioteca_pesquisa', cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
    { name: 'biblioteca_lideranca', cols: ['capa_livro', 'capa_horizontal', 'audio_resumo_url'] },
  ];

  let totalUpdated = 0;

  for (const t of tables) {
    const { data: rows, error } = await supabase.from(t.name).select('id, ' + t.cols.join(', '));
    if (error) { console.error(`Erro em ${t.name}:`, error.message); continue; }
    if (!rows) continue;
    
    for (const r of rows) {
      let needsUpdate = false;
      const updates = {};
      for (const col of t.cols) {
        if (r[col] && r[col].includes('dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/imagens/')) {
          updates[col] = r[col].replace('dnjrgpldcwcpoywamorr', 'izspjvegxdfgkgibpyst');
          needsUpdate = true;
        }
      }
      if (needsUpdate) {
        await supabase.from(t.name).update(updates).eq('id', r.id);
        totalUpdated++;
      }
    }
    console.log(`${t.name} processada`);
  }
  console.log(`\nTotal revertidos: ${totalUpdated}`);
}

revert();
