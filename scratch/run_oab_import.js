import fs from 'fs';

const EDGE_FUNCTION_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/importar-audioaulas-oab';

async function run() {
  const allAudios = JSON.parse(fs.readFileSync('scratch/all_oab_audios.json', 'utf8'));
  console.log(`Carregados ${allAudios.length} áudios do Estatuto da OAB para importação e upload no Storage...`);

  // Organizar itens com número sequencial 1 a 96
  const itens = allAudios.map((a, idx) => ({
    idDrive: a.id,
    title: a.title,
    parentTitle: a.parentTitle,
    sequencia: idx + 1,
  }));

  const BATCH_SIZE = 8; // batches de 8 para garantir download e upload no Storage sem estourar timeout
  const totalBatches = Math.ceil(itens.length / BATCH_SIZE);

  console.log(`Iniciando migração em ${totalBatches} lotes de ${BATCH_SIZE} itens cada...\n`);

  let totalInseridos = 0;
  for (let b = 0; b < totalBatches; b++) {
    const batchItens = itens.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    console.log(`[Lote ${b + 1}/${totalBatches}] Enviando ${batchItens.length} áudios (seq ${batchItens[0].sequencia} a ${batchItens[batchItens.length - 1].sequencia})...`);

    const start = Date.now();
    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itens: batchItens }),
      });

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      if (!res.ok) {
        const text = await res.text();
        console.error(`  ❌ Lote ${b + 1} falhou (HTTP ${res.status}): ${text}`);
      } else {
        const data = await res.json();
        totalInseridos += data.totalProcessado || 0;
        console.log(`  ✅ Lote ${b + 1} concluído em ${elapsed}s! Processados: ${data.totalProcessado} | Total acumulado: ${totalInseridos}/${itens.length}`);
      }
    } catch (err) {
      console.error(`  ❌ Erro de rede no lote ${b + 1}:`, err.message);
    }

    // Intervalo de 1s entre lotes
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n=================================================`);
  console.log(`🎉 MIGRAÇÃO CONCLUÍDA! TOTAL DE ÁUDIOS IMPORTADOS NO STORAGE: ${totalInseridos}/${itens.length}`);
  console.log(`=================================================`);
}

run().catch(console.error);
