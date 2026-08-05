import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AREAS = {
  CONST: '93c9131e-9991-465c-a632-7b4193e2f9e4',
  CIVIL: 'e65dfa40-27bb-4448-a584-33d35363c4b3',
  PROC_CIVIL: 'fbaae877-212d-4243-b062-ae272b86bd28',
  PENAL: '892fe81f-e205-4cbd-b931-20582a8658c1',
  PROC_PENAL: 'e372f6d5-b87c-43a0-b249-81a548d11016',
  TRABALHO: '3366e5bb-0484-4d07-8b0c-55e72d62fe15',
  TRIBUTARIO: '03d30b31-a83f-4099-a047-9eaa7aa86c01'
};

const PACOTE_CONSTITUCIONAL = [
  {
    area_id: AREAS.CONST,
    slug: 'direitos-e-garantias-fundamentais',
    titulo: 'Direitos e Garantias Fundamentais',
    resumo: 'Artigo 5º da CF/88: Princípios, direitos individuais e coletivos, remédios constitucionais.',
    ordem: 1,
    aulas: [
      {
        slug: 'artigo-5-direitos-individuais',
        titulo: 'Art. 5º - Vida, Liberdade, Igualdade e Propriedade',
        objetivo: 'Compreender os direitos fundamentais inscritos no caput e incisos do art. 5º da CF/88.',
        duracao_est_min: 20,
        ordem: 1,
        status: 'published',
        blocos: [
          {
            tipo: 'citacao',
            ordem: 1,
            payload: {
              autor: 'Constituição Federal - Art. 5º',
              texto: 'Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade.'
            }
          },
          {
            tipo: 'leitura',
            ordem: 2,
            payload: {
              titulo: 'A Titularidade e Características dos Direitos Fundamentais',
              conteudo: `Embora o texto do caput mencione "brasileiros e estrangeiros residentes no País", a jurisprudência consolidada do Supremo Tribunal Federal (STF) estende a proteção dos direitos fundamentais a **QUALQUER estrangeiro que esteja no território nacional**, ainda que seja turista ou em passagem transitória.\n\n**Principais Características dos Direitos Fundamentais:**\n• **Inalienabilidade**: Não possuem conteúdo econômico-financeiro para serem vendidos ou negociados.\n• **Imprescritibilidade**: Não se perdem pelo decurso do tempo (podem ser exercidos a qualquer momento).\n• **Irrenunciabilidade**: O titular não pode renunciar definitivamente a eles.\n• **Relatividade (Não Absolutismo)**: Não existem direitos fundamentais absolutos no ordenamento brasileiro. Até o direito à vida sofre exceção legal (pena de morte em caso de guerra declarada, Art. 5º, XLVII, 'a').`
            }
          },
          {
            tipo: 'destaque',
            ordem: 3,
            payload: {
              tom: 'alerta',
              titulo: 'Pegadinha Clássica de Prova!',
              texto: 'Existe algum direito fundamental absoluto no Brasil? NÃO! Nem mesmo o direito à vida é absoluto, pois a própria Constituição autoriza a pena de morte em caso de guerra declarada (Art. 5º, XLVII, a).'
            }
          },
          {
            tipo: 'mapa_mental',
            ordem: 4,
            payload: {
              raiz: 'Direitos Fundamentais (Art. 5º)',
              definicao_raiz: 'Proteções essenciais à pessoa humana na CF/88.',
              ramos: [
                {
                  titulo: 'Titularidade',
                  definicao: 'Brasileiros natos/naturalizados e estrangeiros (inclusive não residentes).',
                  itens: [{ termo: 'Turistas', definicao: 'Protegidos pelos direitos fundamentais.' }]
                },
                {
                  titulo: 'Características',
                  definicao: 'Atributos jurídicos dos direitos fundamentais.',
                  itens: [
                    { termo: 'Imprescritíveis', definicao: 'Não somem com o tempo.' },
                    { termo: 'Irrenunciáveis', definicao: 'Titular não pode abrir mão.' },
                    { termo: 'Relativos', definicao: 'Não há direito absoluto.' }
                  ]
                }
              ]
            }
          },
          {
            tipo: 'checkpoint',
            ordem: 5,
            payload: {
              enunciado: 'Segundo o entendimento firmado pelo STF, um estrangeiro não residente no Brasil (turista) goza das garantias dos direitos fundamentais previstos no art. 5º da CF/88.',
              alternativas: [
                { letra: 'A', texto: 'Certo', correta: true, explicacao: 'Correto! O STF pacificou que o rol do art. 5º abrange estrangeiros em trânsito no país.' },
                { letra: 'B', texto: 'Errado', correta: false, explicacao: 'Incorreto.' }
              ]
            }
          }
        ]
      },
      {
        slug: 'remedios-constitucionais',
        titulo: 'Remédios Constitucionais: HC, MS, HD, MI e Ação Popular',
        objetivo: 'Diferenciar o cabimento e as hipóteses de aplicação dos remédios constitucionais de proteção.',
        duracao_est_min: 25,
        ordem: 2,
        status: 'published',
        blocos: [
          {
            tipo: 'leitura',
            ordem: 1,
            payload: {
              titulo: 'As Ações Constitucionais de Garantia',
              conteudo: `Os remédios constitucionais são instrumentos jurídicos postos à disposição dos cidadãos para provocar a intervenção do Poder Judiciário visando à proteção de direitos fundamentais violados ou ameaçados por ilegalidade ou abuso de poder.\n\n1. **Habeas Corpus (Art. 5º, LXVIII)**: Protege a **liberdade de locomoção** (ir, vir e permanecer). É gratuito e não exige advogado.\n2. **Habeas Data (Art. 5º, LXXII)**: Assegura o conhecimento de informações relativas à pessoa do impetrante constantes de registros ou bancos de dados de entidades governamentais. É gratuito.\n3. **Mandado de Segurança (Art. 5º, LXIX)**: Protege **direito líquido e certo** não amparado por HC ou HD.\n4. **Mandado de Injunção (Art. 5º, LXXI)**: Supre a **falta de norma regulamentadora** que torne inviável o exercício de direitos constitucionais.\n5. **Ação Popular (Art. 5º, LXXIII)**: Proposta por **qualquer cidadão (em gozo dos direitos políticos)** para anular ato lesivo ao patrimônio público, moralidade administrativa, meio ambiente e patrimônio histórico.`
            }
          },
          {
            tipo: 'destaque',
            ordem: 2,
            payload: {
              tom: 'info',
              titulo: 'Gratuidade dos Remédios Constitucionais',
              texto: 'São GRATUITOS por força da Constituição (Art. 5º, LXXVII):\n• Habeas Corpus (HC)\n• Habeas Data (HD)\n\nA Ação Popular é gratuita, SALVO comprovada má-fé do autor.'
            }
          },
          {
            tipo: 'flashcard',
            ordem: 3,
            payload: {
              frente: 'Quem tem legitimidade para propor Ação Popular?',
              verso: 'Qualquer CIDADÃO (brasileiro nato ou naturalizado no gozo dos seus direitos políticos, comprovado pelo título de eleitor).'
            }
          }
        ]
      }
    ]
  }
];

