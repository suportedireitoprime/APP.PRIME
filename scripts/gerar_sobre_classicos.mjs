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
  console.log('Iniciando script de geração de Sobre para biblioteca_classicos...');

  // Busca todos os livros
  const { data: livros, error } = await supabase
    .from('biblioteca_classicos')
    .select('id, livro, autor, sobre');
    
  if (error) {
    console.error('Erro ao buscar livros:', error);
    return;
  }

  // Filtra os livros que precisam ser gerados
  const livrosParaGerar = livros.filter(l => {
    return !l.sobre || l.sobre.length < 50;
  });

  console.log(`Encontrados ${livrosParaGerar.length} livros que precisam de geração de texto "Sobre".`);

  for (let i = 0; i < livrosParaGerar.length; i++) {
    const l = livrosParaGerar[i];
    console.log(`\n[${i + 1}/${livrosParaGerar.length}] Gerando para: ${l.livro} - ${l.autor}`);

    const prompt = `Atue como um exímio jurista, historiador e crítico literário. O usuário está no aplicativo "Vade Mecum PRIME" acessando a seção "Clássicos do Direito". Você precisa criar o conteúdo para o campo "Sobre" do livro "${l.livro}", do autor "${l.autor}".
        
Regras estritas:
1. Comece com "A obra **${l.livro}**, de **${l.autor}**," ou similar, e faça um resumo envolvente e direto ao ponto do livro em 1 a 2 parágrafos.
2. Explique a importância desse livro para a história do Direito ou da filosofia política.
3. Sem subtítulos no meio do texto, devolva apenas o texto limpo com parágrafos separados por quebras de linha normais.
4. Você pode usar formatação Markdown simples como **negrito** para destacar nomes ou partes importantes.
5. Nunca responda como uma IA ("Aqui está o texto..."), vá direto ao conteúdo.`;

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
              model: 'antigravity/gemini-3.7-flash-high',
              temperature: 0.5,
              messages: [
                { role: 'system', content: 'Você é um assistente acadêmico e literário. Responda APENAS com o texto (markdown) solicitado.' },
                { role: 'user', content: prompt }
              ]
            })
          });
        } catch (e) {
          console.error(`Erro de rede para ${l.livro}:`, e.message);
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
            
            console.error(`Rate limit atingido (429). Aguardando ${waitTime/1000}s...`);
            await new Promise(r => setTimeout(r, waitTime));
            retries++;
            continue;
          } else {
            console.error(`Erro HTTP ${res.status}. Detalhe: ${errText}`);
            break;
          }
        }

        const data = await res.json();
        let text = data.choices?.[0]?.message?.content || '';
        text = text.trim();

        if (text && !text.includes('Falha')) {
          const { error: updateError } = await supabase
            .from('biblioteca_classicos')
            .update({ sobre: text })
            .eq('id', l.id);
          
          if (updateError) {
            console.error(`Erro ao salvar no banco:`, updateError);
          } else {
            console.log(`Sucesso! Sobre salvo para "${l.livro}".`);
            success = true;
          }
        } else {
          console.log(`Resposta vazia ou inválida para ${l.livro}`);
          break;
        }
      }

    } catch (err) {
      console.error(`Exceção:`, err);
    }
    
    // Pequena pausa para não dar rate limit (se houver)
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n--- Script finalizado ---');
}

main();
