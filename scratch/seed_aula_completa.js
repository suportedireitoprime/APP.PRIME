import { createRequire } from 'module';
import path from 'path';

const projectRoot = 'c:\\Users\\ext_wpereira\\OneDrive - Vitamina Work Life S.A\\Documentos\\APP.PRIME';
const require = createRequire(path.join(projectRoot, 'package.json'));

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(projectRoot, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const AULA_ID = '6bedc897-3ae3-423d-9637-65cb0a0fe0ea';

  console.log('Removendo blocos anteriores...');
  await supabase.from('aprender_blocos').delete().eq('aula_id', AULA_ID);

  const blocos = [
    // ── 1. Introdução e Significado da Tutela Penal da Família ──
    {
      aula_id: AULA_ID,
      ordem: 1,
      tipo: 'leitura',
      payload: {
        titulo: 'Introdução: A Tutela Penal da Família',
        conteudo: 'A família é a **base estrutural da sociedade** e recebe especial proteção do Estado, como proclama o art. 226 da Constituição Federal de 1988.\n\nMas por que o Direito Penal — que deve ser a *ultima ratio* (último recurso) — intervém nas relações de família?\n\nO Direito Penal não se intromete nos desentendimentos cotidianos de um casal, nem na partilha corriqueira de bens. Sua missão no **Título VII do Código Penal (Arts. 235 a 249)** é punir fraudes graves que ameaçam a própria segurança jurídica do estado civil das pessoas: a bigamia, a falsificação de paternidade, a sonegação de filhos e o abandono de quem não pode se sustentar por conta própria.',
        em_portugues_claro: 'A lei penal protege 4 coisas sagradas na família: o casamento legal, a verdade sobre quem são seus pais, a comida/escola dos filhos e a guarda das crianças.',
        exemplo: 'Se alguém deixa de pagar pensão de propósito tendo muito dinheiro, ou se casa duas vezes no cartório escondido, o caso sai da esfera civil e vira crime punível com prisão.'
      }
    },

    // ── 2. O Bem Jurídico Tutelado ──
    {
      aula_id: AULA_ID,
      ordem: 2,
      tipo: 'destaque',
      payload: {
        tom: 'info',
        titulo: 'O Bem Jurídico Tutelado: Os 4 Pilares do Título VII',
        texto: 'O Título VII do Código Penal divide a proteção da família em 4 capítulos fundamentais:\n\n1. Crimes contra o Casamento (Arts. 235 a 240) — tutela a monogamia e a solenidade civil;\n2. Crimes contra o Estado de Filiação (Arts. 241 a 243) — tutela a verdade biológica e registral da pessoa humana;\n3. Crimes contra a Assistência Familiar (Arts. 244 a 247) — tutela o dever de sustento, alimentação e educação primária;\n4. Crimes contra o Pátrio Poder e Tutela (Arts. 248 a 249) — tutela a autoridade legítima de guarda dos pais e tutores.'
      }
    },

    // ── 3. Storytelling — O Caso do Casamento Duplo de Rogério ──
    {
      aula_id: AULA_ID,
      ordem: 3,
      tipo: 'leitura',
      payload: {
        titulo: 'Storytelling: O Casamento Oculto de Rogério',
        conteudo: 'Rogério é casado há 12 anos com Helena em Campinas/SP, união registrada sob o regime de comunhão parcial de bens. Em 2022, transferido para Belo Horizonte pela empresa onde trabalha, apaixona-se por Bianca.\n\nPara agradar a família de Bianca sem passar pelo divórcio com Helena, Rogério obtém uma segunda via antiga de sua certidão de nascimento onde ainda constava o estado civil de "solteiro" e marca casamento em cartório da capital mineira.\n\nBianca, de boa-fé, acredita piamente que Rogério é solteiro e casa-se com ele em cerimônia formal pública.\n\nDois anos depois, Rogério falece em um acidente. Helena comparece com a certidão de 2010; Bianca comparece com a certidão de 2022. O cartório aciona a polícia civil. Que crimes foram cometidos e quem responde criminalmente?',
        em_portugues_claro: 'Rogério cometeu o crime de Bigamia. Mas e Bianca? Como ela não sabia de nada, ela é vítima do crime e não cometeu infração penal.'
      }
    },

    // ── 4. Capítulo I: Bigamia (Art. 235 do CP) ──
    {
      aula_id: AULA_ID,
      ordem: 4,
      tipo: 'leitura',
      payload: {
        titulo: 'Capítulo I: Bigamia (Art. 235 do CP)',
        conteudo: 'O artigo 235 do Código Penal tipifica o crime de **Bigamia**:\n\n> *"Contrair alguém, sendo casado, novo casamento. Pena: reclusão, de 2 a 6 anos."*\n\n### Elementos Estruturais:\n- **Sujeito Ativo:** É crime próprio. Só pode ser cometido por quem já é legalmente casado no civil.\n- **Sujeito Passivo:** O Estado (interesse público na monogamia) e, secundariamente, o cônjuge inocente.\n- **Figura do § 1º (Concurso Necessário ou Partícipe Especial):** *"Aquele que, não sendo casado, contrai casamento com pessoa casada, conhecendo essa circunstância, é punido com reclusão de 1 a 3 anos"*. Se Bianca soubesse do casamento anterior, ela responderia por este parágrafo!\n- **Anulação do Casamento Anterior (§ 2º):** Se o primeiro casamento for declarado nulo por sentença judicial transitada em julgado, a bigamia é descaracterizada.',
        pegadinha: 'Cuidado em provas: a união estável paralela NÃO configura bigamia! O tipo exige celebração formal de novo casamento civil.'
      }
    },

    // ── 5. Flashcard: Bigamia e União Estável ──
    {
      aula_id: AULA_ID,
      ordem: 5,
      tipo: 'flashcard',
      payload: {
        frente: 'A união estável simultânea a casamento válido configura o crime de Bigamia (Art. 235 do CP)?',
        verso: 'NÃO.',
        explicacao: 'O princípio da estrita legalidade penal veda a analogia in malam partem. O tipo penal do art. 235 exige expressamente "contrair novo casamento". A união estável, embora produza efeitos cíveis, não preenche o tipo penal da bigamia.',
        exemplo: 'Marcos é casado civilmente com Joana e vive em união estável pública com Patrícia. Marcos não comete bigamia.',
        aplicando: 'Em questões da OAB e concursos, assertivas que afirmam que a união estável configura bigamia estão sempre incorretas.'
      }
    },

    // ── 6. Induzimento a Erro Essencial e Ação Penal Personalíssima (Art. 236) ──
    {
      aula_id: AULA_ID,
      ordem: 6,
      tipo: 'leitura',
      payload: {
        titulo: 'Induzimento a Erro Essencial (Art. 236 do CP)',
        conteudo: 'O artigo 236 pune quem contrai casamento induzindo o outro cônjuge em erro essencial ou ocultando impedimento que não seja o de casamento anterior:\n\n> *"Contrair casamento, induzindo em erro essencial o outro contraente, ou ocultando-lhe impedimento que não seja casamento anterior. Pena: detenção, de 6 meses a 2 anos."*\n\n### Peculiaridade Suprema de Concurso:\nO parágrafo único deste artigo traz uma das regras mais cobradas em Direito Penal:\n\n1. **Ação Penal Privada Personalíssima:** Apenas o cônjuge enganado pode oferecer queixa-crime. Seus herdeiros ou o Ministério Público jamais poderão propor a ação.\n2. **Condição de Procedibilidade:** A ação penal privada só pode ser iniciada **DEPOIS** que transitar em julgado a sentença cível que anulou o casamento civil por esse motivo!\n3. O prazo decadencial de 6 meses começa a correr da data do trânsito em julgado da anulação cível.',
        em_portugues_claro: 'Se alguém engana o noivo ou noiva para casar (ex: escondendo crime gravíssimo ou doença grave anterior), a vítima só pode processar criminalmente DEPOIS que anular o casamento no juiz da família.'
      }
    },

    // ── 7. Flashcard: Ação Penal no Artigo 236 ──
    {
      aula_id: AULA_ID,
      ordem: 7,
      tipo: 'flashcard',
      payload: {
        frente: 'Qual a natureza da ação penal no crime do Artigo 236 (Induzimento a Erro Essencial)?',
        verso: 'Ação Penal Privada Personalíssima.',
        explicacao: 'Conforme o parágrafo único do art. 236 do CP, a ação penal é exclusivamente privada personalíssima (só a vítima direta pode mover) e depende de prévia sentença cível transitada em julgado que anule o casamento.',
        aplicando: 'Se a vítima falecer antes de ajuizar a queixa-crime, ninguém mais pode ajuizar; o direito de queixa não se transmite aos herdeiros (art. 236, parágrafo único).'
      }
    },

    // ── 8. Tabela Comparativa dos Crimes Contra o Casamento ──
    {
      aula_id: AULA_ID,
      ordem: 8,
      tipo: 'tabela',
      payload: {
        titulo: 'Quadro Geral: Crimes Contra o Casamento (Arts. 235 a 240)',
        colunas: ['Artigo', 'Nome do Crime', 'Pena', 'Tipo de Ação Penal'],
        linhas: [
          ['Art. 235', 'Bigamia', 'Reclusão, 2 a 6 anos', 'Pública Incondicionada'],
          ['Art. 236', 'Induzimento a Erro Essencial', 'Detenção, 6 meses a 2 anos', 'Privada Personalíssima'],
          ['Art. 237', 'Casamento com Impedimento', 'Detenção, 3 meses a 1 ano', 'Pública Incondicionada'],
          ['Art. 238', 'Simulação de Autoridade', 'Detenção, 1 a 3 anos', 'Pública Incondicionada']
        ]
      }
    },

    // ── 9. Storytelling — O Caso do Bebê da Vizinha (Filiação) ──
    {
      aula_id: AULA_ID,
      ordem: 9,
      tipo: 'leitura',
      payload: {
        titulo: 'Storytelling: O Bebê da Vizinha e a "Adoção à Brasileira"',
        conteudo: 'Clara, jovem mãe solteira em situação de extrema vulnerabilidade e sem qualquer apoio familiar, dá à luz um menino no hospital regional. Desesperada e sem recursos para alimentar a criança, confidencia à vizinha Neide que pretendia deixar o bebê na porta de um orfanato.\n\nNeide, casada com Osvaldo há 20 anos e impossibilitada de ter filhos biológicos, comove-se profundamente com a situação. Em vez de acionar a Vara da Infância e Juventude para ingressar na fila do Sistema Nacional de Adoção, Neide e Osvaldo pegam a declaração de nascido vivo e comparecem ao Cartório de Registro Civil.\n\nLá, Osvaldo e Neide declaram formalmente que a criança nasceu de um parto domiciliar realizado na casa deles e registram o menino como filho biológico do casal, dando-lhe o nome de Gabriel.\n\nCinco anos depois, Clara reaparece exigindo o filho de volta. A conduta de Neide e Osvaldo constitui crime?',
        em_portugues_claro: 'Registrar filho de outra pessoa como próprio é a clássica "adoção à brasileira". Pela lei, é um crime contra o estado de filiação, mas existe uma saída legal muito especial: o perdão judicial!'
      }
    },

    // ── 10. Capítulo II: Crimes Contra o Estado de Filiação (Arts. 241 e 242) ──
    {
      aula_id: AULA_ID,
      ordem: 10,
      tipo: 'leitura',
      payload: {
        titulo: 'Capítulo II: Parto Suposto e Adoção à Brasileira (Arts. 241 e 242)',
        conteudo: 'O Código Penal tutela o direito fundamental da pessoa humana de ter seu registro civil fiel à sua verdadeira filiação.\n\n### Art. 241 — Parto Suposto\n> *"Promover no registro civil a inscrição de nascimento inexistente. Pena: reclusão, de 2 a 6 anos."*\n\n### Art. 242 — Adoção à Brasileira\n> *"Dar parto alheio como próprio; registrar como seu o filho de outrem; ocultar recém-nascido ou substituí-lo, suprimindo ou alterando direito inerente ao estado civil. Pena: reclusão, de 2 a 6 anos."*\n\n### O Perdão Judicial do Parágrafo Único:\nO legislador penal reconheceu que, muitas vezes, casais praticam essa fraude impulsionados por compaixão e afeto genuíno para acolher uma criança desamparada. Por isso, previu expressamente:\n\n> **Parágrafo único do art. 242:** *"Se o crime é praticado por motivo de reconhecida nobreza, o juiz pode deixar de aplicar a pena."*\n\nO perdão judicial extingue a punibilidade (art. 107, IX, CP) e não gera reincidência nem maus antecedentes!',
        exemplo: 'Neide e Osvaldo cometeram o crime do art. 242 do CP. Como agiram exclusivamente por amor e compaixão para salvar a criança, o juiz aplica o perdão judicial do parágrafo único.'
      }
    },

    // ── 11. Flashcard: Adoção à Brasileira e Perdão ──
    {
      aula_id: AULA_ID,
      ordem: 11,
      tipo: 'flashcard',
      payload: {
        frente: 'Qual crime é praticado na "Adoção à Brasileira" e qual benefício o juiz pode aplicar se comprovado motivo nobre?',
        verso: 'Crime do Art. 242 do CP (Registrar filho de outrem como próprio) e cabe Perdão Judicial.',
        explicacao: 'O registro de filho alheio como próprio tipifica o art. 242 do Código Penal. Havendo motivo de reconhecida nobreza (afeto, amparo, compaixão), incide o parágrafo único, facultando ao magistrado a concessão de Perdão Judicial.',
        aplicando: 'O perdão judicial extingue a punibilidade (art. 107, IX, CP), sendo causa extintiva de punibilidade com efeitos absolutórios.'
      }
    },

    // ── 12. Linha do Tempo: Estrutura Cronológica do Título VII ──
    {
      aula_id: AULA_ID,
      ordem: 12,
      tipo: 'linha_tempo',
      payload: {
        titulo: 'Linha do Tempo: Os 4 Capítulos dos Crimes Contra a Família',
        eventos: [
          {
            marco: 'Capítulo I • Arts. 235 a 240',
            titulo: 'Crimes Contra o Casamento',
            descricao: 'Monogamia e solenidade matrimonial. Tipos principais: Bigamia (art. 235) e Induzimento a Erro Essencial (art. 236).'
          },
          {
            marco: 'Capítulo II • Arts. 241 a 243',
            titulo: 'Crimes Contra o Estado de Filiação',
            descricao: 'Veracidade registral e biológica. Destaque: Parto suposto (art. 241), Adoção à brasileira com perdão judicial (art. 242) e Sonegação de estado (art. 243).'
          },
          {
            marco: 'Capítulo III • Arts. 244 a 247',
            titulo: 'Crimes Contra a Assistência Familiar',
            descricao: 'Dever de solidariedade material, alimentar e moral. Destaque: Abandono material de pensão alimentícia (art. 244) e Abandono intelectual escolar (art. 246).'
          },
          {
            marco: 'Capítulo IV • Arts. 248 a 249',
            titulo: 'Crimes Contra o Pátrio Poder e Tutela',
            descricao: 'Exercício da guarda legítima e autoridade parental. Destaque: Induzimento à fuga (art. 248) e Subtração de incapaz (art. 249).'
          }
        ]
      }
    },

    // ── 13. Storytelling — A Recusa de Alimentos de Gustavo ──
    {
      aula_id: AULA_ID,
      ordem: 13,
      tipo: 'leitura',
      payload: {
        titulo: 'Storytelling: A Vingança da Pensão Alimentícia',
        conteudo: 'Gustavo é um empresário próspero, proprietário de duas concessionárias de veículos. Após um divórcio litigioso com sua ex-esposa Marina, o juiz de família fixou uma pensão alimentícia mensal de R$ 5.000,00 em favor de seus dois filhos, de 6 e 10 anos.\n\nIrritado com Marina, Gustavo decide propositadamente suspender todos os depósitos alimentares, afirmando: *"Não vou dar um centavo enquanto ela não me pedir desculpas. De fome eles não morrem"*. As crianças passam privações básicas, dependendo de doações da avó materna.\n\nMarina ajuíza execução de alimentos e Gustavo é preso civilmente por 60 dias pelo juiz da vara de família. Paralelamente, o Ministério Público oferece denúncia criminal contra Gustavo por **Abandono Material (Art. 244 do CP)**.\n\nA defesa de Gustavo alega que ele já foi punido com a prisão civil de 60 dias e não pode sofrer processo penal pelo mesmo fato (*bis in idem*). Essa tese procede?',
        em_portugues_claro: 'A tese da defesa está 100% errada! A prisão civil serve apenas para forçar o devedor a pagar a dívida. O processo penal serve para punir o crime de deixar a família sem sustento.'
      }
    },

    // ── 14. Capítulo III: Abandono Material e Intelectual (Arts. 244 e 246) ──
    {
      aula_id: AULA_ID,
      ordem: 14,
      tipo: 'leitura',
      payload: {
        titulo: 'Capítulo III: Abandono Material e Intelectual (Arts. 244 e 246)',
        conteudo: '### 1. Abandono Material (Art. 244 do CP)\n> *"Deixar, sem justa causa, de prover a subsistência do cônjuge, ou de filho menor de 18 anos ou inapto para o trabalho, ou de ascendente inválido ou maior de 60 anos, não lhes proporcionando os recursos necessários ou faltando ao pagamento de pensão alimentícia judicialmente acordada, fixada ou majorada. Pena: detenção, de 1 a 4 anos, e multa."*\n\n- **Independência das instâncias:** Prisão civil de até 3 meses (art. 528 do CPC) e o crime de abandono material são esferas totalmente autônomas.\n- **Sem Justa Causa:** Se a pessoa não paga porque está desempregada e em miséria absoluta, não há crime (falta dolo e culpabilidade). O crime exige dolo de quem tem condições e se recusa.\n\n### 2. Abandono Intelectual (Art. 246 do CP)\n> *"Deixar, sem justa causa, de prover à instrução primária de filho em idade escolar. Pena: detenção, de 15 dias a 1 mês, ou multa."*\n\nO dever dos pais de garantir a educação básica e fundamental é obrigação penalmente tutelada.',
        pegadinha: 'Atenção: o abandono intelectual restringe-se à instrução primária/fundamental. Não abrange o ensino médio ou cursos superiores.'
      }
    },

    // ── 15. Flashcard: Abandono Material e Prisão Civil ──
    {
      aula_id: AULA_ID,
      ordem: 15,
      tipo: 'flashcard',
      payload: {
        frente: 'A prisão civil decretada pelo juiz de família afasta a responsabilidade penal por Abandono Material (Art. 244 do CP)?',
        verso: 'NÃO.',
        explicacao: 'A prisão civil por dívida alimentar tem natureza coercitiva (forçar o pagamento da dívida civil), enquanto o Art. 244 do CP tem natureza punitiva repressiva estatal. As instâncias cível e penal são independentes e não geram bis in idem.',
        aplicando: 'O pagamento posterior da pensão não extingue de plano o crime de abandono se o dolo de privar os filhos já tiver se consumado no período da inadimplência.'
      }
    },

    // ── 16. Capítulo IV: Crimes Contra o Pátrio Poder e Tutela (Arts. 248 e 249) ──
    {
      aula_id: AULA_ID,
      ordem: 16,
      tipo: 'leitura',
      payload: {
        titulo: 'Capítulo IV: Crimes Contra o Pátrio Poder e Guarda (Arts. 248 e 249)',
        conteudo: 'O último capítulo do Título VII protege o poder familiar e as decisões judiciais sobre a guarda de crianças e adolescentes.\n\n### Subtração de Incapaz (Art. 249 do CP)\n> *"Subtrair menor de 18 anos, ou interdito, ao poder de quem o tem sob sua guarda em virtude de lei ou de ordem judicial. Pena: detenção, de 2 meses a 2 anos."*\n\n### Quem pode cometer?\nQualquer pessoa, inclusive o **pai ou mãe** que não detenha a guarda judicial legítima (ex: pai que pega a criança no colégio e foge para outra cidade sem autorização da mãe que tem a guarda exclusiva).\n\n### Subtração de Incapaz vs. Sequestro (Art. 148 do CP):\n- Se o objetivo do agente for subtrair a guarda para tê-la sob sua influência: **Art. 249 (Subtração de Incapaz)**.\n- Se o menor for privado da liberdade para extorsão ou cárcere sem qualquer relação de guarda: **Art. 148 (Sequestro) ou Art. 159 (Extorsão mediante sequestro)**.',
        em_portugues_claro: 'O pai ou parente que furta a criança da guarda judicial do outro comete o crime de subtração de incapaz.'
      }
    },

    // ── 17. Desafio de Fixação 1 (Bigamia e Casamento) ──
    {
      aula_id: AULA_ID,
      ordem: 17,
      tipo: 'pergunta',
      payload: {
        enunciado: 'Sobre o crime de Bigamia (Art. 235 do Código Penal), assinale a alternativa juridicamente correta conforme a doutrina e jurisprudência majoritárias:',
        opcoes: [
          {
            id: 'a',
            texto: 'A união estável simultânea mantida por pessoa casada configura automaticamente o crime de bigamia.'
          },
          {
            id: 'b',
            texto: 'Aquele que, não sendo casado, contrai casamento com pessoa casada conhecendo essa circunstância, também comete crime punido com reclusão.'
          },
          {
            id: 'c',
            texto: 'A anulação judicial do casamento anterior não produz nenhum efeito sobre a ação penal de bigamia já instaurada.'
          },
          {
            id: 'd',
            texto: 'Trata-se de crime de ação penal privada personalíssima exclusiva do cônjuge enganado.'
          }
        ],
        resposta_correta: {
          id_correto: 'b'
        },
        explicacao: 'Correta a alternativa B! Conforme o § 1º do art. 235 do Código Penal, aquele que não é casado mas contrai matrimônio sabendo da condição de casado do outro é punido com reclusão de 1 a 3 anos. A letra A está errada porque união estável não preenche o tipo penal da bigamia.'
      }
    },

    // ── 18. Desafio de Fixação 2 (Adoção à Brasileira e Perdão) ──
    {
      aula_id: AULA_ID,
      ordem: 18,
      tipo: 'pergunta',
      payload: {
        enunciado: 'Casal que não pode gerar filhos biológicos registra recém-nascido entregue por mãe em situação de rua como se fosse seu filho biológico, agindo por compaixão e afeto. De acordo com o Código Penal, a conduta:',
        opcoes: [
          {
            id: 'a',
            texto: 'É atípica, pois a adoção de fato é amplamente permitida pelo Estatuto da Criança e do Adolescente.'
          },
          {
            id: 'b',
            texto: 'Tipifica o crime do art. 242 do CP, sendo admitida a concessão de Perdão Judicial pelo juiz em razão do motivo nobre.'
          },
          {
            id: 'c',
            texto: 'Configura o crime hediondo inafiançável de sequestro e cárcere privado qualificado.'
          },
          {
            id: 'd',
            texto: 'Depende de representação exclusiva do Ministério Público Federal para instauração de inquérito policial.'
          }
        ],
        resposta_correta: {
          id_correto: 'b'
        },
        explicacao: 'Correta a alternativa B! Registrar filho de outrem como próprio é conduta típica do art. 242 do CP (adoção à brasileira). Contudo, pelo parágrafo único do art. 242, se o crime é praticado por motivo de reconhecida nobreza (afeto, compaixão), o juiz pode deixar de aplicar a pena (perdão judicial).'
      }
    },

    // ── 19. Desafio de Fixação 3 (Abandono Material e Esferas) ──
    {
      aula_id: AULA_ID,
      ordem: 19,
      tipo: 'pergunta',
      payload: {
        enunciado: 'Em relação ao crime de Abandono Material (Art. 244 do Código Penal), assinale a afirmativa correta:',
        opcoes: [
          {
            id: 'a',
            texto: 'A decretação e o cumprimento de prisão civil por alimentos na vara de família extinguem a punibilidade do crime de abandono material.'
          },
          {
            id: 'b',
            texto: 'Configura crime formal que independe da capacidade financeira e dos recursos do alimentante.'
          },
          {
            id: 'c',
            texto: 'As esferas civil e penal são autônomas, de modo que o inadimplemento deliberado e sem justa causa de pensão judicial configura o crime do art. 244 do CP.'
          },
          {
            id: 'd',
            texto: 'O crime só se consuma se os filhos menores vierem a óbito por desnutrição grave.'
          }
        ],
        resposta_correta: {
          id_correto: 'c'
        },
        explicacao: 'Correta a alternativa C! O crime do art. 244 tutela o dever de assistência material. A prisão civil (coerção processual) não impede a condenação criminal pelo abandono material doloso (sanção penal), inexistindo bis in idem.'
      }
    },

    // ── 20. Checkpoint de Fixação e Domínio Completo ──
    {
      aula_id: AULA_ID,
      ordem: 20,
      tipo: 'checkpoint',
      payload: {
        titulo: 'Parabéns! Domínio dos Crimes Contra a Família',
        aprendeu: [
          'O Título VII do Código Penal tutela a instituição da família em 4 capítulos: Casamento, Filiação, Assistência Familiar e Pátrio Poder.',
          'Bigamia (Art. 235) exige celebração de novo casamento civil formal; união estável simultânea não tipifica o crime.',
          'No Induzimento a Erro Essencial (Art. 236), a ação penal é Privada Personalíssima e exige prévia anulação cível do casamento.',
          'A "Adoção à Brasileira" (Art. 242) admite Perdão Judicial se comprovado motivo de reconhecida nobreza (parágrafo único).',
          'Abandono Material (Art. 244) e prisão civil por alimentos operam em esferas jurídicas independentes.',
          'Subtração de Incapaz (Art. 249) pode ser praticada pelo próprio genitor que não detenha a guarda judicial legítima.'
        ],
        pergunta_reflexiva: 'Como o princípio da intervenção mínima do Direito Penal equilibra a proteção das crianças com o respeito à autonomia das decisões familiares?',
        proximo: 'Você concluiu com maestria a aula completa de Crimes Contra a Família!'
      }
    }
  ];

  console.log(`Inserindo ${blocos.length} blocos didáticos completos...`);
  const { data, error } = await supabase.from('aprender_blocos').insert(blocos).select();

  if (error) {
    console.error('Erro ao inserir blocos:', error);
    process.exit(1);
  }

  console.log(`Sucesso absoluto! ${data.length} blocos inseridos na aula.`);
}

main().catch(console.error);
