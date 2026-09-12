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
  objetivo: "Dominar o início da personalidade civil, os direitos do nascituro e as regras de capacidade (absoluta e relativa) e emancipação.",
  duracao_est_min: 10,
  blocos: [
    {
      tipo: "leitura",
      payload: {
        texto: "### O Início de Tudo: A Personalidade Civil\n\nNo Direito Civil, toda pessoa é capaz de **direitos e deveres**. Mas quando exatamente isso começa?\n\nSegundo o **Art. 2º do Código Civil**, a personalidade civil da pessoa natural começa do **nascimento com vida** (teoria natalista).\n\n💡 *Analogia:* Imagine um bebê na barriga da mãe (o **nascituro**). Ele ainda não nasceu, então não tem personalidade completa, mas a lei já guarda uma 'caixinha de direitos' para ele! Por exemplo, o nascituro já pode receber uma herança ou doação, ficando tudo condicionado ao seu nascimento com vida."
      }
    },
    {
      tipo: "flashcard",
      payload: {
        frente: "Qual é o marco inicial da personalidade civil e como fica a situação do nascituro?",
        verso: "A personalidade começa com o **nascimento com vida**. Porém, a lei põe a salvo, desde a concepção, os direitos do **nascituro** (ex: direito à vida, a receber herança)."
      }
    },
    {
      tipo: "leitura",
      payload: {
        texto: "### A Régua da Incapacidade\n\nNem todo mundo pode assinar um contrato sozinho. O Código Civil divide a incapacidade em dois degraus:\n\n1. **Incapacidade Absoluta (Art. 3º):** Não podem fazer nada sozinhos (precisam ser *representados*).\n- *Quem são?* Apenas os **menores de 16 anos**.\n\n2. **Incapacidade Relativa (Art. 4º):** Podem agir, mas precisam ser *assistidos*.\n- Maiores de 16 e menores de 18 anos;\n- Ébrios habituais (alcoólatras) e viciados em tóxicos;\n- Aqueles que não puderem exprimir vontade (transitória ou permanentemente);\n- Os pródigos (gastam dinheiro descontroladamente)."
      }
    },
    {
      tipo: "pergunta", // Mudado para passar na constraint
      payload: {
        rawContent: "### Opções do Menu Suspenso\nDe acordo com o Código Civil, são absolutamente incapazes os menores de [16 anos]. Já os pródigos e os ébrios habituais são considerados [relativamente incapazes].\n\n### Gabarito Comentado\nOs menores de 16 anos são os únicos absolutamente incapazes do sistema civilista. Todos os outros (ébrios, pródigos) são relativamente incapazes."
      }
    },
    {
      tipo: "leitura",
      payload: {
        texto: "### Emancipação: O 'Voo Antecipado'\n\nA regra geral (Art. 5º) é que a menoridade cessa aos **18 anos completos**. Mas existe um atalho chamado **Emancipação**.\n\nA emancipação antecipa a capacidade plena. Ela pode ocorrer:\n- **Voluntária:** Concedida pelos pais, se o menor tiver **16 anos completos**;\n- **Legal/Automática:** Pelo casamento, por assumir emprego público efetivo, por colar grau em ensino superior, ou ter economia própria (por emprego ou negócio próprio)."
      }
    },
    {
      tipo: "checkpoint",
      payload: {
        pergunta: "Carlos, de 16 anos completos, decide se casar com a autorização de seus pais. O que acontece com a capacidade civil de Carlos após o casamento?",
        opcoes: [
          "Permanece relativamente incapaz até os 18 anos.",
          "Torna-se absolutamente capaz por meio da emancipação legal.",
          "Torna-se emancipado apenas se também tiver economia própria.",
          "Volta a ser absolutamente incapaz caso se divorcie antes dos 18 anos."
        ],
        resposta_correta: 1,
        justificativa: "O casamento é uma das causas legais de emancipação previstas no Art. 5º, Parágrafo Único, inciso II do Código Civil, tornando o menor plenamente capaz de forma irreversível (mesmo em caso de divórcio)."
      }
    },
    {
      tipo: "destaque", // Mudado para passar na constraint
      payload: {
        texto: "### Revisão Expressa ⚡\n\n- **Início da Personalidade:** Nascimento com vida (Art. 2º).\n- **Nascituro:** Direitos resguardados desde a concepção.\n- **Incapazes Absolutos:** Apenas os menores de 16 anos (Art. 3º).\n- **Incapazes Relativos:** 16 a 18 anos, ébrios, viciados, pródigos e quem não pode exprimir vontade (Art. 4º).\n- **Emancipação:** A partir dos 16 anos (pelos pais) ou causas legais (casamento, economia própria, etc)."
      }
    }
  ]
};

async function run() {
  const aulaId = '6d8a97a6-bb52-4e19-adee-901910f0d1f7'; // AULA SUJEITOS
  
  console.log("Substituindo blocos da aula Sujeitos com a versão gerada...");
  
  try {
    // 1. Deletar blocos antigos
    await supabase.from('aprender_blocos').delete().eq('aula_id', aulaId);
    console.log("Blocos antigos deletados.");

    // 2. Inserir os novos blocos
    const blocosParaInserir = aulaGeradaGemini.blocos.map((bloco, idx) => ({
      aula_id: aulaId,
      tipo: bloco.tipo,
      ordem: idx + 1,
      payload: bloco.payload
    }));

    const { error: errBlocos } = await supabase.from('aprender_blocos').insert(blocosParaInserir);
    if (errBlocos) throw errBlocos;
    
    // 3. Atualizar a aula
    await supabase.from('aprender_aulas').update({
      titulo: aulaGeradaGemini.titulo,
      objetivo: aulaGeradaGemini.objetivo,
      duracao_est_min: aulaGeradaGemini.duracao_est_min
    }).eq('id', aulaId);

    console.log(`🚀 Sucesso! Aula e blocos inseridos no BD.`);
  } catch(e) {
    console.error("Erro:", e);
  }
}

run();
