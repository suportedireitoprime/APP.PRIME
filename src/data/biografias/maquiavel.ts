import { BiografiaData } from '@/types/biografia';

export const maquiavelData: BiografiaData = {
  id: 'maquiavel',
  categoriaId: 'filosofos',
  nome: 'Nicolau Maquiavel',
  subtitulo: 'O fundador da ciência política moderna e o arquiteto da Razão de Estado.',
  imagemUrl: '/biografias/maquiavel-capa.jpg',
  epoca: 'Renascimento',
  ordemEpoca: 4,
  tabs: [
    {
      id: 'historia',
      label: 'História',
      conteudo_md: `
## A Florença Renascentista e o Surgimento do Diplomata

Nicolau Maquiavel (Niccolò Machiavelli) nasceu em 1469 na fervilhante Florença, berço do Renascimento italiano, um mosaico de cidades-estado em constante guerra, intriga e competição pelo poder, muitas vezes manipuladas por potências estrangeiras e pelo Papado. Nascido em uma família empobrecida, mas de sólida linhagem, ele não herdou riquezas, mas sim uma excelente educação humanista centrada no estudo dos grandes clássicos de Roma e da Grécia Antiga.

Aos 29 anos, após a queda do frade radical Savonarola (que havia instaurado uma breve e puritana república), Maquiavel ascendeu como Secretário da Segunda Chancelaria da nova República Florentina. Sua função era diplomática e militar: ele viajou incansavelmente pela Europa como embaixador, negociando com os homens mais perigosos de seu tempo. Ele estudou de perto o gênio e a brutalidade de César Bórgia (filho do Papa Alexandre VI), o absolutismo pragmático do Rei Luís XII da França e o temperamento guerreiro do Papa Júlio II.

Observando esses governantes de perto, Maquiavel percebeu que as regras ensinadas nos espelhos de príncipes cristãos — que um líder deveria ser sempre dócil, piedoso e honesto — eram uma receita infalível para o fracasso e a ruína do Estado em um mundo cruel.

## O Exílio e a Obra-Prima

Em 1512, com o apoio de tropas espanholas e do Papa, a poderosa família dos Médici (banqueiros e mecenas que haviam sido expulsos no passado) retornou para reconquistar Florença e esmagou a República. Maquiavel, por ser um alto funcionário republicano, foi imediatamente destituído de seu cargo. Pouco tempo depois, foi acusado injustamente de conspirar contra os Médici, sendo preso e barbaramente torturado no método da corda (estrapada).

Sem confessar o crime que não cometeu, foi solto, mas banido da vida pública que tanto amava. Exilado em sua pequena fazenda rural em San Casciano, passava os dias cortando lenha e jogando cartas em tavernas. À noite, contudo, despia-se de suas roupas sujas, vestia seus mantos oficiais e se "encontrava" com os antigos reis e imperadores através da leitura de seus livros. 

Foi nesse doloroso isolamento, na esperança de recuperar um cargo e o perdão da família Médici, que ele escreveu, em poucas semanas, o opúsculo que mudaria o mundo para sempre: **"O Príncipe"** (1513), dedicado a Lorenzo de Médici.

## A Morte e a Imortalidade do "Maquiavélico"

Ironicamente, "O Príncipe" não rendeu a Maquiavel o emprego desejado em vida. Ele morreu em 1527, aos 58 anos, semanas depois que os Médici foram novamente expulsos de Florença. Quando a República retornou, os novos republicanos não quiseram empregar o homem que tentara aconselhar os tiranos Médici.

Apenas alguns anos após a sua morte, sua obra foi publicada e rapidamente censurada no *Index Librorum Prohibitorum* pela Igreja Católica. "O Príncipe" chocou a Europa ao separar, pela primeira vez na história, a Moral (religiosa e privada) da Política (pública e prática). Seu nome originou o adjetivo "maquiavélico", pejorativamente associado à perfídia e à frieza. No entanto, Maquiavel não pregava a maldade gratuita, mas sim que o governante deve estar disposto a perder a própria alma para salvar o seu Estado. Ele não descreveu os homens como *deveriam ser*, mas sim como *eles realmente são*.
      `
    },
    {
      id: 'obras',
      label: 'Principais Obras',
      conteudo_md: `
> "É muito mais seguro ser temido do que amado, quando se tem de abrir mão de uma das duas opções."

Maquiavel produziu uma bibliografia densa que abrange teoria política, estratégia militar, história e até mesmo comédia e literatura. Seus principais trabalhos, escritos majoritariamente durante o seu amargo exílio, contrastam e se complementam, mostrando um homem de intelecto ágil e pragmático:

* **O Príncipe (1513):** O mais famoso tratado político de todos os tempos. Escrito como um manual prático de sobrevivência para um governante (príncipe), o livro rompe violentamente com o moralismo medieval. Maquiavel ensina que o Estado é mantido através da força e da astúcia. A verdadeira virtude política (*Virtù*) não é a bondade cristã, mas a capacidade brutal de se adaptar às circunstâncias (*Fortuna*). É na obra que ele consolida a ideia de que "os fins justificam os meios" (embora ele nunca tenha escrito a frase com essas exatas palavras), orientando que a crueldade, quando necessária, deve ser aplicada rapidamente e de uma só vez para manter o poder e a ordem.
* **Comentários sobre a Primeira Década de Tito Lívio (Discorsi):** Enquanto "O Príncipe" lida com lideranças autocráticas em tempos de crise, os *Discursos* representam o verdadeiro coração ideológico de Maquiavel: o Republicanismo. Analisando a história do Império Romano, ele defende que repúblicas populares são formas de governo muito mais estáveis e eficientes a longo prazo do que as monarquias, pois acomodam melhor os conflitos naturais entre a elite e o povo. Ele defende a ideia do Estado de Direito e dos exércitos cidadãos em vez de mercenários.
* **A Arte da Guerra (1521):** O único trabalho de teoria militar e política que Maquiavel viu ser impresso durante a sua vida. Nele, Maquiavel detalha a necessidade de exércitos permanentes (milícias compostas pelos próprios cidadãos armados) em contraste às perigosas e desleais tropas mercenárias. Ele entende a guerra não como um acidente, mas como a extensão máxima da política e da soberania estatal.
* **A Mandrágora (1518):** Surpreendentemente, Maquiavel foi também um aclamado dramaturgo. Esta peça de comédia é considerada uma das obras primas do teatro renascentista. Cheia de cinismo, corrupção e sagacidade, a peça funciona como uma alegoria hilária, mas sombria, sobre a própria natureza corrompida do ser humano, mostrando que na vida civil, assim como na política de Florença, a fraude e a astúcia frequentemente derrotam a ingenuidade.
      `
    },
    {
      id: 'tabela',
      label: 'Realismo vs Idealismo',
      tabela: {
        oponenteNome: 'Política Idealista / Escolástica',
        items: [
          {
            topico: 'O Propósito da Política',
            personagem: 'A manutenção do Estado, do poder e a ordem social. O Estado é um fim em si mesmo.',
            oponente: 'Conduzir a alma humana à salvação, à virtude cristã e refletir o Reino dos Céus na terra.'
          },
          {
            topico: 'A Natureza Humana',
            personagem: 'Essencialmente ingrata, volúvel, simuladora, covarde ante os perigos e ávida de lucro. O governante deve prever a traição.',
            oponente: 'Racional e capaz de aperfeiçoamento moral através da educação e da religião (mesmo com o pecado original).'
          },
          {
            topico: 'A Virtude (Virtù)',
            personagem: 'A energia viril, a força, a flexibilidade moral e a audácia de agir contra a ética para garantir o sucesso.',
            oponente: 'As virtudes cardeais: Prudência, Justiça, Fortaleza e Temperança (sempre subordinadas às virtudes cristãs da Fé, Esperança e Caridade).'
          },
          {
            topico: 'Ética Pública vs Privada',
            personagem: 'A ética do Príncipe não é a ética do homem comum. Se um rei usar a bondade cega, ele destruirá seu país.',
            oponente: 'Não há diferença. O que é pecado para um camponês também é pecado para um Rei.'
          }
        ]
      }
    },
    {
      id: 'legado',
      label: 'Legado na Ciência Política',
      conteudo_md: `
## O Divórcio entre Ética e Política
O legado mais duradouro de Maquiavel foi a fundação da **Ciência Política Moderna**. Até o Renascimento, a política era vista como um subcapítulo da moral, da religião e da filosofia (desde Aristóteles até Santo Tomás de Aquino). Maquiavel inaugurou a perspectiva empírica: para ele, a política tem regras próprias, totalmente independentes das normas de santidade ou justiça moral. Essa visão de *Realpolitik* tornou-se o mapa de navegação das Relações Internacionais até os dias atuais.

### O Arquétipo do Líder Pragmatico
Maquiavel introduziu a dicotomia do **Leão e da Raposa**. Um príncipe deve ser "leão para afugentar os lobos e raposa para conhecer os laços". O governante precisa aliar a força letal e intimidadora ao calculismo de não cair em armadilhas e quebrar suas próprias promessas quando cumpri-las se tornar uma desvantagem ao Estado. Esse pragmatismo descarnado serviu de base silenciosa para a ação de inúmeros estadistas seculares, de Napoleão a Otto von Bismarck.
      `
    },
    {
      id: 'direito',
      label: 'Direito',
      conteudo_md: `
## A "Razão de Estado" e o Direito Público Moderno

Embora Maquiavel seja o terror dos defensores dos direitos humanos naturais (Jusnaturalismo), sua obra possui um impacto nuclear no desenvolvimento do Direito Público, do Direito Administrativo e do Constitucionalismo Moderno. Ele foi um dos primeiros teóricos a visualizar o **Estado (Lo Stato)** como um ente artificial secular, distinto da figura física do monarca e que necessita sobreviver a qualquer custo.

### A Supremacia e Soberania do Estado
A premissa maquiavélica de que a sobrevivência da nação justifica o abandono das regras normais é a raiz histórica do conceito de **Razão de Estado (Raison d'État)**. Isso evoluiu no direito contemporâneo para os mecanismos jurídicos de exceção. Quando o Direito Constitucional atual prevê "Estado de Sítio", "Estado de Defesa", Suspensão de Garantias e Medidas Provisórias em tempos de grave crise bélica ou sanitária, trata-se de um reconhecimento fundamentalmente maquiavélico: de que a Lei normal não funciona em momentos nos quais a própria existência do Estado está ameaçada por inimigos internos ou externos.

### Leis, Força e Liberdade Republicana
Apesar da fama de "O Príncipe", nos seus *Discorsi*, Maquiavel estabelece fundamentos jurídicos do Republicanismo que seriam usados pelos Pais Fundadores americanos séculos depois. Ele argumentou que **"Boas leis precisam de boas armas"** — ou seja, uma legislação perfeita sem o monopólio da força estatal para executá-la é apenas papel morto.

Além disso, ele chocou pensadores da época ao argumentar que os conflitos sociais (como a luta de classes entre patrícios e plebeus na Roma Antiga) não são doenças no corpo social, mas sim a *garantia da liberdade*, desde que institucionalizados pelas leis. O conflito forçava o Estado a criar novos direitos jurídicos, como o cargo do Tribuno da Plebe. Assim, para Maquiavel, o Direito não vem da paz celestial, mas sim de canalizar o conflito humano na criação de um ordenamento jurídico dinâmico.
      `
    },
    {
      id: 'linha_do_tempo',
      label: 'Timeline',
      timeline: [
        { ano: '1469', evento: 'Nascimento', detalhe: 'Nasce em Florença durante o auge do domínio de Lorenzo de Médici, o Magnífico.' },
        { ano: '1498', evento: 'Entrada na Diplomacia', detalhe: 'Com 29 anos, torna-se Segundo Secretário da Chancelaria da República Florentina após a execução de Savonarola.' },
        { ano: '1502 - 1503', evento: 'Encontros com César Bórgia', detalhe: 'Atua como emissário junto ao brutal filho do Papa, César Bórgia, cuja astúcia implacável servirá de inspiração máxima para "O Príncipe".' },
        { ano: '1512', evento: 'A Queda', detalhe: 'As tropas espanholas devolvem o poder aos Médici. A República Florentina cai e Maquiavel perde o seu cargo.' },
        { ano: '1513', evento: 'Prisão, Tortura e O Príncipe', detalhe: 'Suspeito de conspirar contra os Médici, é torturado e exilado na zona rural, onde, na miséria, escreve sua obra-prima "O Príncipe".' },
        { ano: '1527', evento: 'Morte de um Republicano', detalhe: 'Morre doente em Florença, semanas após o povo expulsar os Médici novamente e restaurar a República que ironicamente se negou a readmiti-lo.' }
      ]
    }
  ]
};
