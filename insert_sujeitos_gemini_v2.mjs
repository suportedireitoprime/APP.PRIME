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

const aulaGeradaGemini = {
  titulo: "Sujeitos de Direito (Personalidade e Capacidade)",
  objetivo: "Aprofundamento Completo: Do Nascituro à Emancipação",
  duracao_est_min: 25,
  blocos: [
    // 1. Introdução
    {
      tipo: "destaque",
      payload: {
        titulo: "Bem-vindo à Aula de Sujeitos de Direito!",
        texto: "Nesta aula de **25 páginas** (gerada via IA Gemini), nós vamos esgotar o tema das Pessoas Naturais no Código Civil Brasileiro (Arts. 1º ao 5º).\n\nVocê vai dominar:\n1. O início da Personalidade Civil e os Direitos do Nascituro\n2. As regras de Incapacidade Absoluta e Relativa\n3. Todas as hipóteses de Emancipação.\n\nPrepare-se para flashcards, casos práticos e questões comentadas!"
      }
    },
    // 2. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### 1. Toda Pessoa é Capaz?\n\nO Código Civil abre com uma premissa básica no seu **Artigo 1º**: *'Toda pessoa é capaz de direitos e deveres na ordem civil.'*\n\nIsso significa que o simples fato de você ser um ser humano já lhe garante uma 'aptidão genérica' para ter direitos (como o direito à vida, ao nome, a herdar patrimônio). Ninguém no Brasil pode ser destituído dessa capacidade de direito (capacidade de gozo). Mas calma, isso não significa que todo mundo pode exercer esses direitos sozinho!"
      }
    },
    // 3. Flashcard
    {
      tipo: "flashcard",
      payload: {
        frente: "Qualquer ser humano vivo perde a sua Capacidade de Direito (ou de Gozo)?",
        verso: "NÃO! A **Capacidade de Direito** é inerente a toda pessoa humana viva, sendo impossível perdê-la. O que pode ser limitada é a *Capacidade de Fato* (exercício)."
      }
    },
    // 4. Pergunta Certo/Errado
    {
      tipo: "pergunta",
      resposta_correta: "errado",
      payload: {
        titulo: "Teste sua atenção",
        enunciado: "Julgue o item: No ordenamento civil brasileiro contemporâneo, é possível que uma pessoa natural seja desprovida de capacidade de direito caso cometa crime hediondo.",
        opcoes: ["Certo", "Errado"],
        justificativa: "Errado. O Art. 1º do CC é claro: 'Toda pessoa é capaz de direitos e deveres'. A capacidade de direito NUNCA se perde, mesmo em condenação penal."
      }
    },
    // 5. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### 2. O Início da Personalidade e o Nascituro\n\nDe acordo com o **Art. 2º**, a personalidade civil da pessoa natural começa do **nascimento com vida**.\n\nA lei brasileira adota a **Teoria Natalista**. Se o bebê respirou (houve troca gasosa), ele adquiriu personalidade civil, ainda que morra minutos depois.\n\nE o nascituro (bebê no ventre)? A lei põe a salvo seus direitos desde a concepção. Ele tem 'expectativa de direitos' (como receber herança ou doação), que se consolida se ele nascer com vida."
      }
    },
    // 6. Flashcard
    {
      tipo: "flashcard",
      payload: {
        frente: "O que diz a Teoria Natalista adotada pelo CC/02?",
        verso: "Afirma que a personalidade civil começa apenas com o **nascimento com vida**, mas a lei já protege os direitos do nascituro desde a concepção."
      }
    },
    // 7. Lacuna
    {
      tipo: "pergunta",
      resposta_correta: "b",
      payload: {
        titulo: "Completando a Lei",
        enunciado: "Complete a lacuna do Artigo 2º: A personalidade civil da pessoa natural começa do [_____] com vida.",
        opcoes: [
          "(a) registro civil",
          "(b) nascimento",
          "(c) batismo",
          "(d) desmame"
        ],
        justificativa: "A palavra correta é NASCIMENTO. Art. 2º: 'A personalidade civil da pessoa natural começa do nascimento com vida...'"
      }
    },
    // 8. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### 3. Incapacidade Absoluta (Art. 3º)\n\nAgora vamos falar de quem NÃO PODE exercer os direitos sozinho.\n\nSão **Absolutamente Incapazes** apenas os **menores de 16 anos**.\n\nEles devem ser sempre **REPRESENTADOS** pelos pais ou tutores. Se um menino de 15 anos assina um contrato de compra de uma casa sozinho, esse contrato é **NULO** de pleno direito (não tem salvação)."
      }
    },
    // 9. Destaque
    {
      tipo: "destaque",
      payload: {
        titulo: "Atenção (Mudança do EPD)",
        texto: "Até 2015, pessoas com deficiência grave ou enfermidade mental eram consideradas absolutamente incapazes. Com o Estatuto da Pessoa com Deficiência (EPD), isso mudou! **Hoje, o ÚNICO absolutamente incapaz no Brasil é o menor de 16 anos.**"
      }
    },
    // 10. Pergunta ABCD
    {
      tipo: "pergunta",
      resposta_correta: "a",
      payload: {
        titulo: "Cai na OAB",
        enunciado: "João, de 25 anos, possui grave deficiência mental que o impede de exprimir sua vontade. Segundo o Código Civil atual (pós-EPD), qual é o grau de capacidade civil de João?",
        opcoes: [
          "(A) Relativamente incapaz.",
          "(B) Absolutamente incapaz.",
          "(C) Plenamente capaz.",
          "(D) Incapaz apenas para atos patrimoniais, sendo capaz para existenciais."
        ],
        justificativa: "Correta A. Após o EPD (2015), o Art. 3º do CC restringe a incapacidade absoluta APENAS aos menores de 16 anos. Pessoas que não podem exprimir vontade são classificadas como **relativamente incapazes** (Art. 4º, III)."
      }
    },
    // 11. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### 4. Incapacidade Relativa (Art. 4º)\n\nOs relativamente incapazes podem agir, mas precisam ser **ASSISTIDOS** (eles assinam o contrato junto com os pais/curadores).\n\nQuem são eles?\n- Maiores de 16 e menores de 18 anos.\n- Ébrios habituais (alcoólatras) e viciados em tóxicos.\n- Aqueles que, por causa transitória ou permanente, não puderem exprimir vontade.\n- Os pródigos (gastadores compulsivos)."
      }
    },
    // 12. Flashcard
    {
      tipo: "flashcard",
      payload: {
        frente: "O pródigo é classificado como absolutamente ou relativamente incapaz?",
        verso: "RELATIVAMENTE incapaz (Art. 4º, IV). Ele sofre restrições apenas para atos de disposição patrimonial (como vender imóveis ou fazer empréstimos)."
      }
    },
    // 13. Lacunas
    {
      tipo: "pergunta",
      resposta_correta: "c",
      payload: {
        titulo: "Lacuna Legal",
        enunciado: "O incapaz [_____] deve ser representado, sob pena de o ato ser [_____]. Já o incapaz [_____] deve ser assistido, sob pena de o ato ser [_____].",
        opcoes: [
          "(A) relativo / nulo / absoluto / anulável",
          "(B) absoluto / anulável / relativo / nulo",
          "(C) absoluto / nulo / relativo / anulável",
          "(D) relativo / anulável / absoluto / anulável"
        ],
        justificativa: "A regra de ouro é: Falta de Representação do Absoluto gera NULIDADE (Nulo). Falta de Assistência do Relativo gera ANULABILIDADE (Anulável)."
      }
    },
    // 14. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### 5. O Fim da Incapacidade: A Maioridade\n\nO **Artigo 5º** estabelece que a menoridade cessa aos **18 anos completos**, quando a pessoa fica habilitada à prática de TODOS os atos da vida civil (Capacidade Plena).\n\nMas, a lei previu exceções onde a pessoa adquire a capacidade plena ANTES dos 18 anos. Esse 'atalho' é chamado de **Emancipação**."
      }
    },
    // 15. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### 6. Emancipação Voluntária\n\nÉ a concedida pelos pais, ou por um deles na falta do outro.\n\n**Requisitos:**\n- O menor precisa ter **16 anos completos**.\n- É feita mediante instrumento público (cartório), **independentemente de homologação judicial**.\n\nAtenção: Emancipação voluntária é definitiva e irrevogável! Se os pais emanciparem, não tem volta (mesmo que se arrependam)."
      }
    },
    // 16. Flashcard
    {
      tipo: "flashcard",
      payload: {
        frente: "A emancipação voluntária pelos pais exige que o juiz autorize (homologação judicial)?",
        verso: "NÃO! Se for pelos pais em conjunto (ou um na falta do outro), é feita direto no cartório por escritura pública. Só precisará do juiz (Emancipação Judicial) se o menor estiver sob TUTELA."
      }
    },
    // 17. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### 7. Emancipação Legal\n\nEsta ocorre automaticamente, por força da lei, caso o menor (que já tenha capacidade de fato para o ato) cumpra certas condições:\n\n1. Casamento (a idade núbil no Brasil é 16 anos);\n2. Exercício de emprego público efetivo;\n3. Colação de grau em ensino superior (raro na prática, mas cai em prova);\n4. Economia própria (por emprego ou estabelecimento, desde que tenha 16 anos)."
      }
    },
    // 18. Pergunta ABCD
    {
      tipo: "pergunta",
      resposta_correta: "b",
      payload: {
        titulo: "Caso Prático",
        enunciado: "Roberto, aos 16 anos, casa-se legitimamente. Aos 17 anos, ele e sua esposa decidem se divorciar. O que acontece com a capacidade civil de Roberto?",
        opcoes: [
          "(A) Ele volta a ser relativamente incapaz até completar 18 anos.",
          "(B) Ele permanece plenamente capaz, pois a emancipação legal pelo casamento é definitiva.",
          "(C) Ele precisará de emancipação voluntária dos pais agora.",
          "(D) Ele perde a capacidade apenas para atos empresariais."
        ],
        justificativa: "A emancipação legal pelo casamento é irrevogável. Se ele casar e depois enviuvar ou se divorciar antes dos 18 anos, ele NÃO retorna à condição de incapaz."
      }
    },
    // 19. Pergunta Certo/Errado
    {
      tipo: "pergunta",
      resposta_correta: "errado",
      payload: {
        titulo: "Atenção aos Detalhes",
        enunciado: "Julgue o item: A emancipação legal decorrente da colação de grau em ensino superior exige que o menor tenha no mínimo 16 anos de idade completos.",
        opcoes: ["Certo", "Errado"],
        justificativa: "Errado! A exigência de '16 anos completos' existe apenas para a emancipação VOLUNTÁRIA dos pais e para o caso de economia própria. Para casamento, exercício de cargo efetivo ou colação de grau em nível superior, a lei NÃO estipula idade mínima explícita para o ato emancipatório (embora seja improvável alguém colar grau com menos de 16, a lei em si não põe essa barreira ali)."
      }
    },
    // 20. Recap
    {
      tipo: "destaque",
      payload: {
        titulo: "Revisão Expressa ⚡ (Resumo da Aula)",
        texto: "Você concluiu os fundamentos de Pessoas! Lembre-se:\n\n- **Início da Personalidade:** Nascimento com vida (Art. 2º).\n- **Incapazes Absolutos:** SOMENTE menores de 16 anos (nulo, sem representação).\n- **Incapazes Relativos:** 16-18, ébrios, viciados, sem vontade (anulável, sem assistência).\n- **Emancipação:** 16+ (voluntária/economia própria) ou sem limite (casamento, cargo efetivo, colação).\n\nExcelente progresso! Avance para a próxima aula."
      }
    }
  ]
};

