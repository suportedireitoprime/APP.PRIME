import { BiografiaData } from '@/types/biografia';

export const kantData: BiografiaData = {
  id: 'kant',
  categoriaId: 'filosofos',
  nome: 'Immanuel Kant',
  subtitulo: 'O expoente do Iluminismo, criador do Imperativo Categórico e divisor de águas da Filosofia Moderna.',
  imagemUrl: '/biografias/kant-capa.jpg',
  epoca: 'Iluminismo',
  ordemEpoca: 5,
  datasVida: '(1724 – 1804)',
  tabs: [
    {
      id: 'historia',
      label: 'História',
      conteudo_md: `
## O Despertar do Sono Dogmático

Nascido em 1724, na cidade prussiana de Königsberg (atual Kaliningrado, na Rússia), Immanuel Kant viveu uma das vidas mais metódicas e monótonas da história da filosofia — mas sua mente promoveu um dos terremotos intelectuais mais violentos de todos os tempos. Diz a lenda que os vizinhos de Königsberg podiam acertar seus relógios apenas observando o horário do passeio diário de Kant, de tão pontual que era.

Antes de Kant, a filosofia estava paralisada em uma guerra sem fim entre os **Racionalistas** (como Descartes, que achavam que a verdade pura vinha só da Razão) e os **Empiristas** (como David Hume, que achavam que só os sentidos físicos traziam o conhecimento real). Kant confessou que a leitura de Hume o despertou de seu "sono dogmático". Ele percebeu que precisava de uma terceira via.

## A Revolução Copernicana da Filosofia

O que Kant propôs mudou tudo. Assim como Copérnico inverteu a astronomia (dizendo que a Terra girava em torno do Sol, e não o contrário), Kant inverteu a epistemologia. Ele disse: nós não somos "telas em branco" recebendo passivamente informações do mundo. Na verdade, a nossa própria mente possui "óculos invisíveis" (as categorias de tempo, espaço e causalidade) que formatam e estruturam a realidade antes mesmo de a percebermos. 

Nós nunca conhecemos a "coisa em si" (*noumenon*), apenas a forma como a coisa aparece para nós (*phenomenon*). Essa síntese genial encerrou a briga entre razão e sentidos: "Pensamentos sem conteúdo são vazios; intuições sem conceitos são cegas".

## A Fundamentação da Ética

Se Kant mudou a forma como conhecemos o mundo, na Moral ele foi ainda mais revolucionário. Ele queria encontrar uma lei moral que não dependesse da religião, da tradição ou de inclinações emocionais — uma lei que fosse baseada puramente na Razão Humana e que valesse para qualquer ser racional em qualquer parte do universo. O resultado foi sua Ética Deontológica (do dever) e o conceito do **Imperativo Categórico**. Kant viveu toda a sua vida fiel a esses rígidos princípios, falecendo em 1804 como a figura central do Iluminismo europeu.
      `
    },
    {
      id: 'obras',
      label: 'Principais Obras',
      conteudo_md: `
A obra de Kant é famosa por sua extrema densidade e complexidade vocabular. Contudo, superada a barreira da linguagem, revela-se um sistema perfeito e inquebrável.

* **Crítica da Razão Pura (1781):** A sua obra magna. É aqui que Kant realiza sua "Revolução Copernicana", dissecando os limites do que a razão humana é capaz de conhecer e onde ela falha (como ao tentar provar a existência de Deus ou a imortalidade da alma usando apenas a lógica científica).
* **Crítica da Razão Prática (1788):** Se a Razão Pura cuida da ciência e do conhecimento do mundo físico, a Razão Prática cuida do mundo Moral e da ação humana. É aqui que Kant fundamenta filosoficamente a liberdade, a vontade e o dever.
* **Fundamentação da Metafísica dos Costumes (1785):** Um livro menor em tamanho, mas gigantesco em impacto. Nele Kant formula de maneira mais clara o Imperativo Categórico e a distinção entre agir "conforme o dever" e agir "pelo dever".
* **À Paz Perpétua (1795):** Um tratado de filosofia política revolucionário. Kant esboça as condições preliminares e definitivas para acabar com as guerras no mundo, propondo uma "liga de nações" pacifista (que inspiraria fortemente a criação da ONU no século XX) baseada no direito cosmopolita.
      `
    },
    {
      id: 'tabela',
      label: 'Kant vs Utilitarismo',
      tabela: {
        oponenteNome: 'Jeremy Bentham (Utilitarismo)',
        items: [
          {
            topico: 'O que define uma ação boa?',
            personagem: 'A intenção e o respeito estrito ao Dever (Deontologia). A ação é boa em si mesma, independente das consequências.',
            oponente: 'As Consequências (Consequencialismo). A ação é boa se maximizar a felicidade ou o prazer para o maior número de pessoas.'
          },
          {
            topico: 'Uso das Pessoas',
            personagem: 'O ser humano é um "Fim em si mesmo". É absolutamente imoral usar um humano como ferramenta/meio para salvar outros humanos.',
            oponente: 'Se sacrificar os direitos de um inocente salvar a vida de milhares, esse sacrifício é moralmente exigido e desejável.'
          },
          {
            topico: 'A Mentira',
            personagem: 'É absolutamente proibida, mesmo para salvar a vida de um amigo. Se a mentira for permitida, a confiança universal humana entra em colapso.',
            oponente: 'É plenamente justificável e até moralmente boa se evitar dor desnecessária ou gerar maior bem-estar geral.'
          },
          {
            topico: 'Natureza Humana',
            personagem: 'Baseia-se na Razão e na Autonomia. Somos livres apenas quando obedecemos a leis morais universais criadas pela nossa própria razão.',
            oponente: 'Baseia-se no cálculo hedonista. Os seres humanos são governados por dois mestres soberanos: a busca do prazer e a fuga da dor.'
          }
        ]
      }
    },
    {
      id: 'direito',
      label: 'A Filosofia do Dever',
      conteudo_md: `
## O Imperativo Categórico

A grande contribuição de Kant para a Ética e para o embasamento dos Direitos Humanos foi o **Imperativo Categórico**. Diferente dos "imperativos hipotéticos" (ex: "se você não quer ser preso, não roube"), o Imperativo Categórico exige cumprimento incondicional.

Kant o resumiu em duas formulações principais:

1. **A Fórmula da Lei Universal:** *"Age apenas segundo uma máxima tal que possas ao mesmo tempo querer que ela se torne lei universal."*
(Tradução prática: antes de agir, pergunte-se: "E se todo mundo no planeta fizesse o que eu vou fazer agora? O mundo continuaria funcionando?". Se a resposta for não, a ação é imoral).

2. **A Fórmula do Fim em Si Mesmo:** *"Age de tal maneira que uses a humanidade, tanto na tua pessoa como na pessoa de qualquer outro, sempre e simultaneamente como fim e nunca simplesmente como meio."*
(Tradução prática para o Direito: a dignidade humana não tem preço. Você não pode torturar um prisioneiro nem para extrair informações que salvariam uma cidade, pois estaria usando a humanidade dele como uma mera ferramenta).

## Kant e o Direito Positivo

Na visão de Kant, a Ética é interna (a intenção conta), mas o **Direito é externo**. Para o Direito, não importa se você pagou sua dívida porque é bondoso ou porque tem medo do juiz; o que importa é que a dívida foi paga.

Para Kant, o Direito é a *"ciência que permite a coexistência do arbítrio (liberdade) de um com o arbítrio de todos os outros, segundo uma lei universal da liberdade"*. Em outras palavras, somos naturalmente livres, mas nossa liberdade entra em choque com a liberdade do outro. O Direito não existe para nos fazer moralmente bons (isso é trabalho da Ética); o Direito existe apenas para delimitar as fronteiras das liberdades usando a coerção (força), garantindo que a sociedade não se autodestrua e que cada um possa buscar sua própria felicidade em paz.
      `
    },
    {
      id: 'linha_do_tempo',
      label: 'Timeline',
      timeline: [
        { ano: '1724', evento: 'Nascimento em Königsberg', detalhe: 'Nasce na Prússia Oriental, cidade da qual praticamente nunca sairia durante toda a sua vida.' },
        { ano: '1755', evento: 'Carreira Universitária', detalhe: 'Torna-se "Privatdozent" (professor não assalariado remunerado por alunos), ensinando desde matemática até geografia e teologia.' },
        { ano: '1770', evento: 'A Grande Cátedra', detalhe: 'Aos 46 anos, após anos de rejeições, finalmente é nomeado Professor Titular de Lógica e Metafísica na Universidade de Königsberg.' },
        { ano: '1781', evento: 'Crítica da Razão Pura', detalhe: 'Publica sua obra prima revolucionária. A primeira edição foi mal compreendida e ignorada, o que o forçou a reescrevê-la.' },
        { ano: '1785', evento: 'A Ética do Dever', detalhe: 'Lança a "Fundamentação da Metafísica dos Costumes", revelando ao mundo o conceito do Imperativo Categórico.' },
        { ano: '1804', evento: 'Falecimento', detalhe: 'Falece aos 79 anos. Suas últimas palavras registradas foram "Es ist gut" (Está bom).' }
      ]
    }
  ]
};
