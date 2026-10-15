const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('=== VERIFICAÇÃO DETALHADA DE ÁUDIO LEIS & ÁUDIO AULAS ===\n');

  // 1. Áudio Leis no Supabase
  const { data: narracoes } = await supabase
    .from('narracoes_artigos')
    .select('tabela_nome, artigo_numero');

  const narracoesPorTabela = {};
  for (const r of (narracoes || [])) {
    const t = (r.tabela_nome || '').toUpperCase();
    narracoesPorTabela[t] = (narracoesPorTabela[t] || 0) + 1;
  }

  // 2. Arquivos locais em scratch (Drive já baixado/mapeado)
  const localFiles = {
    CP: fs.existsSync('scratch/cp_complete_files.json') ? JSON.parse(fs.readFileSync('scratch/cp_complete_files.json', 'utf8')).length : 0,
    CDC: fs.existsSync('scratch/cdc_complete_files.json') ? JSON.parse(fs.readFileSync('scratch/cdc_complete_files.json', 'utf8')).length : 0,
    CPC: fs.existsSync('scratch/cpc_clean_files.json') ? JSON.parse(fs.readFileSync('scratch/cpc_clean_files.json', 'utf8')).length : 0,
    CTN: fs.existsSync('scratch/ctn_clean_files.json') ? JSON.parse(fs.readFileSync('scratch/ctn_clean_files.json', 'utf8')).length : 0,
    CE: fs.existsSync('scratch/ce_clean_files.json') ? JSON.parse(fs.readFileSync('scratch/ce_clean_files.json', 'utf8')).length : 0,
  };

  // 3. Áudio Aulas no Supabase
  const { data: aulas } = await supabase
    .from('audioaulas_acervo')
    .select('id, area, tema');

  const aulasPorArea = {};
  for (const a of (aulas || [])) {
    const area = a.area || 'Sem Área';
    aulasPorArea[area] = (aulasPorArea[area] || 0) + 1;
  }

  console.log('1. NARRACÕES NO SUPABASE (Áudio Leis):');
  console.log(narracoesPorTabela);

  console.log('\n2. ARQUIVOS MAPEADOS DO DRIVE (Prontos ou em processo):');
  console.log(localFiles);

  console.log('\n3. AUDIOAULAS NO SUPABASE:');
  console.log(aulasPorArea);
}

run().catch(console.error);
