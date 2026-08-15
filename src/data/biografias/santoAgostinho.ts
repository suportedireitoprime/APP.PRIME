import { BiografiaData } from '@/types/biografia';

export const santoAgostinhoData: BiografiaData = {
  id: 'santoAgostinho',
  categoriaId: 'filosofos',
  nome: 'Santo Agostinho',
  subtitulo: 'O pilar da filosofia patrística que uniu a razão platônica à fé cristã, moldando o pensamento ocidental.',
  imagemUrl: '/biografias/santoagostinho-capa.jpg',
  epoca: 'Idade Média',
  ordemEpoca: 4,
  datasVida: '(354 – 430)',
  tabs: [
    {
      id: 'historia',
      label: 'História',
      conteudo_md: `
## O Pecador que se tornou Santo

Aurélio Agostinho nasceu em Tagaste, no norte da África (atual Argélia), em uma época de profunda transformação: o Império Romano entrava em colapso e o Cristianismo começava a se consolidar como força espiritual e política dominante. 

Antes de se tornar a voz definitiva da Igreja na Antiguidade Tardia, Agostinho foi um jovem inquieto, apaixonado pelos prazeres do mundo e pela retórica clássica. Sua famosa obra *Confissões* detalha sua juventude turbulenta, sua adesão inicial ao Maniqueísmo (que dividia o mundo em bem absoluto e mal absoluto) e sua busca incessante pela verdade.

Sua conversão ao Cristianismo, ocorrida em Milão sob a influência de Santo Ambrósio e das lágrimas de sua mãe, Santa Mônica, marcou não apenas a sua vida, mas o destino de toda a filosofia ocidental. Agostinho não abandonou a razão; ele a cristianizou. Ele adaptou a filosofia de Platão (através do neoplatonismo) para explicar a doutrina cristã, criando uma síntese poderosa onde **a fé precede a razão, mas a razão confirma a fé**.

## O Colapso de Roma e a "Cidade de Deus"

Em 410 d.C., o império tremeu: Roma foi saqueada pelos visigodos. Os pagãos culparam os cristãos, alegando que o abandono dos deuses antigos havia trazido a ruína. Foi em resposta a essa crise monumental que Agostinho escreveu sua obra magna: *A Cidade de Deus*.

Ele concebeu a humanidade dividida em duas cidades místicas: a **Cidade Terrena**, movida pelo amor a si mesmo e pelo poder (representada por Roma), e a **Cidade de Deus**, movida pelo amor a Deus e destinada à eternidade. Essa obra não apenas defendeu o Cristianismo, mas lançou as bases para o pensamento político medieval, a separação entre a Igreja e o Estado, e a noção de que os reinos humanos são temporários e falhos.
      `
    },
    {
      id: 'obras',
      label: 'Principais Obras',
      conteudo_md: `
## A Cidade de Deus (De Civitate Dei)
Escrita entre 413 e 426, é uma das obras mais influentes da história política e teológica. Agostinho defende que o verdadeiro cidadão cristão pertence à Cidade Celestial, e que a queda de Roma não é a queda do mundo. Esta obra fundou a filosofia da história, vendo o tempo de forma linear, guiado pela providência divina.

## Confissões (Confessiones)
A primeira autobiografia psicológica do Ocidente. Nela, Agostinho explora sua interioridade, seus pecados de juventude, sua conversão e sua complexa reflexão sobre o tempo e a memória. É um tratado profundo sobre a condição humana e a busca da alma por Deus.

## Da Doutrina Cristã (De Doctrina Christiana)
Um manual de teologia e exegese bíblica, onde Agostinho estabelece os princípios da hermenêutica (interpretação de textos). Ele defende que todo conhecimento secular útil (como a lógica e a retórica clássica) deve ser apropriado pelo cristão para a compreensão da verdade divina.
      `
    },
    {
      id: 'tabela',
      label: 'Agostinho vs Pagãos',
      tabela: {
        oponenteNome: 'Pensamento Pagão/Secular',
        items: [
          {
            topico: 'A Queda de Roma',
            personagem: 'Um evento trágico, mas temporal. Roma é a Cidade Terrena, fadada à corrupção e à ruína, não é o fim da humanidade.',
            oponente: 'A queda de Roma ocorreu porque o Império abandonou os deuses antigos que garantiam sua proteção material e sucesso.'
          },
          {
            topico: 'Fé e Razão',
            personagem: '"Creio para entender, entendo para crer." A fé purifica a mente para que a razão possa alcançar a verdade absoluta.',
            oponente: 'A razão humana é autossuficiente e capaz de compreender o cosmos e a ética sem a necessidade de revelação divina.'
          },
          {
            topico: 'Natureza do Mal',
            personagem: 'O mal não é uma força oposta a Deus, mas sim a "privação do bem" (privatio boni) e uma falha na vontade livre do homem.',
            oponente: 'O mal é uma força material e substancial, em constante guerra cósmica contra as forças da luz e do bem (Dualismo/Maniqueísmo).'
          },
          {
            topico: 'A História Humana',
            personagem: 'A história é linear, providencial e tem um propósito: a salvação. Move-se de um início (Criação) para um fim (Juízo Final).',
            oponente: 'O tempo e a história são cíclicos (o eterno retorno), repetindo-se infinitamente sem um propósito ou fim moral definitivo.'
          }
        ]
      }
    },
    {
      id: 'linha_do_tempo',
      label: 'Linha do Tempo',
      timeline: [
        {
          ano: '354',
          evento: 'Nascimento em Tagaste',
          detalhe: 'Nasce na província da Numídia, no norte da África, filho de Patrício (um pagão) e Mônica (uma cristã devota).'
        },
        {
          ano: '386',
          evento: 'A Conversão em Milão',
          detalhe: 'Após uma crise espiritual em um jardim em Milão, onde ouviu uma voz infantil dizendo "Tolle, lege" (Toma e lê), ele se converte definitivamente ao Cristianismo.'
        },
        {
          ano: '395',
          evento: 'Ordenado Bispo de Hipona',
          detalhe: 'Torna-se Bispo de Hipona (atual Annaba, Argélia), assumindo o papel de pastor, teólogo e defensor implacável da doutrina da Igreja contra heresias.'
        },
        {
          ano: '410',
          evento: 'O Saque de Roma',
          detalhe: 'A notícia do saque de Roma pelos visigodos abala o mundo, motivando Agostinho a iniciar a escrita monumental de "A Cidade de Deus".'
        },
        {
          ano: '430',
          evento: 'Morte durante o Cerco Vândalo',
          detalhe: 'Falece aos 76 anos em Hipona, enquanto a cidade estava sendo sitiada pelos vândalos. Sua biblioteca, porém, sobrevive.'
        }
      ]
    },
    {
      id: 'legado',
      label: 'Legado Filosófico',
      conteudo_md: `
## A Interioridade e a Memória
Antes de Descartes afirmar "Penso, logo existo", Agostinho formulou: "Se me engano, existo" (*Si fallor, sum*). Ele foi o primeiro grande pensador a voltar o foco filosófico para a **interioridade humana**, explorando a psicologia da memória e a experiência subjetiva do tempo nas *Confissões*.

## A Sintese Neoplatônica-Cristã
O grande triunfo de Agostinho foi "batizar" Platão. Ele tomou o Mundo das Ideias platônico e o colocou na mente do Deus cristão. O que antes eram conceitos abstratos de um Demiurgo, tornaram-se os pensamentos eternos do Deus Criador, solidificando a base intelectual da teologia ocidental por mais de mil anos.

## A Vontade e o Livre Arbítrio
Diferente dos filósofos gregos clássicos que viam o mal como pura ignorância (Sócrates), Agostinho destacou o papel da **Vontade**. O ser humano, dotado de livre arbítrio, pode escolher virar as costas ao bem superior em favor de bens inferiores. O mal nasce da escolha corrompida da vontade, não de uma força criadora maléfica.
      `
    },
    {
      id: 'direito',
      label: 'O Pensamento Jurídico',
      conteudo_md: `
## Lei Eterna e Lei Temporal
No campo do pensamento jurídico e político, Agostinho estabeleceu uma distinção crucial. A **Lei Eterna** é a razão e a vontade divina que ordena a preservação da ordem natural. A **Lei Temporal** (ou lei humana) deriva sua legitimidade apenas na medida em que reflete a justiça da Lei Eterna. 

## A Justiça como Base do Estado
Agostinho lançou uma provocação célebre em *A Cidade de Deus*: 

> *"Sem a justiça, o que são os reinos senão grandes bandos de ladrões?"*

Para ele, o Estado não é o ápice moral do homem (como era para Aristóteles), mas um mal necessário, uma consequência do pecado original, cuja função primária é manter a ordem e a paz terrena temporária através da coação. O Estado pune os injustos, mas a verdadeira justiça e felicidade só podem ser encontradas na Cidade de Deus.

Esta visão desmistificou o poder político sagrado de Roma e lançou a semente intelectual que justificaria, durante a Idade Média, a supremacia do poder espiritual (a Igreja) sobre o poder temporal (o Estado).
      `
    }
  ]
};
