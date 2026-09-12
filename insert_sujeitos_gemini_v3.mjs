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
  titulo: "Sujeitos de Direito (Aprofundado e Visual)",
  objetivo: "Domínio 360º sobre Personalidade e Capacidade Civil.",
  duracao_est_min: 30,
  blocos: [
    // 1. Destaque / Intro
    {
      tipo: "destaque",
      payload: {
        titulo: "Bem-vindo à Experiência Visual de Direito Civil!",
        texto: "Nesta aula aprofundada de mais de 20 páginas, vamos **destrinchar** o início da Personalidade Civil, os graus de Capacidade e a Emancipação.\n\nPara facilitar a absorção, usaremos **Mapas Conceituais**, **Linhas do Tempo**, **Fluxogramas** e **Jogos de Conexão** gerados estruturalmente pela IA!\n\nPronto para subir de nível?"
      }
    },
    // 2. Linha do Tempo
    {
      tipo: "linha_tempo",
      payload: {
        titulo: "Jornada da Personalidade Civil",
        texto: "Entenda a evolução cronológica dos direitos no Brasil:",
        eventos: [
          { marco: "Concepção", titulo: "O Nascituro", descricao: "A lei põe a salvo os direitos do nascituro (desde a barriga da mãe). Ele possui *expectativa* de direitos." },
          { marco: "Nascimento", titulo: "Personalidade Adquirida", descricao: "Com o nascimento com vida (respiração), a pessoa natural adquire a personalidade civil (Art. 2º)." },
          { marco: "Até 16 anos", titulo: "Incapacidade Absoluta", descricao: "A pessoa não pode exercer os atos da vida civil sozinha, devendo ser **representada**." },
          { marco: "16 a 18 anos", titulo: "Incapacidade Relativa", descricao: "Pode praticar atos civis, mas precisa ser **assistida** pelos pais/curadores." },
          { marco: "18 anos", titulo: "Capacidade Plena", descricao: "Atinge-se a maioridade e a capacidade de fato total." }
        ]
      }
    },
    // 3. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### A Capacidade de Direito vs. De Fato\n\nO **Artigo 1º** diz que toda pessoa é capaz de direitos na ordem civil. Isso é a **Capacidade de Direito** (ou de Gozo), inerente a todo ser humano vivo.\n\nPorém, a **Capacidade de Fato** (ou de Exercício) é a aptidão para exercer esses direitos sozinho. Uma criança de 5 anos tem capacidade de direito (pode ser dona de um imóvel), mas não tem capacidade de fato (não pode vender esse imóvel sozinha)."
      }
    },
    // 4. Conexão
    {
      tipo: "conexao",
      payload: {
        pares: [
          { termo: "Capacidade de Direito", definicao: "Inerente a todo ser humano vivo (Art 1º)." },
          { termo: "Capacidade de Fato", definicao: "Aptidão para exercer os direitos por si mesmo." },
          { termo: "Capacidade Plena", definicao: "Soma da Capacidade de Direito + De Fato." }
        ]
      }
    },
    // 5. Pergunta ABCD
    {
      tipo: "pergunta",
      resposta_correta: "c",
      payload: {
        titulo: "Questão Prática (OAB)",
        enunciado: "Um recém-nascido, momentos após o parto e tendo respirado, recebe uma doação de seu avô. Sobre sua capacidade, é correto afirmar:",
        opcoes: [
          "Não possui qualquer capacidade civil, pois ainda não atingiu a maioridade.",
          "Possui capacidade plena, podendo exercer os direitos inerentes à doação.",
          "Possui capacidade de direito, mas não de fato, sendo absolutamente incapaz.",
          "Possui apenas capacidade relativa, devendo ser assistido."
        ],
        justificativa: "Letra C. Todo ser humano que nasce com vida adquire a capacidade de direito (Art. 2º), mas por ter menos de 16 anos, não tem capacidade de fato (sendo absolutamente incapaz - Art. 3º)."
      }
    },
    // 6. Mapa Conceitual Nascituro
    {
      tipo: "mapa_conceitual",
      payload: {
        titulo: "A Proteção do Nascituro",
        nos: [
          { id: "nasc", rotulo: "Nascituro" },
          { id: "her", rotulo: "Herança e Legado" },
          { id: "ali", rotulo: "Alimentos Gravídicos" },
          { id: "vida", rotulo: "Direito à Vida (Intrauterina)" }
        ],
        arestas: [
          { de: "nasc", para: "her", relacao: "pode receber" },
          { de: "nasc", para: "ali", relacao: "tem direito a" },
          { de: "nasc", para: "vida", relacao: "protegido por lei" }
        ]
      }
    },
    // 7. Flashcard
    {
      tipo: "flashcard",
      payload: {
        frente: "O que a Teoria Natalista defende sobre o início da personalidade?",
        verso: "Defende que a personalidade só começa a partir do **nascimento com vida** (respiração), embora resguarde os direitos do nascituro."
      }
    },
    // 8. Tabela (Absoluta x Relativa)
    {
      tipo: "tabela",
      payload: {
        titulo: "Comparativo: Incapacidade",
        colunas: ["Critério", "Absoluta (Art. 3º)", "Relativa (Art. 4º)"],
        linhas: [
          ["Quem são?", "Apenas os Menores de 16 anos", "16 a 18 anos, Ébrios, Pródigos"],
          ["Exigência Legal", "Representação", "Assistência"],
          ["Sanção (se descumprido)", "Ato NULO (Nulidade Absoluta)", "Ato ANULÁVEL (Nulidade Relativa)"],
          ["Prescrição / Decadência", "NÃO corre contra eles", "CORRE normalmente"]
        ]
      }
    },
    // 9. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### A Nova Realidade da Incapacidade (Pós-EPD)\n\nCom a promulgação do **Estatuto da Pessoa com Deficiência (2015)**, o Código Civil mudou drasticamente!\n\nHoje, **NENHUMA enfermidade ou deficiência mental** gera incapacidade absoluta. A incapacidade absoluta ficou restrita EXCLUSIVAMENTE a um critério etário: **menores de 16 anos**.\n\nPessoas que não podem exprimir vontade (mesmo que em coma) são consideradas, por lei, **Relativamente Incapazes**."
      }
    },
    // 10. Lacuna
    {
      tipo: "pergunta",
      resposta_correta: "a",
      payload: {
        titulo: "Preenchendo Conceitos",
        enunciado: "O [_____] tem restrição APENAS para atos patrimoniais, mas pode casar-se livremente. E a pessoa com deficiência é considerada, em regra, [_____].",
        opcoes: [
          "pródigo / capaz",
          "ébrio / relativamente incapaz",
          "menor / absolutamente incapaz",
          "pródigo / absolutamente incapaz"
        ],
        justificativa: "A. O pródigo (gastador) é relativamente incapaz apenas para dispor de bens. E a pessoa com deficiência, via EPD, goza de plena capacidade civil (exceto se, no caso concreto, não puder exprimir vontade, virando relativa)."
      }
    },
    // 11. Pergunta C/E
    {
      tipo: "pergunta",
      resposta_correta: "errado",
      payload: {
        titulo: "Pegadinha Frequente",
        enunciado: "Julgue o item: Carlos, em virtude de mal de Alzheimer avançado, perdeu de forma permanente o discernimento para atos da vida civil. Logo, ele é absolutamente incapaz.",
        opcoes: ["Certo", "Errado"],
        justificativa: "Errado! Pela redação atual do CC (após 2015), quem não pode exprimir vontade é **Relativamente Incapaz** (Art. 4º, III). O único absolutamente incapaz é o menor de 16."
      }
    },
    // 12. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### Emancipação: A Ponte para a Capacidade Plena\n\nA maioridade chega aos 18 anos, mas a emancipação antecipa isso.\n\nExistem 3 vias para se emancipar:\n1. **Voluntária:** Pelos pais (no cartório).\n2. **Judicial:** Pelo juiz (quando o menor tem um tutor).\n3. **Legal:** Automática pelos fatos da vida (Casamento, Economia, Cargo Público)."
      }
    },
    // 13. Fluxograma
    {
      tipo: "fluxograma",
      payload: {
        titulo: "Como ocorre a Emancipação?",
        etapas: [
          { n: "1", tipo: "inicio", titulo: "Menor deseja Emancipar", descricao: "A partir dos 16 anos, ele adquire essa possibilidade." },
          { n: "2", tipo: "decisao", titulo: "Possui Pais vivos e presentes?", descricao: "Verifica-se quem tem o poder familiar." },
          { n: "3", tipo: "default", titulo: "Emancipação Voluntária", descricao: "Os pais concedem por ESCRITURA PÚBLICA no cartório (sem precisar de juiz)." },
          { n: "4", tipo: "default", titulo: "Emancipação Judicial", descricao: "Se não tiver pais (tiver Tutor), o Juiz decreta após oitiva do menor (aos 16 anos)." },
          { n: "5", tipo: "fim", titulo: "Capacidade Plena", descricao: "O ato é irrevogável. Ele responde civilmente por si mesmo." }
        ]
      }
    },
    // 14. Flashcard
    {
      tipo: "flashcard",
      payload: {
        frente: "A emancipação voluntária pelos pais exige homologação de um juiz?",
        verso: "NÃO! É feita de forma extrajudicial, diretamente no Cartório de Notas por Escritura Pública."
      }
    },
    // 15. Mapa Conceitual (Emancipação Legal)
    {
      tipo: "mapa_conceitual",
      payload: {
        titulo: "Hipóteses de Emancipação Legal (Automática)",
        nos: [
          { id: "eman", rotulo: "Emancipação Legal (Art 5º)" },
          { id: "cas", rotulo: "Casamento" },
          { id: "cargo", rotulo: "Emprego Público Efetivo" },
          { id: "fac", rotulo: "Colação em Ensino Superior" },
          { id: "econ", rotulo: "Economia Própria (16 anos)" }
        ],
        arestas: [
          { de: "eman", para: "cas", relacao: "gera emancipação" },
          { de: "eman", para: "cargo", relacao: "se exercício efetivo" },
          { de: "eman", para: "fac", relacao: "colou grau" },
          { de: "eman", para: "econ", relacao: "pelo trabalho ou negócio" }
        ]
      }
    },
    // 16. Pergunta C/E
    {
      tipo: "pergunta",
      resposta_correta: "certo",
      payload: {
        titulo: "Prática",
        enunciado: "Julgue: Se Maria se emancipar legalmente pelo casamento aos 16 anos e acabar se divorciando aos 17, ela NÃO retornará à condição de incapaz.",
        opcoes: ["Certo", "Errado"],
        justificativa: "Certo! A emancipação é irrevogável e definitiva. O divórcio ou a viuvez não devolvem o ex-cônjuge à condição de incapaz."
      }
    },
    // 17. Leitura
    {
      tipo: "leitura",
      payload: {
        texto: "### Emancipação x Responsabilidade Penal\n\n⚠ **CUIDADO!** Esse é o tema que mais reprova em provas mistas.\n\nA emancipação é um instituto puramente do **Direito Civil**. Se um jovem de 16 anos for emancipado (mesmo sendo milionário com negócio próprio), ele **continua sendo penalmente inimputável**.\n\nA responsabilidade criminal no Brasil é constitucionalmente atrelada aos 18 anos. Ele não irá para um presídio, responderá pelo Estatuto da Criança e do Adolescente (ECA)."
      }
    },
    // 18. Pergunta ABCD
    {
      tipo: "pergunta",
      resposta_correta: "b",
      payload: {
        titulo: "Interdisciplinar (Civil e Penal)",
        enunciado: "Marcos, 17 anos, recém-emancipado pelos pais, compra um carro. Ao dirigir, comete infração de trânsito e causa um acidente letal. Sobre Marcos:",
        opcoes: [
          "Responderá criminalmente como adulto, pois está emancipado.",
          "Responderá civilmente (indenização) com seu próprio patrimônio, mas responderá por ato infracional (ECA) no âmbito penal.",
          "Seus pais respondem pela indenização civil integralmente, pois a emancipação transfere a responsabilidade.",
          "É considerado inimputável em ambas as esferas (civil e criminal)."
        ],
        justificativa: "Letra B. No cível, Marcos tem capacidade plena para assinar o cheque e responder pelo dano. No criminal, a emancipação civil de nada serve: ele segue inimputável (ECA) até os 18."
      }
    },
    // 19. Conexão Final
    {
      tipo: "conexao",
      payload: {
        pares: [
          { termo: "Menores de 16 anos", definicao: "Os únicos Absolutamente Incapazes." },
          { termo: "Ébrios, Viciados, Pródigos", definicao: "Relativamente Incapazes." },
          { termo: "Casamento e Cargo Público", definicao: "Causas de Emancipação Legal (automática)." }
        ]
      }
    },
    // 20. Recap
    {
      tipo: "recapitulacao",
      payload: {
        titulo: "Encerramento da Missão",
        pontos: [
          "Personalidade começa do nascimento com vida, mas protege o nascituro.",
          "Falta de representação anula (absoluto), falta de assistência torna anulável (relativo).",
          "Somente menores de 16 anos são Absolutamente incapazes (após o EPD).",
          "Emancipação voluntária exige 16 anos e cartório (dispensa juiz)."
        ],
        regra_de_ouro: "Emancipação confere capacidade civil, mas NUNCA afeta a imputabilidade penal!"
      }
    }
  ]
};

async function run() {
  const aulaId = '6d8a97a6-bb52-4e19-adee-901910f0d1f7';
  
  console.log("Substituindo blocos por uma experiência ULTRA VISUAL de 20 páginas...");
  
  try {
    await supabase.from('aprender_blocos').delete().eq('aula_id', aulaId);

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
    
    await supabase.from('aprender_aulas').update({
      titulo: aulaGeradaGemini.titulo,
      objetivo: aulaGeradaGemini.objetivo,
      duracao_est_min: aulaGeradaGemini.duracao_est_min
    }).eq('id', aulaId);

    console.log(`🚀 SUCESSO ABSOLUTO!`);
  } catch(e) {
    console.error("Erro final:", e);
  }
}

run();
