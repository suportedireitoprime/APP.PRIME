const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

const LEIS = [
  { tabela: 'ECA_ESTATUTO_CRIANCA_ADOLESCENTE', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8069compilado.htm', nome: 'ECA' },
  { tabela: 'EI_ESTATUTO_IDOSO', url: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10741compilado.htm', nome: 'Estatuto do Idoso' },
];

async function scrapeLei(lei) {
  console.log(`\n=== Scraping ${lei.nome} (${lei.tabela}) ===`);
  
  const res = await fetch(`${SUPABASE_URL}/functions/v1/vademecum-scraper`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ targetUrl: lei.url, maxAgeYears: 20 })
  });
  
  const data = await res.json();
  const articles = data?.articles || [];
  console.log(`  Found: ${articles.length} alterações`);
  
  if (articles.length === 0) {
    console.log('  Nenhuma alteração encontrada.');
    return;
  }
  
  const detectado_em = new Date().toISOString();
  const dbRows = articles.map(art => ({
    tabela_nome: lei.tabela,
    artigo_numero: art.artigo,
    tipo_alteracao: art.motivo.includes('Revogad') ? 'Revogado' : 
                    (art.motivo.includes('Incluíd') || art.motivo.includes('Incluíd') || art.motivo.includes('Acrescid')) ? 'Incluído' :
                    'Alterado',
    texto_anterior: art.texto_antigo || null,
    texto_atual: art.texto_novo || null,
    motivo: art.motivo,
    ano: art.ano,
    detectado_em: detectado_em,
    link_lei: art.link_lei || null
  }));
  
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { error } = await supabase
    .from('legislacao_alteracoes')
    .upsert(dbRows, { onConflict: 'tabela_nome, artigo_numero, ano, motivo' });
  
  if (error) {
    console.error(`  ERRO ao salvar:`, error.message);
  } else {
    console.log(`  Salvo com sucesso! ${dbRows.length} registros.`);
  }
}

(async () => {
  for (const lei of LEIS) {
    await scrapeLei(lei);
  }
  console.log('\nConcluído!');
})();
