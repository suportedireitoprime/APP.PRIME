const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

const LEI_ID = 'cf9e9292-4fe0-4b23-ae89-611edbb92503';
const NOME_LEI = 'Código Penal';
const AREA = 'Direito Penal';
const DENSIDADE = 'auto'; // Inteligente

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log(`[1] Extraindo estrutura da lei: ${NOME_LEI}...`);
  const { data: estruturaData, error: estruturaError } = await supabase.functions.invoke('admin-flashcards-leis', {
    body: { acao: 'listar_estrutura', lei_id: LEI_ID },
    headers: { 'X-Admin-Bypass': 'Vitamina2026' }
  });

  if (estruturaError) {
    console.error('Erro ao buscar estrutura:', estruturaError);
    return;
  }

  const estrutura = estruturaData?.estrutura || [];
  console.log(`[2] Estrutura mapeada com sucesso! Encontrados ${estrutura.length} blocos (títulos).`);

  let totalGerado = 0;

  for (let i = 0; i < estrutura.length; i++) {
    const bloco = estrutura[i];
    if (!bloco.artigos || bloco.artigos.length === 0) continue;
    
    const temaNome = `${NOME_LEI} - ${bloco.titulo}`;
    console.log(`\n[${i + 1}/${estrutura.length}] Processando lote: "${temaNome}" com ${bloco.artigos.length} artigos...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
        body: { 
          acao: 'gerar_flashcards',
          area: AREA, 
          tema: temaNome,
          artigos: bloco.artigos,
          quantidadePorArtigo: DENSIDADE
        },
        headers: { 'X-Admin-Bypass': 'Vitamina2026' }
      });

      if (error) {
        console.error(`[X] Falha no bloco "${temaNome}":`, error.message || error);
        continue; // Continua para o próximo bloco mesmo se falhar
      }

      totalGerado += (data?.total || 0);
      console.log(`[V] Sucesso! Gerados ${data?.total || 0} cards neste lote. Total acumulado: ${totalGerado} cards.`);
      
      // Pequena pausa para evitar rate limit de requisições simultâneas
      await sleep(2000);
      
    } catch (err) {
      console.error(`[X] Erro inesperado no bloco "${temaNome}":`, err.message);
    }
  }

  console.log(`\n===========================================`);
  console.log(`Geração concluída! Foram gerados aproximadamente ${totalGerado} flashcards do ${NOME_LEI}.`);
  console.log(`===========================================`);
}

run();
