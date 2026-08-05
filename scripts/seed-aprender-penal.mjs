import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PENAL_AREA_ID = '892fe81f-e205-4cbd-b931-20582a8658c1';

const MODULOS_PENAL = [
  {
    slug: 'teoria-do-crime-fato-tipico',
    titulo: 'Teoria do Crime: Fato Típico',
    resumo: 'Conceito analítico de crime, conduta, nexo causal, resultado e tipicidade formal e material.',
    ordem: 3,
    aulas: [
      {
        slug: 'conceito-analitico-de-crime',
        titulo: 'Conceito Analítico de Crime',
        objetivo: 'Compreender o conceito tripartido de crime (Fato Típico, Ilicitude e Culpabilidade) segundo a teoria dominada no Brasil.',
        duracao_est_min: 15,
        ordem: 1,
        status: 'published',
        blocos: [
          {
            tipo: 'leitura',
            ordem: 1,
            payload: {
              titulo: 'O Conceito Tripartido de Crime',
              conteudo: `Para o Direito Penal brasileiro moderno (adotado pela doutrina majoritária e pelo STF/STJ), crime sob o aspecto analítico é a **conduta típica, ilícita (antijurídica) e culpável** (Teoria Tripartida ou Tridimensional).\n\nPara que uma ação humana seja considerada crime e resulte na aplicação de uma pena, ela precisa obrigatoriamente preencher esses três degraus sucessivos:\n\n1. **Fato Típico**: A conduta humana descrita abstratamente na lei como infração penal (ex.: "Matar alguém", art. 121 do CP).\n2. **Ilicitude (ou Antijuridicidade)**: A contrariedade entre a conduta típica e o ordenamento jurídico, sem que exista uma causa legal de exclusão (como a legítima defesa).\n3. **Culpabilidade**: O juízo de reprovação social que incide sobre o autor do fato (imputabilidade, potencial consciência da ilicitude e exigibilidade de conduta diversa).\n\n*Atenção:* A punibilidade não é elemento do crime, mas sim sua consequência jurídica.`
            },
            markdown: `Para o Direito Penal brasileiro moderno, crime sob o aspecto analítico é o fato típico, ilícito e culpável.`
          },
          {
            tipo: 'destaque',
            ordem: 2,
            payload: {
              tom: 'info',
              titulo: 'Pegadinha da OAB / Concursos!',
              texto: 'A Teoria Bipartida sustenta que crime é apenas fato típico e ilícito, sendo a culpabilidade pressuposto da pena. Porém, a banca da OAB (FGV) e os tribunais superiores adotam a TEORIA TRIPARTIDA (Fato Típico + Ilicitude + Culpabilidade).'
            }
          },
          {
            tipo: 'mapa_mental',
            ordem: 3,
            payload: {
              raiz: 'Conceito Analítico de Crime',
              definicao_raiz: 'Estrutura tripartida adotada pelo Direito Penal brasileiro.',
              ramos: [
                {
                  titulo: '1. Fato Típico',
                  definicao: 'Conduta, Resultado, Nexo Causal e Tipicidade.',
                  itens: [
                    { termo: 'Conduta', definicao: 'Ação ou omissão humana voluntária.' },
                    { termo: 'Tipicidade', definicao: 'Enquadramento da conduta à norma penal.' }
                  ]
                },
                {
                  titulo: '2. Ilicitude',
                  definicao: 'Ausência de causas justificantes (Legítima Defesa, Estado de Necessidade, etc.).',
                  itens: [
                    { termo: 'Antijuridicidade', definicao: 'Contrariedade ao direito.' }
                  ]
                },
                {
                  titulo: '3. Culpabilidade',
                  definicao: 'Juízo de reprovabilidade pessoal do agente.',
                  itens: [
                    { termo: 'Imputabilidade', definicao: 'Capacidade mental de entender o caráter ilícito.' }
                  ]
                }
              ]
            }
          },
          {
            tipo: 'flashcard',
            ordem: 4,
            payload: {
              frente: 'Qual é a estrutura do conceito analítico de crime adotada majoritariamente no Brasil?',
              verso: 'Fato Típico, Ilicitude (Antijuridicidade) e Culpabilidade (Teoria Tripartida).'
            }
          },
          {
            tipo: 'checkpoint',
            ordem: 5,
            payload: {
              enunciado: 'Segundo a teoria tripartida do crime adotada pela doutrina dominante no Direito Penal brasileiro, a culpabilidade integra o conceito analítico de crime.',
              alternativas: [
                { letra: 'A', texto: 'Certo', correta: true, explicacao: 'Exato! Na teoria tripartida (Welzel/Hungria), o crime é composto por Fato Típico + Ilicitude + Culpabilidade.' },
                { letra: 'B', texto: 'Errado', correta: false, explicacao: 'Incorreto. Essa visão seria a teoria bipartida, que é minoritária nas bancas de concurso.' }
              ]
            }
          }
        ]
      },
      {
        slug: 'conduta-e-suas-excludentes',
        titulo: 'Conduta Penal e Causas de Exclusão',
        objetivo: 'Estudar os elementos da conduta penal voluntária e identificar as situações que excluem a conduta totalmente.',
        duracao_est_min: 15,
        ordem: 2,
        status: 'published',
        blocos: [
          {
            tipo: 'leitura',
            ordem: 1,
            payload: {
              titulo: 'A Conduta e Suas Hipóteses de Ausência',
              conteudo: `A conduta humana é o primeiro elemento do fato típico. Ela é conceituada como a **ação ou omissão humana, consciente e voluntária, dirigida a uma finalidade** (Teoria Finalista da Ação de Hans Welzel).\n\nSe não há voluntariedade ou consciência na ação, **NÃO há conduta**, afastando o próprio fato típico na sua raiz!\n\n**Causas que EXCLUEM a conduta:**\n1. **Coação física irresistível (Vis absoluta)**: O coator responde pelo crime; o coagido não pratica conduta nenhuma (ex.: empurrar alguém forte sobre uma vitrine de loja).\n2. **Movimentos reflexos**: Reações corporais puramente biológicas sem controle do sistema nervoso central (ex.: ataque de epilepsia ou susto involuntário).\n3. **Estados de inconsciência completa**: Sono profundo, sonambulismo ou hipnose comprovada.\n4. **Força maior ou caso fortuito**: Eventos da natureza totalmente incontroláveis.`
            },
            markdown: `A conduta é a ação ou omissão humana consciente e voluntária dirigida a uma finalidade.`
          },
          {
            tipo: 'destaque',
            ordem: 2,
            payload: {
              tom: 'alerta',
              titulo: 'Coação Física vs. Coação Moral',
              texto: 'Diferença crucial para provas:\n• Coação FÍSICA irresistível: EXCLUI A CONDUTA (afasta o Fato Típico).\n• Coação MORAL irresistível: EXCLUI A CULPABILIDADE (afasta a exigibilidade de conduta diversa).'
            }
          },
          {
            tipo: 'flashcard',
            ordem: 3,
            payload: {
              frente: 'O que ocorre no caso de coação física irresistível (vis absoluta)?',
              verso: 'Exclui a própria CONDUTA humana do coagido, eliminando o Fato Típico. Somente o coator responde pelo crime.'
            }
          }
        ]
      }
    ]
  },
  {
    slug: 'ilicitude-e-culpabilidade',
    titulo: 'Ilicitude e Culpabilidade',
    resumo: 'Estudo completo das causas excludentes de ilicitude (art. 23 do CP) e dos elementos constitutivos da culpabilidade.',
    ordem: 4,
    aulas: [
      {
        slug: 'excludentes-de-ilicitude',
        titulo: 'Excludentes de Ilicitude (Art. 23 do CP)',
        objetivo: 'Dominar o Estado de Necessidade, Legítima Defesa, Estrito Cuidado do Dever Legal e Exercício Regular do Direito.',
        duracao_est_min: 20,
        ordem: 1,
        status: 'published',
        blocos: [
          {
            tipo: 'citacao',
            ordem: 1,
            payload: {
              autor: 'Código Penal - Art. 23',
              texto: 'Não há crime quando o agente pratica o fato:\nI - em estado de necessidade;\nII - em legítima defesa;\nIII - em estrito cumprimento de dever legal ou no exercício regular de direito.'
            }
          },
          {
            tipo: 'leitura',
            ordem: 2,
            payload: {
              titulo: 'Entendendo a Legítima Defesa e o Estado de Necessidade',
              conteudo: `Quando o agente pratica um fato descrito em lei como penalmente típico, presume-se que ele é ilícito, A NÃO SER que concorra uma das causas de exclusão da ilicitude do Art. 23 do Código Penal:\n\n1. **Legítima Defesa (Art. 25, CP)**: Usar moderadamente dos meios necessários para repelir **injusta agressão, atual ou iminente**, a direito seu ou de outrem.\n2. **Estado de Necessidade (Art. 24, CP)**: Praticar o fato para salvar de **perigo atual**, que não provocou por sua vontade, direito próprio ou alheio, cujo sacrifício não era razoável exigir-se.\n3. **Estrito Cumprimento do Dever Legal**: Dever imposto por lei ao agente público (ex.: policial cumprindo mandado de prisão de forma regular).\n4. **Exercício Regular do Direito**: Atuação permitida pelo direito (ex.: intervenção cirúrgica médica regular, esportes de contato).`
            }
          },
          {
            tipo: 'destaque',
            ordem: 3,
            payload: {
              tom: 'info',
              titulo: 'Diferença Fundamental!',
              texto: 'Legítima defesa exige agressão INJUSTA humana (atual ou iminente). Estado de necessidade exige situação de PERIGO atual (pode advir de evento natural ou ataque de animal sem instigação).'
            }
          },
          {
            tipo: 'checkpoint',
            ordem: 4,
            payload: {
              enunciado: 'Um pedestre é atacado por um cão enfurecido que escapou da coleira. Para se defender, o pedestre mata o animal com uma pedra. O pedestre agiu amparado por:',
              alternativas: [
                { letra: 'A', texto: 'Estado de Necessidade', correta: true, explicacao: 'Correto! Como o ataque do cão não foi instigado por um ser humano como arma, trata-se de situação de perigo advinda de fato da natureza/animal, caracterizando Estado de Necessidade.' },
                { letra: 'B', texto: 'Legítima Defesa', correta: false, explicacao: 'Incorreto. A legítima defesa pressupõe agressão humana injusta.' },
                { letra: 'C', texto: 'Exercício Regular do Direito', correta: false, explicacao: 'Incorreto.' }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    slug: 'crimes-contra-o-patrimonio',
    titulo: 'Crimes Contra o Patrimônio',
    resumo: 'Estudo aprofundado do Furto (Art. 155), Roubo (Art. 157), Estelionato (Art. 171) e suas qualificadoras.',
    ordem: 5,
    aulas: [
      {
        slug: 'furto-e-roubo-distincoes',
        titulo: 'Furto vs. Roubo: Elementos e Majorantes',
        objetivo: 'Identificar a presença de violência ou grave ameaça como elemento divisor entre o crime de Furto (art. 155) e Roubo (art. 157).',
        duracao_est_min: 20,
        ordem: 1,
        status: 'published',
        blocos: [
          {
            tipo: 'leitura',
            ordem: 1,
            payload: {
              titulo: 'Subtração Patrimonial: Clandestinidade vs. Violência',
              conteudo: `Tanto no **Furto (art. 155)** quanto no **Roubo (art. 157)**, o núcleo do tipo penal é o verbo "subtrair" (chamar a si a posse de coisa alheia móvel).\n\n**A diferença essencial:**\n• **Furto**: A subtração ocorre **SEM** emprego de violência ou grave ameaça à pessoa.\n• **Roubo**: A subtração ocorre **COM** emprego de violência, grave ameaça à pessoa, ou após reduzir a vítima à impossibilidade de resistência.\n\n*Súmula 582 do STJ (Consumação):* Consuma-se o crime de roubo (e também o de furto) no momento em que o agente tenciona a posse da coisa alheia móvel, ainda que por breve espaço de tempo, sendo prescindível a posse tranqüila.`
            }
          },
          {
            tipo: 'citacao',
            ordem: 2,
            payload: {
              autor: 'Súmula 582 do STJ',
              texto: 'Consuma-se o crime de roubo com a inversão da posse do bem mediante emprego de violência ou grave ameaça, sendo prescindível a posse mansa e pacífica ou a saída da esfera de vigilância da vítima.'
            }
          },
          {
            tipo: 'flashcard',
            ordem: 3,
            payload: {
              frente: 'Qual teoria de consumação nos crimes patrimoniais é adotada pelos tribunais superiores (STF e STJ)?',
              verso: 'Teoria da Apprehensio (ou Amotio): consuma-se com a inversão da posse do bem, sendo dispensável a posse mansa e pacífica.'
            }
          }
        ]
      }
    ]
  }
];

async function seedPenal() {
  console.log('--- Iniciando Ingestão de Módulos de Direito Penal ---');

  for (const mod of MODULOS_PENAL) {
    const { data: modExist } = await supabase
      .from('aprender_modulos')
      .select('id')
      .eq('area_id', PENAL_AREA_ID)
      .eq('slug', mod.slug)
      .maybeSingle();

    let moduloId = modExist?.id;

    if (!moduloId) {
      const { data: newMod, error: insErr } = await supabase
        .from('aprender_modulos')
        .insert({
          area_id: PENAL_AREA_ID,
          slug: mod.slug,
          titulo: mod.titulo,
          resumo: mod.resumo,
          ordem: mod.ordem
        })
        .select('id')
        .single();

      if (insErr) {
        console.error(`Erro inserindo módulo ${mod.slug}:`, insErr);
        continue;
      }
      moduloId = newMod.id;
      console.log(`[Módulo Criado] ${mod.titulo} (${moduloId})`);
    } else {
      console.log(`[Módulo Existente] ${mod.titulo} (${moduloId})`);
    }

    for (const aula of mod.aulas) {
      const { data: aulaExist } = await supabase
        .from('aprender_aulas')
        .select('id')
        .eq('modulo_id', moduloId)
        .eq('slug', aula.slug)
        .maybeSingle();

      let aulaId = aulaExist?.id;

      if (!aulaId) {
        const { data: newAula, error: aulaInsErr } = await supabase
          .from('aprender_aulas')
          .insert({
            modulo_id: moduloId,
            slug: aula.slug,
            titulo: aula.titulo,
            objetivo: aula.objetivo,
            duracao_est_min: aula.duracao_est_min,
            ordem: aula.ordem,
            status: aula.status
          })
          .select('id')
          .single();

        if (aulaInsErr) {
          console.error(`Erro inserindo aula ${aula.slug}:`, aulaInsErr);
          continue;
        }
        aulaId = newAula.id;
        console.log(`  -> [Aula Criada] ${aula.titulo}`);
      } else {
        console.log(`  -> [Aula Existente] ${aula.titulo}`);
      }

      for (const bloco of aula.blocos) {
        const { error: blocoErr } = await supabase
          .from('aprender_blocos')
          .insert({
            aula_id: aulaId,
            ordem: bloco.ordem,
            tipo: bloco.tipo,
            payload: bloco.payload,
            markdown: bloco.markdown || null
          });

        if (blocoErr) {
          console.error(`     ! Erro inserindo bloco ${bloco.tipo}:`, blocoErr);
        } else {
          console.log(`     + [Bloco OK] Tipo: ${bloco.tipo}`);
        }
      }
    }
  }

  console.log('--- Ingestão de Direito Penal concluída! ---');
}

seedPenal().catch(console.error);
