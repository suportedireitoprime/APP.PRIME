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
  titulo: "Sujeitos de Direito (Aprofundamento Master)",
  objetivo: "Destrinchar Personalidade, Nascituro, Incapacidade e Emancipação com alto nível de visualização.",
  duracao_est_min: 40,
  blocos: [
    // 1. Capa (Novo Bloco Criado)
    {
      tipo: "destaque",
      payload: {
        subtipo: "capa",
        titulo: "Sujeitos de Direito: Personalidade e Capacidade",
        texto: "Bem-vindo a esta jornada interativa e profunda sobre o início da vida no Código Civil. Deslize ou clique em Iniciar para dominar as nuances das pessoas naturais no Direito Brasileiro.",
        sumario: [
          "O Início da Personalidade e os Direitos do Nascituro",
          "A diferença entre Capacidade de Direito e de Fato",
          "O mapa completo da Incapacidade Absoluta e Relativa",
          "As regras precisas da Emancipação (Voluntária, Legal e Judicial)",
          "A Pegadinha Penal: Emancipação civil isenta de crime?"
        ]
      }
    },
    // 2. Linha do Tempo
    {
      tipo: "linha_tempo",
      payload: {
        titulo: "Jornada da Personalidade Civil",
        texto: "Acompanhe a evolução da proteção legal desde antes do nascimento:",
        eventos: [
          { marco: "Concepção", titulo: "A figura do Nascituro", descricao: "Ainda não tem personalidade completa, mas o Estado já lhe garante *expectativa de direitos* (como direito à vida e recebimento de doação)." },
          { marco: "Nascimento", titulo: "O Marco Zero (Art. 2º)", descricao: "Se nasceu com vida (respirou), a lei confere, instantaneamente, a Personalidade Civil." },
          { marco: "Até 16 anos", titulo: "Incapacidade Absoluta", descricao: "Não possui nenhuma capacidade de fato. Deve atuar através de **Representantes**." },
          { marco: "16 aos 18", titulo: "Incapacidade Relativa", descricao: "Ganha autonomia parcial. Atua em conjunto com **Assistentes** (pais ou tutores)." },
          { marco: "18 anos", titulo: "Capacidade Plena", descricao: "Cessa a menoridade. A pessoa assume 100% da responsabilidade por seus atos na esfera civil." }
        ]
      }
    },
    // 3. Leitura (Teoria)
    {
      tipo: "leitura",
      payload: {
        texto: "### Todo mundo é Capaz?\n\nA resposta rápida é SIM... mas com ressalvas. O Artigo 1º do Código Civil crava que **'Toda pessoa é capaz de direitos e deveres'**.\n\nIsso é chamado de **Capacidade de Direito** (ou de Gozo). Se você existe (nasceu com vida), você tem! Ela nunca pode ser perdida.\n\nPor outro lado, existe a **Capacidade de Fato** (ou de Exercício). É a aptidão para exercer os direitos sozinho. Uma criança tem o direito de possuir um apartamento (Capacidade de Direito), mas não pode vendê-lo sozinha sem um adulto (falta-lhe Capacidade de Fato)."
      }
    },
    // 4. Conexão (Fixação do conceito acima)
    {
      tipo: "conexao",
      payload: {
        pares: [
          { termo: "Capacidade de Direito", definicao: "Inerente a toda pessoa. É a aptidão para ter direitos (ex: recém-nascido dono de lote)." },
          { termo: "Capacidade de Fato", definicao: "Aptidão para exercer os direitos e contrair deveres sozinho, sem interferência de terceiros." },
          { termo: "Capacidade Plena", definicao: "É a soma perfeita da Capacidade de Direito com a Capacidade de Fato." }
        ]
      }
    },
    // 5. Pergunta (Fixação Art 1)
    {
      tipo: "pergunta",
      resposta_correta: "c",
      payload: {
        titulo: "Questão Prática",
        enunciado: "Um preso condenado a 30 anos por crime hediondo possui capacidade civil de direito?",
        opcoes: [
          "Não, ele perde a capacidade civil ao perder a liberdade.",
          "Sim, mas sua capacidade fica restrita apenas aos direitos existenciais (ex: vida, nome), perdendo a patrimonial.",
          "Sim. A capacidade de direito (gozo) é inerente à pessoa humana e jamais pode ser abolida.",
          "Não, pois a condenação criminal afeta a capacidade civil de forma absoluta."
        ],
        justificativa: "Letra C. A Capacidade de Direito, prevista no Art. 1º, é imutável e irrenunciável. Ninguém perde a capacidade de ser sujeito de direitos e deveres."
      }
    },
    // 6. Leitura (Nascituro)
    {
      tipo: "leitura",
      payload: {
        texto: "### O Nascituro e a Teoria Natalista\n\nMas e o bebê na barriga da mãe? Ele é uma pessoa para a lei civil?\n\nNo Brasil adotamos a **Teoria Natalista**: A personalidade começa SOMENTE no nascimento com vida.\n\nEntretanto, o Art. 2º faz uma ressalva: *'Mas a lei põe a salvo, desde a concepção, os direitos do nascituro.'*\nAssim, o nascituro tem direitos resguardados e tutelados pela lei."
      }
    },
    // 7. Mapa Conceitual (Direitos do Nascituro)
    {
      tipo: "mapa_conceitual",
      payload: {
        titulo: "O Nascituro no STJ e na Doutrina",
        nos: [
          { id: "centro", rotulo: "O Nascituro" },
          { id: "alim", rotulo: "Alimentos Gravídicos" },
          { id: "dano", rotulo: "Dano Moral" },
          { id: "doacao", rotulo: "Doação / Herança" }
        ],
        arestas: [
          { de: "centro", para: "alim", relacao: "pode requerer (Lei 11.804)" },
          { de: "centro", para: "dano", relacao: "STJ reconhece direito a indenização" },
          { de: "centro", para: "doacao", relacao: "validade sob condição suspensiva (nascer vivo)" }
        ]
      }
    },
    // 8. Flashcard
    {
      tipo: "flashcard",
      payload: {
        frente: "Se um nascituro recebe uma doação e, durante o parto, nasce morto, o que acontece com a doação?",
        verso: "A doação é anulada. Os direitos materiais do nascituro são eventuais e dependem da **condição suspensiva** do nascimento com vida."
      }
    },
    // 9. Leitura (Absolutamente Incapazes)
    {
      tipo: "leitura",
      payload: {
        texto: "### Incapacidade Absoluta (Art. 3º)\n\nA incapacidade absoluta significa que a pessoa não pode, em hipótese alguma, atuar sozinha no mundo jurídico. O ato praticado sem **representação** é NULO.\n\nCom o Estatuto da Pessoa com Deficiência (2015), essa categoria encolheu! Hoje, **apenas os menores de 16 anos** são considerados absolutamente incapazes."
      }
    },
    // 10. Pergunta Lacuna (Sem (a), (b))
    {
      tipo: "pergunta",
      resposta_correta: "b",
      payload: {
        titulo: "Termos Clínicos",
        enunciado: "Complete a lacuna: Um absolutamente incapaz atua mediante [_____], e se ele assinar um contrato sozinho, o ato será considerado [_____].",
        opcoes: [
          "assistência / anulável",
          "representação / nulo",
          "curatela / ineficaz",
          "representação / anulável"
        ],
        justificativa: "Letra B. Absolutamente Incapaz = Representado. Desrespeito = Nulidade Absoluta (Ato Nulo)."
      }
    },
    // 11. Destaque (EPD)
    {
      tipo: "destaque",
      payload: {
        titulo: "A Mudança do Século (EPD)",
        texto: "Esqueça os livros de 2014! Pessoas com enfermidade ou deficiência mental, não importa o grau, NÃO SÃO MAIS absolutamente incapazes.\n\nA incapacidade absoluta agora é puramente **ETÁRIA** (menos de 16 anos). A pessoa com deficiência pode casar, fazer testamento e assinar contratos. A regra nela é a Capacidade Plena!"
      }
    },
    // 12. Leitura (Incapacidade Relativa)
    {
      tipo: "leitura",
      payload: {
        texto: "### Incapacidade Relativa (Art. 4º)\n\nSe a absoluta exige *representação*, a relativa exige **assistência**. Eles assinam o documento JUNTO com o pai/curador. Se agirem sozinhos, o ato é apenas ANULÁVEL (tem prazo de 4 anos para ser derrubado).\n\nSão Relativamente Incapazes:\n1. Maiores de 16 e menores de 18 anos;\n2. Os ébrios habituais (alcoólatras) e viciados em tóxicos;\n3. Aqueles que, por causa transitória ou permanente, **não puderem exprimir vontade**;\n4. Os pródigos."
      }
    },
    // 13. Tabela Comparativa
    {
      tipo: "tabela",
      payload: {
        titulo: "Raio-X: Absoluta vs Relativa",
        colunas: ["Diferença", "Absoluta (Art. 3º)", "Relativa (Art. 4º)"],
        linhas: [
          ["Quem", "Apenas menores de 16", "16 a 18, pródigos, sem exprimir vontade, ébrios/viciados"],
          ["Mecanismo", "Representação", "Assistência"],
          ["Consequência", "Ato NULO", "Ato ANULÁVEL"],
          ["Prescrição / Decadência", "NÃO corre prazo contra", "Corre normalmente"]
        ]
      }
    },
    // 14. Leitura (Pródigo e Exprimir Vontade)
    {
      tipo: "leitura",
      payload: {
        texto: "### Entendendo os Termos\n\n**O Pródigo:** Aquele que dilapida o patrimônio compulsivamente. Sua interdição é PARCIAL: ele só é incapaz para atos que envolvem dinheiro/patrimônio (ex: vender casa, emprestar). Ele é totalmente capaz para atos existenciais (pode casar sem precisar da mãe assinar junto).\n\n**Não exprimir vontade:** Pacientes em coma, ou com doenças degenerativas agudas que cortam a comunicação (inclusive temporariamente). Pelo novo Código Civil, são colocados como **relativamente** incapazes (uma jabuticaba brasileira)."
      }
    },
    // 15. Flashcard
    {
      tipo: "flashcard",
      payload: {
        frente: "Pode o pródigo ser curatelado e proibido de se casar?",
        verso: "NÃO. A curatela do pródigo afeta exclusivamente sua capacidade patrimonial e negocial (Art. 1.782). Ele pode casar-se livremente."
      }
    },
    // 16. Pergunta C/E (EPD Aplicado)
    {
      tipo: "pergunta",
      resposta_correta: "errado",
      payload: {
        titulo: "Aplicação Prática",
        enunciado: "Julgue o item: Uma pessoa que, devido a um acidente de carro grave, encontra-se em coma profundo na UTI há dois meses, é considerada pela legislação civil vigente como absolutamente incapaz.",
        opcoes: ["Certo", "Errado"],
        justificativa: "Errado! Uma pessoa em coma enquadra-se no Art. 4º, III ('aqueles que, por causa transitória, não puderem exprimir sua vontade'). Portanto, é Relativamente Incapaz."
      }
    },
    // 17. Conexão de Grupos
    {
      tipo: "conexao",
      payload: {
        pares: [
          { termo: "Menor de 15 anos", definicao: "Absolutamente Incapaz" },
          { termo: "Jovem de 17 anos", definicao: "Relativamente Incapaz" },
          { termo: "Pródigo", definicao: "Incapacidade Relativa apenas patrimonial" },
          { termo: "Pessoa com Deficiência", definicao: "Em regra, Capaz" }
        ]
      }
    },
    // 18. Leitura (Fim da Incapacidade)
    {
      tipo: "leitura",
      payload: {
        texto: "### O Fim da Linha: A Maioridade (Art. 5º)\n\nAo bater as doze badaladas do seu aniversário de 18 anos completos, a menoridade encerra. A partir daquele milésimo de segundo, você se torna habilitado à prática de **TODOS** os atos da vida civil.\n\nMas, a lei civil é pragmática e criou um 'atalho' no tempo, chamado **Emancipação**, que cessa a incapacidade do menor antes da hora."
      }
    },
    // 19. Leitura (Emancipação Voluntária)
    {
      tipo: "leitura",
      payload: {
        texto: "### Emancipação Voluntária e Judicial\n\nA **Emancipação Voluntária** é concedida pelos PAIS (em conjunto) no cartório (por escritura pública). \n- Requisito de ouro: O menor deve ter **16 anos completos**.\n- Juiz precisa assinar? NÃO.\n\nA **Emancipação Judicial** só ocorre quando o menor NÃO tem pais no poder familiar (por exemplo, é cuidado por um Tutor). Nesse caso, o Tutor não pode emancipar sozinho. O juiz deve intervir."
      }
    },
    // 20. Flashcard
    {
      tipo: "flashcard",
      payload: {
        frente: "A Emancipação Voluntária pode ser revogada se os pais descobrirem que o jovem está agindo de forma irresponsável?",
        verso: "NÃO. Qualquer forma de emancipação (voluntária, judicial ou legal) é **irrevogável e definitiva**."
      }
    },
    // 21. Fluxograma (Caminhos Emancipação)
    {
      tipo: "fluxograma",
      payload: {
        titulo: "Fluxo de Decisão: Voluntária ou Judicial?",
        etapas: [
          { n: "1", tipo: "inicio", titulo: "Menor de 16 Anos Completos", descricao: "O menor e seu responsável buscam a emancipação." },
          { n: "2", tipo: "decisao", titulo: "Quem detém o poder sobre o jovem?", descricao: "Ele está sob poder familiar ou sob tutela?" },
          { n: "3", tipo: "default", titulo: "Se for Pais (Poder Familiar)", descricao: "Basta ir ao Tabelião de Notas. Ato Bilateral ou Unilateral (se um faltar). ESCRITURA PÚBLICA." },
          { n: "4", tipo: "default", titulo: "Se for Tutor", descricao: "Apenas via Juiz. Tutor pede judicialmente, ouvindo-se o tutorado." },
          { n: "5", tipo: "fim", titulo: "Registro Público", descricao: "Toda emancipação deve ser averbada no registro de nascimento." }
        ]
      }
    },
    // 22. Leitura (Emancipação Legal)
    {
      tipo: "leitura",
      payload: {
        texto: "### Emancipação Legal\n\nÉ aquela que acontece 'sozinha', porque a pessoa realizou um ato da vida que a lei diz: 'Ok, você é maduro suficiente'.\n\nEla ocorre mediante quatro hipóteses exclusivas: Casamento, Exercício de emprego público efetivo, Colação de Grau em Ensino Superior, e Economia Própria (seja por comércio ou vínculo empregatício)."
      }
    },
    // 23. Mapa Conceitual (As Hipóteses Legais)
    {
      tipo: "mapa_conceitual",
      payload: {
        titulo: "Hipóteses da Emancipação Legal",
        nos: [
          { id: "leg", rotulo: "Emancipação Automática" },
          { id: "cas", rotulo: "Casamento Válido" },
          { id: "cargo", rotulo: "Emprego Público Efetivo" },
          { id: "grad", rotulo: "Colação de Grau (Ensino Superior)" },
          { id: "eco", rotulo: "Economia Própria" }
        ],
        arestas: [
          { de: "leg", para: "cas", relacao: "idade núbil (16 anos)" },
          { de: "leg", para: "cargo", relacao: "não serve estágio/comissionado" },
          { de: "leg", para: "grad", relacao: "raro para menores, mas possível" },
          { de: "leg", para: "eco", relacao: "exige que o menor tenha 16 anos!" }
        ]
      }
    },
    // 24. Pergunta C/E
    {
      tipo: "pergunta",
      resposta_correta: "errado",
      payload: {
        titulo: "Pegadinha Clássica",
        enunciado: "Julgue o item: Pedro, de 15 anos de idade, possui um canal no YouTube e aufere renda de 50 mil reais mensais, sustentando toda a sua família. Nessa situação, Pedro goza de emancipação legal por possuir economia própria.",
        opcoes: ["Certo", "Errado"],
        justificativa: "Errado! A emancipação por economia própria exige (Art. 5º, V) que o menor tenha **16 ANOS COMPLETOS**. Aos 15 anos, mesmo sendo milionário, Pedro não será emancipado."
      }
    },
    // 25. Destaque (Penal x Civil)
    {
      tipo: "destaque",
      payload: {
        titulo: "Alerta de Fronteira: Penal x Civil",
        texto: "A Emancipação **SÓ AFETA A ESFERA CIVIL**.\n\nUm garoto de 17 anos emancipado continua sendo penalmente **INIMPUTÁVEL**. Ele não pode ser preso preventivamente em penitenciária comum, não pode tirar CNH (pois o Código de Trânsito exige ser penalmente imputável) e responderá pelos seus crimes (atos infracionais) nas regras do ECA."
      }
    },
    // 26. Recap
    {
      tipo: "recapitulacao",
      payload: {
        titulo: "Missão Cumprida",
        pontos: [
          "O Nascituro tem direitos protegidos antes mesmo de ter personalidade.",
          "Capacidade de Fato (exercício) é diferente da de Direito.",
          "Incapacidade absoluta = Representação = Nulo = Apenas Menores de 16.",
          "Coma, embriaguez habitual e prodigalidade = Relativamente incapazes.",
          "Emancipação Voluntária exige 16 anos e escritura pública."
        ],
        regra_de_ouro: "O emancipado ganha asas civis, mas a lei penal continua o tratando como adolescente até o relógio bater 18 anos!"
      }
    }
  ]
};

async function run() {
  const aulaId = '6d8a97a6-bb52-4e19-adee-901910f0d1f7';
  
  console.log("Substituindo blocos por uma experiência TOTALMENTE IMERSIVA de 26 páginas...");
  
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

    console.log(`🚀 SUCESSO DE 26 PÁGINAS! Capa adicionada.`);
  } catch(e) {
    console.error("Erro final:", e);
  }
}

run();
