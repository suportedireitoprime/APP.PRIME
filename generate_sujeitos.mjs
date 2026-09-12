import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envData = fs.readFileSync('.env', 'utf8');
const env = envData.split(/\r?\n/).reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) {
    acc[k.trim()] = v.join('=').trim().replace(/`/g, '').replace(/"/g, '');
  }
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

const AulaSchema = {
  type: 'OBJECT',
  properties: {
    titulo: { type: 'STRING', description: 'O título engajador. Ex: Início da Personalidade e Nascituro' },
    objetivo: { type: 'STRING' },
    duracao_est_min: { type: 'INTEGER' },
    blocos: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          tipo: { type: 'STRING', description: 'leitura, flashcard, lacunas, checkpoint, recap' },
          payload: {
            type: 'OBJECT',
            properties: {
              texto: { type: 'STRING' },
              frente: { type: 'STRING' },
              verso: { type: 'STRING' },
              rawContent: { type: 'STRING', description: 'Markdown contendo [ LACUNA 1 ] e as Opções' },
              pergunta: { type: 'STRING' },
              opcoes: { type: 'ARRAY', items: { type: 'STRING' } },
              resposta_correta: { type: 'INTEGER', description: 'Índice 0-based' },
              justificativa: { type: 'STRING' }
            }
          }
        },
        required: ['tipo', 'payload']
      }
    }
  },
  required: ['titulo', 'objetivo', 'duracao_est_min', 'blocos']
};

async function run() {
  const aulaId = '6d8a97a6-bb52-4e19-adee-901910f0d1f7'; // AULA SUJEITOS
  
  const resumoPessoas = `
Código Civil - Das Pessoas Naturais (Art. 1 ao 5)
Art. 1º Toda pessoa é capaz de direitos e deveres na ordem civil.
Art. 2º A personalidade civil da pessoa natural começa do nascimento com vida; mas a lei põe a salvo, desde a concepção, os direitos do nascituro.
Art. 3º São absolutamente incapazes de exercer pessoalmente os atos da vida civil os menores de 16 (dezesseis) anos.
Art. 4º São incapazes, relativamente a certos atos ou à maneira de os exercer:
I - os maiores de dezesseis e menores de dezoito anos;
II - os ébrios habituais e os viciados em tóxico;
III - aqueles que, por causa transitória ou permanente, não puderem exprimir sua vontade;
IV - os pródigos.
Art. 5º A menoridade cessa aos dezoito anos completos, quando a pessoa fica habilitada à prática de todos os atos da vida civil.
Parágrafo único. Cessará, para os menores, a incapacidade: (Emancipação)
I - pela concessão dos pais, se o menor tiver 16 anos completos;
II - pelo casamento;
III - pelo exercício de emprego público efetivo;
IV - pela colação de grau em curso de ensino superior;
V - pelo estabelecimento civil ou comercial, ou relação de emprego, desde que tenha economia própria.
  `;

  const prompt = `
Você é um professor de Direito focado em concursos públicos (Magistratura e OAB).
Gere uma Aula de Microlearning Interativo focada no tema: "Sujeitos de Direito (Personalidade e Capacidade)".
Baseie-se 100% no seguinte texto legal:
"${resumoPessoas}"

A sequência de blocos OBRIGATÓRIA é:
1. 'leitura': Explique de forma simples o Art 1 e 2 (Início da personalidade e direitos do nascituro). Use uma analogia ou caso prático (Ex: bebê na barriga ganhando herança). Use formatação Markdown (negrito, etc) para o texto, evite HTML cru.
2. 'flashcard': Um flashcard perguntando quando começa a personalidade civil e a situação do nascituro.
3. 'leitura': Explique a diferença entre Incapacidade Absoluta (Art. 3) e Relativa (Art. 4). Use listas.
4. 'lacunas': Um texto curto testando a literalidade com até 2 lacunas. O 'rawContent' deve ser: "São absolutamente incapazes os menores de [ LACUNA 1 ]. Já os pródigos são [ LACUNA 2 ].\n\nOpções L1: 16 anos, 18 anos. Opções L2: absolutamente incapazes, relativamente incapazes."
5. 'leitura': Explique a Emancipação (Art. 5).
6. 'checkpoint': Uma questão de múltipla escolha focada em emancipação (4 opções). O array 'opcoes' deve ter 4 strings.
7. 'recap': Resumo final em bullet points no campo 'texto'.
  `;

  console.log("Chamando Gemini via REST API...");
  
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: AulaSchema
      }
    };

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      console.error(await res.text());
      return;
    }

    const json = await res.json();
    const textOutput = json.candidates[0].content.parts[0].text;
    const aulaGerada = JSON.parse(textOutput);
    
    console.log(`✅ Aula Gerada: ${aulaGerada.titulo}`);
    console.log(`Blocos gerados: ${aulaGerada.blocos.length}`);
    
    // Deletar blocos antigos
    await supabase.from('aprender_blocos').delete().eq('aula_id', aulaId);
    console.log("Blocos antigos deletados.");

    // Inserir os novos
    const blocosParaInserir = aulaGerada.blocos.map((bloco, idx) => ({
      aula_id: aulaId,
      tipo: bloco.tipo,
      ordem: idx + 1,
      payload: bloco.payload
    }));

    const { error: errBlocos } = await supabase.from('aprender_blocos').insert(blocosParaInserir);
    if (errBlocos) throw errBlocos;
    
    // Atualiza aula
    await supabase.from('aprender_aulas').update({
      titulo: aulaGerada.titulo,
      objetivo: aulaGerada.objetivo,
      duracao_est_min: aulaGerada.duracao_est_min
    }).eq('id', aulaId);

    console.log(`🚀 Sucesso! Aula e blocos inseridos no BD.`);
  } catch(e) {
    console.error("Erro:", e);
  }
}

run();