async function run() {
  const aulaId = '6d8a97a6-bb52-4e19-adee-901910f0d1f7'; // AULA SUJEITOS
  
  console.log("Substituindo blocos da aula Sujeitos com 20 blocos gerados pela IA...");
  
  try {
    // 1. Deletar blocos antigos
    await supabase.from('aprender_blocos').delete().eq('aula_id', aulaId);

    // 2. Inserir os novos blocos
    const blocosParaInserir = aulaGeradaGemini.blocos.map((bloco, idx) => ({
      aula_id: aulaId,
      tipo: bloco.tipo,
      ordem: idx + 1,
      resposta_correta: bloco.resposta_correta || null, // Colocado no nivel do banco, se for o caso. Mas no schema do banco pode ser payload.
      payload: bloco.payload
    }));

    // Correção: No supabase `aprender_blocos` tem coluna `resposta_correta`?
    // Vou usar a estrutura segura:
    const insertData = aulaGeradaGemini.blocos.map((bloco, idx) => {
       const b = {
          aula_id: aulaId,
          tipo: bloco.tipo,
          ordem: idx + 1,
          payload: bloco.payload
       };
       if (bloco.resposta_correta) {
          b.resposta_correta = bloco.resposta_correta;
       }
       return b;
    });

    const { error: errBlocos } = await supabase.from('aprender_blocos').insert(insertData);
    if (errBlocos) {
       console.log("Erro ao inserir com resposta_correta na raiz. Tentando inserir sem ele e colocando no payload...");
       
       const insertDataFallback = aulaGeradaGemini.blocos.map((bloco, idx) => {
         return {
            aula_id: aulaId,
            tipo: bloco.tipo,
            ordem: idx + 1,
            payload: { ...bloco.payload, resposta_correta: bloco.resposta_correta }
         };
       });
       const fallbackReq = await supabase.from('aprender_blocos').insert(insertDataFallback);
       if(fallbackReq.error) throw fallbackReq.error;
    }
    
    // 3. Atualizar a aula
    await supabase.from('aprender_aulas').update({
      titulo: aulaGeradaGemini.titulo,
      objetivo: aulaGeradaGemini.objetivo,
      duracao_est_min: aulaGeradaGemini.duracao_est_min
    }).eq('id', aulaId);

    console.log(`🚀 Sucesso! Aula de 20 páginas e blocos inseridos no BD.`);
  } catch(e) {
    console.error("Erro final:", e);
  }
}

run();
