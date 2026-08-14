import { BiografiaData } from '@/types/biografia';

export const socratesData: BiografiaData = {
  id: 'socrates',
  categoriaId: 'filosofos',
  nome: 'Sócrates de Atenas',
  subtitulo: 'O homem que foi condenado por fazer perguntas e ensinar os jovens a pensar.',
  imagemUrl: 'https://images.unsplash.com/photo-1598980894043-f875f284e36d?q=80&w=600&auto=format&fit=crop', // Estátua de mármore como placeholder
  tabs: [
    {
      id: 'historia',
      label: 'História',
      conteudo_md: `
## O homem mais sábio de Atenas

Sócrates não deixou uma única linha escrita. Tudo o que sabemos sobre ele nos foi relatado por seus discípulos (principalmente Platão e Xenofonte) ou por seus opositores. Nascido em Atenas (c. 470 a.C.), filho de um escultor e de uma parteira, ele costumava dizer que herdou a profissão da mãe: sua missão não era depositar verdades prontas nas mentes dos jovens, mas sim **ajudá-los a "dar à luz" as suas próprias ideias** — método que ficou conhecido como **Maiêutica**.

## O Método Socrático e a Ironia

Diferente dos professores convencionais da época, Sócrates não cobrava por suas aulas e andava descalço pelas praças de Atenas puxando conversa com qualquer um. Ele abordava políticos, artistas e cidadãos comuns, questionando: *"O que é a justiça? O que é a coragem? O que é a virtude?"*. 

Quando o interlocutor respondia, ele usava a **ironia socrática**: fingia ignorância e continuava fazendo perguntas sequenciais até que a própria pessoa percebesse as contradições em seu raciocínio. Isso irritou profundamente a elite ateniense.

## O Julgamento e a Morte

Em 399 a.C., no auge do ressentimento público, Sócrates foi processado sob duas acusações: **corromper a juventude** e **não acreditar nos deuses da cidade**.

O julgamento, relatado em *A Apologia de Sócrates*, foi o primeiro grande teatro jurídico da história. Em vez de implorar por misericórdia ou prometer parar de filosofar, Sócrates argumentou que a cidade deveria sustentá-lo pelo bem que ele fazia ao mantê-los acordados, comparando-se a uma "mutuca" (um inseto) que pica um cavalo preguiçoso para mantê-lo alerta.

Foi condenado a beber **cicuta** (um veneno) por uma diferença pequena de votos. Seus amigos propuseram a fuga, mas ele se recusou, criando o primeiro grande precedente da *obediência civil*: a lei da cidade, mesmo que injusta em sua aplicação, não deve ser quebrada para não destruir o Estado.
      `
    },
    {
      id: 'obras',
      label: 'Principais Obras',
      conteudo_md: `
> "Eu nada escrevi. E é por não escrever nada que serei lido para sempre."

Sócrates nunca escreveu um único livro. Para ele, a filosofia só existia na oralidade, no calor do diálogo, na refutação instantânea. Textos estáticos eram perigosos, pois "não podem se defender quando são questionados". 

Toda a doutrina socrática é acessada através dos **Diálogos de Platão**. Se você quiser estudar o pensamento dele, deve começar por:

* **A Apologia de Sócrates**: O discurso de defesa feito por ele próprio perante o tribunal de Atenas, narrando sua vida, sua postura ética e seu desafio aos juízes. É a introdução perfeita à sua personalidade.
* **Fédon**: Relata as últimas horas de vida de Sócrates na prisão antes de beber a cicuta, discutindo a imortalidade da alma e a falta de medo da morte.
* **A República**: Sócrates aparece como personagem principal guiando a discussão sobre o que é a verdadeira Justiça e como seria a cidade ideal (ainda que este texto represente muito mais o pensamento maduro de Platão do que do próprio Sócrates).
      `
    },
    {
      id: 'tabela',
      label: 'Sócrates vs Sofistas',
      tabela: {
        oponenteNome: 'Os Sofistas (Advogados da Antiguidade)',
        items: [
          {
            topico: 'O que é a Verdade?',
            personagem: 'Acreditava que a verdade é absoluta e universal, e que ela já está dentro de nós (basta fazer as perguntas certas).',
            oponente: 'Acreditavam no Relativismo. A verdade é aquilo que você conseguir convencer o tribunal a acreditar.'
          },
          {
            topico: 'Qual o papel da Retórica?',
            personagem: 'Um instrumento perigoso se não for guiado pela moral. Falar bem não importa se você estiver defendendo o mal.',
            oponente: 'A ferramenta mais importante do Estado. Vender aulas de oratória era o modelo de negócios deles.'
          },
          {
            topico: 'O propósito do Diálogo',
            personagem: 'Aproximar os dois lados da Sabedoria e da Virtude (Arete). O objetivo é aprender, não "ganhar".',
            oponente: 'Vencer o debate a qualquer custo, mesmo que o argumento seja uma falácia (Eristica).'
          },
          {
            topico: 'Cobrança por aulas',
            personagem: 'Filosofava de graça nas praças. Considerava prostituição intelectual cobrar para ensinar a virtude.',
            oponente: 'Cobravam fortunas (honorários) para ensinar filhos de políticos a discursar no tribunal.'
          }
        ]
      }
    },
    {
      id: 'legado',
      label: 'O Legado Jurídico',
      conteudo_md: `
## O Precedente da Defesa e da Obediência

Sócrates é frequentemente comparado à figura do Cristo: ambos não deixaram nada escrito, ambos confrontaram o status quo, sofreram um julgamento político mascarado de jurídico e foram condenados à morte sem resistir com violência.

### A Apologia e o Direito à Defesa
O julgamento de Sócrates é um marco no estudo do **Direito Processual**. Na Apologia, vemos a estrutura do júri antigo e o exercício pleno do direito de defesa. Ele recusa o uso de táticas apelativas, como chorar, trazer a família ou implorar pena, que eram comuns na época. Ele exige ser julgado com base nos fatos e na verdade, elevando o padrão ético do Tribunal.

### Contrato Social e Segurança Jurídica
No diálogo *Críton*, ele explica o porquê de recusar a fuga da prisão. Ele constrói um dos primeiros modelos teóricos do que viria a ser o **Contrato Social**. Ele argumenta que ao viver 70 anos em Atenas, usufruindo de suas proteções, leis e educação, ele assinou um contrato tácito de obediência. Fugir apenas porque a lei o prejudicou agora seria hipocrisia, e destruir a validade das leis de Atenas (a Segurança Jurídica) seria o verdadeiro crime. O homem não pode estar acima da Lei que ele jurou viver sob.
      `
    },
    {
      id: 'linha_do_tempo',
      label: 'Timeline',
      timeline: [
        { ano: 'c. 470 a.C.', evento: 'Nascimento', detalhe: 'Nasce em Atenas, filho de Sofronisco (pedreiro/escultor) e Fenareta (parteira).' },
        { ano: '431 - 404 a.C.', evento: 'Guerra do Peloponeso', detalhe: 'Luta como hoplita (soldado de infantaria) por Atenas, destacando-se pela extrema bravura e resistência ao frio e fome.' },
        { ano: 'c. 420 a.C.', evento: 'O Oráculo de Delfos', detalhe: 'Querefonte, seu amigo, pergunta ao Oráculo quem é o homem mais sábio. O Oráculo responde: Sócrates. Ele conclui que só é o mais sábio porque "Sabe que nada sabe".' },
        { ano: '399 a.C.', evento: 'O Julgamento', detalhe: 'Acusado por Meleto, Ânito e Lícon de corromper a juventude e inventar deuses. Condenado por um júri de 500 cidadãos atenienses (280 contra 220).' },
        { ano: '399 a.C.', evento: 'A Morte', detalhe: 'Bebe cicuta na prisão, cercado de amigos, conversando calmamente sobre a imortalidade da alma até os últimos segundos.' }
      ]
    }
  ]
};
