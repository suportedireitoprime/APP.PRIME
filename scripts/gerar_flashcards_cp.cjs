const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  console.log("========================================");
  console.log("INICIANDO GERAÇÃO EM LOTE - CÓDIGO PENAL");
  console.log("========================================");

  // 1. Obter a lei ID
  const { data: leis, error: errLei } = await supabase
    .from('vade_mecum_leis')
    .select('*')
    .ilike('nome', 'Código Penal%');
    
  if (errLei || !leis || leis.length === 0) {
    console.error("Erro ao buscar a lei:", errLei);
    return;
  }
  const lei = leis[0];
  console.log(`Lei encontrada: ${lei.nome} (ID: ${lei.id})`);

  // 2. Extrair estrutura
  console.log("Buscando estrutura de artigos...");
  const edgeRes = await fetch(`${SUPABASE_URL}/functions/v1/admin-flashcards-leis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'X-Admin-Bypass': 'Vitamina2026'
    },
    body: JSON.stringify({
      acao: 'listar_estrutura',
      lei_id: lei.id
    })
  });

  const edgeData = await edgeRes.json();
  if (!edgeRes.ok) {
    console.error("Erro ao listar estrutura:", edgeData);
    return;
  }

  const estrutura = edgeData.estrutura || [];
  console.log(`Estrutura carregada! Total de blocos (Títulos/Capítulos): ${estrutura.length}`);

  let totalGerado = 0;
  let blocosProcessados = 0;

  // 3. Iterar blocos
  for (const bloco of estrutura) {
    if (!bloco.artigos || bloco.artigos.length === 0) continue;
    
    console.log(`\n-> Processando bloco: [${bloco.titulo}] (${bloco.artigos.length} artigos)`);
    const temaNome = `${lei.nome_curto || lei.nome} - ${bloco.titulo}`;
    
    try {
      const genRes = await fetch(`${SUPABASE_URL}/functions/v1/admin-flashcards-leis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'X-Admin-Bypass': 'Vitamina2026'
        },
        body: JSON.stringify({
          acao: 'gerar_flashcards',
          area: 'Direito Penal',
          tema: temaNome,
          artigos: bloco.artigos,
          quantidadePorArtigo: 10
        })
      });

      const genData = await genRes.json();
      if (!genRes.ok) {
        console.error(`   [ERRO] Falha no bloco ${bloco.titulo}:`, genData);
        continue; // Continua para o próximo bloco mesmo se um falhar
      }

      console.log(`   [SUCESSO] Gerou ${genData.total} cards!`);
      totalGerado += (genData.total || 0);
      blocosProcessados++;
    } catch (e) {
      console.error(`   [ERRO CATCH] Falha no bloco ${bloco.titulo}:`, e.message);
    }
    
    // Pequena pausa entre requisições para evitar rate limit do Gemini
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("========================================");
  console.log(`GERAÇÃO FINALIZADA!`);
  console.log(`Blocos processados: ${blocosProcessados}/${estrutura.length}`);
  console.log(`Total de cards gerados: ${totalGerado}`);
  console.log("========================================");
}

run();
