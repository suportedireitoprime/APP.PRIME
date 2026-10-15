const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('=== LEVANTAMENTO COMPLETO DE ARTIGOS NO BANCO DE DADOS ===\n');

  // 1. Total em vade_mecum_artigos
  const { count: totalArtigosVM } = await sb
    .from('vade_mecum_artigos')
    .select('*', { count: 'exact', head: true });

  console.log(`1. Total de Artigos em 'vade_mecum_artigos': ${totalArtigosVM}`);

  // 2. Leis em vade_mecum_leis
  const { data: leis } = await sb
    .from('vade_mecum_leis')
    .select('id, slug, nome, total_artigos')
    .order('total_artigos', { ascending: false });

  console.log(`2. Total de Legislações Registradas: ${leis?.length || 0}`);

  const leisComArtigos = (leis || []).filter(l => (l.total_artigos || 0) > 0);
  console.log(`3. Legislações com Artigos Contabilizados: ${leisComArtigos.length}`);

  let somaArtigosLeis = 0;
  console.log('\n--- TOP 25 LEIS COM MAIS ARTIGOS ---');
  leisComArtigos.slice(0, 25).forEach((l, i) => {
    console.log(`${(i + 1).toString().padStart(2, ' ')}. ${l.nome} (${l.slug}): ${l.total_artigos} artigos`);
    somaArtigosLeis += l.total_artigos;
  });

  // 4. Status em resumos_juridicos
  const { count: totalResumos } = await sb
    .from('resumos_juridicos')
    .select('*', { count: 'exact', head: true });

  const { count: resumosComMarkdown } = await sb
    .from('resumos_juridicos')
    .select('*', { count: 'exact', head: true })
    .not('markdown', 'is', null);

  const { count: resumosComExemplos } = await sb
    .from('resumos_juridicos')
    .select('*', { count: 'exact', head: true })
    .not('exemplos', 'is', null);

  const { count: resumosComTermos } = await sb
    .from('resumos_juridicos')
    .select('*', { count: 'exact', head: true })
    .not('termos', 'is', null);

  console.log('\n--- SITUAÇÃO DA TABELA resumos_juridicos ---');
  console.log(`Total de registros em resumos_juridicos: ${totalResumos}`);
  console.log(`Registros com Explicação (markdown): ${resumosComMarkdown}`);
  console.log(`Registros com Exemplos: ${resumosComExemplos}`);
  console.log(`Registros com Termos: ${resumosComTermos}`);

  // 5. Status em artigo_ai_cache
  const { count: totalCacheAI } = await sb
    .from('artigo_ai_cache')
    .select('*', { count: 'exact', head: true });

  console.log('\n--- SITUAÇÃO DA TABELA artigo_ai_cache ---');
  console.log(`Total em artigo_ai_cache: ${totalCacheAI}`);

  // 6. Verificar tabelas legado (ex: CLT, CP, etc)
  const tabelasPrincipais = [
    'CLT_CONSOLIDACAO_LEIS_TRABALHO',
    'CP_CODIGO_PENAL',
    'CC_CODIGO_CIVIL',
    'CPC_CODIGO_PROCESSO_CIVIL',
    'CPP_CODIGO_PROCESSO_PENAL',
    'CF88_CONSTITUICAO_FEDERAL',
    'CDC_CODIGO_DEFESA_CONSUMIDOR',
    'CTN_CODIGO_TRIBUTARIO_NACIONAL',
    'CE_CODIGO_ELEITORAL',
  ];

  console.log('\n--- CONTAGEM DE ARTIGOS NAS TABELAS INDIVIDUAIS ---');
  let somaTabelasIndividuais = 0;
  for (const tab of tabelasPrincipais) {
    try {
      const { count } = await sb.from(tab).select('*', { count: 'exact', head: true });
      console.log(`- ${tab}: ${count || 0} artigos`);
      somaTabelasIndividuais += (count || 0);
    } catch (e) {
      console.log(`- ${tab}: erro ao consultar (${e.message})`);
    }
  }
  console.log(`Total nessas 9 leis principais: ${somaTabelasIndividuais} artigos`);
}

main().catch(console.error);
