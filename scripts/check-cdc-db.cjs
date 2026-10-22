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

async function check() {
  const counts = {};
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from('narracoes_artigos')
      .select('tabela_nome')
      .not('audio_url', 'is', null)
      .range(from, from + 999);
    for (const r of data || []) {
      counts[r.tabela_nome] = (counts[r.tabela_nome] || 0) + 1;
    }
    if (!data || data.length < 1000) break;
  }

  // Load LEIS_CATALOG from src/data/leisCatalog.ts
  const content = fs.readFileSync('src/data/leisCatalog.ts', 'utf8');
  const items = [];
  const regex = /{\s*id:\s*['"]([^'"]+)['"],\s*nome:\s*['"]([^'"]+)['"],\s*sigla:\s*['"]([^'"]+)['"],.*?tipo:\s*['"]([^'"]+)['"],\s*tabela_nome:\s*['"]([^'"]+)['"]/gs;
  let match;
  while ((match = regex.exec(content)) !== null) {
    items.push({
      id: match[1],
      nome: match[2],
      sigla: match[3],
      tipo: match[4],
      tabela_nome: match[5],
      artigos: counts[match[5]] || 0
    });
  }

  const byCategory = {};
  for (const item of items) {
    if (item.artigos > 0) {
      if (!byCategory[item.tipo]) byCategory[item.tipo] = [];
      byCategory[item.tipo].push(item);
    }
  }

  console.log('--- LEIS COM ÁUDIO POR CATEGORIA ---');
  for (const [cat, laws] of Object.entries(byCategory)) {
    console.log(`\nCategoria: ${cat} (${laws.length} leis)`);
    for (const l of laws) {
      console.log(`  - [${l.sigla}] ${l.nome}: ${l.artigos} artigos`);
    }
  }
}

check();
