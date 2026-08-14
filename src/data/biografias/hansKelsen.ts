import { BiografiaData } from '@/types/biografia';

export const hansKelsenData: BiografiaData = {
  id: 'hanskelsen',
  categoriaId: 'filosofos',
  nome: 'Hans Kelsen',
  subtitulo: 'O arquiteto do Positivismo Jurídico moderno e criador da Teoria Pura do Direito.',
  imagemUrl: '/biografias/hanskelsen-capa.jpg',
  epoca: 'Positivismo Moderno',
  ordemEpoca: 5,
  tabs: [
    {
      id: 'historia',
      label: 'História',
      conteudo_md: `
## O Contexto do Século XX e a Crise do Direito

Nascido em Praga em 1881, Hans Kelsen foi uma das mentes mais aguçadas e controversas do século XX. Crescendo no seio do Império Austro-Húngaro, Kelsen vivenciou o choque de diferentes nacionalidades, religiões e visões de mundo. Formado na Universidade de Viena, ele presenciou a queda dos grandes impérios após a Primeira Guerra Mundial (1914–1918) e o esforço desesperado de reconstrução política na Europa.

Kelsen percebeu que a Ciência Jurídica de sua época estava "contaminada" por outras disciplinas. Os juristas não sabiam separar a Lei da religião, da moralidade, da sociologia ou da política. Quando os juízes julgavam um caso, eles frequentemente justificavam suas decisões baseados em conceitos nebulosos de "justiça natural" ou na "vontade de Deus", o que permitia que o Direito fosse manipulado para justificar qualquer barbárie ideológica — algo que culminaria catastroficamente nos regimes totalitários das décadas seguintes.

## A "Teoria Pura" e a Limpeza Metodológica

A grande revolução de Kelsen foi propor uma "Teoria Pura" do Direito. O termo "Puro" não significava que a lei era perfeita ou eticamente boa, mas sim que o **método de estudo do jurista** deveria ser puro, livre de interferências ideológicas. Para Kelsen, o papel da Ciência Jurídica não era dizer se uma norma era "justa" ou "injusta", mas apenas responder a uma pergunta técnica: "Esta norma é válida?".

Sua consagração prática veio em 1920, quando Kelsen foi o redator da Constituição Republicana da Áustria e, logo em seguida, foi nomeado juiz da recém-criada **Corte Constitucional**. Foi Kelsen quem inventou o modelo moderno de Tribunal Constitucional (o Tribunal com a missão exclusiva de guardar a Constituição e anular leis que a contrariem), modelo que inspiraria Cortes no mundo todo, incluindo o STF no Brasil.

## A Perseguição Nazista e o Exílio

A ascensão do fascismo e do nazismo provou ser o maior teste para a vida de Kelsen. Sendo de ascendência judaica e um defensor ferrenho das democracias constitucionais puras, Kelsen tornou-se o alvo principal de juristas ligados ao Terceiro Reich, especialmente Carl Schmitt (o "Jurista da Coroa" de Hitler). Schmitt defendia que o Direito emanava da pura Vontade do Soberano (o Führer), enquanto Kelsen insistia que o Estado e o Direito eram uma única entidade regida por uma Constituição rígida.

Em 1933, quando Hitler chegou ao poder na Alemanha, Kelsen (que lecionava em Colônia) foi imediatamente destituído de seu cargo universitário pelas leis raciais. Ele foi forçado a fugir para Genebra, e mais tarde, com a eclosão da Segunda Guerra Mundial, para os Estados Unidos. Nos EUA, ele lecionou em Harvard e em Berkeley, onde continuou a expandir seu monumental legado até sua morte, em 1973, consagrando-se como o jurista mais lido, odiado e estudado da história do direito dogmático ocidental.
      `
    },
    {
      id: 'obras',
      label: 'Principais Obras',
      conteudo_md: `
A produção literária de Hans Kelsen é vasta e extremamente rigorosa. Suas obras exigem leitura atenta e formam o pilar do ensino jurídico nas faculdades contemporâneas. O operador do direito não consegue entender a estrutura hierárquica do Estado sem passar pelos seus conceitos primários.

* **Teoria Pura do Direito (1934 e 1960):** A obra-prima absoluta de Kelsen. O livro propõe livrar a ciência jurídica de elementos que não pertençam ao seu objeto rigoroso de estudo (livrando a norma jurídica de análises sociológicas e morais). É aqui que ele define o conceito de "Norma Fundamental" (*Grundnorm*) — a hipótese lógica, pressuposta, que serve de fundamento de validade para a primeira Constituição histórica de um país, impedindo uma regressão infinita na busca pela origem da validade do ordenamento.
* **Teoria Geral do Estado (1925):** Neste tratado fundamental, Kelsen ataca a dualidade clássica que dividia o Estado e o Direito como entidades distintas. Para Kelsen, o Estado *é* a ordem jurídica. Não há Estado sem Direito, e todo Direito estatal compõe o Estado. O Estado não "cria" o Direito como um pai cria um filho; o Estado se manifesta como o próprio sistema de normas coercitivas em vigor.
* **A Ilusão da Justiça (1957):** Uma obra de filosofia onde Kelsen elabora um relativismo axiológico contundente. Ele demonstra que o conceito de "Justiça" é irredutivelmente subjetivo e emocional, variando de acordo com as paixões, ideologias políticas e eras históricas. Logo, basear o funcionamento do Estado em um conceito tão flutuante quanto "Justiça" seria gerar anarquia. Apenas o Direito Positivo (a norma objetivamente posta pelo Estado) oferece segurança jurídica tangível.
* **Jurisdição Constitucional (1928):** Uma de suas obras aplicadas mais inovadoras, onde ele fundamenta e detalha o controle de constitucionalidade concentrado (o modelo austríaco/europeu), justificando por que a Constituição precisa de uma corte especializada e imparcial para ser um mecanismo verdadeiramente limitador do poder legislativo ordinário.
      `
    },
    {
      id: 'tabela',
      label: 'Kelsen vs Jusnaturalismo',
      tabela: {
        oponenteNome: 'A Tradição Jusnaturalista (Direito Natural)',
        items: [
          {
            topico: 'Origem do Direito',
            personagem: 'O Direito é criado por atos de vontade do Estado (Positivação). Não existe lei jurídica fora da ordem estatal posta.',
            oponente: 'O Direito se origina na Razão, na Natureza humana ou na vontade divina. Ele é descoberto, não criado.'
          },
          {
            topico: 'Relação entre Direito e Moral',
            personagem: 'Separação metodológica. Uma lei extremamente injusta continua sendo uma Lei Válida se foi produzida pelos trâmites corretos do Estado.',
            oponente: 'Uma lei injusta que viola a lei natural não é Direito, é uma perversão da lei ("Lex injusta non est lex", de Tomás de Aquino).'
          },
          {
            topico: 'O que é a "Justiça"?',
            personagem: 'Um ideal irracional. Não existe Justiça Absoluta. O que existe é a aplicação correta e isonômica da Lei vigente.',
            oponente: 'O padrão objetivo e universal pelo qual as leis dos homens devem ser medidas e julgadas.'
          },
          {
            topico: 'Fundamento de Validade',
            personagem: 'Uma norma tira sua validade de uma norma hierarquicamente superior, subindo até a "Norma Fundamental" (Grundnorm).',
            oponente: 'A validade última da lei baseia-se na sua concordância com princípios éticos imutáveis da condição humana.'
          }
        ]
      }
    },
    {
      id: 'direito',
      label: 'Direito e Positivismo',
      conteudo_md: `
## O Legado Monumental de Hans Kelsen no Direito

Falar sobre o Direito contemporâneo sem mencionar Kelsen é quase como estudar física moderna sem mencionar Einstein. Kelsen deu ao Direito o status de ciência metodologicamente independente e fechada em sua própria lógica.

### A Pirâmide de Kelsen e o Escalonamento Normativo
Ainda que Kelsen nunca tenha desenhado a forma de uma pirâmide literalmente (a imagem gráfica popularizou-se através de comentadores como seu aluno Merkl), a **Hierarquia das Normas** é sua contribuição estrutural mais famosa. Ele explicou que o ordenamento jurídico não é um amontoado aleatório de regras lado a lado, mas sim uma ordem escalonada. 

Um Decreto tira sua validade de uma Lei Ordinária. A Lei Ordinária tira sua validade da Constituição. E a Constituição tira sua validade da **Norma Fundamental** (um pressuposto lógico-transcendental indispensável: "obedeça ao primeiro constituinte histórico"). Isso permitiu aos tribunais entenderem com precisão milimétrica que qualquer norma inferior que contradiga a superior é nula de pleno direito.

### Controle de Constitucionalidade (O Modelo Austríaco)
Enquanto nos Estados Unidos o controle de constitucionalidade nasceu difuso (nas mãos de qualquer juiz, via caso *Marbury v. Madison*), a Europa carecia de um mecanismo que defendesse a Constituição sem depender de litígios individuais. 

Kelsen propôs e estruturou um Tribunal Constitucional exclusivo, uma corte que não julga processos comuns entre vizinhos, mas que julga "a própria Lei", atuando como um legislador negativo capaz de varrer do ordenamento regras inconstitucionais (Controle Concentrado). No Brasil contemporâneo, a atuação do Supremo Tribunal Federal (STF) através de ADIs e ADPFs deve quase tudo ao brilhantismo sistêmico arquitetado por Hans Kelsen na Áustria em 1920.
      `
    },
    {
      id: 'linha_do_tempo',
      label: 'Timeline',
      timeline: [
        { ano: '1881', evento: 'Nascimento em Praga', detalhe: 'Nasce em uma família judaica em Praga, mudando-se para Viena pouco tempo depois.' },
        { ano: '1920', evento: 'A Constituição Austríaca', detalhe: 'Redige a nova Constituição da República Austríaca e desenha o primeiro Tribunal Constitucional da história europeia moderna.' },
        { ano: '1930', evento: 'Mudança para Colônia', detalhe: 'Sofrendo oposição política da direita em Viena, Kelsen muda-se para a Universidade de Colônia, na Alemanha, para lecionar direito internacional.' },
        { ano: '1933', evento: 'Demissão e Exílio', detalhe: 'Adolf Hitler sobe ao poder. Kelsen e outros professores judeus são demitidos sumariamente de suas cátedras. Ele foge para Genebra.' },
        { ano: '1934', evento: 'A Teoria Pura', detalhe: 'Publica a primeira edição da sua obra máxima, "Teoria Pura do Direito", sistematizando o Positivismo Jurídico normativista.' },
        { ano: '1973', evento: 'Falecimento', detalhe: 'Falece em Berkeley (Califórnia), aos 91 anos, deixando o maior e mais denso legado científico do Direito do século XX.' }
      ]
    }
  ]
};
