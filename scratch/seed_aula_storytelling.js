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

  console.log('Removendo blocos antigos da aula...');
  await supabase.from('aprender_blocos').delete().eq('aula_id', AULA_ID);

  const blocos = [
    // ── Página 1: Storytelling Introdução ──
    {
      aula_id: AULA_ID,
      ordem: 1,
      tipo: 'leitura',
      payload: {
        titulo: 'O Segredo de Rogério e a Ordem Familiar',
        conteudo: 'Imagine o seguinte caso real: Rogério é casado no papel há 15 anos com Helena em Campinas. Em 2021, transferido para Belo Horizonte a trabalho, apaixona-se por Camila. Sem nunca se divorciar de Helena, Rogério apresenta uma certidão de nascimento desatualizada e casa-se formalmente com Camila em cartório mineiro.\n\nTrês anos depois, Rogério falece repentinamente. No inventário, Helena e Camila comparecem com certidões de casamento válidas na mão, enquanto um terceiro filho surge, registrado por um vizinho da família como se fosse dele.\n\nEste cenário ilustra exatamente o porquê de o Direito Penal intervir nas relações familiares. A família não é apenas um vínculo afetivo privado: ela é a **célula-base da sociedade** (art. 226 da Constituição) e sua estabilidade jurídica é protegida pelo Código Penal no **Título VII (Arts. 235 a 249)**.',
        em_portugues_claro: 'A lei penal não se intromete em brigas comuns de casal, mas pune com rigor condutas que fraudam o casamento civil, falsificam a paternidade de crianças ou abandonam filhos sem comida ou escola.',
        exemplo: 'Rogério cometeu o crime de **Bigamia (art. 235 do CP)**. E o vizinho que registrou o filho alheio praticou o chamado "parto suposto" ou "adoção à brasileira" (art. 242 do CP).'
      }
    },

    // ── Página 2: O Bem Jurídico Tutelado ──
    {
      aula_id: AULA_ID,
      ordem: 2,
      tipo: 'destaque',
      payload: {
        tom: 'info',
        titulo: 'O Bem Jurídico e os 4 Pilares da Tutela Penal',
        texto: 'O Título VII do Código Penal tutela a instituição e organização da família, dividida em 4 pilares normativos:\n\n1. O casamento civil como ato solene público;\n2. A certeza e verdade jurídica do estado de filiação;\n3. O dever recíproco de sustento e assistência moral e material;\n4. O regular exercício do pátrio poder, guarda e tutela.'
      }
    },

    // ── Página 3: Storytelling Ato 1 — Bigamia ──
    {
      aula_id: AULA_ID,
      ordem: 3,
      tipo: 'leitura',
      payload: {
        titulo: 'Ato I: Bigamia e Crimes Contra o Casamento',
        conteudo: 'O artigo 235 do Código Penal define o crime de **Bigamia**: *"Contrair alguém, sendo casado, novo casamento. Pena: reclusão, de 2 a 6 anos"*. \n\n### Quem responde pelo crime?\n- **O bígamo (sujeito ativo):** responde pelo caput do art. 235.\n- **O segundo cônjuge:** se sabia que a outra pessoa já era casada, responde como partícipe ou pela figura do § 1º (*"Aquele que, não sendo casado, contrai casamento com pessoa casada, conhecendo essa circunstância"* — pena de reclusão de 1 a 3 anos).\n- Se o segundo cônjuge foi enganado de boa-fé, ele é **vítima**, não comete crime algum!',
        em_portugues_claro: 'Casar duas vezes no civil dá cadeia. Quem casa sabendo que o parceiro já é casado também responde por crime.',
        pegadinha: 'Atenção para a OAB: e se a pessoa já casada mantiver apenas uma união estável ou concubinato com outra? Não há crime de bigamia! O tipo penal exige formalização de novo casamento civil formal.'
      }
    },

    // ── Página 4: Flashcard Bigamia ──
    {
      aula_id: AULA_ID,
      ordem: 4,
      tipo: 'flashcard',
      payload: {
        frente: 'A união estável simultânea configura o crime de Bigamia (Art. 235 do CP)?',
        verso: 'NÃO.',
        explicacao: 'O crime de bigamia exige que o agente contraia novo casamento civil formal. Em Direito Penal, veda-se a analogia in malam partem; portanto, manter união estável, concubinato ou namoro paralelo não preenche o tipo penal do art. 235.',
        exemplo: 'Carlos é casado no civil com Laura e vive em união estável com Bruna. Carlos não comete bigamia, pois não formalizou segundo casamento no cartório.',
        aplicando: 'Em questões de concurso, qualquer menção a união estável ou noivado simultâneo como "crime de bigamia" torna a assertiva incorreta.'
      }
    },

    // ── Página 5: Storytelling Ato 2 — Filiação e Adoção à Brasileira ──
    {
      aula_id: AULA_ID,
      ordem: 5,
      tipo: 'leitura',
      payload: {
        titulo: 'Ato II: Parto Suposto e a Adoção à Brasileira',
        conteudo: 'No segundo capítulo do Título VII, o Código Penal protege o **estado de filiação**, isto é, o direito sagrado de cada ser humano saber quem são seus pais e ter seu registro civil correspondente à verdade biológica ou legal.\n\n### O que é a "Adoção à Brasileira"?\nOcorre quando alguém registra como seu o filho de outrem (Art. 242: *"Dar parto alheio como próprio; registrar como seu o filho de outrem"* — pena: reclusão de 2 a 6 anos).\n\nMuitas vezes, famílias simples pegam recém-nascidos abandonados ou entregues pela mãe biológica e vão diretamente ao cartório declarando serem os pais biológicos, sem passar pelo processo judicial de adoção.\n\n### Existe Perdão Judicial?\n**SIM!** O parágrafo único do art. 242 estabelece: *"Se o crime é praticado por motivo de reconhecida nobreza, o juiz pode deixar de aplicar a pena"*. O STJ reconhece amplamente o perdão quando comprovado que o casal agiu por amor e dedicação à criança.',
        em_portugues_claro: 'Registrar filho de outra pessoa no cartório como se fosse seu é crime contra o estado de filiação. Porém, se foi feito por amor e compaixão ("motivo nobre"), o juiz pode perdoar a pena.',
        exemplo: 'Dona Maria acolhe o bebê de uma vizinha em vulnerabilidade extrema e o registra em seu nome. Trata-se de adoção à brasileira com aplicação do perdão judicial pelo motivo nobre.'
      }
    },

    // ── Página 6: Flashcard Adoção à Brasileira ──
    {
      aula_id: AULA_ID,
      ordem: 6,
      tipo: 'flashcard',
      payload: {
        frente: 'Quem registra filho de outra pessoa como próprio comete qual crime e cabe perdão judicial?',
        verso: 'Comete crime contra o estado de filiação (Art. 242 do CP) e cabe perdão judicial.',
        explicacao: 'O registro de filho alheio como próprio (adoção à brasileira) tipifica o art. 242 do CP. Conforme o parágrafo único, se o crime for praticado por motivo de reconhecida nobreza, o juiz pode deixar de aplicar a pena (perdão judicial).',
        aplicando: 'O perdão judicial extingue a punibilidade do agente (art. 107, IX, CP), não deixando reincidência nem maus antecedentes.'
      }
    },

    // ── Página 7: Linha do Tempo dos Crimes Contra a Família ──
    {
      aula_id: AULA_ID,
      ordem: 7,
      tipo: 'linha_tempo',
      payload: {
        titulo: 'Linha do Tempo Estrutural dos Crimes Contra a Família',
        eventos: [
          {
            marco: 'Capítulo I • Arts. 235 a 240',
            titulo: 'Crimes Contra o Casamento',
            descricao: 'Tutela a solenidade matrimonial. Destaque: Bigamia (art. 235) e Induzimento a erro essencial / ocultação de impedimento (art. 236).'
          },
          {
            marco: 'Capítulo II • Arts. 241 a 243',
            titulo: 'Crimes Contra o Estado de Filiação',
            descricao: 'Tutela a verdade registral e biológica. Destaque: Parto suposto e Adoção à brasileira (art. 242) e Sonegação de estado de filiação (art. 243).'
          },
          {
            marco: 'Capítulo III • Arts. 244 a 247',
            titulo: 'Crimes Contra a Assistência Familiar',
            descricao: 'Tutela o dever de socorro mútuo e criação. Destaque: Abandono material (art. 244) e Abandono intelectual / escolar (art. 246).'
          },
          {
            marco: 'Capítulo IV • Arts. 248 a 249',
            titulo: 'Crimes Contra o Pátrio Poder e Tutela',
            descricao: 'Tutela o exercício legítimo da guarda. Destaque: Induzimento a fuga ou entrega arbitrária (art. 248) e Subtração de incapaz (art. 249).'
          }
        ]
      }
    },

    // ── Página 8: Storytelling Ato 3 — Assistência Familiar e Abandono ──
    {
      aula_id: AULA_ID,
      ordem: 8,
      tipo: 'leitura',
      payload: {
        titulo: 'Ato III: Abandono Material e Intelectual',
        conteudo: 'O dever da família não cessa com o nascimento; ele impõe o dever ativo de sustento e formação dos filhos.\n\n### 1. Abandono Material (Art. 244 do CP)\nComete crime quem, sem justa causa, deixa de prover a subsistência do cônjuge, filho menor de 18 anos ou inapto para o trabalho, ou ascendente idoso. Também comete crime quem deixa de pagar pensão alimentícia judicialmente acordada ou fixada.\n\n*Atenção:* A prisão civil de até 3 meses na vara de família **não impede** a responsabilização penal pelo art. 244! São esferas autônomas.\n\n### 2. Abandono Intelectual (Art. 246 do CP)\nConsiste em deixar, sem justa causa, de prover a instrução primária de filho em idade escolar. O direito à educação básica é dever intransponível dos pais perante o Estado.',
        em_portugues_claro: 'Deixar de pagar pensão tendo condições financeiras é crime de abandono material. Não colocar o filho na escola primária sem justificativa é crime de abandono intelectual.',
        exemplo: 'Pai empresário com alto padrão de vida deixa de pagar pensão fixada judicialmente para os filhos menores por pura vingança contra a ex-cônjuge. Ele comete o crime do art. 244 do Código Penal.'
      }
    },

    // ── Página 9: Desafio de Fixação 1 ──
    {
      aula_id: AULA_ID,
      ordem: 9,
      tipo: 'pergunta',
      payload: {
        enunciado: 'Sobre o crime de Bigamia previsto no artigo 235 do Código Penal, assinale a alternativa juridicamente correta:',
        opcoes: [
          {
            id: 'a',
            texto: 'A união estável paralela e simultânea ao casamento válido é suficiente para tipificar o crime de bigamia.'
          },
          {
            id: 'b',
            texto: 'O segundo cônjuge que contrai matrimônio sabendo da condição de casado do outro também responde criminalmente.'
          },
          {
            id: 'c',
            texto: 'Se o primeiro casamento era anulável, a bigamia subsiste mesmo após trânsito em julgado de sentença que anule o primeiro vínculo.'
          },
          {
            id: 'd',
            texto: 'Trata-se de crime culposo, punido apenas com pena de detenção e multa.'
          }
        ],
        resposta_correta: {
          id_correto: 'b'
        },
        explicacao: 'Correta a alternativa B! Conforme o § 1º do art. 235 do CP, aquele que, não sendo casado, contrai casamento com pessoa casada, conhecendo essa circunstância, comete crime punido com reclusão de 1 a 3 anos. A alternativa A está errada porque união estável não configura bigamia.'
      }
    },

    // ── Página 10: Desafio de Fixação 2 ──
    {
      aula_id: AULA_ID,
      ordem: 10,
      tipo: 'pergunta',
      payload: {
        enunciado: 'A respeito dos crimes contra o estado de filiação e assistência familiar, assinale a opção correta:',
        opcoes: [
          {
            id: 'a',
            texto: 'A prisão civil do devedor de alimentos extingue a tipicidade do crime de abandono material (art. 244 do CP).'
          },
          {
            id: 'b',
            texto: 'No crime de registrar filho alheio como próprio (art. 242 do CP), o juiz pode conceder perdão judicial se o motivo for de reconhecida nobreza.'
          },
          {
            id: 'c',
            texto: 'O abandono intelectual restringe-se exclusivamente a não custear faculdade particular de filho maior de 18 anos.'
          },
          {
            id: 'd',
            texto: 'O crime de parto suposto exige obrigatoriamente violência ou grave ameaça contra a gestante.'
          }
        ],
        resposta_correta: {
          id_correto: 'b'
        },
        explicacao: 'Correta a alternativa B! O parágrafo único do art. 242 do CP prevê expressamente o perdão judicial quando o crime for praticado por motivo de reconhecida nobreza (adoção à brasileira de boa-fé). A prisão civil não afasta o crime de abandono material (esferas independentes).'
      }
    },

    // ── Página 11: Checkpoint de Consolidação ──
    {
      aula_id: AULA_ID,
      ordem: 11,
      tipo: 'checkpoint',
      payload: {
        titulo: 'Síntese de Fixação: Crimes Contra a Família',
        aprendeu: [
          'A Família é protegida penalmente no Título VII do Código Penal em 4 capítulos essenciais.',
          'Bigamia (art. 235) exige casamento civil formal — união estável paralela não configura o tipo penal.',
          'O partícipe que se casa conhecendo a condição de casado do outro também responde por crime (§ 1º).',
          'Registrar filho alheio como próprio (adoção à brasileira) admite Perdão Judicial por motivo de reconhecida nobreza (art. 242, parágrafo único).',
          'Abandono Material (art. 244) e prisão civil por alimentos atuam em esferas jurídicas distintas e independentes.'
        ],
        pergunta_reflexiva: 'Se um casal registra uma criança encontrada abandonada para salvá-la, por que a lei considera crime, mas autoriza o juiz a perdoar?',
        proximo: 'Parabéns! Você dominou a tutela penal da família. Prossiga para fixar com simulados e jurisprudência.'
      }
    }
  ];

  console.log(`Inserindo ${blocos.length} novos blocos estruturados em storytelling e didática...`);
  const { data, error } = await supabase.from('aprender_blocos').insert(blocos).select();

  if (error) {
    console.error('Erro ao inserir blocos:', error);
    process.exit(1);
  }

  console.log(`Sucesso! ${data.length} blocos inseridos na aula.`);
}

main().catch(console.error);
