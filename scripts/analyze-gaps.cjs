const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

// 1. Catálogo de Leis
const catalogContent = fs.readFileSync('src/data/leisCatalog.ts', 'utf8');
const catalogItems = [];
const itemRegex = /{\s*id:\s*'([^']+)',\s*nome:\s*'([^']+)',\s*sigla:\s*'([^']+)',\s*descricao:[^,]+,\s*tipo:\s*'([^']+)',\s*tabela_nome:\s*'([^']+)'/g;
let m;
while ((m = itemRegex.exec(catalogContent)) !== null) {
  catalogItems.push({
    id: m[1],
    nome: m[2],
    sigla: m[3],
    tipo: m[4],
    tabela_nome: m[5]
  });
}

// 2. Drive Audios
const driveAudios = JSON.parse(fs.readFileSync('scripts/all_drive_audios.json', 'utf8'));
const driveTabelas = new Set(driveAudios.map(a => a.tabelaNome));

async function run() {
  console.log('=== 1. ANÁLISE DE AUDIOLEIS (LEGISLAÇÃO) ===');
  console.log(`Total de leis no LEIS_CATALOG: ${catalogItems.length}`);
  console.log(`Total de leis com narrações no Google Drive/R2: ${driveTabelas.size}`);

  const leisComAudio = [];
  const leisSemAudio = [];

  for (const item of catalogItems) {
    if (driveTabelas.has(item.tabela_nome)) {
      leisComAudio.push(item);
    } else {
      leisSemAudio.push(item);
    }
  }

  console.log(`\nLeis do App COM Áudio Pronto: ${leisComAudio.length}`);
  console.log(`Leis do App SEM Áudio (Faltando): ${leisSemAudio.length}`);
  console.log('\n--- LISTA DE LEIS FALTANDO ÁUDIO ---');
  leisSemAudio.forEach(l => {
    console.log(`[${l.tipo.toUpperCase()}] ${l.sigla} - ${l.nome} (${l.tabela_nome})`);
  });

  // Também verificar o painel do Google Drive:
  console.log('\n--- STATUS NO PAINEL DO DRIVE (painel_narracoes.csv) ---');
  const painel = fs.readFileSync('scripts/painel_narracoes.csv', 'utf8');
  console.log(painel.trim());

  console.log('\n=== 2. ANÁLISE DE AUDIOAULAS (MATÉRIAS E ACERVO) ===');
  // Consultar tabelas de audioaulas no Supabase
  // Tabelas possíveis: audioaulas, audioaulas_acervo, aulas
  let audioaulasData = null;
  let audioaulasTable = '';

  for (const t of ['audioaulas', 'audioaulas_acervo', 'aulas', 'audioaulas_aulas']) {
    try {
      const { data, count, error } = await supabase.from(t).select('*', { count: 'exact' }).limit(10);
      if (!error && count !== null) {
        console.log(`Tabela "${t}": encontrada com ${count} registros!`);
        if (!audioaulasTable) {
          audioaulasTable = t;
          audioaulasData = { count };
        }
      }
    } catch (e) {}
  }

  if (audioaulasTable) {
    // Buscar todas as matérias/áreas e contagem
    let from = 0;
    const areas = {};
    while (true) {
      const { data } = await supabase.from(audioaulasTable).select('*').range(from, from + 999);
      if (!data || data.length === 0) break;
      for (const row of data) {
        const area = row.materia || row.area || row.disciplina || row.categoria || 'Sem Categoria';
        areas[area] = (areas[area] || 0) + 1;
      }
      from += 1000;
      if (data.length < 1000) break;
    }
    console.log(`\nMatérias em "${audioaulasTable}":`);
    for (const [k, v] of Object.entries(areas)) {
      console.log(`- ${k}: ${v} audioaulas`);
    }
  }

  // Verificar matérias canônicas de Audioaulas no frontend
  const audioaulasPage = fs.readFileSync('src/pages/Audioaulas.tsx', 'utf8');
  const areasMatches = audioaulasPage.match(/area|materia|disciplina/gi);
  console.log(`\nAnálise do frontend de Audioaulas concluída.`);
}

run().catch(console.error);
