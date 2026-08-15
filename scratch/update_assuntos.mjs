import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Baixando todas as questoes...");
  // As Supabase limits to 1000 rows by default, we need to paginate to get all records.
  let allData = [];
  let step = 1000;
  for (let i = 0; ; i++) {
    const { data, error } = await supabase.from('questoes').select('id, assunto').range(i * step, (i + 1) * step - 1);
    if (error) {
      console.error("Erro no select:", error);
      return;
    }
    if (!data || data.length === 0) break;
    allData.push(...data);
  }
  
  console.log(`Total de registros baixados: ${allData.length}`);

  // Passo 1 e 2: Extrair bases e calcular frequências para escolher o nome canônico
  const baseFrequency = {}; // chave: lowercase, valor: { formas: { FormaA: count, FormaB: count } }
  
  const toUpdate = [];

  for (const row of allData) {
    if (!row.assunto) continue;
    
    const base = row.assunto.split('>')[0].trim();
    const lowBase = base.toLowerCase();
    
    if (!baseFrequency[lowBase]) {
      baseFrequency[lowBase] = { total: 0, forms: {} };
    }
    
    baseFrequency[lowBase].total += 1;
    baseFrequency[lowBase].forms[base] = (baseFrequency[lowBase].forms[base] || 0) + 1;
  }
  
  // Escolher canônico
  const canonicals = {};
  for (const [low, info] of Object.entries(baseFrequency)) {
    // Acha a forma com mais contagens
    let bestForm = null;
    let max = -1;
    for (const [form, count] of Object.entries(info.forms)) {
      if (count > max) {
        max = count;
        bestForm = form;
      }
    }
    canonicals[low] = bestForm;
  }
  
  console.log("Exemplo de nomes canonicos:");
  console.log(Object.entries(canonicals).slice(0, 10));

  // Passo 3: Criar lista de atualizações
  for (const row of allData) {
    if (!row.assunto) continue;
    
    const base = row.assunto.split('>')[0].trim();
    const lowBase = base.toLowerCase();
    const canon = canonicals[lowBase];
    
    if (row.assunto !== canon) {
      toUpdate.push({ id: row.id, assunto: canon, old: row.assunto });
    }
  }
  
  console.log(`Total de registros para atualizar: ${toUpdate.length}`);
  
  if (toUpdate.length > 0) {
    console.log("Exemplo das 5 primeiras atualizações:", toUpdate.slice(0, 5));
    
    // Atualizar em lotes
    const batchSize = 100;
    let successCount = 0;
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const batch = toUpdate.slice(i, i + batchSize);
      
      // Supabase não tem bulk update nativo por id array para records diferentes, 
      // Upsert pode ser usado se incluirmos as outras colunas? Não, upsert requer linha inteira se não houver trigger.
      // É mais seguro enviar updates individuais mas com Promise.all limitando a concorrência.
      
      const promises = batch.map(u => supabase.from('questoes').update({ assunto: u.assunto }).eq('id', u.id));
      const results = await Promise.all(promises);
      
      let batchErrors = 0;
      results.forEach(r => {
        if (r.error) batchErrors++;
        else successCount++;
      });
      
      if (batchErrors > 0) {
        console.error(`Erros no lote ${i / batchSize}: ${batchErrors} falhas.`);
      }
      
      process.stdout.write(`\rProgresso: ${successCount} / ${toUpdate.length} atualizados...`);
    }
    console.log("\nAtualização concluída com sucesso!");
  } else {
    console.log("Nenhum registro precisava ser atualizado.");
  }
}

run();
