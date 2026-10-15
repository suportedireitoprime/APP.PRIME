const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('--- 1. AUDIOMATERIAIS / NARRACAO (Audioleis) ---');
  // Buscar todas as tabelas em narracoes_artigos
  const { data: narracoes, error: errN } = await supabase
    .from('narracoes_artigos')
    .select('tabela_nome, artigo_numero');

  if (errN) {
    console.error('Erro narracoes:', errN);
  } else {
    const contagem = {};
    for (const r of narracoes || []) {
      const t = r.tabela_nome || 'SEM_TABELA';
      contagem[t] = (contagem[t] || 0) + 1;
    }
    console.log('Tabelas com narracoes em narracoes_artigos:');
    console.table(contagem);
  }

  console.log('\n--- 2. AUDIOAULAS (audioaulas_acervo) ---');
  const { data: aulas, error: errA } = await supabase
    .from('audioaulas_acervo')
    .select('id, area, tema, titulo');

  if (errA) {
    console.error('Erro audioaulas:', errA);
  } else {
    const porArea = {};
    for (const a of aulas || []) {
      const area = a.area || 'Sem Area';
      porArea[area] = (porArea[area] || 0) + 1;
    }
    console.log('Audioaulas por area:');
    console.table(porArea);
  }
}

main().catch(console.error);
