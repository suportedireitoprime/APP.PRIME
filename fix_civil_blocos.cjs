const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  let hasMore = true;
  let page = 0;
  const pageSize = 1000;
  let totalUpdated = 0;

  while (hasMore) {
    const { data: blocos, error } = await supabase
      .from('aprender_blocos')
      .select('id, tipo, payload')
      .in('tipo', ['pergunta', 'flashcard'])
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(error);
      return;
    }

    if (blocos.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Page ${page}: Found ${blocos.length} blocos.`);

    let updatedCount = 0;
    for (const bloco of blocos) {
      let needsUpdate = false;
      let newPayload = { ...bloco.payload };

      if (bloco.tipo === 'flashcard') {
        if (newPayload.conteudo || newPayload.frente) {
           let text = newPayload.conteudo || newPayload.frente;
           if (text.includes('**')) {
               text = text.replace(/\*\*/g, '');
               needsUpdate = true;
           }
           
           if (newPayload.conteudo && !newPayload.frente) {
               newPayload.frente = text;
               newPayload.verso = "";
               delete newPayload.conteudo;
               needsUpdate = true;
           } else if (needsUpdate) {
               newPayload.frente = text;
           }
        }
      } else if (bloco.tipo === 'pergunta') {
        if (!newPayload.enunciado && newPayload.conteudo) {
           newPayload.enunciado = newPayload.conteudo;
           delete newPayload.conteudo;
           if (!newPayload.opcoes || newPayload.opcoes.length === 0) {
               newPayload.opcoes = ["Opção 1", "Opção 2", "Opção 3", "Opção 4"];
               newPayload.gabarito = 0;
           }
           needsUpdate = true;
        }
      }

      if (needsUpdate) {
         await supabase.from('aprender_blocos').update({ payload: newPayload }).eq('id', bloco.id);
         updatedCount++;
      }
    }

    console.log(`Page ${page}: Updated ${updatedCount} blocos.`);
    totalUpdated += updatedCount;
    page++;
  }

  console.log(`Finished! Total updated: ${totalUpdated}`);
}
run();
