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

async function run() {
  // Pegar todas as tabela_nome distintas
  let from = 0;
  const batchSize = 1000;
  const tabelaCounts = {};
  const sampleUrls = {};

  while (true) {
    const { data, error } = await supabase
      .from('narracoes_artigos')
      .select('tabela_nome, audio_url')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching batch:', error);
      break;
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      tabelaCounts[row.tabela_nome] = (tabelaCounts[row.tabela_nome] || 0) + 1;
      if (!sampleUrls[row.tabela_nome]) {
        sampleUrls[row.tabela_nome] = row.audio_url;
      }
    }

    from += batchSize;
    if (data.length < batchSize) break;
  }

  console.log('Total de tabelas únicas com narrações existentes:', Object.keys(tabelaCounts).length);
  console.log('\nTabelas e quantidades:');
  for (const [tab, count] of Object.entries(tabelaCounts)) {
    console.log(`- ${tab}: ${count} artigos (ex: ${sampleUrls[tab]})`);
  }
}

run();
