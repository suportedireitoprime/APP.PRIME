import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega as variáves do .env na raiz
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltam variáveis VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Iniciando script de geração de Sobre para as leis...');

  // Busca todas as leis que NÃO têm sobre_html
  const { data: leis, error } = await supabase
    .from('vade_mecum_leis')
    .select('id, nome, sobre_html');
    //.is('sobre_html', null);
    
  if (error) {
    console.error('Erro ao buscar leis:', error);
    return;
  }

  // Filtra as leis que precisam ser geradas (se for nulo ou se for aquele texto padrão antigo)
  const leisParaGerar = leis.filter(lei => {
    return !lei.sobre_html || lei.sobre_html.length < 100 || lei.sobre_html.includes('Informações detalhadas não disponíveis');
  });

  console.log(`Encontradas ${leisParaGerar.length} leis que precisam de geração de texto "Sobre".`);

  for (let i = 0; i < leisParaGerar.length; i++) {
    const lei = leisParaGerar[i];
    console.log(`\n[${i + 1}/${leisParaGerar.length}] Gerando para: ${lei.nome}`);

    const prompt = `Atue como um exímio jurista e professor de Direito. Resuma o que é a norma "${lei.nome}" de forma estruturada e extremamente detalhada.
        
Inclua os seguintes pontos:
1. Contexto histórico completo da sua criação, ano de sanção, presidente/governo da época, e o principal motivo de sua promulgação.
2. Os objetivos primordiais da norma e o seu impacto no Direito Brasileiro.
3. Como a norma é dividida e estruturada de forma orgânica (escreva detalhadamente os principais Livros ou Títulos, explicando brevemente o que cada um aborda).

Regras de formatação obrigatórias:
- Retorne APENAS o HTML final, sem blocos de código markdown (como \`\`\`html).
- Use APENAS as tags <p>, <strong> e <ul class="list-disc pl-5 space-y-1.5 text-zinc-400 mt-2 mb-4"> com <li> contendo <strong class="text-zinc-200">Título/Livro:</strong> explicação.
- Seja didático, aprofundado, e gere pelo menos 3 parágrafos de introdução antes da lista estrutural.`;

    try {
      // Pega a key do OmniRoute via edge function
      const { data: keyData, error: keyError } = await supabase.functions.invoke('get-omniroute-key', {
        headers: {
          'x-bypass-auth': 'my-secret-bypass'
        }
      });
      if (keyError || !keyData?.key) {
        console.error('Falha ao obter omniroute key:', keyError);
        continue;
      }
      
      const apiKey = keyData.key;

      let retries = 0;
      let success = false;

      while (!success && retries < 3) {
        let res;
        try {
          res = await fetch('https://omniroute-production-fb57.up.railway.app/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'antigravity/gemini-3.7-flash-high', // Model verified in Sandbox
              temperature: 0.3,
              messages: [
                { role: 'system', content: 'Você é um assistente jurídico sênior. Responda APENAS com o HTML puro solicitado.' },
                { role: 'user', content: prompt }
              ]
            })
          });
        } catch (e) {
          console.error(`Erro de rede para ${lei.nome}:`, e.message);
          await new Promise(r => setTimeout(r, 10000));
          retries++;
          continue;
        }

        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 429) {
            let waitTime = 15000;
            try {
              const errJson = JSON.parse(errText);
              if (errJson.error && errJson.error.reset_seconds) {
                waitTime = (errJson.error.reset_seconds + 5) * 1000;
              }
            } catch (e) {}
            
            console.error(`Rate limit atingido (429) para ${lei.nome}. Aguardando ${waitTime/1000}s...`);
            await new Promise(r => setTimeout(r, waitTime));
            retries++;
            continue;
          } else {
            console.error(`Erro na requisição para ${lei.nome}: HTTP ${res.status}. Detalhe: ${errText}`);
            break;
          }
        }

        const data = await res.json();
        let html = data.choices?.[0]?.message?.content || '';
        html = html.replace(/```html/g, '').replace(/```/g, '').trim();

        if (html && !html.includes('Falha')) {
          const { error: updateError } = await supabase
            .from('vade_mecum_leis')
            .update({ sobre_html: html })
            .eq('id', lei.id);
          
          if (updateError) {
            console.error(`Erro ao salvar no banco para ${lei.nome}:`, updateError);
          } else {
            console.log(`Sucesso: ${lei.nome} salva no Supabase.`);
            success = true;
          }
        } else {
          console.log(`Resposta vazia ou com falha para ${lei.nome}`);
          break;
        }
      }

    } catch (err) {
      console.error(`Exceção ao gerar para ${lei.nome}:`, err);
    }
    
    // Pequena pausa para não dar rate limit (se houver)
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n--- Script finalizado ---');
}

main();