const PACOTE_CIVIL = [
  {
    area_id: AREAS.CIVIL,
    slug: 'parte-geral-lindb-e-pessoas',
    titulo: 'LINDB e Pessoas Naturais',
    resumo: 'Lei de Introdução às Normas do Direito Brasileiro e Capacidade das Pessoas Naturais.',
    ordem: 1,
    aulas: [
      {
        slug: 'lindb-vigencia-e-eficacia',
        titulo: 'Vigência e Eficácia da Lei no Tempo (LINDB)',
        objetivo: 'Compreender a vacatio legis, repristinação e irretroatividade da lei no Direito Civil.',
        duracao_est_min: 15,
        ordem: 1,
        status: 'published',
        blocos: [
          {
            tipo: 'citacao',
            ordem: 1,
            payload: {
              autor: 'LINDB - Art. 1º',
              texto: 'Salvo disposição em contrário, a lei começa a vigorar em todo o país 45 dias depois de oficialmente publicada.'
            }
          },
          {
            tipo: 'leitura',
            ordem: 2,
            payload: {
              titulo: 'Vacatio Legis e Regras de Vigência',
              conteudo: `A Lei de Introdução às Normas do Direito Brasileiro (LINDB - Decreto-Lei nº 4.657/1942) rege a aplicação do direito civil no espaço e no tempo.\n\n**Regra Geral de Vigência:**\n• No território nacional: a lei entra em vigor **45 dias** após a publicação oficial, salvo se a própria lei fixar prazo diferente.\n• No exterior: quando admitida, entra em vigor **3 meses** após a publicação.\n\n**Repristinação:** A restauração de uma lei revogada pela revogação da lei que a revogou. No Brasil, **NÃO há repristinação automática**; ela só ocorre se houver previsão expressa do legislador.`
            }
          },
          {
            tipo: 'flashcard',
            ordem: 3,
            payload: {
              frente: 'Ocorre repristinação automática de normas jurídicas no Brasil?',
              verso: 'NÃO! A repristinação no Brasil depende obrigatoriamente de declaração expressa da lei nova.'
            }
          }
        ]
      }
    ]
  }
];

const PACOTE_PROC_PENAL = [
  {
    area_id: AREAS.PROC_PENAL,
    slug: 'inquerito-policial-e-acao-penal',
    titulo: 'Inquérito Policial e Ação Penal',
    resumo: 'Características do IP, instauração, indiciamento, arquivamento e espécies de Ação Penal.',
    ordem: 1,
    aulas: [
      {
        slug: 'inquerito-policial-caracteristicas',
        titulo: 'Características do Inquérito Policial',
        objetivo: 'Dominar o conceito de IP e suas características (Procedimento inquisitorial, escrito, sigiloso e indisponível).',
        duracao_est_min: 20,
        ordem: 1,
        status: 'published',
        blocos: [
          {
            tipo: 'leitura',
            ordem: 1,
            payload: {
              titulo: 'Conceito e Características do Inquérito Policial',
              conteudo: `O Inquérito Policial (IP) é um procedimento administrativo inquisitório e preparatório, presidido pelo Delegado de Polícia, com o objetivo de apurar a autoria e a materialidade de uma infração penal para fundamentar a ação penal.\n\n**Principais Características do IP (Mnemônico: SEIA-DIS):**\n1. **Sigiloso**: A autoridade assegurará o sigilo necessário à elucidação do fato (ressalvadas as prerrogativas dos advogados, Súmula Vinculante 14 do STF).\n2. **Escrito**: Todas as peças do IP serão reduzidas a escrito ou datilografadas/digitadas e rubricadas pela autoridade.\n3. **Inquisitorial**: Não há contraditório amplo nem ampla defesa na fase investigatória.\n4. **Autorritratável / Indisponível**: A autoridade policial **NÃO PODE determinar o arquivamento** do inquérito policial (Art. 17 do CPP).\n5. **Discrisionário**: O delegado conduz as diligências conforme a conveniência da investigação.`
            }
          },
          {
            tipo: 'citacao',
            ordem: 2,
            payload: {
              autor: 'Código de Processo Penal - Art. 17',
              texto: 'A autoridade policial não poderá mandar arquivar autos de inquérito.'
            }
          },
          {
            tipo: 'destaque',
            ordem: 3,
            payload: {
              tom: 'alerta',
              titulo: 'Súmula Vinculante 14 do STF',
              texto: 'É direito do defensor, no interesse do representado, ter acesso amplo aos elementos de prova que, JÁ DOCUMENTADOS em procedimento investigatório realizado por órgão com competência de polícia judiciária, digam respeito ao exercício do direito de defesa.'
            }
          },
          {
            tipo: 'checkpoint',
            ordem: 4,
            payload: {
              enunciado: 'Se o Delegado de Polícia se convencer de que o fato investigado é atípico, ele tem atribuição para determinar diretamente o arquivamento do inquérito policial.',
              alternativas: [
                { letra: 'A', texto: 'Certo', correta: false, explicacao: 'Incorreto! Conforme o Art. 17 do CPP, a autoridade policial JAMAIS pode determinar o arquivamento do inquérito.' },
                { letra: 'B', texto: 'Errado', correta: true, explicacao: 'Exato! O arquivamento depende do Poder Judiciário/Ministério Público.' }
              ]
            }
          }
        ]
      }
    ]
  }
];

async function seedCompleto() {
  console.log('=== Iniciando Ingestão de Pacotes do Aprender ===');

  const pacotes = [...PACOTE_CONSTITUCIONAL, ...PACOTE_CIVIL, ...PACOTE_PROC_PENAL];

  for (const mod of pacotes) {
    const { data: modExist } = await supabase
      .from('aprender_modulos')
      .select('id')
      .eq('area_id', mod.area_id)
      .eq('slug', mod.slug)
      .maybeSingle();

    let moduloId = modExist?.id;

    if (!moduloId) {
      const { data: newMod, error: insErr } = await supabase
        .from('aprender_modulos')
        .insert({
          area_id: mod.area_id,
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

  console.log('=== Ingestão Concluída com Sucesso! ===');
}

seedCompleto().catch(console.error);
