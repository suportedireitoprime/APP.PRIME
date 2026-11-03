// Catálogo Oficial do Audiobook: O Caso dos Exploradores de Cavernas
// Armazenado e servido a 0ms via Cloudflare R2 Global CDN

export interface AudiobookCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface AudiobookImagem {
  url: string;
  startTime: number;
  endTime: number;
  ordem: number;
  arquivo: string;
}

export interface AudiobookCapitulo {
  numero: number;
  id: string;
  titulo: string;
  autor: string;
  descricao: string;
  duracaoSegundos: number;
  duracaoFormatada: string;
  audioUrl: string;
  audioTituloUrl?: string;
  srtUrl?: string;
  cues: AudiobookCue[];
  imagens: AudiobookImagem[];
}

export interface AudiobookLivro {
  id: string;
  tableId?: number;
  titulo: string;
  subtitulo?: string;
  autor: string;
  ano?: number | string | null;
  descricao: string;
  sinopse?: string;
  capaUrl: string;
  totalCapitulos: number;
  duracaoTotalSegundos?: number;
  duracaoTotalFormatada?: string;
  tags?: string[];
  status: 'disponivel' | 'em_breve';
  capitulos: AudiobookCapitulo[];
}

export const O_CASO_DOS_EXPLORADORES_DE_CAVERNAS: AudiobookLivro = {
  "id": "o-caso-dos-exploradores-de-cavernas",
  "tableId": 121,
  "status": "disponivel",
  "titulo": "O Caso dos Exploradores de Cavernas",
  "subtitulo": "Um clássico imortal da Filosofia do Direito",
  "autor": "Lon L. Fuller",
  "ano": 1949,
  "descricao": "Cinco exploradores ficam presos em uma caverna isolada por um deslizamento. Diante da fome iminente, sorteiam quem será sacrificado para a sobrevivência dos demais. Resgatados, enfrentam a pena de morte por assassinato.",
  "sinopse": "Publicado na Harvard Law Review em 1949, o livro simula o julgamento dos sobreviventes perante a Suprema Corte de Newgarth, confrontando as maiores correntes do pensamento jurídico mundial: o Positivismo, o Jusnaturalismo, o Formalismo e o Realismo Jurídico.",
  "capaUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capa-do-livro.jpg",
  "totalCapitulos": 8,
  "duracaoTotalSegundos": 6479,
  "duracaoTotalFormatada": "108 min",
  "tags": [
    "Filosofia do Direito",
    "Jusnaturalismo",
    "Positivismo",
    "Clássicos",
    "Harvard Law"
  ],
  "capitulos": [
    {
      "numero": 0,
      "id": "capitulo-00-apresentacao",
      "titulo": "Apresentação da Obra",
      "autor": "Lon L. Fuller",
      "descricao": "Apresentação do livro: título, autor, tradutor, edição brasileira e contexto histórico.",
      "duracaoSegundos": 28,
      "duracaoFormatada": "00:28",
      "audioUrl": "/audiobooks/o-caso-dos-exploradores-de-cavernas/apresentacao-do-livro.mp3",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 5.56,
          "text": "Bem-vindo ao audiobook de O Caso dos Exploradores de Cavernas, de Lon L."
        },
        {
          "id": 2,
          "start": 5.56,
          "end": 6.1,
          "text": "Fuller."
        },
        {
          "id": 3,
          "start": 6.1,
          "end": 12.12,
          "text": "Tradução e notas de Claudio Blanc, apresentação e comentários de Célio Egídio."
        },
        {
          "id": 4,
          "start": 12.12,
          "end": 17.75,
          "text": "Título original: The Case of the Speluncean Explorers, publicado em 1949."
        },
        {
          "id": 5,
          "start": 17.75,
          "end": 21.46,
          "text": "Edição brasileira da Geração Editorial, de 2018."
        },
        {
          "id": 6,
          "start": 21.46,
          "end": 27.55,
          "text": "A narração a seguir começa pela Apresentação e segue o texto original do livro."
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capa-do-livro.jpg",
          "startTime": 0,
          "endTime": 28,
          "ordem": 1,
          "arquivo": "capa-do-livro.jpg"
        }
      ]
    },
    {
      "numero": 0,
      "id": "capitulo-00-sumario",
      "titulo": "Sumário da Suprema Corte",
      "autor": "Direito Prime",
      "descricao": "Sumário e roteiro cronológico da Suprema Corte de Newgarth, ano 4300.",
      "duracaoSegundos": 22,
      "duracaoFormatada": "00:22",
      "audioUrl": "/audiobooks/o-caso-dos-exploradores-de-cavernas/sumario.mp3",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 1.41,
          "text": "Este é o sumário."
        },
        {
          "id": 2,
          "start": 1.41,
          "end": 5.58,
          "text": "O livro começa com a Apresentação de Célio Egídio."
        },
        {
          "id": 3,
          "start": 5.58,
          "end": 19.06,
          "text": "Depois, a Suprema Corte de Newgarth, ano 4300, com os votos de Truepenny, presidente, Foster, Tatting, Keen, Handy e, novamente, Tatting, seguidos do Pós-escrito."
        },
        {
          "id": 4,
          "start": 19.06,
          "end": 21.72,
          "text": "Vamos começar pela Apresentação."
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capa-do-livro.jpg",
          "startTime": 0,
          "endTime": 22,
          "ordem": 1,
          "arquivo": "capa-do-livro.jpg"
        }
      ]
    },
    {
      "numero": 1,
      "id": "capitulo-01",
      "titulo": "Apresentação de Célio Egídio",
      "autor": "Célio Egídio",
      "descricao": "Introdução histórica e filosófica ao caso ficcional dos cinco membros da Sociedade Espeleológica aprisionados.",
      "duracaoSegundos": 919,
      "duracaoFormatada": "15:19",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-01/capitulo-01-apresentacao-de-celio-egidio.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-01/capitulo-01-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-01/capitulo-01-apresentacao-de-celio-egidio.srt",
      "cues": [
        {
          "id": 1,
          "text": "Mergulhar no universo de Fuller é trazer um verdadeiro estudo sobre a Filosofia do Direito em sua maior expressividade, pois o autor transfere para um ambiente hermético os atores principais, os espeleólogos, para a criação de normas diante da adversidade de um resgate atemporal.",
          "start": 0,
          "end": 19.6
        },
        {
          "id": 2,
          "text": "É uma obra utilizada também por outras ciências, afinal ao sociólogo é fundamental trazer ao debate o isolamento com o qual foram submetidos e os comportamentos diante de situação sui generis em que a vida deveria ser negada por algum de seus componentes.",
          "start": 19.6,
          "end": 37.45
        },
        {
          "id": 3,
          "text": "A ficção apresentada pelo autor é uma forma de conhecer as principais linhas e correntes de pensamento.",
          "start": 37.45,
          "end": 44.66
        },
        {
          "id": 4,
          "text": "É uma grande alegoria em que se consegue observar dois momentos claros: a primeira parte, referente ao fato, e a segunda parte, referente ao julgamento do fato, com uma grande navegação pelas escolas de pensamento da jusfilosofia, por meio dos juízes que julgavam o caso, tanto na esfera no primeiro grau, bem como o magistrado do grau de recurso.",
          "start": 44.66,
          "end": 68.95
        },
        {
          "id": 5,
          "text": "Conta-se que Fuller teve sua inspiração em casos de naufrágios que também foram seguidos de eliminação da vida humana em benefício da sobrevivência da maioria.",
          "start": 68.95,
          "end": 80.08
        },
        {
          "id": 6,
          "text": "Não se confunde a caverna desta obra com a de Platão, onde a ausência de percepção foi dada em virtude do encarceramento das mentes das pessoas.",
          "start": 80.08,
          "end": 90.16
        },
        {
          "id": 7,
          "text": "Neste caso, as pessoas estavam encarceradas e sem condições de qualquer outra percepção que não a própria sobrevivência, e diante da falta de expectativa de resgate.",
          "start": 90.16,
          "end": 101.71
        },
        {
          "id": 8,
          "text": "O caso dos exploradores de cavernas, além do debate sobre a preservação da vida e a forma como podemos criar “normas” sociais, também traz contornos para a análise do debate jurídico, e do papel dos juízes e das leis na sociedade.",
          "start": 101.71,
          "end": 118.02
        },
        {
          "id": 9,
          "text": "Afinal a obra tem como ponto central a execução do justo e a aplicação da equidade, que é a aplicação do direito ao caso concreto, muito bem abordada por Aristóteles em sua obra Ética a Nicômano, onde a referência era a régua de Lesbos — uma espécie de trena que se adaptava aos contornos das pedras retiradas de uma pedreira que seriam usadas para construção, a fim de medi-las.",
          "start": 118.02,
          "end": 144.9
        },
        {
          "id": 10,
          "text": "A analogia do Estagirita era que o direito fosse aplicado ao caso concreto de acordo com sua forma, trazendo, sim, a devida equidade.",
          "start": 144.9,
          "end": 154.33
        },
        {
          "id": 11,
          "text": "É nesse diapasão que caminham todos os julgamentos e expressões dos juízes do caso.",
          "start": 154.33,
          "end": 160.22
        },
        {
          "id": 12,
          "text": "Nesse viés, é possível trazer ao debate a similaridade da sociedade atual, distante da fictícia sociedade do ano de 4300, assim como a suprema corte de Newgarth, para a realidade brasileira.",
          "start": 160.22,
          "end": 173.7
        },
        {
          "id": 13,
          "text": "O professor de direito poderá entrar na discussão da formação da lei que deriva da sociedade e discutir de que forma está modelada a atual, ou seja, como vive e como se relaciona o brasileiro diante das normas.",
          "start": 173.7,
          "end": 188.59
        },
        {
          "id": 14,
          "text": "Não que estejam fisicamente em uma caverna, mas diante das várias sociedades bloqueadas que vivenciamos, principalmente nos grandes centros do sudeste brasileiro — com uma enormidade de favelas e comunidades de alta vulnerabilidade, em que o domínio de facções criminosas cria “cavernas” novas, com “novas” leis e regras de convivência, formando um verdadeiro hiato social entre a lei posta pelo Estado e sua aplicabilidade.",
          "start": 188.59,
          "end": 217.2
        },
        {
          "id": 15,
          "text": "Com essa relação bloqueada pelo crime organizado, os noticiários dos últimos anos, e quem sabe dos próximos, ainda terão como destaque a guerra entre os grupos de infratores da lei, exteriorizando um universo de violência que não se limita aos sons de armas sofisticadas, mas no silêncio de muitos que estão submissos a esse poder de uma “caverna” que determina seu comportamento, forma de aplicação da lei, sem a esperança de um resgate a tempo de salvar a si ou aos seus.",
          "start": 217.2,
          "end": 249.12
        },
        {
          "id": 16,
          "text": "É fato que o Poder Judiciário possui a premissa de pacificar a sociedade, estabelecendo a justiça propriamente dita, mas se Fuller estivesse nos morros do Rio de Janeiro, não precisaria reportar-se aos antigos naufrágios, mas sim ao isolamento invisível em que se encontram milhares de pessoas.",
          "start": 249.12,
          "end": 268.96
        },
        {
          "id": 17,
          "text": "Em suma, temos dois grandes momentos dessa obra magnífica para ser aplicada em qualquer momento da formação do futuro profissional que irá tratar das ciências sociais aplicadas, especialmente a Ciência Jurídica.",
          "start": 268.96,
          "end": 283.2
        },
        {
          "id": 18,
          "text": "Os fatos Trata-se de ficção ocorrida em 4299, no condado de Stowfield na Whetmore Company, em que o seu proprietário, Roger Whetmore, também espeleólogo juntamente com outros quatro estudiosos da sociedade de espeleologia, partem para a explorar o interior de uma caverna de rocha calcaria.",
          "start": 283.2,
          "end": 302.79
        },
        {
          "id": 19,
          "text": "Após certo tempo de caminhada no interior da caverna, blocos de pedra fecharam a entrada impossibilitando que saíssem.",
          "start": 302.79,
          "end": 310.76
        },
        {
          "id": 20,
          "text": "Como tardaram a retornar para suas casas, as famílias notificaram a falta e foi montada uma esquipe de resgate.",
          "start": 310.76,
          "end": 318.26
        },
        {
          "id": 21,
          "text": "Várias foram as dificuldades encontradas pela primeira equipe que chegou ao local, notando que seriam necessários vários equipamentos e pessoal para se efetivar o resgate, além de ser uma operação onerosa.",
          "start": 318.26,
          "end": 332.11
        },
        {
          "id": 22,
          "text": "Ao iniciar seu contato com a equipe de resgate, médicos e outros sobre as possibilidades de sobrevivência diante daquela situação, Whetmore soube que, talvez, o tempo necessário para a libertação ultrapassasse os limites dos suprimentos que eles, os exploradores, haviam levado consigo.",
          "start": 332.11,
          "end": 351.43
        },
        {
          "id": 23,
          "text": "A crise se agrava no momento em que os aprisionados ficam sabendo que o resgate será feito em dez dias e levantam, diante das condições em que se encontram, a possibilidade de utilizarem carne humana para sobreviver até o término do resgaste.",
          "start": 351.43,
          "end": 367.77
        },
        {
          "id": 24,
          "text": "Ninguém externo a eles ofertou parecer favorável, pois estavam em um mundo ordinário e não submetidos ao da realidade dos confinados, que “distante das regras naturais” podiam criar as suas próprias para fins de sobrevivência.",
          "start": 367.77,
          "end": 383.04
        },
        {
          "id": 25,
          "text": "Diante de tal situação, Whetmore propôs para os companheiros se seria aconselhável que um deles fosse sacrificado para que os outros pudessem sobreviver.",
          "start": 383.04,
          "end": 393.44
        },
        {
          "id": 26,
          "text": "Indagando se seria coerente tirar na sorte, nenhum dos médicos, padres, juízes, ou autoridade governamental assumiu a responsabilidade de responder à pergunta.",
          "start": 393.44,
          "end": 404.26
        },
        {
          "id": 27,
          "text": "Como as baterias dos comunicadores se encerravam na mesma forma das relações sociais com o mundo “exterior”, paralelamente crescia entre eles a ideia de uma nova formação de regra de sobrevivência com a possibilidade de se retirar a vida de um deles.",
          "start": 404.26,
          "end": 421.25
        },
        {
          "id": 28,
          "text": "Como nas favelas cariocas ou na periferia da cidade de São Paulo, a ausência estatal faz com que os criminosos criem suas normas de conduta, na caverna elas também foram criadas, com um jogo, para que alguém fosse sacrificado a fim de que outros sobrevivessem.",
          "start": 421.25,
          "end": 438.93
        },
        {
          "id": 29,
          "text": "Foi Whetmore, segundo o que foi relatado, o primeiro a propor que um deles ofertasse sua vida para a sobrevivência dos demais.",
          "start": 438.93,
          "end": 447.5
        },
        {
          "id": 30,
          "text": "Depois de vários debates, todos concordaram com a situação, sendo que criaram uma espécie de jogo da sorte em que, por final, o próprio autor foi o vitimado, ou o “escolhido”.",
          "start": 447.5,
          "end": 459.4
        },
        {
          "id": 31,
          "text": "Em momento interessante da obra, após Whetmore ser o sorteado, ele se arrepende e deseja ficar vivo mais alguns dias alegando uma possibilidade de resgate, mas todos o contrariam pois estava “quebrando” a própria regra que criou.",
          "start": 459.4,
          "end": 474.97
        },
        {
          "id": 32,
          "text": "Então retiraram a sua vida, mesmo com a sua discordância.",
          "start": 474.97,
          "end": 478.85
        },
        {
          "id": 33,
          "text": "Retornamos à questão das “lacunas estatais” e às normas que são criadas pelas sociedades em virtude dessa desídia ou até ausência estatal.",
          "start": 478.85,
          "end": 488.02
        },
        {
          "id": 34,
          "text": "Assim, Fuller traz muita similaridade com os fatos atuais em nossa sociedade, com a exposição de uma diversidade de correntes sociológicas que exteriorizam nessa obra, inclusive a questão do contrato social “rousseano”: “... cada um condiciona sua liberdade”.",
          "start": 488.02,
          "end": 505.23
        },
        {
          "id": 35,
          "text": "Os espeleólogos foram socorridos e levados para tratamento, mas ao serem apresentados às autoridades, foram condenados.",
          "start": 505.23,
          "end": 513.14
        },
        {
          "id": 36,
          "text": "O julgamento e os votos Os espeleólogos foram condenados com base no veredicto do juiz de primeira instância ou de recepção do processo.",
          "start": 513.14,
          "end": 522.17
        },
        {
          "id": 37,
          "text": "Esse veredicto destaca que mais dez pessoas foram mortas no curso do resgate, sentenciando que os exploradores sobreviventes fossem levados à forca.",
          "start": 522.17,
          "end": 532.01
        },
        {
          "id": 38,
          "text": "Os réus entraram com recurso junto ao chefe do Poder Executivo pedindo que tal sentença fosse comutada em prisão de seis meses.",
          "start": 532.01,
          "end": 540.45
        },
        {
          "id": 39,
          "text": "Chega-se ao ápice da obra com os votos dos juízes, verdadeiras aulas sobre as vertentes que podem ocorrer no direito.",
          "start": 540.45,
          "end": 548.22
        },
        {
          "id": 40,
          "text": "Percebam que recentemente estão públicas as divergências entre os ministros do Supremo Tribunal Brasileiro, sendo que é natural a divergência de votos e a diversidade de correntes seguidas por um ou outro magistrado.",
          "start": 548.22,
          "end": 562.57
        },
        {
          "id": 41,
          "text": "O juiz Foster, embora diante de um caso assombroso, com corrente naturalista, entende que os condenados estavam privados das leis que se estabeleciam dentro de Newgarth e resolve inocentá-los.",
          "start": 562.57,
          "end": 575.33
        },
        {
          "id": 42,
          "text": "Por outro lado, o juiz Keen, positivista (norma pela norma) segue afirmando que cometeram homicídio e devem responder a este ato.",
          "start": 575.33,
          "end": 584.42
        },
        {
          "id": 43,
          "text": "Já o juiz Tatting posicionou-se de forma híbrida, levando em conta o aspecto emocional e a aplicação da lei, e criticou o voto do juiz Foster e suas posições ao direito natural.",
          "start": 584.42,
          "end": 596.88
        },
        {
          "id": 44,
          "text": "Tatting questiona em qual momento os réus entraram em seu “estado natural”: no momento da entrada da caverna, no instante do acidente, no momento do perigo ou na última tentativa de sobrevivência.",
          "start": 596.88,
          "end": 610.68
        },
        {
          "id": 45,
          "text": "Soma em suas dúvidas como aplicar a lei vigente, diante de tantas controvérsias.",
          "start": 610.68,
          "end": 616.32
        },
        {
          "id": 46,
          "text": "Várias hipóteses foram levantadas: a da “compensação” de mortes — afinal morreram dez operários para salvar quatro pessoas —; se Whetmore era homicida; se houve a excludente da legítima defesa no momento que ele se recusou a cumprir a norma por ele criada; e até hipóteses religiosas sobre o caso.",
          "start": 616.32,
          "end": 637.24
        },
        {
          "id": 47,
          "text": "Percebam que julgam a clemência do Poder Executivo em não condenar os réus, ou seja, o autor criou um sistema jurídico próprio para este ambiente fictício, trazendo os vários atores estatais para sua responsabilidade diante de um caso de homicídio e canibalismo.",
          "start": 637.24,
          "end": 655.69
        },
        {
          "id": 48,
          "text": "Evidentes são os exemplos de aplicação da lei diante desse caso para os demais casos, e que a correção de erros ou equívocos legislativos não suplanta a vontade do poder legislativo em torná-las mais efetivas.",
          "start": 655.69,
          "end": 670.41
        },
        {
          "id": 49,
          "text": "Emitiram seus votos os juízes Hand J.",
          "start": 670.41,
          "end": 673.01
        },
        {
          "id": 50,
          "text": "Keen, Trupenny, Foster e Tatting.",
          "start": 673.01,
          "end": 675.34
        },
        {
          "id": 51,
          "text": "O juiz Keen apresentou em seu voto a incompetência daquele tribunal, dissertando sobre o sofrimento já impingido a todos, mas condenou os réus, pois a lei deveria ser cumprida.",
          "start": 675.34,
          "end": 687.24
        },
        {
          "id": 52,
          "text": "E debateu com o juiz Tatting, que julgou muito severas as suas conclusões, pois entendia que uma lei deveria ser aplicada segundo os propósitos.",
          "start": 687.24,
          "end": 696.97
        },
        {
          "id": 53,
          "text": "Imputar responsabilidade criminal a uma pessoa “livre” é simples, mas diante das circunstâncias, era difícil julgar conforme a lei.",
          "start": 696.97,
          "end": 705.83
        },
        {
          "id": 54,
          "text": "Já o juiz Foster tentou encontrar hiatos na lei para que aqueles réus não pudessem ficar sem punição.",
          "start": 705.83,
          "end": 712.66
        },
        {
          "id": 55,
          "text": "Essa grande contrariedade de pensamento, natural em debates, nós podemos acompanhar nos tribunais superiores brasileiros.",
          "start": 712.66,
          "end": 720.84
        },
        {
          "id": 56,
          "text": "Hand J. ressaltou a publicidade do ato e que isso afetaria a opinião pública e a importância dessa opinião no momento da formação da decisão, dizendo que os acusados deveriam ser perdoados ou deixados em liberdade, com uma espécie de pena simbólica, mas que a forma não constituísse nem defesa nem acusação.",
          "start": 720.84,
          "end": 741.59
        },
        {
          "id": 57,
          "text": "Continuou o seu voto expressando a contrariedade sobre o caso, com a abstenção do Ministério Público, e da grande divergência de votos, ficando nítida para a população a divergência de pensamento dentro da própria corte.",
          "start": 741.59,
          "end": 756.46
        },
        {
          "id": 58,
          "text": "Os exploradores sobreviventes foram julgados e condenados à morte pela forca, pelo assassinato de Whetmore.",
          "start": 756.46,
          "end": 763.7
        },
        {
          "id": 59,
          "text": "Os réus recorreram da decisão.",
          "start": 763.7,
          "end": 765.72
        },
        {
          "id": 60,
          "text": "Quatro juízes estavam no caso: dois votaram a favor dos réus (Foster e Handy), um juiz condenou (Keen), e o outro juiz recusou-se a participar (Tatting).",
          "start": 765.72,
          "end": 776.07
        },
        {
          "id": 61,
          "text": "E com o voto do presidente do tribunal da primeira instância, deu-se empate nas votações.",
          "start": 776.06,
          "end": 782.63
        },
        {
          "id": 62,
          "text": "Assim foram condenados à morte, marcada para o dia 2 de abril de 4300, às 6 horas da manhã de sexta-feira.",
          "start": 782.63,
          "end": 790.45
        },
        {
          "id": 63,
          "text": "No final do livro, o autor afirma que, se encontrarmos algum dia situação parecida, deveremos nos responsabilizar pelos nossos atos, independentemente do caso em questão.",
          "start": 790.45,
          "end": 803
        },
        {
          "id": 64,
          "text": "Em resumo, essa obra é uma grande aula sobre o ser humano, suas fraquezas, sua expressividade de pensamento, sobre aplicação de leis, enfim, sobre o direito.",
          "start": 803,
          "end": 814.59
        },
        {
          "id": 65,
          "text": "O caso dos exploradores de cavernas foi inspirado em dois casos reais de naufrágio: U.S. v.",
          "start": 814.59,
          "end": 821.31
        },
        {
          "id": 66,
          "text": "Holmes (1842) e Regina v.",
          "start": 821.31,
          "end": 823.15
        },
        {
          "id": 67,
          "text": "Dudley & Stephens (1884).",
          "start": 823.15,
          "end": 825
        },
        {
          "id": 68,
          "text": "Sextante presente no naufrágio que Dudley levou para Austrália após sua soltura.",
          "start": 825,
          "end": 830.9
        },
        {
          "id": 69,
          "text": "O objeto foi comprado por um colecionador de antiguidade náutica, pagou na época £ 37.",
          "start": 830.9,
          "end": 837.25
        },
        {
          "id": 70,
          "text": "Só após a compra descobriu a história fatídica o que valorizou o sextante em mais de £ 1.000 No caso U.S. v.",
          "start": 837.25,
          "end": 845.22
        },
        {
          "id": 71,
          "text": "Holmes (1842) não houve canibalismo, mas os homicídios foram praticados como forma de aliviar a carga do bote salva-vidas, que estava ameaçado pela superlotação.",
          "start": 845.22,
          "end": 857.11
        },
        {
          "id": 72,
          "text": "Alexander Holmes foi considerado culpado e condenado a seis meses de prisão e uma multa de US$ 20.",
          "start": 857.11,
          "end": 864.34
        },
        {
          "id": 73,
          "text": "Nenhum dos outros membros da equipe foi levado a julgamento.",
          "start": 864.34,
          "end": 868.77
        },
        {
          "id": 74,
          "text": "Artigo publicado pelo The Illustrated London News sobre o naufrágio do iate Mignonette em 1884, conhecido como Regina v.",
          "start": 868.78,
          "end": 877.73
        },
        {
          "id": 75,
          "text": "Dudley e Stephens.",
          "start": 877.73,
          "end": 879.08
        },
        {
          "id": 76,
          "text": "A beira da morte pela fome Dudley e Stephens mataram um jovem de 17 anos para que pudessem comê-lo.",
          "start": 879.08,
          "end": 886.46
        },
        {
          "id": 77,
          "text": "Dudley e Stephens foram condenados à morte.",
          "start": 886.46,
          "end": 889.67
        },
        {
          "id": 78,
          "text": "No entanto, devido a um protesto público, a sentença foi reduzida para seis meses de prisão.",
          "start": 889.67,
          "end": 896.54
        },
        {
          "id": 79,
          "text": "SUPREMA CORTE DE NEWGARTH, ano 4300 Os réus, acusados do crime de homicídio, foram condenados e sentenciados à forca pelo Tribunal de Instâncias Gerais do Condado de Stowfield.",
          "start": 896.54,
          "end": 909.67
        },
        {
          "id": 80,
          "text": "Eles apresentaram uma petição de erro perante este tribunal.",
          "start": 909.67,
          "end": 914.15
        },
        {
          "id": 81,
          "text": "Os fatos parecem ser suficientes na opinião do juiz principal.",
          "start": 914.15,
          "end": 918.77
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-01/imagem-01-caverna.webp",
          "startTime": 0,
          "endTime": 230,
          "ordem": 1,
          "arquivo": "imagem-01-caverna.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-01/imagem-02-caverna-invisivel.webp",
          "startTime": 230,
          "endTime": 459,
          "ordem": 2,
          "arquivo": "imagem-02-caverna-invisivel.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-01/imagem-03-sorteio.webp",
          "startTime": 459,
          "endTime": 689,
          "ordem": 3,
          "arquivo": "imagem-03-sorteio.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-01/imagem-04-tribunal.webp",
          "startTime": 689,
          "endTime": 919,
          "ordem": 4,
          "arquivo": "imagem-04-tribunal.webp"
        }
      ]
    },
    {
      "numero": 2,
      "id": "capitulo-02",
      "titulo": "Presidente Truepenny",
      "autor": "Presidente Truepenny",
      "descricao": "O voto legalista clássico: a letra estrita da lei contraposta à clemência do Poder Executivo.",
      "duracaoSegundos": 681,
      "duracaoFormatada": "11:21",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-02/capitulo-02-truepenny.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-02/capitulo-02-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-02/capitulo-02-truepenny.srt",
      "cues": [
        {
          "id": 1,
          "text": "Os quatro acusados são membros da Sociedade Espeleológica, uma organização de amadores interessados na exploração de cavernas.",
          "start": 0,
          "end": 8.56
        },
        {
          "id": 2,
          "text": "No início de maio de 4299, eles, na companhia de Roger Whetmore, então também membro da sociedade, penetraram no interior de uma caverna de calcário do tipo encontrado no planalto central desta Confederação1.",
          "start": 8.56,
          "end": 22.69
        },
        {
          "id": 3,
          "text": "Quando chegaram a um ponto afastado da entrada da caverna, ocorreu um deslizamento.",
          "start": 22.69,
          "end": 28.33
        },
        {
          "id": 4,
          "text": "Pedras pesadas caíram, de forma a bloquear completamente a única via conhecida de acesso e de saída para a caverna.",
          "start": 28.33,
          "end": 36.14
        },
        {
          "id": 5,
          "text": "Ao descobrir sua situação, os homens se colocaram perto da entrada obstruída para esperar a equipe de resgate remover os escombros que os impediam de deixar sua prisão subterrânea.",
          "start": 36.14,
          "end": 48.37
        },
        {
          "id": 6,
          "text": "Como Whetmore e os réus tardassem em retornar às suas casas, o secretário da sociedade foi notificado por suas famílias.",
          "start": 48.37,
          "end": 56.52
        },
        {
          "id": 7,
          "text": "Ao que tudo indica, os exploradores deixaram indicações na sede da sociedade sobre a localização da caverna que iriam visitar.",
          "start": 56.52,
          "end": 65.08
        },
        {
          "id": 8,
          "text": "Uma equipe de resgate foi imediatamente enviada ao local.",
          "start": 65.08,
          "end": 68.95
        },
        {
          "id": 9,
          "text": "O trabalho de resgate foi de uma dificuldade esmagadora.",
          "start": 68.95,
          "end": 72.75
        },
        {
          "id": 10,
          "text": "Fez-se necessário suplementar a equipe original com repetidos envios de homens e máquinas adicionais, que tiveram de ser transportados a grande custo para a região remota e isolada na qual a caverna estava localizada.",
          "start": 72.75,
          "end": 87.49
        },
        {
          "id": 11,
          "text": "Foi montado um enorme acampamento temporário de trabalhadores, engenheiros, geólogos e outros especialistas.",
          "start": 87.49,
          "end": 94.83
        },
        {
          "id": 12,
          "text": "O trabalho de desobstrução foi várias vezes frustrado por novos deslizamentos de terra.",
          "start": 94.83,
          "end": 100.74
        },
        {
          "id": 13,
          "text": "Em um desses acidentes, dez trabalhadores que estavam desobstruindo a entrada da caverna foram mortos.",
          "start": 100.74,
          "end": 107.67
        },
        {
          "id": 14,
          "text": "Os fundos da Sociedade Espeleológica foram logo esgotados no esforço de resgate, e a soma de 800 mil frelares2, levantada em parte por doações do público e em parte por concessão governamental, foi gasta antes de os homens presos serem salvos.",
          "start": 107.67,
          "end": 124.17
        },
        {
          "id": 15,
          "text": "O resgate foi finalmente concluído no trigésimo segundo dia após os espeleólogos terem entrado na caverna.",
          "start": 124.17,
          "end": 131.37
        },
        {
          "id": 16,
          "text": "Sabia-se que os exploradores haviam levado poucas provisões e que também não havia matéria animal ou vegetal na caverna da qual pudessem subsistir, portanto, temeu-se que os exploradores viessem a morrer de inanição antes que o acesso até eles fosse aberto.",
          "start": 131.37,
          "end": 148.83
        },
        {
          "id": 17,
          "text": "No vigésimo dia, descobriu- se que eles haviam levado para a caverna uma máquina de comunicação portátil sem fio.",
          "start": 148.83,
          "end": 156.51
        },
        {
          "id": 18,
          "text": "Uma máquina semelhante foi instalada de imediato no acampamento de resgate e foi estabelecida comunicação oral com os infelizes homens presos na montanha.",
          "start": 156.51,
          "end": 166.97
        },
        {
          "id": 19,
          "text": "Eles perguntaram quanto tempo seria necessário para resgatá-los.",
          "start": 166.97,
          "end": 171.32
        },
        {
          "id": 20,
          "text": "Os engenheiros encarregados do projeto responderam que seria preciso pelo menos dez dias, isso se não ocorresse um novo deslizamento.",
          "start": 171.32,
          "end": 180.35
        },
        {
          "id": 21,
          "text": "Os exploradores quiseram, então, saber se havia médicos presentes, e foram colocados em contato com uma junta de médicos especialistas.",
          "start": 180.35,
          "end": 189.52
        },
        {
          "id": 22,
          "text": "Os aprisionados descreveram sua condição e as rações que haviam levado e pediram a opinião dos médicos sobre a possibilidade de sobreviverem por mais dez dias.",
          "start": 189.52,
          "end": 200.32
        },
        {
          "id": 23,
          "text": "O presidente da junta médica lhes respondeu que as possibilidades eram remotas.",
          "start": 200.32,
          "end": 205.69
        },
        {
          "id": 24,
          "text": "Então, o aparelho sem fio na caverna ficou em silêncio por oito horas.",
          "start": 205.69,
          "end": 210.44
        },
        {
          "id": 25,
          "text": "Quando a comunicação foi restabelecida, os homens pediram para falar novamente com os médicos.",
          "start": 210.44,
          "end": 216.83
        },
        {
          "id": 26,
          "text": "O presidente da junta médica foi colocado no aparelho, e Whetmore, falando em nome de si mesmo e dos réus, perguntou se eles poderiam sobreviver por dez dias mais se consumissem a carne de um deles.",
          "start": 216.83,
          "end": 230.28
        },
        {
          "id": 27,
          "text": "Com relutância, o presidente dos médicos respondeu afirmativamente à questão.",
          "start": 230.28,
          "end": 235.51
        },
        {
          "id": 28,
          "text": "Whetmore, em seguida, perguntou se seria aconselhável que eles tirassem a sorte para determinar qual deles deveria ser consumido.",
          "start": 235.51,
          "end": 244.27
        },
        {
          "id": 29,
          "text": "Nenhum dos médicos presentes estava disposto a responder à pergunta.",
          "start": 244.27,
          "end": 248.89
        },
        {
          "id": 30,
          "text": "Em seguida, perguntou se havia entre os membros da equipe de resgate um juiz ou outro funcionário do governo que pudesse responder a essa questão.",
          "start": 248.89,
          "end": 258.81
        },
        {
          "id": 31,
          "text": "Ninguém no acampamento quis assumir o papel de orientador neste problema3.",
          "start": 258.81,
          "end": 263.83
        },
        {
          "id": 32,
          "text": "Ele então perguntou se algum pastor ou padre poderia responder, e não se encontrou nenhum que o fizesse.",
          "start": 263.83,
          "end": 270.9
        },
        {
          "id": 33,
          "text": "Posteriormente, não foram recebidas mais mensagens da caverna, e pensou-se (erroneamente, conforme soube-se mais tarde) que as baterias da máquina de comunicação dos exploradores haviam se esgotado.",
          "start": 270.9,
          "end": 284.35
        },
        {
          "id": 34,
          "text": "Quando os homens aprisionados foram finalmente libertados, soube-se que, no vigésimo terceiro dia depois de sua entrada na caverna, Whetmore havia sido morto e consumido por seus companheiros.",
          "start": 284.35,
          "end": 297.39
        },
        {
          "id": 35,
          "text": "Do testemunho dos réus, que foi aceito pelo júri, soube-se que foi Whetmore quem primeiro propôs que eles encontrassem alimento, sem o qual a sobrevivência seria impossível, na carne de um dos companheiros.",
          "start": 297.39,
          "end": 311.38
        },
        {
          "id": 36,
          "text": "Também foi Whetmore quem primeiro propôs o uso de algum método de sorteio, chamando a atenção dos réus para um par de dados que tinha levado consigo.",
          "start": 311.38,
          "end": 321.51
        },
        {
          "id": 37,
          "text": "Os réus relutaram em adotar um procedimento tão desesperado, mas depois das conversas por meio do aparelho sem fio acima mencionadas, eles finalmente concordaram com o plano proposto por Whetmore4.",
          "start": 321.51,
          "end": 334.89
        },
        {
          "id": 38,
          "text": "Após muita discussão sobre os problemas matemáticos envolvidos, chegou-se finalmente a um acordo sobre um método para resolver o problema por meio dos dados.",
          "start": 334.89,
          "end": 345.55
        },
        {
          "id": 39,
          "text": "Contudo, antes que os dados fossem lançados, Whetmore declarou que ele desistia do acordo, pois decidira esperar mais uma semana antes de adotar um expediente tão terrível e odioso.",
          "start": 345.55,
          "end": 357.85
        },
        {
          "id": 40,
          "text": "Os outros o acusaram de quebrar o pacto e procederam com o lançamento dos dados.",
          "start": 357.85,
          "end": 363.28
        },
        {
          "id": 41,
          "text": "Quando chegou a vez de Whetmore, os dados foram lançados em seu lugar por um dos réus, e ele foi convidado a declarar quaisquer objeções que pudesse ter com relação ao lance dos dados.",
          "start": 363.28,
          "end": 375.78
        },
        {
          "id": 42,
          "text": "Whetmore afirmou que não tinha objeções.",
          "start": 375.78,
          "end": 378.5
        },
        {
          "id": 43,
          "text": "O resultado foi contra ele, morto e consumido a seguir pelos companheiros.",
          "start": 378.5,
          "end": 383.52
        },
        {
          "id": 44,
          "text": "Após o resgate, os réus, depois de terem ficado internados em um hospital onde se submeteram a um tratamento para desnutrição e choque, foram indiciados pelo assassinato de Roger Whetmore.",
          "start": 383.52,
          "end": 396.3
        },
        {
          "id": 45,
          "text": "No julgamento, após as testemunhas terem sido ouvidas, o chefe do júri (um advogado de profissão) perguntou ao tribunal se o júri não poderia chegar a um veredicto especial, deixando para o juiz decidir se, baseado nos fatos encontrados, os réus eram culpados.",
          "start": 396.3,
          "end": 413.96
        },
        {
          "id": 46,
          "text": "Após uma discussão, tanto o representante do Ministério Público quanto o advogado de defesa afirmaram que aceitavam esse procedimento, que foi adotado pelo tribunal.",
          "start": 413.96,
          "end": 425.16
        },
        {
          "id": 47,
          "text": "Em um longo veredicto especial, o júri acolheu a prova dos fatos conforme relatei acima.",
          "start": 425.16,
          "end": 431.14
        },
        {
          "id": 48,
          "text": "E resolveram ainda que, se baseado nos fatos relatados, os réus fossem considerados culpados do crime do qual eram acusados, então deveriam ser condenados.",
          "start": 431.14,
          "end": 441.67
        },
        {
          "id": 49,
          "text": "Com base neste veredicto, o juiz de instrução julgou que os réus eram culpados de assassinar Roger Whetmore.",
          "start": 441.67,
          "end": 449.01
        },
        {
          "id": 50,
          "text": "O juiz condenou-os, então, a serem enforcados, conforme a lei da nossa Confederação, que não permite a ele nenhuma discrição com respeito à pena a ser imposta.",
          "start": 449.01,
          "end": 459.81
        },
        {
          "id": 51,
          "text": "Após a dissolução do júri, seus membros enviaram uma petição conjunta ao chefe do Poder Executivo pedindo que a sentença fosse comutada para prisão por seis meses.",
          "start": 459.81,
          "end": 470.88
        },
        {
          "id": 52,
          "text": "O juiz de primeira instância dirigiu uma petição semelhante ao chefe do Poder Executivo.",
          "start": 470.88,
          "end": 476.86
        },
        {
          "id": 53,
          "text": "Ainda não foi tomada nenhuma ação em relação a esses fundamentos, já que o chefe do Executivo está aguardando nossa disposição sobre tal recurso.",
          "start": 476.86,
          "end": 486.71
        },
        {
          "id": 54,
          "text": "Parece-me que, ao lidar com este caso extraordinário, o júri e o juiz do julgamento seguiram um curso que não só era justo e sábio5, mas o único que lhes era possível nos termos da lei.",
          "start": 486.71,
          "end": 499.27
        },
        {
          "id": 55,
          "text": "O texto da nossa lei é bem conhecido: “Quem quer que voluntariamente tire a vida de outro será punido com a morte”.",
          "start": 499.27,
          "end": 507.09
        },
        {
          "id": 56,
          "text": "N.",
          "start": 507.09,
          "end": 507.22
        },
        {
          "id": 57,
          "text": "C.",
          "start": 507.22,
          "end": 507.36
        },
        {
          "id": 58,
          "text": "S.",
          "start": 507.36,
          "end": 507.49
        },
        {
          "id": 59,
          "text": "A. (N.",
          "start": 507.49,
          "end": 507.9
        },
        {
          "id": 60,
          "text": "S.) § 12-A: Esta lei não permite nenhuma exceção aplicável a este litígio.",
          "start": 507.9,
          "end": 512.93
        },
        {
          "id": 61,
          "text": "No entanto, nossas simpatias nos inclinam a levar em consideração a trágica situação em que esses homens se encontravam.",
          "start": 512.93,
          "end": 521.08
        },
        {
          "id": 62,
          "text": "Em uma ocorrência como esta, o princípio da clemência executiva parece muito adequado a fim de mitigar os rigores da lei.",
          "start": 521.08,
          "end": 529.3
        },
        {
          "id": 63,
          "text": "Proponho aos meus colegas que sigamos o exemplo do júri e do juiz de primeira instância e endossemos as petições que enviaram ao chefe do Poder Executivo.",
          "start": 529.3,
          "end": 539.76
        },
        {
          "id": 64,
          "text": "Há todas as razões para acreditar que tais requerimentos de clemência serão deferidos, uma vez que partem daqueles que estudaram a ocorrência e tiveram a oportunidade de se familiarizar, de forma minuciosa, com todos os seus aspectos.",
          "start": 539.76,
          "end": 555.66
        },
        {
          "id": 65,
          "text": "É altamente improvável que o chefe do Poder Executivo negue essas solicitações, a menos que ele mesmo realize audiências pelo menos tão extensas quanto as que foram realizadas em primeira instância, que duraram três meses.",
          "start": 555.66,
          "end": 570.74
        },
        {
          "id": 66,
          "text": "A realização de tais investigações (o que constituiria, virtualmente, um novo julgamento do caso) dificilmente seria compatível com a função do Poder Executivo, como é normalmente concebida.",
          "start": 570.74,
          "end": 583.64
        },
        {
          "id": 67,
          "text": "Penso que podemos, portanto, assumir que alguma forma de clemência será estendida a esses réus.",
          "start": 583.64,
          "end": 590.1
        },
        {
          "id": 68,
          "text": "Se isto for feito, a justiça será realizada sem ferir a letra ou o espírito da lei, e sem encorajar de qualquer modo sua transgressão.",
          "start": 590.1,
          "end": 599.2
        },
        {
          "id": 69,
          "text": "1 O termo original é Commonwealth, uma organização intergovernamental composta por diferentes nações, na qual os estados-membros cooperam num quadro de valores e objetivos comuns.",
          "start": 599.2,
          "end": 611.36
        },
        {
          "id": 70,
          "text": "A palavra “confederação”, i.e., “Reunião de diversos estados que, mesmo mantendo governos próprios, se colocam sob a dependência de um governo central, com o intuito de defender interesses comuns” (Michaelis), aplica-se melhor à ideia pretendida pelo autor desta ficção futura (Nota do Tradutor).",
          "start": 611.36,
          "end": 631.46
        },
        {
          "id": 71,
          "text": "2 Moeda fictícia criada pelo autor (N. do T.).",
          "start": 631.46,
          "end": 634.59
        },
        {
          "id": 72,
          "text": "3 Percebe-se que, neste momento, o autor põe em dúvida a possibilidade de resgate, pairando no ar a possibilidade do fim da vida de todos.",
          "start": 634.59,
          "end": 643.96
        },
        {
          "id": 73,
          "text": "Trata-se de momento de grande reflexão, pois a morte torna- se um fato viável entre os espeleólogos (Nota do Apresentador).",
          "start": 643.96,
          "end": 652.32
        },
        {
          "id": 74,
          "text": "4 A hermeticidade da caverna faz com que uma liderança se apresente para criar uma solução, pois a escassez de alimentos levaria todos à morte.",
          "start": 652.32,
          "end": 662.03
        },
        {
          "id": 75,
          "text": "Com o enfrentamento da morte, inicia-se um racionalismo sobre a utopia da vida (N. do A.).",
          "start": 662.03,
          "end": 668.15
        },
        {
          "id": 76,
          "text": "5 Fuller traz um termo de suma importância: a questão da sabedoria no justo, ou seja, inicia um debate sobre a força da lei posta em contraposição ao efeito de fazer justiça (N. do A.).",
          "start": 668.15,
          "end": 680.71
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-02/imagem-01-tribunal.webp",
          "startTime": 0,
          "endTime": 227,
          "ordem": 1,
          "arquivo": "imagem-01-tribunal.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-02/imagem-02-lei-escrita.webp",
          "startTime": 227,
          "endTime": 454,
          "ordem": 2,
          "arquivo": "imagem-02-lei-escrita.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-02/imagem-03-sentenca.webp",
          "startTime": 454,
          "endTime": 681,
          "ordem": 3,
          "arquivo": "imagem-03-sentenca.webp"
        }
      ]
    },
    {
      "numero": 3,
      "id": "capitulo-03",
      "titulo": "Juiz Foster",
      "autor": "Juiz Foster",
      "descricao": "O jusnaturalismo e o estado de natureza: a coexistência humana fora do império do direito positivo.",
      "duracaoSegundos": 1240,
      "duracaoFormatada": "20:40",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-03/capitulo-03-foster.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-03/capitulo-03-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-03/capitulo-03-foster.srt",
      "cues": [
        {
          "id": 1,
          "text": "Surpreende-me o fato de o presidente do tribunal, em um esforço para escapar dos constrangimentos desta trágica ocorrência, ter adotado e proposto aos seus colegas um expediente ao mesmo tempo tão sórdido e tão simplista.",
          "start": 0,
          "end": 15.5
        },
        {
          "id": 2,
          "text": "Creio que algo mais está em julgamento neste caso do que o destino desses infelizes exploradores, ou seja, a lei da nossa Confederação.",
          "start": 15.5,
          "end": 24.96
        },
        {
          "id": 3,
          "text": "Se este tribunal declara que, de acordo com a nossa lei, esses homens cometeram um crime, então nossa lei será condenada no tribunal do bom senso6, não obstante o que aconteça aos indivíduos envolvidos neste recurso de apelação.",
          "start": 24.96,
          "end": 40.95
        },
        {
          "id": 4,
          "text": "Ao afirmarmos que a lei que defendemos e enunciamos nos compele a uma conclusão que nos envergonha, e da qual só podemos escapar apelando para uma exceção que depende do capricho do chefe do Poder Executivo, parece- me que admitimos que a lei desta Confederação não pretende realizar justiça.",
          "start": 40.95,
          "end": 61.43
        },
        {
          "id": 5,
          "text": "Pessoalmente, não acredito que nossa lei conduza à monstruosa conclusão de que esses homens são assassinos.",
          "start": 61.43,
          "end": 68.93
        },
        {
          "id": 6,
          "text": "Creio, pelo contrário, que declara que são inocentes de terem cometido qualquer crime.",
          "start": 68.93,
          "end": 74.96
        },
        {
          "id": 7,
          "text": "Fundamento esta conclusão em duas premissas independentes, cada uma das quais basta por si só para justificar a absolvição dos réus.",
          "start": 74.96,
          "end": 84.22
        },
        {
          "id": 8,
          "text": "A primeira dessas asserções baseia-se em uma premissa que pode suscitar oposição até que tenha sido examinada em profundidade.",
          "start": 84.22,
          "end": 93.06
        },
        {
          "id": 9,
          "text": "Considero que a lei promulgada ou positiva desta Confederação, o que inclui todos os seus estatutos e precedentes, é inaplicável a este caso e que o caso é governado, em vez disso, pelo que os escritores antigos na Europa e na América chamaram de “lei da natureza”7.",
          "start": 93.06,
          "end": 111.71
        },
        {
          "id": 10,
          "text": "Esta conclusão fundamenta-se na proposição de que nossa lei positiva se baseia na possibilidade da coexistência entre os homens na sociedade.",
          "start": 111.71,
          "end": 121.6
        },
        {
          "id": 11,
          "text": "Quando ocorre uma situação em que a coexistência se torna impossível, então a condição que respalda todos os nossos precedentes e disposições legais deixa de existir.",
          "start": 121.6,
          "end": 133.24
        },
        {
          "id": 12,
          "text": "Quando essa condição desaparece, em minha opinião, a força do direito positivo desaparece com ela.",
          "start": 133.24,
          "end": 140.11
        },
        {
          "id": 13,
          "text": "Não estamos habituados a aplicar a máxima cessante ratione legis, cessat et ipsa lex8 ao conjunto das nossas leis em vigor, mas acredito que este seja uma ocorrência em que a máxima deve ser aplicada.",
          "start": 140.11,
          "end": 154.13
        },
        {
          "id": 14,
          "text": "A proposição de que toda lei positiva se baseia na possibilidade da coexistência entre os homens soa de modo insólito9, não porque a verdade que contém é estranha, mas simplesmente porque é uma verdade tão óbvia e ubíqua que raramente temos ocasião de colocá-la em palavras.",
          "start": 154.13,
          "end": 173.35
        },
        {
          "id": 15,
          "text": "Como o ar que respiramos, ele é parte tão integral de nossa vida que acabamos por nos esquecer de que existe, até que, de repente, somos, dele, privados.",
          "start": 173.35,
          "end": 184.08
        },
        {
          "id": 16,
          "text": "Quaisquer que sejam os objetivos buscados pelos vários ramos do nosso direito, é evidente a reflexão de que todos eles têm como meta facilitar e melhorar a coexistência entre os homens, e regular com justiça e equidade as relações de sua vida em comum.",
          "start": 184.08,
          "end": 201.75
        },
        {
          "id": 17,
          "text": "Quando a suposição de que os homens são capazes de coexistir deixa de ser verdadeira, como obviamente aconteceu nessa extraordinária situação em que a preservação da vida só se tornou possível pela privação da vida, então as premissas básicas subjacentes a toda nossa ordem jurídica perdem seu significado e sua força.",
          "start": 201.75,
          "end": 224.05
        },
        {
          "id": 18,
          "text": "Se os trágicos acontecimentos deste caso tivessem ocorrido uma milha além dos limites territoriais da nossa Confederação, ninguém pretenderia considerar que nossa lei lhes fosse aplicada.",
          "start": 224.05,
          "end": 237.16
        },
        {
          "id": 19,
          "text": "Reconhecemos que a jurisdição tem base territorial.",
          "start": 237.16,
          "end": 240.74
        },
        {
          "id": 20,
          "text": "Os fundamentos deste princípio não são de modo algum evidentes e raramente são examinados.",
          "start": 240.74,
          "end": 247.05
        },
        {
          "id": 21,
          "text": "Considero que este princípio apoia-se na suposição de que é somente possível impor uma única ordem jurídica a um grupo de homens apenas se eles vivem juntos dentro dos limites de uma determinada área da superfície terrestre.",
          "start": 247.05,
          "end": 262.76
        },
        {
          "id": 22,
          "text": "A premissa de que os homens devem coexistir em grupo subjaz, desse modo, o princípio territorial, como faz toda a lei.",
          "start": 262.76,
          "end": 271.03
        },
        {
          "id": 23,
          "text": "Assim, afirmo que um caso pode ser moralmente removido da força de uma ordem legal, bem como geograficamente.",
          "start": 271.03,
          "end": 278.68
        },
        {
          "id": 24,
          "text": "Se atentarmos aos propósitos da lei e do governo e as premissas subjacentes à nossa lei positiva, veremos que esses homens, quando tomaram a decisão fatídica, estavam tão distantes da nossa ordem jurídica como se estivessem a mil milhas de nossas fronteiras.",
          "start": 278.68,
          "end": 296.77
        },
        {
          "id": 25,
          "text": "Mesmo em um sentido físico, sua prisão subterrânea foi separada de nossos tribunais e oficiais de justiça por uma sólida cortina de pedra que só foi removida após o mais extraordinário dispêndio de tempo e de esforço.",
          "start": 296.77,
          "end": 311.99
        },
        {
          "id": 26,
          "text": "Concluo, portanto, que, no momento em que a vida de Roger Whetmore foi encerrada pelos réus, eles estavam, para usar a linguagem singular dos escritores do século XIX, não em um “estado da sociedade civil”, mas em um “estado de natureza”.",
          "start": 311.99,
          "end": 328.68
        },
        {
          "id": 27,
          "text": "Isso tem como consequência que a lei que lhes é aplicável não é aquela sancionada e estabelecida nesta Confederação, mas a lei derivada desses princípios, os quais adequavam-se à sua condição.",
          "start": 328.68,
          "end": 342.14
        },
        {
          "id": 28,
          "text": "Não hesito em dizer que, sob esses princípios, não são culpados de qualquer crime.",
          "start": 342.14,
          "end": 347.89
        },
        {
          "id": 29,
          "text": "O que esses homens fizeram foi realizado em cumprimento a um acordo aceito por todos eles e proposto, em primeiro lugar, pelo próprio Whetmore.",
          "start": 347.89,
          "end": 357.92
        },
        {
          "id": 30,
          "text": "Como era evidente que sua extraordinária dificuldade tornava inaplicáveis os princípios habituais que regulam as relações dos homens entre si, foi necessário estabelecer, por assim dizer, uma nova constituição apropriada à situação em que se encontravam.",
          "start": 357.92,
          "end": 375.73
        },
        {
          "id": 31,
          "text": "Desde tempos remotos, reconhece-se que o princípio mais básico do direito ou governo encontra-se na noção de contrato ou acordo.",
          "start": 375.73,
          "end": 384.71
        },
        {
          "id": 32,
          "text": "Pensadores antigos, especialmente durante o período de 1600 a 1900, costumavam estabelecer as bases do próprio governo em um pacto social.",
          "start": 384.71,
          "end": 394.38
        },
        {
          "id": 33,
          "text": "Os céticos notam que essa teoria contradiz os fatos históricos conhecidos e que não há evidência científica que sustente a noção de que qualquer governo já tenha sido estabelecido da maneira proposta pela tese.",
          "start": 394.38,
          "end": 409.11
        },
        {
          "id": 34,
          "text": "Os moralistas responderam que, mesmo se, do ponto de vista histórico, o pacto fosse uma ficção, a noção de contrato ou de acordo fornece a única justificativa ética sobre a qual os poderes do governo, que incluem o de tirar a vida, poderiam ser fundamentados.",
          "start": 409.11,
          "end": 427.27
        },
        {
          "id": 35,
          "text": "Os poderes do governo só podem ser moralmente justificados com base no fato de que são poderes que os homens razoáveis concordariam e aceitariam se fossem confrontados com a necessidade de construir uma nova ordem capaz de tornar possível a vida em comum.",
          "start": 427.27,
          "end": 445.15
        },
        {
          "id": 36,
          "text": "Felizmente, a nossa Confederação não é perturbada pelas perplexidades que afligiam os antigos.",
          "start": 445.15,
          "end": 451.75
        },
        {
          "id": 37,
          "text": "Sabemos, como uma questão de verdade histórica, que nosso governo foi fundado com base em um contrato de livre acordo.",
          "start": 451.75,
          "end": 460.02
        },
        {
          "id": 38,
          "text": "A prova arqueológica é conclusiva no sentido de que, no primeiro período que se seguiu à Grande Espiral, os sobreviventes desse holocausto voluntariamente se uniram e elaboraram uma constituição.",
          "start": 460.02,
          "end": 473.69
        },
        {
          "id": 39,
          "text": "Os escritores sofísticos questionam o poder desses primeiros contratantes de obrigar as futuras gerações a seguir este documento, mas o fato é que nosso governo remonta, de forma ininterrupta, a essa carta original.",
          "start": 473.69,
          "end": 488.77
        },
        {
          "id": 40,
          "text": "Se, por conseguinte, nossos carrascos têm o poder de pôr termo à vida dos homens, se nossos oficiais de justiça têm o poder de despejar inquilinos devedores, se nossa polícia tem o poder de encarcerar o galhofeiro embriagado, tais poderes encontram a sua justificativa moral naquele contrato original celebrado pelos nossos antepassados10.",
          "start": 488.77,
          "end": 512.54
        },
        {
          "id": 41,
          "text": "Se não conseguimos recorrer a uma fonte mais elevada para basear nossa ordem jurídica, qual fonte superior deveríamos esperar que esses infelizes famintos encontrassem para sustentar a ordem que adotaram?",
          "start": 512.54,
          "end": 526.85
        },
        {
          "id": 42,
          "text": "Creio que a linha de argumento que acabei de expor não permite nenhuma contestação racional.",
          "start": 526.85,
          "end": 533.3
        },
        {
          "id": 43,
          "text": "Percebo que, provavelmente, será recebida com certa inquietação por muitos que vierem a lê-la, os quais inclinar-se-ão a suspeitar que algum sofisma velado deve subjazer uma demonstração que leva a tantas conclusões incomuns.",
          "start": 533.3,
          "end": 549.08
        },
        {
          "id": 44,
          "text": "A fonte dessa inquietação é, porém, fácil de identificar.",
          "start": 549.08,
          "end": 553.08
        },
        {
          "id": 45,
          "text": "As condições usuais da existência do Homem inclinam-nos a pensar a vida humana como um valor absoluto, que não pode ser sacrificado em nenhuma circunstância.",
          "start": 553.08,
          "end": 564.09
        },
        {
          "id": 46,
          "text": "Há muito de fictício nessa concepção, mesmo quando aplicada às relações sociais comuns.",
          "start": 564.09,
          "end": 570.19
        },
        {
          "id": 47,
          "text": "Temos um exemplo desta verdade no caso diante de nós.",
          "start": 570.19,
          "end": 573.9
        },
        {
          "id": 48,
          "text": "Dez trabalhadores morreram no processo de remoção das rochas da abertura da caverna.",
          "start": 573.9,
          "end": 579.79
        },
        {
          "id": 49,
          "text": "Os engenheiros e os funcionários públicos que dirigiram o esforço de resgate não sabiam que as operações que estavam realizando eram perigosas e que envolviam um sério risco para a vida dos trabalhadores que as executavam?",
          "start": 579.79,
          "end": 595.36
        },
        {
          "id": 50,
          "text": "Se é justo que essas dez vidas tenham sido sacrificadas para salvar cinco exploradores aprisionados, por que, então, entenderíamos ser injusto que esses exploradores realizassem um acordo para salvar quatro vidas ao preço de uma11?",
          "start": 595.36,
          "end": 611.56
        },
        {
          "id": 51,
          "text": "Cada rodovia, cada túnel ou edifício que projetamos envolve risco para a vida humana.",
          "start": 611.56,
          "end": 617.52
        },
        {
          "id": 52,
          "text": "Ao considerarmos o montante total de tais empreendimentos, podemos calcular com certa precisão o número de mortes que sua construção exigirá.",
          "start": 617.52,
          "end": 627.41
        },
        {
          "id": 53,
          "text": "As estatísticas nos mostram o custo médio em termos de vidas humanas para se construir uma rodovia de concreto de quatro pistas com mil milhas de extensão.",
          "start": 627.41,
          "end": 638.28
        },
        {
          "id": 54,
          "text": "No entanto, nós, deliberada e conscientemente, assumimos e pagamos esse custo, partindo do pressuposto de que as vantagens obtidas pelos sobreviventes superam as perdas.",
          "start": 638.28,
          "end": 650.13
        },
        {
          "id": 55,
          "text": "Se tais coisas são aceitas em uma sociedade que se desenvolve na superfície de maneira normal e comum, o que devemos dizer do suposto valor absoluto da vida humana na situação desesperada em que esses réus e seu companheiro Whetmore se encontravam?",
          "start": 650.13,
          "end": 667.52
        },
        {
          "id": 56,
          "text": "Com isso concluo a exposição do primeiro fundamento do meu voto.",
          "start": 667.52,
          "end": 672.01
        },
        {
          "id": 57,
          "text": "O meu segundo fundamento, porém, rejeita hipoteticamente todas as premissas nas quais me baseei.",
          "start": 672.01,
          "end": 678.74
        },
        {
          "id": 58,
          "text": "Admito, a fim de argumentar, que estou errado ao afirmar que a situação desses homens os liberou da incidência de nosso direito positivo e suponho que nossas Leis Consolidadas tenham o poder de penetrar 500 pés através da pedra e de se impor a esses homens famintos, amontoados em sua prisão subterrânea.",
          "start": 678.74,
          "end": 700.06
        },
        {
          "id": 59,
          "text": "Não há dúvidas de que esses homens realizaram um ato que viola a expressão literal da lei, que declara que aquele que “voluntariamente tirar a vida de outro” é um homicida.",
          "start": 700.06,
          "end": 712.12
        },
        {
          "id": 60,
          "text": "Mas um dos mais antigos cânones da sabedoria jurídica é a afirmação de que pode-se violar a letra da lei sem se violar a própria lei.",
          "start": 712.12,
          "end": 721.45
        },
        {
          "id": 61,
          "text": "Toda proposição do direito positivo, esteja contida em uma lei ou em um precedente, deve ser interpretada de forma racional, à luz do seu propósito evidente.",
          "start": 721.45,
          "end": 732.46
        },
        {
          "id": 62,
          "text": "Esta é uma verdade tão elementar que não é necessário que me prolongue.",
          "start": 732.46,
          "end": 737.43
        },
        {
          "id": 63,
          "text": "Os exemplos de sua aplicação são inúmeros e encontrados em todos os ramos do direito.",
          "start": 737.43,
          "end": 743.4
        },
        {
          "id": 64,
          "text": "No caso Confederação v.",
          "start": 743.4,
          "end": 745.01
        },
        {
          "id": 65,
          "text": "Staymore, o réu foi condenado pela lei que determina ser proibido estacionar o automóvel em certas áreas por um período superior a duas horas.",
          "start": 745.01,
          "end": 754.97
        },
        {
          "id": 66,
          "text": "O réu tentou remover seu veículo, mas foi impedido de fazê-lo porque as ruas estavam obstruídas por uma manifestação política da qual ele não tomara parte, nem pudera prever.",
          "start": 754.97,
          "end": 767.17
        },
        {
          "id": 67,
          "text": "Sua condenação foi anulada por este tribunal, embora o litígio se enquadrasse perfeitamente no enunciado da lei.",
          "start": 767.17,
          "end": 775.02
        },
        {
          "id": 68,
          "text": "Do mesmo modo, no caso Fehler v.",
          "start": 775.02,
          "end": 777.27
        },
        {
          "id": 69,
          "text": "Neegas, foi apresentado um dispositivo legal a este tribunal em que a palavra “não” havia sido transposta de sua posição, na seção final e mais crucial do ato.",
          "start": 777.27,
          "end": 788.42
        },
        {
          "id": 70,
          "text": "Esta transposição estava presente em todas as sucessivas redações de tal dispositivo legal, não tendo, aparentemente, sido notada pelos autores do parecer e mantenedores da legislação.",
          "start": 788.42,
          "end": 801.32
        },
        {
          "id": 71,
          "text": "Apesar de ninguém ter sido capaz de explicar como o erro surgira, era evidente que, tendo em conta as disposições da lei em seu conjunto, um erro havia sido cometido, uma vez que a leitura literal da cláusula final tornava inconsistente toda a redação que a precedia e com o objetivo do texto, conforme indicado no preâmbulo.",
          "start": 801.32,
          "end": 824.11
        },
        {
          "id": 72,
          "text": "Este tribunal recusou-se a aceitar uma interpretação literal da lei e, de fato, retificou-a, posicionando a palavra “não” no local onde evidentemente deveria estar.",
          "start": 824.11,
          "end": 835.61
        },
        {
          "id": 73,
          "text": "O dispositivo legal que devemos interpretar nunca foi aplicado literalmente.",
          "start": 835.61,
          "end": 840.94
        },
        {
          "id": 74,
          "text": "Há séculos, foi estabelecido que matar em defesa própria é perdoável.",
          "start": 840.94,
          "end": 845.78
        },
        {
          "id": 75,
          "text": "Não há nada na letra da lei que sugira esta exceção.",
          "start": 845.78,
          "end": 849.42
        },
        {
          "id": 76,
          "text": "Várias tentativas foram realizadas buscando conciliar a tese de legítima defesa com o que a lei estipula, contudo, na minha opinião, não passam de sofismas engenhosos.",
          "start": 849.42,
          "end": 861.14
        },
        {
          "id": 77,
          "text": "A verdade é que a exceção a favor da legítima defesa não pode ser conciliada com as palavras da lei, mas apenas com seu propósito.",
          "start": 861.14,
          "end": 870.25
        },
        {
          "id": 78,
          "text": "A verdadeira reconciliação da tese de legítima defesa com a lei, que reza ser crime matar outro, encontra-se na linha de raciocínio a seguir.",
          "start": 870.25,
          "end": 880.14
        },
        {
          "id": 79,
          "text": "Um dos principais propósitos implícitos a qualquer legislação penal é o de dissuadir os homens a cometerem crimes.",
          "start": 880.14,
          "end": 888.13
        },
        {
          "id": 80,
          "text": "Desse modo, é evidente que, se a lei declarasse que matar em legítima defesa é crime, tal regra não poderia funcionar de forma dissuasiva.",
          "start": 888.13,
          "end": 897.81
        },
        {
          "id": 81,
          "text": "Um homem cuja vida é ameaçada irá repelir o agressor, qualquer que seja a lei.",
          "start": 897.81,
          "end": 903.28
        },
        {
          "id": 82,
          "text": "Observando, portanto, os propósitos maiores da legislação penal, podemos declarar com segurança que esta lei não se destina a ser aplicada em ocorrências de legítima defesa.",
          "start": 903.28,
          "end": 915.41
        },
        {
          "id": 83,
          "text": "Quando a justificativa da tese de legítima defesa é assim explicada, torna- se evidente que precisamente o mesmo raciocínio é aplicável ao litígio em discussão.",
          "start": 915.41,
          "end": 926.63
        },
        {
          "id": 84,
          "text": "Se, no futuro, algum grupo de homens se encontrar na situação trágica desses réus, podemos ter certeza de que sua decisão de viver ou morrer não será controlada pelas normas do nosso Código Penal.",
          "start": 926.63,
          "end": 940.38
        },
        {
          "id": 85,
          "text": "Por conseguinte, se lermos este estatuto de forma racional, é evidente que ele não se aplica a este caso.",
          "start": 940.38,
          "end": 947.74
        },
        {
          "id": 86,
          "text": "A exclusão desta situação do efeito da lei justifica-se precisamente pelas mesmas considerações que foram apresentadas pelos nossos predecessores há séculos, no caso da legítima defesa.",
          "start": 947.74,
          "end": 960.71
        },
        {
          "id": 87,
          "text": "Há os que protestam, alegando usurpação judicial, sempre que um tribunal, depois de analisar o propósito de um dispositivo legal, dá às suas palavras um significado que não é de todo aparente para o leitor casual que não estudou o estatuto em profundidade, ou que examinou os objetivos que a lei procura atingir.",
          "start": 960.71,
          "end": 982.59
        },
        {
          "id": 88,
          "text": "Permitam-me afirmar de maneira enfática que aceito sem reservas a proposição de que este tribunal está vinculado pelas leis da nossa Confederação e que exerce seus poderes em subserviência à vontade devidamente expressa da Câmara dos Representantes.",
          "start": 982.59,
          "end": 1000.05
        },
        {
          "id": 89,
          "text": "A linha de raciocínio que apliquei acima não suscita nenhuma questão de fidelidade ao direito promulgado, embora possa levantar a questão de distinção entre fidelidade inteligente e fidelidade ininteligente.",
          "start": 1000.05,
          "end": 1014.57
        },
        {
          "id": 90,
          "text": "Nenhum superior quer um funcionário que não tem a capacidade de ler nas entrelinhas.",
          "start": 1014.57,
          "end": 1020.46
        },
        {
          "id": 91,
          "text": "A empregada doméstica mais estúpida sabe disso; quando lhe dizem para “descascar a sopa e escumar as batatas”, ela sabe que sua patroa não quis dizer exatamente isto.",
          "start": 1020.46,
          "end": 1032.1
        },
        {
          "id": 92,
          "text": "Ela também sabe que quando seu patrão lhe diz “largue tudo e venha correndo”, ele não considera a possibilidade de que a empregada esteja naquele momento salvando o bebê que caiu no barril destinado a recolher a água de chuva.",
          "start": 1032.1,
          "end": 1047.95
        },
        {
          "id": 93,
          "text": "Certamente, temos o direito de esperar o mesmo mínimo de inteligência do judiciário.",
          "start": 1047.95,
          "end": 1053.84
        },
        {
          "id": 94,
          "text": "A correção de erros ou equívocos legislativos óbvios não tem como objetivo suplantar a vontade legislativa, mas, sim, torná-la efetiva.",
          "start": 1053.84,
          "end": 1063.31
        },
        {
          "id": 95,
          "text": "Concluo, portanto, que, em qualquer aspecto sob o qual esse caso possa ser considerado, estes réus são inocentes do crime de homicídio contra Roger Whetmore e que a sentença seja reformulada.",
          "start": 1063.31,
          "end": 1076.7
        },
        {
          "id": 96,
          "text": "6 Com efeito, há uma diferença teórica entre ética e moral.",
          "start": 1076.7,
          "end": 1080.84
        },
        {
          "id": 97,
          "text": "Embora etimologicamente tenham o mesmo significado (“moral” é a tradução latina do termo grego “ethos”, ou “costume”), normalmente os filósofos consideram “moral” aquilo que se refere às normas e leis, enquanto “ética” é o embasamento teórico desta moral.",
          "start": 1080.84,
          "end": 1098.72
        },
        {
          "id": 98,
          "text": "Assim, pode haver conflito entre o que é “moral” e o que é “ético”: por exemplo, a lei de certos países (moral) condena os culpados de determinados crimes à morte ou à mutilação.",
          "start": 1098.72,
          "end": 1111.2
        },
        {
          "id": 99,
          "text": "No entanto, tirar a vida de outro ser humano ou mutilar seu corpo é eticamente condenável.",
          "start": 1111.2,
          "end": 1117.51
        },
        {
          "id": 100,
          "text": "O juiz Foster está dizendo que, apesar de a lei (a moral) condenar os réus, em termos éticos, neste caso, isso poderia ser uma contradição, ou mesmo um erro.",
          "start": 1117.51,
          "end": 1128.52
        },
        {
          "id": 101,
          "text": "A despeito da distinção feita pelos filósofos, mantive a tradução do termo original “moral” sempre que usado pelo autor (N. do T.).",
          "start": 1128.52,
          "end": 1137.71
        },
        {
          "id": 102,
          "text": "7 Direito natural, ou jusnaturalismo: teoria que busca fundamentar o direito no bom senso, na equidade e no pragmatismo, a fim de se agir de modo razoável e bom (N. do T.).",
          "start": 1137.71,
          "end": 1149.77
        },
        {
          "id": 103,
          "text": "8 “Cessando a motivação da legislação, cessa a própria norma em questão”: com esta máxima, o autor implica que, quando se encontra em um estado de natureza, a legislação passível de ser aplicável não é a de um estado de direito positivo, mas, sim, uma inerente e própria das circunstâncias em que o litígio ocorreu (N. do T.).",
          "start": 1149.77,
          "end": 1172.63
        },
        {
          "id": 104,
          "text": "9 A contraposição do positivismo em contraponto com a realidade traz a verdade Kelseniana à tona, sobre a norma pela norma, o ser e dever (N. do A.).",
          "start": 1172.63,
          "end": 1183.08
        },
        {
          "id": 105,
          "text": "10 A ilação sobre o poder ilimitado dos juízes é alvo de críticas do autor.",
          "start": 1183.08,
          "end": 1188.34
        },
        {
          "id": 106,
          "text": "Eles anunciam os plenos poderes para realizar o ato de retirar a vida, mas debatem se, naquele momento, não seria possível retirar esse dom.",
          "start": 1188.34,
          "end": 1198.16
        },
        {
          "id": 107,
          "text": "Nos dias atuais, vemos os mesmos poderes de juízes no momento do julgamento que, ora permeiam de justiça, ora se afastam totalmente do esperado para aquele ato (N. do A.).",
          "start": 1198.16,
          "end": 1210.15
        },
        {
          "id": 108,
          "text": "11 Foster refere-se à Ética Utilitarista, proposta por Jeremy Benthan (1748-1832) e seu discípulo John Stuart Mill (1806-1873).",
          "start": 1210.15,
          "end": 1219.05
        },
        {
          "id": 109,
          "text": "A Ética Utilitarista busca promover o bem do maior número possível de pessoas, mesmo que em detrimento de um número menor de indivíduos.",
          "start": 1219.05,
          "end": 1228.59
        },
        {
          "id": 110,
          "text": "O pensamento utilitarista é uma das bases do Liberalismo.",
          "start": 1228.59,
          "end": 1232.59
        },
        {
          "id": 111,
          "text": "No parágrafo seguinte, Foster sedimenta a tese utilitarista com o exemplo que desenvolve (N. do T.).",
          "start": 1232.59,
          "end": 1239.6
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-03/imagem-01-foster.webp",
          "startTime": 0,
          "endTime": 310,
          "ordem": 1,
          "arquivo": "imagem-01-foster.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-03/imagem-02-contrato-caverna.webp",
          "startTime": 310,
          "endTime": 620,
          "ordem": 2,
          "arquivo": "imagem-02-contrato-caverna.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-03/imagem-03-resgate.webp",
          "startTime": 620,
          "endTime": 930,
          "ordem": 3,
          "arquivo": "imagem-03-resgate.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-03/imagem-04-proposito-lei.webp",
          "startTime": 930,
          "endTime": 1240,
          "ordem": 4,
          "arquivo": "imagem-04-proposito-lei.webp"
        }
      ]
    },
    {
      "numero": 4,
      "id": "capitulo-04",
      "titulo": "Juiz Tatting (Primeiro Voto)",
      "autor": "Juiz Tatting",
      "descricao": "O dilema ético e a perplexidade jurídica que culminam na abstenção do voto.",
      "duracaoSegundos": 944,
      "duracaoFormatada": "15:44",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-04/capitulo-04-tatting-primeiro-voto.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-04/capitulo-04-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-04/capitulo-04-tatting-primeiro-voto.srt",
      "cues": [
        {
          "id": 1,
          "text": "Na execução de minhas funções como juiz deste tribunal, sou, em geral, capaz de dissociar os aspectos emocional e intelectual de minhas reações e de decidir o caso sub judice inteiramente com base na razão12.",
          "start": 0,
          "end": 14.11
        },
        {
          "id": 2,
          "text": "Contudo, ao estudar esta trágica ocorrência, sinto que estes recursos habituais me falham.",
          "start": 14.11,
          "end": 20.21
        },
        {
          "id": 3,
          "text": "No lado emocional, encontro-me dividido entre a simpatia por estes homens e um sentimento de aborrecimento e aversão pelo ato monstruoso que cometeram.",
          "start": 20.21,
          "end": 30.46
        },
        {
          "id": 4,
          "text": "Acreditei poder colocar essas emoções contraditórias de lado e tratá-las como irrelevantes, decidindo o litígio com base em uma demonstração convincente e lógica do resultado exigido pela nossa lei.",
          "start": 30.46,
          "end": 43.89
        },
        {
          "id": 5,
          "text": "Infelizmente, não alcancei esse intuito.",
          "start": 43.89,
          "end": 46.6
        },
        {
          "id": 6,
          "text": "Ao analisar o voto que meu colega Foster acaba de enunciar, considero que ele incorre em contradições e falácias.",
          "start": 46.6,
          "end": 54.27
        },
        {
          "id": 7,
          "text": "Comecemos com sua primeira proposição: esses homens não estavam sujeitos à nossa lei porque não estavam em um “estado de sociedade civil”, mas em um “estado de natureza”.",
          "start": 54.27,
          "end": 65.8
        },
        {
          "id": 8,
          "text": "Não está claro por que deva ser assim, seja por causa da espessura da rocha que os aprisionou, ou porque estavam padecendo fome, ou porque criaram uma “nova carta de governo” pela qual as regras usuais do direito podiam ser suplantadas por um lance de dados.",
          "start": 65.8,
          "end": 83.3
        },
        {
          "id": 9,
          "text": "Outras dificuldades se apresentaram.",
          "start": 83.3,
          "end": 85.74
        },
        {
          "id": 10,
          "text": "Se esses homens passaram da jurisdição de nossa lei para a “lei da natureza”, em que momento isso ocorreu?",
          "start": 85.74,
          "end": 92.93
        },
        {
          "id": 11,
          "text": "Foi quando a entrada da caverna foi bloqueada, ou foi quando a ameaça de fome atingiu um certo grau indefinido de intensidade, ou ainda quando celebraram o acordo de que o lance de dados decidiria sua sorte?",
          "start": 92.93,
          "end": 106.97
        },
        {
          "id": 12,
          "text": "Tais incertezas na doutrina proposta pelo meu colega trazem dificuldades reais.",
          "start": 106.97,
          "end": 112.33
        },
        {
          "id": 13,
          "text": "Suponhamos, por exemplo, que um desses homens completou seu vigésimo primeiro aniversário enquanto estava aprisionado na montanha.",
          "start": 112.33,
          "end": 121.15
        },
        {
          "id": 14,
          "text": "Em que data devemos considerar que alcançou sua maioridade: quando atingiu a idade de vinte e um anos, no momento em que, por hipótese, estava liberado dos efeitos da nossa lei, ou apenas quando foi libertado da caverna e tornou- se novamente sujeito ao que o meu colega chama de “lei positiva”?",
          "start": 121.15,
          "end": 141.16
        },
        {
          "id": 15,
          "text": "Essas dificuldades podem parecer fantasiosas, mas só servem para revelar a natureza falaciosa da doutrina que é capaz de originá-las.",
          "start": 141.16,
          "end": 150.18
        },
        {
          "id": 16,
          "text": "Mas não é necessário aprofundarmo-nos em tais sutilezas para demonstrar o absurdo da posição do meu colega.",
          "start": 150.18,
          "end": 157.44
        },
        {
          "id": 17,
          "text": "O senhor Foster e eu somos os juízes designados do Tribunal da Confederação de Newgarth, juramentados e com poderes para administrar as leis da Confederação.",
          "start": 157.44,
          "end": 168.09
        },
        {
          "id": 18,
          "text": "Por qual autoridade nos tornamos um tribunal da natureza?",
          "start": 168.09,
          "end": 171.96
        },
        {
          "id": 19,
          "text": "Se esses homens estavam de fato sob a lei natural, de onde vem nossa autoridade para estabelecer e aplicar essa lei?",
          "start": 171.96,
          "end": 179.83
        },
        {
          "id": 20,
          "text": "Certamente, não estamos em um estado de natureza.",
          "start": 179.83,
          "end": 183.15
        },
        {
          "id": 21,
          "text": "Vejamos o conteúdo deste código da natureza que meu colega propõe que adotemos e apliquemos neste caso.",
          "start": 183.15,
          "end": 190.14
        },
        {
          "id": 22,
          "text": "Que código tão complicado e odioso!",
          "start": 190.14,
          "end": 192.51
        },
        {
          "id": 23,
          "text": "É um código em que as normas reguladoras dos contratos são mais importantes do que a lei que rege o homicídio.",
          "start": 192.51,
          "end": 199.97
        },
        {
          "id": 24,
          "text": "É um código sob o qual um homem pode fazer um acordo válido que confere a seus companheiros o poder de consumir seu corpo.",
          "start": 199.97,
          "end": 208.25
        },
        {
          "id": 25,
          "text": "De acordo com as disposições deste código, além disso, tal acordo, uma vez feito, é irrevogável, e se uma das partes tentar retirar-se, os outros podem tomar a lei em suas próprias mãos e fazer cumprir o contrato por violência — pois, embora meu colega faça um silêncio conveniente sobre o efeito da saída de Whetmore do acordo, esta é a implicação necessária de seu argumento.",
          "start": 208.25,
          "end": 233.82
        },
        {
          "id": 26,
          "text": "Os princípios que meu colega expõe contêm outras implicações que não podem ser toleradas.",
          "start": 233.82,
          "end": 239.86
        },
        {
          "id": 27,
          "text": "Ele argumenta que quando os réus atacaram Whetmore e o mataram (não sabemos como, talvez golpeando-o com pedras), eles estavam apenas exercendo os direitos a eles conferidos por seu acordo.",
          "start": 239.86,
          "end": 252.68
        },
        {
          "id": 28,
          "text": "Suponhamos, no entanto, que Whetmore trouxesse um revólver escondido e que, quando viu os réus prestes a matá-lo, eliminou-os para salvar sua própria vida.",
          "start": 252.68,
          "end": 263.19
        },
        {
          "id": 29,
          "text": "O raciocínio de meu colega aplicado a esses fatos faria com que Whetmore fosse um assassino, uma vez que a excludente da legítima defesa lhe seria negada.",
          "start": 263.19,
          "end": 273.64
        },
        {
          "id": 30,
          "text": "Se seus atacantes estivessem agindo com legitimidade ao buscar provocar sua morte, então, certamente, ele não poderia mais reivindicar a legítima defesa da própria vida, tanto quanto um prisioneiro condenado que ataca o executor público que, licitamente, tenta colocar a corda ao redor do seu pescoço.",
          "start": 273.64,
          "end": 294.06
        },
        {
          "id": 31,
          "text": "Todas essas considerações impossibilitam-me aceitar a primeira parte do argumento de meu colega.",
          "start": 294.06,
          "end": 300.57
        },
        {
          "id": 32,
          "text": "Não posso compartilhar sua noção de que esses homens estavam sob uma lei natural, lei esta que este tribunal deveria lhes aplicar, nem posso aceitar as regras odiosas e pervertidas que esse código pudesse conter.",
          "start": 300.57,
          "end": 314.95
        },
        {
          "id": 33,
          "text": "Chego agora à segunda parte das considerações de meu colega, na qual ele procura demostrar que os réus não violaram as disposições legais da N.",
          "start": 314.95,
          "end": 324.65
        },
        {
          "id": 34,
          "text": "C.",
          "start": 324.65,
          "end": 324.78
        },
        {
          "id": 35,
          "text": "S.",
          "start": 324.78,
          "end": 324.92
        },
        {
          "id": 36,
          "text": "A. (N.",
          "start": 324.92,
          "end": 325.33
        },
        {
          "id": 37,
          "text": "S.) § 12-A.",
          "start": 325.33,
          "end": 326.07
        },
        {
          "id": 38,
          "text": "Aqui, o caminho, em vez de claro, torna- se, a meu ver, nebuloso e ambíguo, embora meu colega aparente desconhecer as dificuldades inerentes às suas demonstrações.",
          "start": 326.07,
          "end": 337.13
        },
        {
          "id": 39,
          "text": "A essência de seu argumento pode ser colocada da seguinte forma: nenhuma lei, quaisquer que sejam seus termos, deve ser aplicada de forma a contradizer seu propósito.",
          "start": 337.13,
          "end": 348.39
        },
        {
          "id": 40,
          "text": "Um dos objetivos de qualquer código criminal é a prevenção.",
          "start": 348.39,
          "end": 352.39
        },
        {
          "id": 41,
          "text": "A aplicação da lei que determina ser crime assassinar outro aos fatos peculiares deste caso contradiz este propósito, pois é impossível acreditar que o conteúdo do código criminal poderia dissuadir homens confrontados com a alternativa de viver ou morrer.",
          "start": 352.39,
          "end": 369.69
        },
        {
          "id": 42,
          "text": "O raciocínio pelo qual esta exceção é encontrada na lei é, observa meu colega, o mesmo que admite a excludente de legítima defesa.",
          "start": 369.69,
          "end": 378.51
        },
        {
          "id": 43,
          "text": "À primeira vista, esta demonstração parece deveras convincente.",
          "start": 378.51,
          "end": 382.78
        },
        {
          "id": 44,
          "text": "A interpretação do meu colega sobre a justificativa da excludente de legítima defesa é de fato apoiada por uma decisão deste tribunal, Confederação v.",
          "start": 382.78,
          "end": 392.96
        },
        {
          "id": 45,
          "text": "Parry, um precedente que encontrei em minha pesquisa sobre este litígio.",
          "start": 392.96,
          "end": 397.84
        },
        {
          "id": 46,
          "text": "Embora o caso Confederação v.",
          "start": 397.84,
          "end": 399.81
        },
        {
          "id": 47,
          "text": "Parry pareça ter sido omitido nos textos e decisões subsequentes, ele está inequivocamente de acordo com a interpretação que meu colega atribuiu à excludente de legítima defesa.",
          "start": 399.81,
          "end": 411.81
        },
        {
          "id": 48,
          "text": "Ora, permitam-me, porém, esboçar brevemente as perplexidades que me ocorrem quando examino a demonstração do meu colega em maior profundidade.",
          "start": 411.81,
          "end": 421.45
        },
        {
          "id": 49,
          "text": "É verdade que uma lei deve ser aplicada à luz de seu propósito, e que um dos propósitos da legislação penal é reconhecidamente a prevenção.",
          "start": 421.45,
          "end": 430.88
        },
        {
          "id": 50,
          "text": "A dificuldade é que outras determinações também são imputadas à lei penal.",
          "start": 430.88,
          "end": 435.89
        },
        {
          "id": 51,
          "text": "Conforme foi dito, um dos seus objetivos é fornecer um escape ordenado à instintiva demanda humana de retribuição.",
          "start": 435.89,
          "end": 443.63
        },
        {
          "id": 52,
          "text": "Em Confederação v.",
          "start": 443.63,
          "end": 444.85
        },
        {
          "id": 53,
          "text": "Scape também foi afirmado que seu propósito é a reabilitação do delinquente.",
          "start": 444.85,
          "end": 450
        },
        {
          "id": 54,
          "text": "Confederação v.",
          "start": 450,
          "end": 451.02
        },
        {
          "id": 55,
          "text": "Makeover.",
          "start": 451.02,
          "end": 451.63
        },
        {
          "id": 56,
          "text": "Outras teorias têm sido propostas.",
          "start": 451.63,
          "end": 453.94
        },
        {
          "id": 57,
          "text": "Uma dificuldade semelhante se dá pelo fato de que, embora haja jurisprudência que corrobore a interpretação do meu colega à excludente de legítima defesa, há outro critério jurisprudencial que confere a essa excludente uma lógica diferente.",
          "start": 453.94,
          "end": 470.22
        },
        {
          "id": 58,
          "text": "Na verdade, até eu tomar conhecimento do caso Confederação v.",
          "start": 470.22,
          "end": 474.36
        },
        {
          "id": 59,
          "text": "Parry, nunca tinha ouvido falar da explanação dada pelo meu colega.",
          "start": 474.36,
          "end": 478.9
        },
        {
          "id": 60,
          "text": "A doutrina ensinada em nossas escolas de direito, memorizadas por gerações de estudantes, estabelece o seguinte: a lei relativa ao homicídio requer que se trate de ato “intencional”.",
          "start": 478.9,
          "end": 491.25
        },
        {
          "id": 61,
          "text": "O homem que age para rechaçar uma ameaça agressiva à sua vida não age “intencionalmente”, mas em resposta a um impulso profundamente enraizado na natureza humana.",
          "start": 491.25,
          "end": 502.24
        },
        {
          "id": 62,
          "text": "Suspeito que dificilmente exista um advogado nesta Confederação que não esteja familiarizado com essa linha de raciocínio, especialmente porque este é um dos pontos preferidos explorados nos exames pelos professores de direito.",
          "start": 502.24,
          "end": 517.63
        },
        {
          "id": 63,
          "text": "Ora, a explicação familiar exposta para a excludente de legítima defesa, com efeito, não pode ser aplicada por analogia aos fatos deste litígio.",
          "start": 517.63,
          "end": 527.4
        },
        {
          "id": 64,
          "text": "Esses homens agiram não apenas “intencionalmente”, mas com grande deliberação e após horas de discussão sobre o que deveriam fazer.",
          "start": 527.4,
          "end": 536.29
        },
        {
          "id": 65,
          "text": "Mais uma vez, encontramo-nos diante de uma encruzilhada entre uma linha de raciocínio que nos conduz em uma direção, e outra, que nos leva a um sentido totalmente oposto.",
          "start": 536.29,
          "end": 547.82
        },
        {
          "id": 66,
          "text": "Essa perplexidade é, neste caso, composta, por assim dizer, por uma explicação incorporada em um precedente praticamente desconhecido deste tribunal, contra outra explanação, sendo esta parte da tradição jurídica ensinada de nossas escolas de direito, mas que, até onde eu sei, nunca foi adotada em decisão judicial alguma.",
          "start": 547.82,
          "end": 569.73
        },
        {
          "id": 67,
          "text": "Reconheço a relevância dos precedentes citados por meu colega sobre o “não” colocado fora de lugar e sobre o réu que extrapolou as horas permitidas de estacionamento de seu automóvel.",
          "start": 569.73,
          "end": 582.14
        },
        {
          "id": 68,
          "text": "Mas o que devemos fazer com um dos marcos da nossa jurisprudência, sobre o qual, de modo notável, meu colega se abstém de pronunciar-se a respeito?",
          "start": 582.14,
          "end": 592.11
        },
        {
          "id": 69,
          "text": "Isto é visto em Confederação v.",
          "start": 592.11,
          "end": 594.22
        },
        {
          "id": 70,
          "text": "Valjean.",
          "start": 594.22,
          "end": 594.76
        },
        {
          "id": 71,
          "text": "Embora o caso seja relatado de modo um tanto obscuro, parece que o réu foi indiciado pelo furto de um pedaço de pão e estabeleceu sua defesa com base na afirmação de que estava padecendo fome.",
          "start": 594.76,
          "end": 607.78
        },
        {
          "id": 72,
          "text": "O tribunal não aceitou essa alegação.",
          "start": 607.78,
          "end": 610.29
        },
        {
          "id": 73,
          "text": "Uma vez mais, se analisarmos o litígio pelo viés da prevenção, é possível que um homem deixe-se morrer de fome para evitar uma sentença de prisão por furto de um pedaço de pão?",
          "start": 610.29,
          "end": 622.23
        },
        {
          "id": 74,
          "text": "As argumentações de meu colega nos obrigariam a anular Confederação v.",
          "start": 622.23,
          "end": 626.98
        },
        {
          "id": 75,
          "text": "Valjean e muitos outros precedentes que constituíram o caso.",
          "start": 626.98,
          "end": 631.05
        },
        {
          "id": 76,
          "text": "Uma vez mais, tenho dificuldade em dizer que nenhum efeito preventivo, qualquer que seja, poderia ser imputado a uma decisão de que esses homens são culpados de homicídio.",
          "start": 631.05,
          "end": 642.65
        },
        {
          "id": 77,
          "text": "O estigma da palavra “assassino” é tal que, muito provavelmente, creio eu, se esses homens tivessem sabido que seu ato seria considerado pela lei como homicídio, eles teriam esperado por alguns dias, pelo menos, antes de posto seu plano em prática.",
          "start": 642.65,
          "end": 659.47
        },
        {
          "id": 78,
          "text": "Nesse ínterim, algum socorro inesperado poderia tê-los salvo.",
          "start": 659.47,
          "end": 663.61
        },
        {
          "id": 79,
          "text": "Percebo que essa observação apenas reduz a distinção a uma questão de grau e não a elimina completamente.",
          "start": 663.61,
          "end": 670.73
        },
        {
          "id": 80,
          "text": "Certamente é verdade que o elemento de dissuasão teria uma ascendência menor neste caso do que normalmente tem na aplicação do direito penal.",
          "start": 670.73,
          "end": 680.3
        },
        {
          "id": 81,
          "text": "Há ainda uma dificuldade adicional na proposta do meu colega Foster de entender que existe uma exceção na lei que favorece este litígio, embora seja, novamente, uma dificuldade sequer assinalada em sua opinião.",
          "start": 680.3,
          "end": 694.54
        },
        {
          "id": 82,
          "text": "Qual deve ser o escopo desta exceção?",
          "start": 694.54,
          "end": 697.05
        },
        {
          "id": 83,
          "text": "Aqui, os homens lançaram dados, e a vítima concordava, em um primeiro momento, com o acordo.",
          "start": 697.05,
          "end": 703.29
        },
        {
          "id": 84,
          "text": "Qual seria nossa decisão, se soubéssemos que Whetmore se recusou, desde o início, a participar do plano?",
          "start": 703.29,
          "end": 710.35
        },
        {
          "id": 85,
          "text": "Seria outorgado à maioria o poder de suplantar sua vontade?",
          "start": 710.35,
          "end": 714.35
        },
        {
          "id": 86,
          "text": "Ou vamos supor que nenhum plano tivesse sido adotado e que os réus simplesmente conspiraram para assassinar Whetmore, justificando seu ato com a afirmação de que ele era o mais debilitado do grupo.",
          "start": 714.35,
          "end": 727.71
        },
        {
          "id": 87,
          "text": "Ou, então, que se adotou um plano de seleção da vítima baseado na justificativa de que, como os outros fossem ateus, Whetmore deveria morrer porque era o único que acreditava em uma vida após a morte.",
          "start": 727.71,
          "end": 741.28
        },
        {
          "id": 88,
          "text": "Esses exemplos poderiam ser multiplicados, mas os que sugerimos bastam para demonstrar que as dificuldades ocultas no raciocínio de meu colega criam um atoleiro intransponível.",
          "start": 741.28,
          "end": 753.22
        },
        {
          "id": 89,
          "text": "Certamente percebo, ao refletir, que estou preocupando-me com um problema que nunca voltará a surgir, uma vez que é improvável que outro grupo de homens seja de novo levado a cometer o ato de terror aqui consumado.",
          "start": 753.22,
          "end": 767.73
        },
        {
          "id": 90,
          "text": "No entanto, em uma reflexão ainda mais aprofundada, mesmo que tenhamos certeza de que nenhuma ocorrência semelhante surgirá outra vez, os exemplos que citei não demostram a falta de qualquer princípio coerente e racional na interpretação que meu colega propõe?",
          "start": 767.73,
          "end": 785.37
        },
        {
          "id": 91,
          "text": "A solidez de um princípio não deve ser demonstrada pelas conclusões que implica, sem referência aos acidentes ou à história litigiosa posterior?",
          "start": 785.37,
          "end": 795.14
        },
        {
          "id": 92,
          "text": "Mesmo assim, se tal for verdadeiro, por que é que nós, membros deste tribunal, discutimos amiúde se é provável que tenhamos que aplicar no futuro o princípio que a solução do presente caso reclama?",
          "start": 795.14,
          "end": 808.5
        },
        {
          "id": 93,
          "text": "Quanto mais examino e reflito sobre este litígio, mais profundamente me envolvo.",
          "start": 808.5,
          "end": 813.93
        },
        {
          "id": 94,
          "text": "Minha mente se emaranha nas malhas da rede que lanço em meu próprio resgate.",
          "start": 813.93,
          "end": 819.08
        },
        {
          "id": 95,
          "text": "Acredito que quase todas as considerações sobre a decisão deste caso são contrabalançadas por outras que nos conduzem na direção oposta.",
          "start": 819.08,
          "end": 828.31
        },
        {
          "id": 96,
          "text": "Meu colega Foster não me forneceu, nem sou capaz de encontrar por mim mesmo, qualquer fórmula capaz de resolver os equívocos que me assaltam de todos os flancos.",
          "start": 828.31,
          "end": 839.23
        },
        {
          "id": 97,
          "text": "Tratei deste caso da melhor forma que pude.",
          "start": 839.23,
          "end": 842.15
        },
        {
          "id": 98,
          "text": "Mal pude dormir desde que passamos a debatê-lo.",
          "start": 842.15,
          "end": 845.33
        },
        {
          "id": 99,
          "text": "Quando me sinto inclinado a aceitar a visão de meu colega Foster, sou afastado pelo sentimento de que seus argumentos são intelectualmente infundados e se aproximam de mera racionalização.",
          "start": 845.33,
          "end": 858.09
        },
        {
          "id": 100,
          "text": "Por outro lado, quando me inclino a defender a condenação, espanta-me o absurdo de enviar os réus para a forca, sendo que suas vidas foram salvas à custa da existência de dez trabalhadores heroicos.",
          "start": 858.09,
          "end": 871.52
        },
        {
          "id": 101,
          "text": "Lamento que o procurador público tenha considerado adequado acusá-los de homicídio.",
          "start": 871.52,
          "end": 877.15
        },
        {
          "id": 102,
          "text": "Se tivéssemos uma provisão em nossas leis que determinasse ser crime consumir carne humana, teria sido uma acusação mais apropriada.",
          "start": 877.15,
          "end": 886.1
        },
        {
          "id": 103,
          "text": "Se nenhuma outra acusação adequada aos fatos deste caso pudesse ser imputada contra os réus, teria sido mais sábio, creio, não os ter indiciado.",
          "start": 886.1,
          "end": 895.87
        },
        {
          "id": 104,
          "text": "Infelizmente, porém, os réus foram indiciados e julgados, envolvendo, portanto, a nós juízes nesse infeliz litígio.",
          "start": 895.87,
          "end": 903.67
        },
        {
          "id": 105,
          "text": "Como não há capacidade de resolver as dúvidas que me assediam sobre a aplicação da lei neste caso, lamento sobremaneira anunciar uma medida que, em minha opinião, não tem precedentes na história deste tribunal: declaro retirar minha participação da decisão deste caso.",
          "start": 903.67,
          "end": 921.85
        },
        {
          "id": 106,
          "text": "12 O magistrado Tatting apresenta sua linha de pensamento, ou seja, a razão imperará sobre a emoção.",
          "start": 921.85,
          "end": 928.63
        },
        {
          "id": 107,
          "text": "Partindo de que o direito é uma ciência humana e não exata, o autor apresenta uma linha de pensamento quase que cartesiana do direito, renova o dura lex sed lex e afasta a sensibilidade no momento do ato de julgar (N. do A.).",
          "start": 928.63,
          "end": 943.9
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-04/imagem-01-duvida.webp",
          "startTime": 0,
          "endTime": 315,
          "ordem": 1,
          "arquivo": "imagem-01-duvida.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-04/imagem-02-labirinto.webp",
          "startTime": 315,
          "endTime": 629,
          "ordem": 2,
          "arquivo": "imagem-02-labirinto.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-04/imagem-03-tribunal-dividido.webp",
          "startTime": 629,
          "endTime": 944,
          "ordem": 3,
          "arquivo": "imagem-03-tribunal-dividido.webp"
        }
      ]
    },
    {
      "numero": 5,
      "id": "capitulo-05",
      "titulo": "Juiz Keen",
      "autor": "Juiz Keen",
      "descricao": "O positivismo analítico estrito: a separação irrevogável entre Direito e Moral.",
      "duracaoSegundos": 1134,
      "duracaoFormatada": "18:54",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-05/capitulo-05-keen.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-05/capitulo-05-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-05/capitulo-05-keen.srt",
      "cues": [
        {
          "id": 1,
          "text": "Gostaria de começar por colocar de lado duas questões que não cabem a este tribunal.",
          "start": 0,
          "end": 5.8
        },
        {
          "id": 2,
          "text": "A primeira é se a clemência executiva pode ser estendida a esses réus, caso a condenação seja confirmada.",
          "start": 5.8,
          "end": 13.06
        },
        {
          "id": 3,
          "text": "Em nosso sistema de governo, tal questão deve ser respondida pelo Poder Executivo, não por nós.",
          "start": 13.06,
          "end": 19.62
        },
        {
          "id": 4,
          "text": "Por conseguinte, desaprovo a passagem na opinião do juiz principal na qual, com efeito, ele passa instruções ao Poder Executivo sobre o que deve ser feito neste litígio e sugere que poderia advir alguma improbidade, caso tais instruções não sejam atendidas.",
          "start": 19.62,
          "end": 37.38
        },
        {
          "id": 5,
          "text": "Este é o mistifório das funções governamentais — um caos do qual o Poder Judiciário deve ser isentado de culpa.",
          "start": 37.38,
          "end": 45.04
        },
        {
          "id": 6,
          "text": "Gostaria de afirmar que, se eu fosse o chefe do Poder Executivo, avançaria mais na direção da clemência do que as reivindicações a ele endereçadas suplicam.",
          "start": 45.04,
          "end": 55.82
        },
        {
          "id": 7,
          "text": "Gostaria de perdoar todos esses homens, já que acredito que sofreram o bastante para pagar qualquer delito que possam ter cometido.",
          "start": 55.82,
          "end": 64.87
        },
        {
          "id": 8,
          "text": "Quero deixar claro que esta observação é feita em minha capacidade de cidadão particular que, em virtude de seu ofício, adquiriu um íntimo conhecimento dos fatos deste caso.",
          "start": 64.87,
          "end": 76.82
        },
        {
          "id": 9,
          "text": "Na execução de minhas funções como juiz, não é minha obrigação questionar as orientações do chefe do Poder Executivo, nem levar em consideração o que ele pode ou não fazer, para chegar à minha própria conclusão, a qual deve ser totalmente fundamentada na lei desta Confederação.",
          "start": 76.82,
          "end": 96.03
        },
        {
          "id": 10,
          "text": "A segunda questão que desejo deixar de lado é a de decidir se o que esses homens fizeram foi “correto” ou “errado”, “mau” ou “bom”13.",
          "start": 96.03,
          "end": 105.22
        },
        {
          "id": 11,
          "text": "Trata-se, também, de uma inquirição irrelevante para a realização do meu ofício de juiz que jurou aplicar, não as minhas concepções de moralidade, mas a lei da terra.",
          "start": 105.22,
          "end": 116.69
        },
        {
          "id": 12,
          "text": "Ao colocar esta questão de lado, creio poder, de igual maneira, excluir com segurança, sem comentar, a primeira e mais poética parte do voto de meu colega Foster.",
          "start": 116.69,
          "end": 127.88
        },
        {
          "id": 13,
          "text": "O elemento de fantasia contida nos argumentos por ele desenvolvidos já foi suficientemente revelado na tentativa um tanto solene de meu colega Tatting de levar tais argumentos a sério.",
          "start": 127.88,
          "end": 140.59
        },
        {
          "id": 14,
          "text": "A única questão que nos é dada a deliberar é se esses réus, no sentido da lei N.",
          "start": 140.59,
          "end": 146.12
        },
        {
          "id": 15,
          "text": "C.",
          "start": 146.12,
          "end": 146.25
        },
        {
          "id": 16,
          "text": "S.",
          "start": 146.25,
          "end": 146.39
        },
        {
          "id": 17,
          "text": "A. (N.",
          "start": 146.39,
          "end": 146.81
        },
        {
          "id": 18,
          "text": "S.) § 12-A, tiraram voluntariamente a vida de Roger Whetmore.",
          "start": 146.81,
          "end": 151.02
        },
        {
          "id": 19,
          "text": "O texto exato da lei reza o seguinte: “Quem tirar voluntariamente a vida de outrem será punido com a morte”.",
          "start": 151.02,
          "end": 158.48
        },
        {
          "id": 20,
          "text": "Ora, eu deveria supor que qualquer observador sincero, contentando-se em extrair dessas palavras seu significado natural, admitiria imediatamente que esses réus “tiraram voluntariamente a vida” de Roger Whetmore.",
          "start": 158.48,
          "end": 173.13
        },
        {
          "id": 21,
          "text": "De onde, então, surgem todas as dificuldades deste caso e a necessidade de tantas páginas de discussão sobre algo que deveria ser tão óbvio?",
          "start": 173.13,
          "end": 182.8
        },
        {
          "id": 22,
          "text": "As dificuldades, mesmo da forma angustiada com que aqui se apresentam, voltam-se a uma única fonte, a qual é a incapacidade de se distinguir entre os aspectos legais e morais14 deste caso.",
          "start": 182.8,
          "end": 195.79
        },
        {
          "id": 23,
          "text": "Colocando sem rodeios, meus colegas sentem-se desconfortáveis com o fato de que a lei escrita demanda a condenação dos réus.",
          "start": 195.79,
          "end": 204.36
        },
        {
          "id": 24,
          "text": "Inclusive eu.",
          "start": 204.36,
          "end": 205.25
        },
        {
          "id": 25,
          "text": "Contudo, ao contrário de meus colegas, respeito as obrigações de um ofício que exige que eu coloque de lado minhas convicções pessoais ao interpretar e aplicar a lei desta Confederação.",
          "start": 205.25,
          "end": 218.03
        },
        {
          "id": 26,
          "text": "Ora, certamente, meu colega Foster não admite que está sugestionado por uma aversão pessoal à lei escrita.",
          "start": 218.03,
          "end": 225.36
        },
        {
          "id": 27,
          "text": "Em lugar disso, ele desenvolve uma linha de argumentação segundo a qual o tribunal pode desconsiderar o enunciado expresso de uma lei quando algo não contido nessa lei, denominado de “propósito”, pode ser empregado para justificar o resultado que o tribunal considera adequado.",
          "start": 225.36,
          "end": 244.49
        },
        {
          "id": 28,
          "text": "Como esta é uma questão antiga entre meu colega e eu, gostaria, antes de discutir a aplicação particular do argumento aos fatos deste caso, comentar os antecedentes históricos deste problema e suas implicações para o direito e o governo de modo geral.",
          "start": 244.49,
          "end": 261.83
        },
        {
          "id": 29,
          "text": "Houve um tempo nesta Confederação em que os juízes, com efeito, legislavam de modo demasiadamente livre, e todos nós sabemos que durante esse período algumas das nossas leis foram minuciosamente reformuladas pelo Judiciário.",
          "start": 261.83,
          "end": 277.31
        },
        {
          "id": 30,
          "text": "Foi uma época em que os princípios aceitos da ciência política não se imiscuíam na hierarquia e na função dos vários poderes do Estado.",
          "start": 277.31,
          "end": 286.64
        },
        {
          "id": 31,
          "text": "Todos conhecemos o trágico problema dessa incerteza por conta da breve guerra civil resultante do conflito entre o Poder Judiciário, de um lado, e o Executivo e o Legislativo, de outro.",
          "start": 286.64,
          "end": 299.42
        },
        {
          "id": 32,
          "text": "Não há necessidade de aqui rememorar os fatores que contribuíram para a eclosão dessa infame luta pelo poder, embora fossem também motivados pelo caráter não representativo da Câmara, resultante de uma divisão da Confederação em zonas eleitorais que já não estavam de acordo com a distribuição real da população, bem como da personalidade contundente e do amplo apoio popular amealhado pelo então chefe do Poder Executivo.",
          "start": 299.42,
          "end": 328.57
        },
        {
          "id": 33,
          "text": "Basta observar que esses dias ficaram para trás e que, em lugar da incerteza que antes reinava, agora temos um princípio claro, que é a supremacia do Poder Legislativo do nosso governo.",
          "start": 328.57,
          "end": 341.35
        },
        {
          "id": 34,
          "text": "Desse princípio, depreende-se que a obrigação do Poder Judiciário é a de fazer cumprir fielmente a lei escrita e de interpretar tal lei de acordo com seu significado mais simples, sem referência aos nossos desejos pessoais ou nossas concepções individuais de justiça15.",
          "start": 341.35,
          "end": 359.94
        },
        {
          "id": 35,
          "text": "Não me preocupa a questão de saber se o princípio que proíbe a revisão judicial é correto ou errado, desejável ou indesejável; observo simplesmente que este princípio tornou-se uma premissa tácita subjacente a toda a ordem legal e governamental que jurei aplicar.",
          "start": 359.94,
          "end": 378.11
        },
        {
          "id": 36,
          "text": "Não obstante o princípio da supremacia da legislatura ter sido aceito em tese por séculos, a tenacidade da tradição profissional e a força de hábitos de pensamento fixos são tais, que muitos dos magistrados ainda não se adaptaram ao papel restrito que a nova ordem lhes impõe.",
          "start": 378.11,
          "end": 397.17
        },
        {
          "id": 37,
          "text": "Meu colega Foster pertence a tal grupo.",
          "start": 397.17,
          "end": 399.87
        },
        {
          "id": 38,
          "text": "Sua forma de tratar a lei é exatamente aquela de um juiz que viveu no século XL d.C.",
          "start": 399.87,
          "end": 405.67
        },
        {
          "id": 39,
          "text": "Estamos todos familiarizados com o processo pelo qual reforma-se os dispositivos legais desfavorecidos pelos juízes.",
          "start": 405.67,
          "end": 413.68
        },
        {
          "id": 40,
          "text": "Qualquer um que tenha concordado com as argumentações produzidas pelo colega Foster terá a oportunidade de vê-las atuando em todos os ramos da lei.",
          "start": 413.68,
          "end": 423.84
        },
        {
          "id": 41,
          "text": "Tenho tanta familiaridade com o processo que, caso meu colega tivesse se julgado incapaz, eu poderia redigir um voto satisfatório em seu lugar, sem qualquer sugestão de sua parte além da informação de que concordava ou não com o efeito da lei a ser aplicada ao caso ora analisado.",
          "start": 423.84,
          "end": 443.18
        },
        {
          "id": 42,
          "text": "O processo de revisão judicial exige três etapas.",
          "start": 443.18,
          "end": 446.57
        },
        {
          "id": 43,
          "text": "A primeira é encontrar o único “propósito” ao qual a lei serve.",
          "start": 446.57,
          "end": 450.92
        },
        {
          "id": 44,
          "text": "Isto é feito, embora nenhuma lei tenha um único propósito — e apesar de que os propósitos de quase todas as leis sejam interpretados de maneira diversa pelos diferentes grupos que as promovem.",
          "start": 450.92,
          "end": 464.19
        },
        {
          "id": 45,
          "text": "A segunda etapa é descobrir que um ser mítico chamado “legislador”, na busca desse “propósito” imaginado, negligenciou algo, deixou alguma lacuna, ou cometeu qualquer imperfeição em seu trabalho.",
          "start": 464.19,
          "end": 477.66
        },
        {
          "id": 46,
          "text": "Em seguida, vem a parte final e mais estimulante da tarefa, que é, naturalmente, preencher o hiato assim criado.",
          "start": 477.66,
          "end": 485.4
        },
        {
          "id": 47,
          "text": "Quod erat faciendum16.",
          "start": 485.4,
          "end": 486.91
        },
        {
          "id": 48,
          "text": "A inclinação de meu colega Foster para encontrar brechas na lei lembra uma história contada por um antigo autor, sobre o homem que comeu um par de sapatos.",
          "start": 486.91,
          "end": 497.62
        },
        {
          "id": 49,
          "text": "Ao ser indagado se havia gostado, respondeu que sua parte preferida tinha sido os buracos.",
          "start": 497.62,
          "end": 503.84
        },
        {
          "id": 50,
          "text": "É assim que o meu colega se sente com relação às leis: quanto mais buracos (brechas), mais as aprecia.",
          "start": 503.84,
          "end": 510.89
        },
        {
          "id": 51,
          "text": "Em suma, não lhe agradam as leis.",
          "start": 510.89,
          "end": 513.17
        },
        {
          "id": 52,
          "text": "Não se poderia desejar um caso melhor para ilustrar a natureza especiosa desse processo de preenchimento de lacunas do que este que julgamos.",
          "start": 513.17,
          "end": 522.91
        },
        {
          "id": 53,
          "text": "Meu colega pensa saber exatamente o que buscou ao determinar-se que o homicídio é crime, e isto é algo que ele denomina “prevenção”.",
          "start": 522.91,
          "end": 532.03
        },
        {
          "id": 54,
          "text": "Meu colega Tatting já demostrou o quanto foi omitido nessa interpretação.",
          "start": 532.03,
          "end": 537.07
        },
        {
          "id": 55,
          "text": "Contudo, creio que o problema é mais profundo.",
          "start": 537.07,
          "end": 540.25
        },
        {
          "id": 56,
          "text": "Duvido muito que a lei que qualifica homicídio como um crime realmente tenha um “propósito” em qualquer sentido deste termo.",
          "start": 540.25,
          "end": 548.82
        },
        {
          "id": 57,
          "text": "Essencialmente, tal lei reflete uma convicção humana profundamente enraizada, qual seja: a de que o homicídio é errado e que algo deve ser feito ao homem que o comete.",
          "start": 548.82,
          "end": 560.35
        },
        {
          "id": 58,
          "text": "Se fôssemos forçados a ser mais claros sobre o problema, provavelmente nos refugiaríamos nas teorias mais sofisticadas dos criminologistas, o que, decerto, não estava na mente daqueles que criaram nossas leis.",
          "start": 560.35,
          "end": 574.79
        },
        {
          "id": 59,
          "text": "Podemos também observar que os homens trabalham de forma mais eficaz e vivem vidas mais felizes quando estão protegidos contra a ameaça de ataque violento.",
          "start": 574.79,
          "end": 585.5
        },
        {
          "id": 60,
          "text": "Tendo em mente que as vítimas de assassinatos são quase sempre pessoas repulsivas, podemos inferir que a questão da eliminação de indesejáveis não é uma função adequada à empresa privada, mas deve ser monopólio do Estado.",
          "start": 585.5,
          "end": 600.77
        },
        {
          "id": 61,
          "text": "Isto me recorda o advogado que, certa vez, defendeu diante deste tribunal que uma lei sobre o exercício da medicina seria positiva, pois essa medida provocaria uma queda nos prêmios dos seguros de vida, elevando o nível de saúde de modo geral.",
          "start": 600.77,
          "end": 617.56
        },
        {
          "id": 62,
          "text": "Há aqueles que desejam explicar o óbvio.",
          "start": 617.56,
          "end": 620.32
        },
        {
          "id": 63,
          "text": "Se não conhecemos o propósito do § 12-A, como podemos dizer que há uma “lacuna” nele?",
          "start": 620.32,
          "end": 626.19
        },
        {
          "id": 64,
          "text": "Como podemos saber o que os relatores pensavam sobre a questão de matar homens para comê-los?",
          "start": 626.19,
          "end": 632.62
        },
        {
          "id": 65,
          "text": "Meu colega Tatting demonstrou uma repulsa compreensível, embora talvez um pouco exagerada, com relação ao canibalismo.",
          "start": 632.62,
          "end": 640.77
        },
        {
          "id": 66,
          "text": "Será que seus antepassados remotos não sentiram a mesma revolta em um grau ainda maior?",
          "start": 640.77,
          "end": 646.78
        },
        {
          "id": 67,
          "text": "Os antropólogos afirmam que o temor de um ato proibido pode ser aumentado pelo fato de que as condições de vida de uma tribo criam tentações especiais para tal ato, como é o caso do incesto, severamente condenado entre aqueles cujas relações na Confederação aumentam sua probabilidade.",
          "start": 646.78,
          "end": 666.47
        },
        {
          "id": 68,
          "text": "Certamente, o período que se seguiu à Grande Espiral levou a tais tentações de antropofagia.",
          "start": 666.47,
          "end": 672.82
        },
        {
          "id": 69,
          "text": "Talvez fosse por essa mesma razão que nossos antepassados expressaram sua proibição de forma tão abrangente e absoluta.",
          "start": 672.82,
          "end": 681.05
        },
        {
          "id": 70,
          "text": "Tudo isso trata-se, certamente, de uma conjectura, porém, está bastante claro que nem eu, tampouco meu colega Foster, sabemos qual é o “propósito” do § 12-A.",
          "start": 681.05,
          "end": 691.89
        },
        {
          "id": 71,
          "text": "Considerações semelhantes às que acabei de descrever são também aplicáveis à exclusão de legítima defesa, que desempenha um papel tão importante no raciocínio dos colegas Foster e Tatting.",
          "start": 691.89,
          "end": 704.88
        },
        {
          "id": 72,
          "text": "É certamente verdade que em Commonwealth v.",
          "start": 704.88,
          "end": 707.85
        },
        {
          "id": 73,
          "text": "Parry, a exceção foi justificada por um obiter dictum17 sob o pressuposto de que a finalidade da legislação penal é a prevenção.",
          "start": 707.85,
          "end": 716.69
        },
        {
          "id": 74,
          "text": "Pode também ser verdade que gerações de estudantes de direito aprenderam que a verdadeira explicação da exclusão reside no fato de que um homem que age em legítima defesa não o faz “voluntariamente”, e que os mesmos alunos passaram em seus exames ao repetir o que seus professores lhes ensinaram.",
          "start": 716.69,
          "end": 737.14
        },
        {
          "id": 75,
          "text": "Essas últimas observações poderiam ser omitidas, sem dúvida, por serem consideradas irrelevantes pelo simples motivo de que os professores e os examinadores não foram designados para elaborar nossas leis.",
          "start": 737.14,
          "end": 751.24
        },
        {
          "id": 76,
          "text": "No entanto, uma vez mais, o verdadeiro problema jaz em maior profundidade.",
          "start": 751.24,
          "end": 756.35
        },
        {
          "id": 77,
          "text": "Tanto no que se refere à lei, como no que diz respeito à exclusão, a questão não é o suposto propósito da lei, mas seu alcance18.",
          "start": 756.35,
          "end": 765.26
        },
        {
          "id": 78,
          "text": "Ora, o escopo da exclusão de legítima defesa, como foi aplicado por este tribunal, é claro: aplica-se a casos de resistência a uma ameaça agressiva à vida do sujeito.",
          "start": 765.26,
          "end": 776.73
        },
        {
          "id": 79,
          "text": "Por conseguinte, é demasiado claro que este caso não se enquadra no âmbito da exceção, uma vez que é evidente que Whetmore não ameaçou a vida desses réus.",
          "start": 776.73,
          "end": 787.37
        },
        {
          "id": 80,
          "text": "A fragilidade da tentativa de meu colega Foster ao apresentar sua reformulação da lei escrita com ar de legitimidade vem tragicamente à superfície na reflexão do meu colega Tatting.",
          "start": 787.37,
          "end": 799.87
        },
        {
          "id": 81,
          "text": "Nessa opinião, o juiz Tatting luta virilmente para associar os vagos moralismos do colega com sua fidelidade à lei escrita.",
          "start": 799.87,
          "end": 808.37
        },
        {
          "id": 82,
          "text": "O problema deste esforço só poderia ser aquilo que ocorreu, uma completa negligência na execução da função judicial.",
          "start": 808.37,
          "end": 816.38
        },
        {
          "id": 83,
          "text": "O juiz não pode simplesmente aplicar uma lei conforme está redigida e, ao mesmo tempo, reinterpretá-la para satisfazer os próprios desejos.",
          "start": 816.38,
          "end": 825.99
        },
        {
          "id": 84,
          "text": "Tenho consciência de que a linha de raciocínio que desenvolvi neste voto não é aceitável para aqueles que consideram apenas os efeitos imediatos de uma decisão e ignoram as implicações de longo prazo de uma decisão de exceção por parte do Poder Judiciário.",
          "start": 825.99,
          "end": 843.67
        },
        {
          "id": 85,
          "text": "Um veredicto estrito nunca é popular.",
          "start": 843.67,
          "end": 846.23
        },
        {
          "id": 86,
          "text": "Há juízes celebrados na literatura por elaborar subterfúgios maliciosos, por meio dos quais o litigante acabou sendo privado de seus direitos, nos casos em que a opinião pública considerava inaceitável garantir tais direitos.",
          "start": 846.23,
          "end": 861.77
        },
        {
          "id": 87,
          "text": "Creio, contudo, que a exceção feita pelo Poder Judiciário traz mais malefícios a longo prazo do que uma decisão rigorosa.",
          "start": 861.77,
          "end": 870.13
        },
        {
          "id": 88,
          "text": "Os casos polêmicos podem conter, muitas vezes, certo valor moral, ao provocar no público a reflexão sobre suas próprias responsabilidades com relação à lei, que é, em última instância, sua criação, lembrando-lhes, igualmente, que não há um princípio de perdão pessoal que possa mitigar os erros cometidos por seus representantes.",
          "start": 870.13,
          "end": 892.86
        },
        {
          "id": 89,
          "text": "Na verdade, irei mais longe e direi que não só os princípios que exponho são os mais sólidos para as nossas condições atuais, mas que teríamos herdado um melhor sistema legal de nossos antepassados, se esses princípios tivessem sido observados desde o início.",
          "start": 892.86,
          "end": 910.75
        },
        {
          "id": 90,
          "text": "Por exemplo, se nossos tribunais tivessem se mantido estritos em aplicar a letra da lei com relação à excludente de legítima defesa, o resultado, sem dúvida, teria sido uma revisão legislativa.",
          "start": 910.75,
          "end": 924.09
        },
        {
          "id": 91,
          "text": "Tal revisão teria buscado a assistência de filósofos e psicólogos, e a resultante regulamentação da matéria teria uma base compreensível e racional, em vez da mixórdia de verbalismos e distinções metafísicas que emergiram do tratamento judicial e acadêmico.",
          "start": 924.09,
          "end": 941.84
        },
        {
          "id": 92,
          "text": "Estas observações finais estão, com efeito, além dos deveres que tenho de cumprir com relação a este caso, mas os incluo aqui porque sinto profundamente que meus colegas não estão suficientemente conscientes dos perigos implícitos nas concepções sobre a magistratura defendidas por meu colega Foster19.",
          "start": 941.84,
          "end": 962.71
        },
        {
          "id": 93,
          "text": "Concluo, assim, que a sentença condenatória deve ser confirmada.",
          "start": 962.71,
          "end": 967.13
        },
        {
          "id": 94,
          "text": "13 Percebe-se que a bipolarização presente na humanidade se apresenta no momento da decisão.",
          "start": 967.13,
          "end": 973.48
        },
        {
          "id": 95,
          "text": "Dividir todos os aspectos do momento polêmico que os exploradores passaram na caverna entre um simples “bom” ou “mau” é enaltecer a insensibilidade e a multilateralidade do fato (N. do A.).",
          "start": 973.48,
          "end": 986.54
        },
        {
          "id": 96,
          "text": "14 Veja nota 3.",
          "start": 986.54,
          "end": 987.58
        },
        {
          "id": 97,
          "text": "15 Com o “propósito de colocar em foco certas filosofias divergentes do direito e do governo”, neste trecho, Fuller nos faz pensar nos Imperativos Categóricos da ética kantiana.",
          "start": 987.58,
          "end": 999.81
        },
        {
          "id": 98,
          "text": "Na obra Crítica da razão prática, na qual desenvolve seus conceitos éticos, Immanuel Kant (1724-1804) define imperativo categórico como “um imperativo que, sem se basear como condição em qualquer outra intenção a dirigir por um certo comportamento, ordena imediatamente este comportamento”; o imperativo categórico não contém, “além da lei, senão a necessidade da máxima que manda conformar-se com esta lei, e não contendo uma lei nenhuma condição que a limite, nada mais resta senão a universalidade de uma lei em geral à qual a máxima da ação deve ser conforme, conformidade esta que só o imperativo nos representa propriamente como necessário” (KANT, apud DONZELLI, 2016, pp.164-165).",
          "start": 999.81,
          "end": 1047.27
        },
        {
          "id": 99,
          "text": "Desse modo, a ética de Kant é “deontológica”, isto é, defende que o valor moral de uma ação reside na própria ação e não em suas consequências (N. do T.).",
          "start": 1047.27,
          "end": 1057.91
        },
        {
          "id": 100,
          "text": "16 “Como se queria demonstrar” (N. do T.).",
          "start": 1057.91,
          "end": 1060.81
        },
        {
          "id": 101,
          "text": "17 Argumentos expedidos para completar o raciocínio, mas que não desempenham papel fundamental na formação do julgado; argumentos acessórios que acompanham o principal (N. do T.).",
          "start": 1060.81,
          "end": 1073.17
        },
        {
          "id": 102,
          "text": "18 Sobre o alcance da lei ou o seu propósito, vejam que o debate não se limita ao que a lei oferta em seu escopo, mas em como ela pode alcançar a justiça e fazer o justo (N. do A.).",
          "start": 1073.17,
          "end": 1085.68
        },
        {
          "id": 103,
          "text": "19 Aqui, podemos observar a distinção entre o ético e o moral compreendida pelos filósofos.",
          "start": 1085.68,
          "end": 1091.97
        },
        {
          "id": 104,
          "text": "Muitas vezes, aplicar a lei (a moral), conforme defende o juiz Keen, implica em tomar-se uma decisão não ética.",
          "start": 1091.97,
          "end": 1099.63
        },
        {
          "id": 105,
          "text": "Este paradoxo que pode ocorrer entre a ética e a moral pode ser visto na tragédia Antigona, de Sófocles.",
          "start": 1099.63,
          "end": 1106.82
        },
        {
          "id": 106,
          "text": "Antigona desrespeita a lei, que proíbe o funeral de seu irmão, considerado traidor da pátria, porque tem a obrigação ética de providenciar que o irmão seja enterrado dignamente, de modo que seu manes não vagasse pela eternidade; ou seja, para realizar uma ação ética com relação a seu irmão morto, Antigona comete uma imoralidade (desobedece a lei), pelo que é severamente punida (N. do T.).",
          "start": 1106.82,
          "end": 1133.83
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-05/imagem-01-keen.webp",
          "startTime": 0,
          "endTime": 378,
          "ordem": 1,
          "arquivo": "imagem-01-keen.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-05/imagem-02-livro-leis.webp",
          "startTime": 378,
          "endTime": 756,
          "ordem": 2,
          "arquivo": "imagem-02-livro-leis.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-05/imagem-03-tribunal-formal.webp",
          "startTime": 756,
          "endTime": 1134,
          "ordem": 3,
          "arquivo": "imagem-03-tribunal-formal.webp"
        }
      ]
    },
    {
      "numero": 6,
      "id": "capitulo-06",
      "titulo": "Juiz Handy",
      "autor": "Juiz Handy",
      "descricao": "O realismo jurídico e o senso comum: a vontade popular e a sabedoria prática no julgamento.",
      "duracaoSegundos": 1325,
      "duracaoFormatada": "22:05",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-06/capitulo-06-handy.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-06/capitulo-06-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-06/capitulo-06-handy.srt",
      "cues": [
        {
          "id": 1,
          "text": "Ouço com espanto os raciocínios angustiados, suscitados por este caso simples.",
          "start": 0,
          "end": 5.4
        },
        {
          "id": 2,
          "text": "Nunca cesso de questionar a capacidade de meus colegas de lançar uma cortina obscura de legalismos sobre cada questão que lhes é apresentada para julgar.",
          "start": 5.4,
          "end": 16
        },
        {
          "id": 3,
          "text": "Ouvimos esta tarde eruditos arrazoamentos sobre a distinção entre direito positivo e direito natural, entre a letra da lei e seu propósito, entre funções judiciais e executivas, entre a legislação proveniente do Judicial e do Legislativo.",
          "start": 16,
          "end": 32.48
        },
        {
          "id": 4,
          "text": "Desaponta-me, porém, que ninguém tenha levantado a questão da natureza jurídica do acordo feito na caverna — seja ele unilateral ou bilateral, e se não se poderia considerar a revogação por parte de Whetmore de sua anuência anterior sob tal acordo.",
          "start": 32.48,
          "end": 49.66
        },
        {
          "id": 5,
          "text": "O que tem tudo isto a ver com o caso?",
          "start": 49.66,
          "end": 52.22
        },
        {
          "id": 6,
          "text": "O problema diante de nós é o que, enquanto funcionários do governo, devemos fazer com esses réus.",
          "start": 52.22,
          "end": 58.94
        },
        {
          "id": 7,
          "text": "Esta é uma questão de sabedoria prática a ser exercida em um contexto; não se trata de um problema abstrato, mas pertinente à realidade humana.",
          "start": 58.94,
          "end": 68.85
        },
        {
          "id": 8,
          "text": "Quando o caso é abordado sob esta luz, torna-se, penso eu, um dos mais fáceis de decidir que já foram julgados por este tribunal.",
          "start": 68.85,
          "end": 77.78
        },
        {
          "id": 9,
          "text": "Antes de colocar minhas conclusões sobre os méritos deste caso, gostaria de discutir brevemente algumas das questões mais fundamentais envolvidas — e sobre as quais meus colegas e eu estamos divididos.",
          "start": 77.78,
          "end": 91.7
        },
        {
          "id": 10,
          "text": "Jamais fui capaz de demostrar a meus colegas que o governo é um assunto humano, e que os homens são governados, não por palavras postas no papel ou por teorias abstratas, mas por outros homens.",
          "start": 91.7,
          "end": 105.07
        },
        {
          "id": 11,
          "text": "O povo é bem governado quando seus governantes compreendem seus sentimentos e anseios; e é malconduzido, quando não há tal compreensão.",
          "start": 105.07,
          "end": 114.42
        },
        {
          "id": 12,
          "text": "De todos os ramos do governo, o Poder Judiciário é o mais propenso a perder o contato com o homem comum.",
          "start": 114.42,
          "end": 121.63
        },
        {
          "id": 13,
          "text": "Os motivos para isso são, de fato, deveras claros.",
          "start": 121.63,
          "end": 125.09
        },
        {
          "id": 14,
          "text": "Enquanto as massas reagem a uma situação em termos de algumas características marcantes, nós, juízes, dividimos em pequenas partes cada situação que nos é apresentada.",
          "start": 125.09,
          "end": 136.66
        },
        {
          "id": 15,
          "text": "Com efeito, os advogados são contratados por ambos os lados para analisar e dissecar.",
          "start": 136.66,
          "end": 142.54
        },
        {
          "id": 16,
          "text": "Os juízes e advogados concorrem entre si para ver quem pode descobrir o maior número de dificuldades e distinções em um único conjunto de fatos.",
          "start": 142.54,
          "end": 152.52
        },
        {
          "id": 17,
          "text": "Cada lado tenta encontrar fatos, reais ou imaginários, que irão envergonhar as manifestações do outro lado.",
          "start": 152.52,
          "end": 159.93
        },
        {
          "id": 18,
          "text": "Para escapar deste embaraço, outras distinções são inventadas e relacionadas à situação.",
          "start": 159.93,
          "end": 166.02
        },
        {
          "id": 19,
          "text": "Quando um conjunto de fatos é submetido a esse tipo de tratamento por tempo suficiente, toda sua vida e essência termina por ser drenada, restando apenas um punhado de poeira.",
          "start": 166.02,
          "end": 178.14
        },
        {
          "id": 20,
          "text": "Percebo que, sempre que houver regras e princípios abstratos, os juristas poderão fazer distinções.",
          "start": 178.14,
          "end": 185
        },
        {
          "id": 21,
          "text": "Até certo ponto, o que descrevi é um mal necessário associado a qualquer regulamentação formal de questões humanas.",
          "start": 185,
          "end": 192.97
        },
        {
          "id": 22,
          "text": "Entretanto, creio que a área que realmente precisa de tal regulamentação é superestimada.",
          "start": 192.97,
          "end": 199.13
        },
        {
          "id": 23,
          "text": "Há, certamente, em todo jogo, algumas regras fundamentais que devem ser aceitas como precondição para sua realização.",
          "start": 199.13,
          "end": 207.23
        },
        {
          "id": 24,
          "text": "Eu incluiria entre estas, as regras relativas à condução das eleições, à nomeação de funcionários públicos e ao termo que um cargo deve ser ocupado.",
          "start": 207.23,
          "end": 217.49
        },
        {
          "id": 25,
          "text": "Aqui, alguma restrição à discrição e à exceção, à forma e àquilo que a norma abrange e não abrange é, concordo, essencial.",
          "start": 217.49,
          "end": 225.94
        },
        {
          "id": 26,
          "text": "Talvez a área do princípio básico deva ser expandida de modo a incluir algumas outras regras, como as que se destinam a preservar o sistema de livre mobilidade civil.",
          "start": 225.94,
          "end": 237.43
        },
        {
          "id": 27,
          "text": "Entretanto, afora tais campos, acredito que todos os funcionários públicos, inclusive os juízes, irão realizar um melhor trabalho, se utilizarem formas e conceitos abstratos como instrumentos.",
          "start": 237.43,
          "end": 250.73
        },
        {
          "id": 28,
          "text": "Devemos tomar como modelo, penso eu, o bom administrador que adequa procedimentos e princípios para o caso em questão, selecionando entre as formas disponíveis as mais apropriadas para alcançar o resultado devido.",
          "start": 250.73,
          "end": 265.48
        },
        {
          "id": 29,
          "text": "A vantagem mais óbvia deste método de governo é que ele nos permite cumprir nossas tarefas diárias com eficiência e senso comum.",
          "start": 265.48,
          "end": 274.35
        },
        {
          "id": 30,
          "text": "Minha adesão a esta filosofia tem, no entanto, raízes mais profundas.",
          "start": 274.35,
          "end": 279.13
        },
        {
          "id": 31,
          "text": "Creio que é somente com a iluminação produzida por esta filosofia que podemos preservar a flexibilidade essencial, se quisermos manter nossas ações em razoável acordo com os sentimentos daqueles sujeitos à nossa lei.",
          "start": 279.13,
          "end": 294.09
        },
        {
          "id": 32,
          "text": "A falta desse acordo entre governante e governado causou a ruína de mais governos e provocou mais miséria humana do que qualquer outro fator percebido ao longo da história.",
          "start": 294.09,
          "end": 306
        },
        {
          "id": 33,
          "text": "Quando o povo e aqueles que dirigem sua vida jurídica, política e econômica estão em desacordo, a sociedade é arruinada20.",
          "start": 306,
          "end": 314.45
        },
        {
          "id": 34,
          "text": "Então, nem o direito natural de Foster, nem a fidelidade à letra da lei proposta por Keen nos servirão para nada.",
          "start": 314.45,
          "end": 322.28
        },
        {
          "id": 35,
          "text": "Ora, quando essas concepções são aplicadas ao caso sub judice, sua decisão torna-se, como disse, demasiadamente fácil.",
          "start": 322.28,
          "end": 330.45
        },
        {
          "id": 36,
          "text": "Para demonstrar isso, terei que introduzir certas realidades que meus colegas, em seu recatado decoro, julgaram oportuno omitir, apesar de serem tão conscientes delas quanto eu.",
          "start": 330.45,
          "end": 342.71
        },
        {
          "id": 37,
          "text": "A primeira de tais realidades é que este caso despertou enorme interesse público21, tanto aqui quanto no exterior.",
          "start": 342.71,
          "end": 350.61
        },
        {
          "id": 38,
          "text": "Quase todos os jornais e revistas publicaram artigos sobre o ocorrido, os colunistas divulgaram a seus leitores informações confidenciais sobre as articulações do governo, centenas de cartas foram enviadas aos editores.",
          "start": 350.61,
          "end": 365.78
        },
        {
          "id": 39,
          "text": "Uma de nossas grandes redes de notícias fez uma pesquisa da opinião pública sobre a questão: “O que você acha que a Corte Suprema deve fazer com os exploradores de cavernas?”.",
          "start": 365.78,
          "end": 377.9
        },
        {
          "id": 40,
          "text": "Cerca de noventa por cento expressaram a opinião de que os réus deveriam ser perdoados ou absolvidos com uma pena simbólica.",
          "start": 377.9,
          "end": 386.49
        },
        {
          "id": 41,
          "text": "Está perfeitamente claro, portanto, como a opinião pública sente-se a respeito deste caso.",
          "start": 386.49,
          "end": 392.72
        },
        {
          "id": 42,
          "text": "Sabíamos, certamente, isso sem a necessidade da pesquisa, com base no senso comum, ou mesmo observando que, neste tribunal, quatro homens e meio, ou noventa por cento, compartilham tal opinião.",
          "start": 392.72,
          "end": 406.09
        },
        {
          "id": 43,
          "text": "Isso torna óbvio não só o que deveríamos fazer, mas o que devemos fazer, se quisermos estabelecer uma harmonia razoável e digna entre nós e a opinião pública.",
          "start": 406.09,
          "end": 417.03
        },
        {
          "id": 44,
          "text": "A decisão de declarar que esses homens são inocentes não necessariamente nos envolve em qualquer ardil ou artifício indigno.",
          "start": 417.03,
          "end": 425.62
        },
        {
          "id": 45,
          "text": "Tampouco faz-se necessário qualquer princípio de interpretação legal que não esteja em acordo com as práticas pretéritas deste tribunal.",
          "start": 425.62,
          "end": 435.04
        },
        {
          "id": 46,
          "text": "Certamente, nenhum leigo pensaria que, ao absolver estes réus, nós distendemos a lei mais do que os nossos antepassados quando criaram a excludente de legítima defesa.",
          "start": 435.04,
          "end": 446.61
        },
        {
          "id": 47,
          "text": "Se uma demonstração mais detalhada do método de conciliação da nossa decisão com o dispositivo legal se fizer necessária, contento-me em sustentar os argumentos desenvolvidos na segunda e menos imaginosa parte do julgamento de meu colega Foster.",
          "start": 446.61,
          "end": 463.58
        },
        {
          "id": 48,
          "text": "Sou consciente de que meus colegas horrorizar-se-ão diante de minha sugestão de que este tribunal deve levar em conta a opinião pública.",
          "start": 463.58,
          "end": 473
        },
        {
          "id": 49,
          "text": "Irão replicar que a opinião pública é emocional e caprichosa, que se baseia em meias verdades e ouve testemunhas que não estão sujeitas a um novo interrogatório.",
          "start": 473,
          "end": 484.15
        },
        {
          "id": 50,
          "text": "Argumentarão que a lei permeia o julgamento de um caso como este com salvaguardas estritas, destinadas a garantir que a verdade seja conhecida, e que toda consideração racional sobre as questões do caso seja levada em conta.",
          "start": 484.15,
          "end": 499.66
        },
        {
          "id": 51,
          "text": "Advertirão que, caso uma opinião do público formada fora deste quadro puder influenciar nossa decisão, todas estas salvaguardas perderão seu efeito.",
          "start": 499.66,
          "end": 509.91
        },
        {
          "id": 52,
          "text": "Mas examinemos com imparcialidade algumas das realidades da aplicação do nosso direito penal.",
          "start": 509.91,
          "end": 516.35
        },
        {
          "id": 53,
          "text": "Quando um homem é acusado de crime, há, falando de modo geral, quatro maneiras pelas quais ele pode evitar a condenação.",
          "start": 516.35,
          "end": 524.67
        },
        {
          "id": 54,
          "text": "Uma delas é a determinação por parte de um juiz de que, nos termos da lei aplicável, o réu não cometeu crime algum.",
          "start": 524.67,
          "end": 532.63
        },
        {
          "id": 55,
          "text": "Esta é, decerto, uma decisão que ocorre em uma atmosfera bastante formal e abstrata.",
          "start": 532.63,
          "end": 538.45
        },
        {
          "id": 56,
          "text": "Mas vejamos as outras três maneiras pelas quais o acusado pode evitar a punição.",
          "start": 538.45,
          "end": 543.99
        },
        {
          "id": 57,
          "text": "São elas: (1) uma decisão do procurador público de não pedir a instauração do processo; (2) uma absolvição pelo júri; (3) um perdão ou comutação de sentença pelo Poder Executivo.",
          "start": 543.99,
          "end": 556.32
        },
        {
          "id": 58,
          "text": "Pode alguém negar que essas decisões são realizadas dentro de um quadro rígido e formal de regras que evitam erros factuais, excluem fatores emocionais e pessoais e garantem que todas as formas da lei serão observadas?",
          "start": 556.32,
          "end": 571.42
        },
        {
          "id": 59,
          "text": "No caso do júri, nós, com certeza, tentamos limitar suas deliberações na área do legalmente relevante, entretanto não há necessidade de nos enganarmos acreditando que tal tentativa é realmente bem-sucedida.",
          "start": 571.42,
          "end": 585.69
        },
        {
          "id": 60,
          "text": "No curso normal dos acontecimentos, o caso que ora analisamos deveria ter sido julgado, com todos os seus problemas, pelo júri.",
          "start": 585.69,
          "end": 594.48
        },
        {
          "id": 61,
          "text": "Se isso tivesse ocorrido, podemos ter certeza de que os réus teriam sido absolvidos ou que, pelo menos, teria havido uma divisão que impediria a condenação.",
          "start": 594.48,
          "end": 605.29
        },
        {
          "id": 62,
          "text": "Se o júri tivesse sido informado de que a inanição dos réus e o acordo que fizeram não constituem defesa à acusação de homicídio, seu veredicto teria, com toda a probabilidade, ignorado esta instrução e teria envolvido muito mais distorções da letra da lei do que qualquer um de nós seria tentado a fazer.",
          "start": 605.29,
          "end": 626.41
        },
        {
          "id": 63,
          "text": "Certamente, o único motivo porque isto não ocorreu foi a circunstância fortuita de o chefe do júri ser advogado.",
          "start": 626.41,
          "end": 634.17
        },
        {
          "id": 64,
          "text": "Seus conhecimentos permitiram que ele criasse uma fórmula verbal que possibilitou ao júri evadir-se de suas responsabilidades habituais.",
          "start": 634.17,
          "end": 643.59
        },
        {
          "id": 65,
          "text": "Meu colega Tatting expressa contrariedade porque o procurador público não decidiu, de fato, o caso, abstendo-se de requerer a instauração do processo.",
          "start": 643.59,
          "end": 653.98
        },
        {
          "id": 66,
          "text": "Probo como é no cumprimento das exigências da teoria jurídica, teria se contentado em fazer com que o destino desses homens fosse decidido fora do tribunal pelo procurador público com base no senso comum.",
          "start": 653.98,
          "end": 668.11
        },
        {
          "id": 67,
          "text": "O presidente do tribunal, por outro lado, quer que a aplicação do senso comum seja adiada até o final, embora, como Tatting, ele não queira tomar parte nessa decisão.",
          "start": 668.11,
          "end": 679.61
        },
        {
          "id": 68,
          "text": "Isto me conduz à parte final das minhas observações, que tem a ver com a clemência executiva.",
          "start": 679.61,
          "end": 686.05
        },
        {
          "id": 69,
          "text": "Antes de discutir esse tema diretamente, quero fazer uma observação com relação à pesquisa da opinião pública.",
          "start": 686.05,
          "end": 693.67
        },
        {
          "id": 70,
          "text": "Como eu disse, noventa por cento das pessoas queriam que a Suprema Corte absolvesse os réus por completo, ou com uma pena mais ou menos nominal.",
          "start": 693.67,
          "end": 703.64
        },
        {
          "id": 71,
          "text": "Os dez por cento restantes constituem um grupo singularmente variado, com as opiniões mais curiosas e divergentes.",
          "start": 703.64,
          "end": 711.54
        },
        {
          "id": 72,
          "text": "Um dos nossos especialistas acadêmicos realizou um estudo sobre esse grupo e descobriu que seus membros se enquadram em determinados padrões.",
          "start": 711.54,
          "end": 721.3
        },
        {
          "id": 73,
          "text": "Uma parte substancial é constituída por assinantes de publicações da chamada “imprensa marrom”, que passaram a seus leitores uma versão distorcida dos fatos deste caso.",
          "start": 721.3,
          "end": 732.94
        },
        {
          "id": 74,
          "text": "Alguns destes entrevistados pensam que a palavra “espeleólogo” significa “canibal” e que a antropofagia é um dos princípios da sociedade.",
          "start": 732.94,
          "end": 742.43
        },
        {
          "id": 75,
          "text": "Contudo, o ponto que quero notar é o seguinte: embora quase todas as variedades concebíveis de opinião tenham surgido nas respostas desse grupo, tanto quanto sei, nenhum deles — e tampouco entre o grupo majoritário dos noventa por cento que os perdoariam —, respondeu: “creio que seria bom se o tribunal condenasse esses homens a serem enforcados e que, então, outro poder do Estado intercedesse e os perdoasse”.",
          "start": 742.43,
          "end": 770.96
        },
        {
          "id": 76,
          "text": "No entanto, esta é uma solução que tem mais ou menos dominado as nossas discussões, e que o presidente do tribunal propõe como a forma pela qual podemos evitar cometer qualquer injustiça e, ao mesmo tempo, preservar o respeito pela lei.",
          "start": 770.96,
          "end": 787.31
        },
        {
          "id": 77,
          "text": "O presidente do tribunal pode ter certeza de que, se ele está preservando a moral de qualquer pessoa, é a dele mesmo, e não a do público, que ignora suas distinções.",
          "start": 787.31,
          "end": 798.74
        },
        {
          "id": 78,
          "text": "Menciono esta questão porque desejo enfatizar mais uma vez o perigo de perdermo-nos nos padrões de nosso próprio pensamento e esquecer que esses padrões muitas vezes não lançam a menor sombra sobre o mundo exterior.",
          "start": 798.74,
          "end": 813.63
        },
        {
          "id": 79,
          "text": "Chego agora ao fato mais importante deste caso, um fato conhecido por todos nós deste tribunal, embora meus colegas tenham considerado oportuno encobri-lo com suas togas.",
          "start": 813.63,
          "end": 825.4
        },
        {
          "id": 80,
          "text": "Trata-se da probabilidade assustadora de que, se a questão for deixada a seu encargo, o chefe do Poder Executivo se recusará a perdoar esses homens ou a comutar sua sentença.",
          "start": 825.4,
          "end": 837.46
        },
        {
          "id": 81,
          "text": "Como todos sabemos, o chefe do Poder Diretor Executivo é um homem de idade bem avançada, de princípios muito rígidos.",
          "start": 837.46,
          "end": 845.56
        },
        {
          "id": 82,
          "text": "O clamor público geralmente recai sobre ele com o efeito reverso do esperado.",
          "start": 845.56,
          "end": 850.89
        },
        {
          "id": 83,
          "text": "Como eu disse a meus colegas, acontece que a sobrinha da minha esposa é amiga íntima de sua secretária.",
          "start": 850.89,
          "end": 858.03
        },
        {
          "id": 84,
          "text": "Soube dessa maneira indireta, porém, creio eu, totalmente confiável, que ele está firmemente determinado a não comutar a sentença se os réus forem considerados culpados.",
          "start": 858.03,
          "end": 869.73
        },
        {
          "id": 85,
          "text": "Ninguém lamenta mais do que eu a necessidade de basear uma questão tão importante em informações que poderiam ser caracterizadas como mexerico.",
          "start": 869.73,
          "end": 879.64
        },
        {
          "id": 86,
          "text": "Se eu tivesse poder de determinar o curso das ações, isso não aconteceria, pois eu teria adotado a medida sensata de reunir-me com o Executivo, abordando o caso em conjunto, descobrindo quais são suas opiniões e, talvez, produzindo um programa comum para abordar a situação.",
          "start": 879.64,
          "end": 898.62
        },
        {
          "id": 87,
          "text": "Mas é claro que meus colegas jamais concordariam em abordar o problema desse modo.",
          "start": 898.62,
          "end": 904.3
        },
        {
          "id": 88,
          "text": "Seu escrúpulo com relação à aquisição de informações precisas por meio direto não impediu que ficassem bastante perturbados sobre o que descobririam de modo indireto.",
          "start": 904.3,
          "end": 915.79
        },
        {
          "id": 89,
          "text": "Seu conhecimento dos fatos que acabei de colocar explica o motivo pelo qual o juiz principal, normalmente um modelo de decoro, considerou oportuno agitar sua toga diante do rosto do Executivo, ameaçando-o com a excomunhão se não comutasse a sentença.",
          "start": 915.79,
          "end": 933.11
        },
        {
          "id": 90,
          "text": "Isso explica, suspeito, a proeza de levitação efetuada por meu colega Foster, pela qual toda uma biblioteca de livros jurídicos foi retirada de sobre os ombros dos réus.",
          "start": 933.11,
          "end": 944.81
        },
        {
          "id": 91,
          "text": "Isto explica também porque meu colega legalista Keen imitou o personagem Pooh-Bah da antiga comédia, passando para o outro lado do palco para dirigir algumas observações ao Poder Executivo “na minha qualidade de cidadão particular”. (Observo, aliás, que o conselho do cidadão particular Keen aparecerá nos autos impresso deste tribunal às expensas dos contribuintes.) Devo confessar que, à medida que envelheço, fico cada vez mais perplexo com a recusa dos homens em aplicar seu senso comum a problemas de direito e de governo; e este caso deveras trágico aprofundou meu sentimento de desânimo e de consternação.",
          "start": 944.81,
          "end": 987.2
        },
        {
          "id": 92,
          "text": "Desejo apenas convencer meus colegas sobre a sabedoria dos princípios que apliquei ao ofício jurídico desde que comecei a praticá-lo.",
          "start": 987.2,
          "end": 996.41
        },
        {
          "id": 93,
          "text": "Na verdade, por uma espécie de triste retorno ao mesmo ponto, encontrei problemas semelhantes aos aqui envolvidos no primeiro caso que julguei como juiz de primeira instância no tribunal do condado de Fanleigh.",
          "start": 996.41,
          "end": 1010.96
        },
        {
          "id": 94,
          "text": "Uma seita religiosa retirou os privilégios eclesiásticos de um pastor que teria adotado os pontos de vista e práticas de uma seita rival.",
          "start": 1010.96,
          "end": 1020.45
        },
        {
          "id": 95,
          "text": "Em reação, o pastor distribuiu um folheto fazendo acusações contra as autoridades que o expulsaram.",
          "start": 1020.45,
          "end": 1027.31
        },
        {
          "id": 96,
          "text": "Certos membros leigos da igreja anunciaram uma reunião pública na qual explicariam a posição da igreja.",
          "start": 1027.31,
          "end": 1034.44
        },
        {
          "id": 97,
          "text": "O pastor participou dessa reunião.",
          "start": 1034.44,
          "end": 1036.79
        },
        {
          "id": 98,
          "text": "Algumas pessoas afirmaram que ele entrou disfarçadamente, sem ser observado.",
          "start": 1036.79,
          "end": 1042.06
        },
        {
          "id": 99,
          "text": "Contudo, em seu testemunho, o pastor declarou que havia entrado abertamente, como parte do público.",
          "start": 1042.06,
          "end": 1048.92
        },
        {
          "id": 100,
          "text": "De qualquer forma, quando os discursos começaram, ele interrompeu com certas questões sobre os assuntos da igreja e fez algumas colocações em defesa de seus pontos de vista.",
          "start": 1048.92,
          "end": 1060.9
        },
        {
          "id": 101,
          "text": "Como resultado, o pastor foi atacado por alguns dos presentes e agredido violentamente, tendo, entre outras lesões, o maxilar fraturado.",
          "start": 1060.9,
          "end": 1070.32
        },
        {
          "id": 102,
          "text": "Ele intentou uma ação de indenização contra a associação que promoveu a reunião, bem como contra dez indivíduos, cujos nomes ele forneceu, os quais alegou terem sido seus agressores.",
          "start": 1070.32,
          "end": 1082.92
        },
        {
          "id": 103,
          "text": "Quando iniciamos o julgamento, o caso, a princípio, me pareceu bastante complicado.",
          "start": 1082.92,
          "end": 1088.67
        },
        {
          "id": 104,
          "text": "Os advogados levantaram uma série de dificuldades legais.",
          "start": 1088.67,
          "end": 1092.62
        },
        {
          "id": 105,
          "text": "Foram colocadas questões interessantes sobre a admissibilidade das provas.",
          "start": 1092.62,
          "end": 1097.75
        },
        {
          "id": 106,
          "text": "E, em relação à ação contra a associação, alguns problemas dificultosos surgiram em torno da questão sobre o pastor ser um intruso ou se era autorizado a lá estar.",
          "start": 1097.75,
          "end": 1109.04
        },
        {
          "id": 107,
          "text": "Como noviço na magistratura, estava ansioso para aplicar o conhecimento adquirido na escola de direito e comecei a estudar essas questões em profundidade, pesquisando os autores que são referência e preparando considerandos bem-documentados.",
          "start": 1109.04,
          "end": 1125.73
        },
        {
          "id": 108,
          "text": "Ao aprofundar-me no caso, envolvi-me cada vez mais em suas complexidades jurídicas e comecei a entrar em um estado semelhante àquele demonstrado pelo meu colega Tatting com relação ao presente caso.",
          "start": 1125.73,
          "end": 1139.44
        },
        {
          "id": 109,
          "text": "De súbito, porém, percebi que todas aquelas questões desconcertantes não tinham, com efeito, nada a ver com o processo, e comecei a examiná-lo à luz do senso comum.",
          "start": 1139.44,
          "end": 1150.8
        },
        {
          "id": 110,
          "text": "A demanda imediatamente ganhou uma nova perspectiva, e entendi que a única coisa que devia fazer era absolver os réus por falta de provas.",
          "start": 1150.8,
          "end": 1160.36
        },
        {
          "id": 111,
          "text": "Cheguei a essa conclusão pelas seguintes considerações: o ataque no qual o autor foi ferido estava muito confuso, com algumas pessoas tentando chegar ao centro do tumulto, enquanto outras tentavam se afastar dele; alguns criticaram o autor, enquanto outros tentaram protegê-lo.",
          "start": 1160.36,
          "end": 1179.55
        },
        {
          "id": 112,
          "text": "Teria levado semanas para descobrir a verdade.",
          "start": 1179.55,
          "end": 1182.73
        },
        {
          "id": 113,
          "text": "Assim, decidi que o maxilar quebrado de alguma pessoa não tinha tanta relevância para a Confederação. (Os ferimentos do pastor, aliás, já estavam curados sem causar desfiguração e sem qualquer prejuízo das faculdades normais.) Além disso, senti muito fortemente que o demandante havia motivado, em grande parte, o problema.",
          "start": 1182.73,
          "end": 1205.1
        },
        {
          "id": 114,
          "text": "Ele estava consciente do quanto os ânimos estavam inflamados pela polêmica; além disso, o pastor poderia facilmente ter encontrado outro fórum para a expressar seus pontos de vista.",
          "start": 1205.1,
          "end": 1217.64
        },
        {
          "id": 115,
          "text": "Minha decisão foi totalmente aprovada pela imprensa e pela opinião pública, nenhuma das quais admitia os pontos de vista e práticas que o pastor expulso tentava defender.",
          "start": 1217.64,
          "end": 1229.41
        },
        {
          "id": 116,
          "text": "Hoje, passados trinta anos, graças a um procurador público ambicioso e a um presidente do júri legalista, enfrento um caso que suscita questões que, no fundo, têm semelhança com o que acabo de expor.",
          "start": 1229.41,
          "end": 1243.2
        },
        {
          "id": 117,
          "text": "O mundo não parece ter mudado, em demasia, exceto que desta vez não é um julgamento por 500 ou 600 frelares22, mas pela vida ou morte de quatro homens que já sofreram mais tormento e humilhação do que a maioria de nós enfrentaria em mil anos.",
          "start": 1243.2,
          "end": 1259.96
        },
        {
          "id": 118,
          "text": "Concluo, pois, que os réus são inocentes do crime do qual são acusados e que a condenação e a sentença sejam anuladas.",
          "start": 1259.96,
          "end": 1268.13
        },
        {
          "id": 119,
          "text": "20 Esta afirmação remete à política socrática.",
          "start": 1268.13,
          "end": 1271.32
        },
        {
          "id": 120,
          "text": "Em Alcebíades, Sócrates afirma, pela pena de Platão, que a política é a arte de tecer laços de amizade entre os cidadãos, isto é, de produzir harmonia entre suas classes.",
          "start": 1271.32,
          "end": 1283.09
        },
        {
          "id": 121,
          "text": "Do contrário, “uma política que seria apenas gestão de corpos e de bens só poderia levar à discórdia” (CAMUS et al, 2014, p.",
          "start": 1283.09,
          "end": 1291.68
        },
        {
          "id": 122,
          "text": "11) (N. do T.).",
          "start": 1291.68,
          "end": 1292.72
        },
        {
          "id": 123,
          "text": "21 O autor fez um grande apanhado pela corrente que influencia o pensamento jurídico e, de maneira direta, nos contornos da decisão.",
          "start": 1292.72,
          "end": 1301.86
        },
        {
          "id": 124,
          "text": "Mas é neste momento da obra que traz a questão da influência popular, ou seja, a formação da opinião pública e seu impulso na concordância com o fato e o relato.",
          "start": 1301.86,
          "end": 1313.02
        },
        {
          "id": 125,
          "text": "Hoje, em tempos de internet e redes sociais, a condenação e o linchamento público podem se instaurar em segundos, e horas depois já temos o veredicto (N. do A).",
          "start": 1313.02,
          "end": 1324.1
        },
        {
          "id": 126,
          "text": "22 Veja nota 2.",
          "start": 1324.1,
          "end": 1325.14
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-06/imagem-01-handy.webp",
          "startTime": 0,
          "endTime": 442,
          "ordem": 1,
          "arquivo": "imagem-01-handy.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-06/imagem-02-opiniao-publica.webp",
          "startTime": 442,
          "endTime": 883,
          "ordem": 2,
          "arquivo": "imagem-02-opiniao-publica.webp"
        },
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-06/imagem-03-tribunal-povo.webp",
          "startTime": 883,
          "endTime": 1326,
          "ordem": 3,
          "arquivo": "imagem-03-tribunal-povo.webp"
        }
      ]
    },
    {
      "numero": 7,
      "id": "capitulo-07",
      "titulo": "Juiz Tatting (Segundo Voto)",
      "autor": "Juiz Tatting",
      "descricao": "A recusa definitiva em desempatar a Suprema Corte.",
      "duracaoSegundos": 40,
      "duracaoFormatada": "0:40",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-07/capitulo-07-tatting-segundo-voto.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-07/capitulo-07-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-07/capitulo-07-tatting-segundo-voto.srt",
      "cues": [
        {
          "id": 1,
          "text": "Ao ser questionado pelo presidente do tribunal se, depois de ouvir as opiniões que acabei de ouvir, desejo reexaminar a posição anteriormente por mim assumida.",
          "start": 0,
          "end": 10.29
        },
        {
          "id": 2,
          "text": "Gostaria de afirmar que, depois de ouvir essas opiniões, sinto- me muito fortalecido em minha convicção de que não devo participar do julgamento deste caso.",
          "start": 10.29,
          "end": 20.38
        },
        {
          "id": 3,
          "text": "Estando o Supremo Tribunal uniformemente dividido, mantém-se a condenação e sentença do Tribunal de Instâncias Gerais.",
          "start": 20.38,
          "end": 28.02
        },
        {
          "id": 4,
          "text": "É ordenado que a execução da sentença ocorra às 6 horas da manhã, sexta-feira, 2 de abril de 4300, momento em que o executor público deverá cumprir a determinação enforcando os réus.",
          "start": 28.02,
          "end": 39.79
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-07/imagem-01-tatting-reexamina.webp",
          "startTime": 0,
          "endTime": 40,
          "ordem": 1,
          "arquivo": "imagem-01-tatting-reexamina.webp"
        }
      ]
    },
    {
      "numero": 8,
      "id": "capitulo-08",
      "titulo": "Pós-escrito",
      "autor": "Lon L. Fuller",
      "descricao": "O desfecho do processo e as notas finais do autor sobre a filosofia jurídica.",
      "duracaoSegundos": 117,
      "duracaoFormatada": "1:57",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-08/capitulo-08-pos-escrito.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-08/capitulo-08-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-08/capitulo-08-pos-escrito.srt",
      "cues": [
        {
          "id": 1,
          "text": "Tendo o tribunal pronunciado seu julgamento, o leitor, admirado com a escolha da data, deve lembrar que o número de séculos que nos separa do ano 4300 é aproximadamente o mesmo que nos distancia da Era de Péricles23.",
          "start": 0,
          "end": 14.87
        },
        {
          "id": 2,
          "text": "Provavelmente, não há necessidade de observar que o caso dos exploradores de cavernas não se destina a ser uma obra satírica, tampouco trata-se de uma predição, em qualquer sentido atribuído ao termo.",
          "start": 14.87,
          "end": 28.65
        },
        {
          "id": 3,
          "text": "Quanto aos juízes que compõem o tribunal da Suprema Corte de Truepenny, são, naturalmente, tão míticos quanto os fatos e precedentes dos quais tratam.",
          "start": 28.65,
          "end": 38.98
        },
        {
          "id": 4,
          "text": "O leitor que se negar a aceitar essa visão, bem como aquele que procurar ver semelhanças contemporâneas, onde nada é pretendido ou contemplado, deve ser advertido de que está cometendo um erro que pode levá-lo a perder as modestas verdades enunciadas nos votos emitidos pela Suprema Corte de Newgarth.",
          "start": 38.98,
          "end": 59.7
        },
        {
          "id": 5,
          "text": "O caso foi concebido com o único propósito de colocar em foco certas filosofias divergentes do direito e do governo.",
          "start": 59.7,
          "end": 67.69
        },
        {
          "id": 6,
          "text": "Essas filosofias apresentavam questões profundas sobre as escolhas a fazer, já nos dias de Platão e Aristóteles.",
          "start": 67.69,
          "end": 75.4
        },
        {
          "id": 7,
          "text": "Talvez continuem a fazê-lo, mesmo depois de nossa era ter dado sua palavra final sobre as mesmas.",
          "start": 75.4,
          "end": 82.08
        },
        {
          "id": 8,
          "text": "Se houver algum elemento de predição no caso, não vai além da sugestão de que as questões nele envolvidas estão entre os problemas permanentes da raça humana.",
          "start": 82.08,
          "end": 92.96
        },
        {
          "id": 9,
          "text": "23 Péricles (c.",
          "start": 92.96,
          "end": 94
        },
        {
          "id": 10,
          "text": "495-2 a.C. -- 429 a.C.) legislou Atenas durante parte significativa do período de maior desenvolvimento econômico e cultural dessa cidade, entre a vitória sobre os persas em Salamina e a Guerra do Peloponeso — a “Idade de Ouro de Atenas” ou “Século de Péricles”.",
          "start": 94,
          "end": 112.04
        },
        {
          "id": 11,
          "text": "Foi um dos períodos de maior criatividade da história da humanidade (N. do T.).",
          "start": 112.04,
          "end": 117.48
        }
      ],
      "imagens": [
        {
          "url": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-08/imagem-01-pos-escrito.webp",
          "startTime": 0,
          "endTime": 118,
          "ordem": 1,
          "arquivo": "imagem-01-pos-escrito.webp"
        }
      ]
    }
  ]
};


export const DOS_DELITOS_E_DAS_PENAS: AudiobookLivro = {
  "id": "dos-delitos-e-das-penas",
  "tableId": 123,
  "status": "disponivel",
  "titulo": "Dos Delitos e das Penas",
  "subtitulo": "O marco fundador do Direito Penal moderno",
  "autor": "Cesare Beccaria",
  "ano": 1764,
  "descricao": "Marco iluminista que revolucionou a história do Direito Penal, propondo a proporcionalidade das penas, a abolição da tortura, o fim das acusações secretas e o combate à crueldade punitiva em prol da dignidade humana.",
  "sinopse": "Publicado em 1764 na Itália, Dos Delitos e das Penas é a obra mais influente da criminologia e da filosofia penal mundial. Cesare Beccaria desafiou o absolutismo e as práticas arcaicas da época com argumentos irrefutáveis sobre a utilidade da punição, a legalidade, a separação entre pecado e crime, a igualdade perante a lei e a prevenção como o verdadeiro fim das penas.",
  "capaUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capa-do-livro.jpg",
  "totalCapitulos": 48,
  "duracaoTotalSegundos": 16668,
  "duracaoTotalFormatada": "4h 38min",
  "tags": [
    "Direito Penal",
    "Filosofia do Direito",
    "Iluminismo Jurídico",
    "Criminologia",
    "Clássicos"
  ],
  "capitulos": [
    {
      "numero": 0,
      "id": "apresentacao-do-livro",
      "titulo": "Apresentação da Obra",
      "autor": "Cesare Beccaria",
      "descricao": "Apresentação geral da obra Dos Delitos e das Penas e de Cesare Beccaria.",
      "duracaoSegundos": 25,
      "duracaoFormatada": "00:25",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/apresentacao.mp3",
      "cues": [],
      "imagens": []
    },
    {
      "numero": 1,
      "id": "sumario",
      "titulo": "Sumário Narrado",
      "autor": "Cesare Beccaria",
      "descricao": "Sumário completo narrado dos 42 capítulos e Apêndice.",
      "duracaoSegundos": 30,
      "duracaoFormatada": "00:30",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/sumario.mp3",
      "cues": [],
      "imagens": []
    },
    {
      "numero": 2,
      "id": "frente-apresentacao",
      "titulo": "Frente: Apresentação",
      "autor": "Cesare Beccaria",
      "descricao": "Apresentação editorial sobre o contexto histórico e impacto iluminista da obra.",
      "duracaoSegundos": 98,
      "duracaoFormatada": "01:38",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/frente-apresentacao.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-frente-apresentacao.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/frente-apresentacao.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 15.97,
          "text": "“Dos delitos e das penas” é uma obra que se insere no movimento filosófico e humanitário da segunda metade do século XVIII, ao qual pertencem os trabalhos dos Enciclopedistas, como Voltaire, Rousseau, Montesquieu e tantos outros."
        },
        {
          "id": 2,
          "start": 15.97,
          "end": 32.42,
          "text": "Na época havia grassado a tese de que as penas constituíam uma espécie de vingança coletiva; essa concepção havia induzido à aplicação de punições de conseqüências muito superiores e mais terríveis que os males produzidos pelos delitos."
        },
        {
          "id": 3,
          "start": 32.42,
          "end": 39.81,
          "text": "Prodigalizara-se a prática de torturas, penas de morte, prisões desumanas, banimentos, acusações secretas."
        },
        {
          "id": 4,
          "start": 39.81,
          "end": 43.3,
          "text": "Foi contra essa situação que se insurgiu Beccaria."
        },
        {
          "id": 5,
          "start": 43.3,
          "end": 49.64,
          "text": "Sua obra foi elogiada por intelectuais, religiosos e nobres (inclusive Catarina da Rússia)."
        },
        {
          "id": 6,
          "start": 49.64,
          "end": 56.61,
          "text": "As críticas foram poucas, geralmente resultantes de interesses egoísticos de magistrados e clérigos."
        },
        {
          "id": 7,
          "start": 56.61,
          "end": 61.98,
          "text": "A humanidade encontrava novos caminhos para garantir a igualdade e a justiça."
        },
        {
          "id": 8,
          "start": 61.98,
          "end": 68.61,
          "text": "Estamos divulgando o texto por acreditarmos que deva ser lido de novo, especialmente no Brasil."
        },
        {
          "id": 9,
          "start": 68.61,
          "end": 73.28,
          "text": "A prática de torturas, entre nós, tem sido cada vez mais freqüente."
        },
        {
          "id": 10,
          "start": 73.28,
          "end": 81.64,
          "text": "A pena de morte, que vai sendo abolida em países mais avançados, aqui tem sido proposta por inúmeros políticos raivosos."
        },
        {
          "id": 11,
          "start": 81.64,
          "end": 86.39,
          "text": "Crianças ficam encarceradas sob condições cruéis, às vezes bárbaras."
        },
        {
          "id": 12,
          "start": 86.39,
          "end": 89.94,
          "text": "Juizes corruptos vivem no conforto de suas mansões."
        },
        {
          "id": 13,
          "start": 89.94,
          "end": 94.96,
          "text": "Assassinos frios, por serem influentes, desfrutam de todas as mordomias."
        },
        {
          "id": 14,
          "start": 94.96,
          "end": 97.68,
          "text": "Que o espírito de Beccaria nos ilumine."
        }
      ],
      "imagens": []
    },
    {
      "numero": 3,
      "id": "frente-biografia",
      "titulo": "Frente: Biografia do Autor",
      "autor": "Cesare Beccaria",
      "descricao": "A vida, a formação e as influências intelectuais de Cesare Beccaria.",
      "duracaoSegundos": 222,
      "duracaoFormatada": "03:42",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/frente-biografia.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-frente-biografia.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/frente-biografia.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 5.3,
          "text": "CESARE BONESANA, marquês de Beccaria, nasceu em Milão no ano de 1738."
        },
        {
          "id": 2,
          "start": 5.3,
          "end": 13.14,
          "text": "Educado em Paris pelos jesuítas, entregou-se com entusiasmo ao estudo da literatura e das matemáticas."
        },
        {
          "id": 3,
          "start": 13.14,
          "end": 22.82,
          "text": "Muita influência exerceu na formação do seu espírito a leitura das Lettres Persanes de Mostesquieu e de L'Esprit de Helvétius."
        },
        {
          "id": 4,
          "start": 22.82,
          "end": 28.89,
          "text": "Desde então, todas as suas preocupações se voltaram para o estudo da filosofia."
        },
        {
          "id": 5,
          "start": 28.89,
          "end": 42.11,
          "text": "Foi ele um dos fundadores da sociedade literária que se formou em Milão e que, inspirando-se no exemplo da de Helvétius, divulgou os novos princípios da filosofia francesa."
        },
        {
          "id": 6,
          "start": 42.11,
          "end": 52.48,
          "text": "Além disso, a fim de divulgar na Itália as idéias novas, Beccaria fez parte da redação do jornal II Caffè, que apareceu de 1764 a 1765."
        },
        {
          "id": 7,
          "start": 52.48,
          "end": 73.3,
          "text": "Foi mais ou menos por essa época que, insurgindo-se contra as injustiças dos processos criminais em voga, Beccaria principiou a agitar com os seus amigos, entre os quais se destacavam os irmãos Pietro e Alessandro Verri, os complexos problemas relacionados com a matéria."
        },
        {
          "id": 8,
          "start": 73.3,
          "end": 77.53,
          "text": "Assim teve origem o seu livro Dei Delitti e delle Pene."
        },
        {
          "id": 9,
          "start": 77.53,
          "end": 89.66,
          "text": "Receoso de perseguições, o autor mandou imprimir sua obra secretamente, em Livorno, e ainda assim velando muitos pensamentos com expressões vagas e indecisas."
        },
        {
          "id": 10,
          "start": 89.66,
          "end": 143.45,
          "text": "O tratado Dos Delitos e das Penas é a filosofia francesa aplicada à legislação penal: contra a tradição jurídica, invoca a razão e o sentimento; faz-se porta-voz dos protestos da consciência pública contra os julgamentos secretos, o juramento imposto aos acusados, a tortura, a confiscação, as penas infamantes, a desigualdade ante o castigo, a atrocidade dos suplícios; estabelece limites entre a justiça divina e a justiça humana, entre os pecados e os delitos; condena o direito de vingança e toma por base do direito de punir a utilidade social; declara a pena de morte inútil e reclama a proporcionalidade das penas aos delitos, assim como a separação do poder judiciário e do poder legislativo."
        },
        {
          "id": 11,
          "start": 143.45,
          "end": 152.82,
          "text": "Nenhum livro fora tão oportuno e o seu sucesso foi verdadeiramente extraordinário, sobretudo entre os filósofos franceses."
        },
        {
          "id": 12,
          "start": 152.82,
          "end": 157.97,
          "text": "O abade Morellet traduziu-o, Diderot anotou-o, Voltaire comentou-o."
        },
        {
          "id": 13,
          "start": 157.97,
          "end": 169.96,
          "text": "d'Alembert, Buffon, Hume, Helvétius, o barão d'Holbach, em suma, todos os grandes homens da França manifestaram desde logo a sua admiração e seu entusiasmo."
        },
        {
          "id": 14,
          "start": 169.96,
          "end": 176.26,
          "text": "Em 1766, indo a Paris, Beccaria foi alvo das mais vivas demonstrações de simpatia."
        },
        {
          "id": 15,
          "start": 176.26,
          "end": 193.01,
          "text": "No entanto, tendo regressado a Milão, cidade que ele não mais abandonou, teve de sofrer uma campanha infamante por parte dos seus adversários, que ainda se apegavam aos preconceitos e à rotina para acusá-lo de heresia."
        },
        {
          "id": 16,
          "start": 193.01,
          "end": 205.07,
          "text": "A denúncia não teve conseqüências, mas Beccaria ressentiu-se de tal forma que o receio de novas perseguições levou-o a renunciar às dissertações filosóficas."
        },
        {
          "id": 17,
          "start": 205.07,
          "end": 219.05,
          "text": "Em 1768, o governo austríaco, sabedor de que ele recusara as ofertas de Catarina II, que procurara atraí-lo para São Petersburgo, criou em seu favor uma cátedra de economia política."
        },
        {
          "id": 18,
          "start": 219.05,
          "end": 221.66,
          "text": "Beccaria morreu em Milão, em 1794."
        }
      ],
      "imagens": []
    },
    {
      "numero": 4,
      "id": "frente-prefacio",
      "titulo": "Frente: Prefácio do Autor",
      "autor": "Cesare Beccaria",
      "descricao": "Prefácio de Cesare Beccaria endereçado ao leitor.",
      "duracaoSegundos": 511,
      "duracaoFormatada": "08:31",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/frente-prefacio.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-frente-prefacio.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/frente-prefacio.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 56.12,
          "text": "ALGUNS fragmentos da legislação de um antigo povo conquistador, compilados por ordem de um príncipe que reinou há doze séculos em Constantinopla, combinados em seguida com os costumes dos lombardos e amortalhados num volumoso calhamaço de comentários obscuros, constituem o velho acervo de opiniões que uma grande parte da Europa honrou com o nome de leis; e, mesmo hoje, o preconceito da rotina, tão funesto quanto generalizado, faz que uma opinião de Carpozow (1), uma velha prática indicada por Claro (2), um suplício imaginado com bárbara complacência por Francisco (3), sejam as regras que friamente seguem esses homens, que deveriam tremer quando decidem da vida e fortuna dos seus concidadãos É esse código informe, que não passa de produção monstruosa dos séculos mais bárbaros, que eu quero examinar nesta obra."
        },
        {
          "id": 2,
          "start": 56.12,
          "end": 71.72,
          "text": "Limitar-me-ei, porém, ao sistema criminal, cujos abusos ousarei assinalar aos que estão encarregados de proteger a felicidade pública, sem preocupação de dar ao meu estilo o encanto que seduz a impaciência dos leitores vulgares."
        },
        {
          "id": 3,
          "start": 71.72,
          "end": 83.98,
          "text": "Se pude investigar livremente a verdade, se me elevei acima das opiniões comuns, devo tal independência à indulgência e às luzes do governo sob o qual tenho a felicidade de viver."
        },
        {
          "id": 4,
          "start": 83.98,
          "end": 104.3,
          "text": "Os grandes reis e príncipes que querem a felicidade dos homens que governam são amigos da verdade, quando esta lhes é revelada por um filósofo que, do fundo do seu retiro, mostra uma coragem isenta de fanatismo e se contenta em combater com as armas da razão as empresas da violência e da intriga."
        },
        {
          "id": 5,
          "start": 104.3,
          "end": 117.03,
          "text": "De resto, examinando-se os abusos de que vamos falar, verificar-se-á que os mesmos constituem a sátira e a vergonha dos séculos passados, mas não do nosso século e dos seus legisladores."
        },
        {
          "id": 6,
          "start": 117.03,
          "end": 124.15,
          "text": "Se alguém quiser dar-me a honra de criticar meu livro, trate antes de apreender bem o fim que me propus."
        },
        {
          "id": 7,
          "start": 124.15,
          "end": 143.86,
          "text": "Longe de pensar em diminuir a autoridade legítima, ver-se-á que todos os meus esforços só visam a engrandecê-la e esta se engrandecerá, de fato, quando a opinião pública for mais poderosa do que a força, quando a indulgência e a humanidade fizerem que se perdoe aos príncipes o seu poder."
        },
        {
          "id": 8,
          "start": 143.86,
          "end": 150.43,
          "text": "Críticos houve, cujas intenções não podiam ser honestas, que atacaram esta obra alterando-a (4)."
        },
        {
          "id": 9,
          "start": 150.43,
          "end": 159.19,
          "text": "Devo interromper-me um instante, para impor silêncio à mentira azoinada, aos furores do fanatismo, às calúnias covardes do ódio."
        },
        {
          "id": 10,
          "start": 159.19,
          "end": 169.25,
          "text": "Os princípios de moral e de política, aceitos entre os homens, derivam em geral de três fontes: a revelação, a lei natural e as convenções sociais."
        },
        {
          "id": 11,
          "start": 169.25,
          "end": 182.8,
          "text": "Não se pode estabelecer comparação entre a primeira e as duas últimas, do ponto-de-vista dos seus fins principais; completam-se, porém, ao tenderem igualmente para tornar os homens felizes na terra."
        },
        {
          "id": 12,
          "start": 182.8,
          "end": 191.97,
          "text": "Discutir as relações das convenções sociais não significa atacar as relações que podem encontrar-se entre a revelação e a lei natural."
        },
        {
          "id": 13,
          "start": 191.97,
          "end": 221.74,
          "text": "Uma vez que esses princípios divinos, embora imutáveis, foram de mil modos desnaturados nos espíritos corruptos, ou pela maldade humana, ou pelas falsas religiões, ou pelas idéias arbitrárias da virtude e do vício, deve parecer necessário examinar (pondo de lado quaisquer considerações estranhas) os resultados das simples convenções humanas, quer essas convenções tenham sido feitas realmente, quer se suponham vantajosas para todos."
        },
        {
          "id": 14,
          "start": 221.74,
          "end": 239.67,
          "text": "Todas as opiniões, todos os sistemas de moral devem reunir-se necessariamente nesse ponto, e nunca se louvariam bastante os louváveis esforços tendentes a reconduzir os mais obstinados e os mais incrédulos aos princípios que levam os homens a viver em sociedade."
        },
        {
          "id": 15,
          "start": 239.67,
          "end": 249.8,
          "text": "Podem, pois, distinguir-se três espécies de virtudes e de vícios, cuja fonte está igualmente na religião, na lei natural e nas convenções políticas."
        },
        {
          "id": 16,
          "start": 249.8,
          "end": 259.45,
          "text": "Jamais devem essas três espécies estar em contradição entre si; não alcançam, contudo, os mesmos resultados e não obrigam aos mesmos deveres."
        },
        {
          "id": 17,
          "start": 259.45,
          "end": 265.68,
          "text": "A lei natural exige menos que a revelação, e as convenções sociais menos que a lei natural."
        },
        {
          "id": 18,
          "start": 265.68,
          "end": 284.71,
          "text": "Assim, é muito importante distinguir bem os efeitos dessas convenções, isto é, dos pactos expressos ou tácitos que os homens se impuseram, porque nisso deve residir o exercício legítimo da força, nessas relações de homem a homem, que não exigem a missão especial do Ser supremo."
        },
        {
          "id": 19,
          "start": 284.71,
          "end": 290.46,
          "text": "Pode dizer-se, portanto, com razão, que as idéias da virtude política são variáveis."
        },
        {
          "id": 20,
          "start": 290.46,
          "end": 298.6,
          "text": "As da virtude natural seriam sempre claras e precisas se as fraquezas e as paixões humanas não empanassem a sua pureza."
        },
        {
          "id": 21,
          "start": 298.6,
          "end": 308.46,
          "text": "As idéias da virtude religiosa são imutáveis e constantes, porque foram imediatamente reveladas pelo próprio Deus, que as conserva inalteráveis."
        },
        {
          "id": 22,
          "start": 308.46,
          "end": 320.64,
          "text": "Pode, pois, aquele que fala das convenções sociais e dos seus resultados ser acusado de mostrar princípios contrários, à lei natural ou à revelação, por nada dizer a respeito?..."
        },
        {
          "id": 23,
          "start": 320.64,
          "end": 333.57,
          "text": "Se diz que o estado de guerra precedeu a reunião dos homens em sociedade, é o caso de compará-lo a Hobbes (5), que não supõe para o homem isolado nenhum dever, nenhuma obrigação natural?..."
        },
        {
          "id": 24,
          "start": 333.57,
          "end": 343.5,
          "text": "Não se pode ao – contrário, considerar o que ele diz como um fato, que foi tão somente a conseqüência da corrupção humana e da ausência das leis?"
        },
        {
          "id": 25,
          "start": 343.5,
          "end": 354.24,
          "text": "Enfim, não é um erro censurar um escritor, que examina os efeitos das convenções sociais, por não admitir antes de tudo a existência mesma dessas convenções?"
        },
        {
          "id": 26,
          "start": 354.24,
          "end": 366.22,
          "text": "A justiça divina e a justiça natural são, por sua essência, constantes e invariáveis, porque as relações existentes entre dois objetos da mesma natureza não podem mudar nunca."
        },
        {
          "id": 27,
          "start": 366.22,
          "end": 383.33,
          "text": "Mas, a justiça humana, ou, se se quiser, a justiça política, não sendo mais do que uma relação estabelecida entre uma ação e o estado variável da sociedade, também pode variar, à medida que essa ação se torne vantajosa ou necessária ao estado social."
        },
        {
          "id": 28,
          "start": 383.33,
          "end": 393.59,
          "text": "Só se pode determinar bem a natureza dessa justiça examinando com atenção as relações complicadas das inconstantes combinações que governam os homens."
        },
        {
          "id": 29,
          "start": 393.59,
          "end": 403.52,
          "text": "Se todos esses princípios, essencialmente distintos, chegam a confundir-se, já não é possível raciocinar com clareza sobre os assuntos políticos."
        },
        {
          "id": 30,
          "start": 403.52,
          "end": 411.32,
          "text": "Cabe aos teólogos estabelecer os limites do justo e do injusto, segundo a maldade ou a bondade interiores da ação."
        },
        {
          "id": 31,
          "start": 411.32,
          "end": 420.29,
          "text": "Ao publicista cabe determinar tais limites em política, isto é, sob as relações do bem e do mal que a ação possa fazer à sociedade."
        },
        {
          "id": 32,
          "start": 420.29,
          "end": 431.99,
          "text": "Esse último objeto não pode acarretar nenhum prejuízo ao outro, porque todos sabem quanto a virtude política está abaixo das virtudes inalteráveis que emanam da Divindade."
        },
        {
          "id": 33,
          "start": 431.99,
          "end": 467.3,
          "text": "Repito, pois, que, se quiserem dar ao meu livro a honra de uma crítica, não comecem por me atribuir princípios contrários à virtude ou à religião, pois tais princípios não são os meus; em lugar de me assinalar como um ímpio ou um sedicioso, contentem-se em mostrar que sou mau lógico ou ignorante político; não tremam a cada proposição em que defendo os interesses da humanidade; verifiquem a inutilidade de minhas máximas e os perigos que podem ter minhas opiniões; façam-me ver as vantagens das práticas recebidas."
        },
        {
          "id": 34,
          "start": 467.3,
          "end": 478.46,
          "text": "Dei um testemunho público dos meus princípios religiosos e da minha submissão ao soberano, ao responder às Notas e Observações que se publicaram contra minha obra."
        },
        {
          "id": 35,
          "start": 478.46,
          "end": 485.03,
          "text": "Devo guardar silêncio em relação aos escritores que doravante só me opuserem as mesmas objeções."
        },
        {
          "id": 36,
          "start": 485.03,
          "end": 511.1,
          "text": "Mas, aquele que puser em sua crítica a decência e o respeito que os homens honestos se devem entre si, e quem tiver bastantes luzes para não me obrigar a demonstrar-lhe os princípios mais simples, de qualquer natureza que sejam, encontrará em mim um homem menos apressado a defender suas opiniões particulares do que um tranqüilo amigo da verdade, pronto a confessar os seus erros."
        }
      ],
      "imagens": []
    },
    {
      "numero": 5,
      "id": "capitulo-01",
      "titulo": "Capítulo 01: Introdução",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 01 do clássico Dos Delitos e das Penas: Introdução.",
      "duracaoSegundos": 401,
      "duracaoFormatada": "06:41",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-19-publicidade-e-presteza-das-penas.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-19.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-19-publicidade-e-presteza-das-penas.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 6.89,
          "text": "QUANTO mais pronta for a pena e mais de perto seguir o delito, tanto mais justa e útil ela será."
        },
        {
          "id": 2,
          "start": 6.89,
          "end": 7.68,
          "text": "Mais justa."
        },
        {
          "id": 3,
          "start": 7.68,
          "end": 20.03,
          "text": "porque poupará ao acusado os cruéis tormentos da, incerteza, tormentos supérfluos, cujo horror aumenta para ele na razão da força de imaginação e do sentimento de fraqueza."
        },
        {
          "id": 4,
          "start": 20.03,
          "end": 31.94,
          "text": "A presteza do julgamento é justa ainda porque, a perda da liberdade sendo já uma pena, esta só deve preceder a condenação na estrita medida que a necessidade o exige."
        },
        {
          "id": 5,
          "start": 31.94,
          "end": 45.08,
          "text": "Se a prisão é apenas um meio de deter um cidadão até que ele seja julgado culpado, como esse meio é aflitivo e cruel, deve-se, tanto quanto possível, suavizar-lhe o rigor e a duração."
        },
        {
          "id": 6,
          "start": 45.08,
          "end": 56.78,
          "text": "Um cidadão detido só deve ficar na prisão o tempo necessário para a instrução do processo; e os mais antigos detidos têm direito de ser julgados em primeiro lugar."
        },
        {
          "id": 7,
          "start": 56.78,
          "end": 65.97,
          "text": "O acusado não deve ser encerrado senão na medida em que for necessário para o impedir de fugir ou de ocultar as provas do crime."
        },
        {
          "id": 8,
          "start": 65.97,
          "end": 69.7,
          "text": "O processo mesmo deve ser conduzido sem protelações."
        },
        {
          "id": 9,
          "start": 69.7,
          "end": 75.44,
          "text": "Que contraste hediondo entre a indolência de um juiz e a angústia de um acusado!"
        },
        {
          "id": 10,
          "start": 75.44,
          "end": 87.29,
          "text": "De um lado, um magistrado insensível, que passa os dias no bem-estar e nos prazeres, e de outro um infeliz que definha, a chorar no fundo de uma masmorra abominável."
        },
        {
          "id": 11,
          "start": 87.29,
          "end": 101.64,
          "text": "Os efeitos do castigo que se segue ao crime devem ser em geral impressionantes e sensíveis para os que o testemunharam; haverá, porém, necessidade de que esse castigo seja tão cruel para quem o sofre?"
        },
        {
          "id": 12,
          "start": 101.64,
          "end": 112.91,
          "text": "Quando os homens se reuniram em sociedade, foi para só se sujeitarem aos mínimos males possíveis; e não há país que possa negar esse princípio incontestável."
        },
        {
          "id": 13,
          "start": 112.91,
          "end": 135.17,
          "text": "Eu disse que a presteza da pena é útil; e é certo que, quanto menos tempo decorrer entre o delito e a pena, tanto mais os espíritos ficarão compenetrados da idéia de que não há crimes sem castigo; tanto mais se habituarão a considerar o crime como a causa da qual o castigo é o efeito necessário e inseparável."
        },
        {
          "id": 14,
          "start": 135.17,
          "end": 140.55,
          "text": "É a ligação das idéias que sustenta todo o edifício do entendimento humano."
        },
        {
          "id": 15,
          "start": 140.55,
          "end": 147.94,
          "text": "Sem ela, o prazer e a dor seriam sentimentos isolados, sem efeito, tão cedo esquecidos quanto sentidos."
        },
        {
          "id": 16,
          "start": 147.94,
          "end": 160.36,
          "text": "Os homens sem idéias gerais e princípios universais, isto é, os homens ignorantes e embrutecidos, não agem senão segundo as idéias mais vizinhas e mais imediatamente unidas."
        },
        {
          "id": 17,
          "start": 160.36,
          "end": 171.92,
          "text": "Negligenciam as relações distantes, e essas idéias complicadas, que só se apresentam ao homem fortemente apaixonado por um objeto, ou aos espíritos esclarecidos."
        },
        {
          "id": 18,
          "start": 171.92,
          "end": 177.3,
          "text": "A luz da atenção dissipa no homem apaixonado as trevas que cercam o vulgar."
        },
        {
          "id": 19,
          "start": 177.3,
          "end": 193.88,
          "text": "O homem instruído, acostumado a percorrer e a comparar rapidamente um grande número de idéias e de sentimentos opostos, tira do contraste um resultado que constitui a base de sua conduta, desde então menos incerta e menos perigosa."
        },
        {
          "id": 20,
          "start": 193.88,
          "end": 210.25,
          "text": "É, pois, da maior importância punir prontamente um crime cometido, se se quiser que, no espírito grosseiro do vulgo, a pintura sedutora das vantagens de uma ação criminosa desperte imediatamente a idéia de um castigo inevitável."
        },
        {
          "id": 21,
          "start": 210.25,
          "end": 217.07,
          "text": "Uma pena por demais retardada torna menos estreita a união dessas duas idéias: crime e castigo."
        },
        {
          "id": 22,
          "start": 217.07,
          "end": 233.51,
          "text": "Se o suplício de um acusado causa então alguma impressão, e somente como espetáculo, pois só se apresenta ao espectador quando o horror do crime, que contribui para fortificar o horror da pena, já está enfraquecido nos espíritos."
        },
        {
          "id": 23,
          "start": 233.51,
          "end": 252.89,
          "text": "Poder-se-ia ainda estreitar mais a ligação das idéias de crime e de castigo, dando à pena toda a conformidade possível com a natureza do delito, a fim de que o receio de um castigo especial afaste o espírito do caminho a que conduzia a perspectiva de um crime vantajoso."
        },
        {
          "id": 24,
          "start": 252.89,
          "end": 261.86,
          "text": "É preciso que a idéia do suplício esteja sempre presente no coração do homem fraco e domine o sentimento que o leva ao crime."
        },
        {
          "id": 25,
          "start": 261.86,
          "end": 276.07,
          "text": "Entre vários povos, punem-se os crimes pouco consideráveis com a prisão ou com a escravidão num país distante, isto é, manda-se o culpado levar um exemplo inútil a uma sociedade que ele não ofendeu."
        },
        {
          "id": 26,
          "start": 276.07,
          "end": 294.59,
          "text": "Como os homens não se entregam, a princípio, aos maiores crimes, a maior parte dos que assistem ao suplício de um celerado, acusado de algum crime monstruoso, não experimentam nenhum sentimento de terror ao verem um castigo que jamais imaginam poder merecer."
        },
        {
          "id": 27,
          "start": 294.59,
          "end": 307.87,
          "text": "Ao contrário, a punição pública dos pequenos delitos mais comuns causar-lhe-á na alma uma impressão salutar que os afastará de grandes crimes, desviando-os primeiro dos que o são menos."
        }
      ],
      "imagens": []
    },
    {
      "numero": 6,
      "id": "capitulo-02",
      "titulo": "Capítulo 02: Origem das penas e direito de punir",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 02 do clássico Dos Delitos e das Penas: Origem das penas e direito de punir.",
      "duracaoSegundos": 280,
      "duracaoFormatada": "04:40",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-29-duelos.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-29-duelos.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-29-duelos.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 10.87,
          "text": "A HONRA, que não é senão a necessidade dos sufrágios públicos, deu nascimento aos combates singulares, que só puderam estabelecer-se na desordem das más leis."
        },
        {
          "id": 2,
          "start": 10.87,
          "end": 23.8,
          "text": "Se os duelos não estiveram em uso na antigüidade, como algumas pessoas o crêem, é que os antigos não se reuniam armados com um ar de desconfiança, nos templos, no teatro e entre os amigos."
        },
        {
          "id": 3,
          "start": 23.8,
          "end": 38.52,
          "text": "Talvez também, sendo o duelo um espetáculo muito comum que vis escravos davam ao povo, os homens livres tivessem receio de que os combates singulares não bastassem para que eles fossem considerados homens honrados."
        },
        {
          "id": 4,
          "start": 38.52,
          "end": 45.26,
          "text": "Seja como for, é em vão que se experimentou entre os modernos impedir os duelos com pena de morte."
        },
        {
          "id": 5,
          "start": 45.26,
          "end": 53.86,
          "text": "Essas leis severas não puderam destruir um costume fundado numa espécie de honra, mais cara aos homens do que a própria vida."
        },
        {
          "id": 6,
          "start": 53.86,
          "end": 73.81,
          "text": "O cidadão que recusa um duelo vê-se presa do desprezo dos seus concidadãos; é forçado a levar uma vida solitária, a renunciar aos encantos da sociedade, ou a expor-se constantemente aos insultos e à vergonha, cujos repetidos golpes o afetam de maneira mais cruel do que a idéia do suplício."
        },
        {
          "id": 7,
          "start": 73.81,
          "end": 80.41,
          "text": "Por que motivo serão os duelos menos freqüentes entre os homens do povo do que entre os grandes?"
        },
        {
          "id": 8,
          "start": 80.41,
          "end": 93.69,
          "text": "É somente porque o povo não traz espada, é porque tem menos necessidade de sufrágios públicos do que os homens de condição mais elevada, que se observam entre si com mais desconfiança e inveja."
        },
        {
          "id": 9,
          "start": 93.69,
          "end": 121.75,
          "text": "Não é inútil repetir aqui o que já se disse certa vez: que o melhor meio de impedir o duelo é punir o agressor, isto é, aquele que deu lugar à querela, a declarar inocente aquele que, sem procurar tirar a espada, se viu constrangido a defender a própria honra, isto é, a opinião, que as leis não protegem suficientemente, e mostrar aos seus concidadãos que pode respeitar as leis, mas que não teme os homens."
        }
      ],
      "imagens": []
    },
    {
      "numero": 7,
      "id": "capitulo-03",
      "titulo": "Capítulo 03: Consequências desses princípios",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 03 do clássico Dos Delitos e das Penas: Consequências desses princípios.",
      "duracaoSegundos": 123,
      "duracaoFormatada": "02:03",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-39-do-espirito-de-familia.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-39-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-39-do-espirito-de-familia.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 4.76,
          "text": "O ESPIRÍTO da família é outra fonte geral de injustiças na legislação."
        },
        {
          "id": 2,
          "start": 4.76,
          "end": 22.57,
          "text": "Se as disposições cruéis e os outros vícios das leis penais foram aprovados pelos legisladores mais esclarecidos, nas repúblicas mais livres, é que se considerou o Estado antes como uma sociedade de famílias do que como a associação de um certo número de homens."
        },
        {
          "id": 3,
          "start": 22.57,
          "end": 42.63,
          "text": "Suponha-se uma nação composta de cem mil homens, distribuídos em vinte mil famílias de cinco pessoas cada uma, inclusive o chefe que a representa; se a associação é feita por famílias, haveria vinte mil cidadãos e oitenta mil escravos; se é feita por indivíduos, haveria cem mil cidadãos livres."
        },
        {
          "id": 4,
          "start": 42.63,
          "end": 64.04,
          "text": "No primeiro caso, seria uma república composta de vinte mil pequenas monarquias; no segundo, tudo respirará o espírito de liberdade, que animará os cidadãos, não somente nas praças públicas e nas assembléias nacionais, mas ainda sob o teto doméstico, onde residem os principais elementos de felicidade e de miséria."
        },
        {
          "id": 5,
          "start": 64.04,
          "end": 95.18,
          "text": "Se a associação é feita por famílias, as leis e os costumes, que são sempre o resultado dos sentimentos habituais dos membros da sociedade política, serão obra dos chefes dessas famílias; ver-se-á em breve o espírito monárquico introduzir-se aos poucos na própria república, e os seus efeitos só encontrarão obstáculos na oposição dos interesses particulares, porque os sentimentos naturais de liberdade e de igualdade já terão deixado de viver nos corações."
        },
        {
          "id": 6,
          "start": 95.18,
          "end": 114.28,
          "text": "O espírito de família é um espirito de minúcia limitado pelos mais insignificantes pormenores; ao passo que o espírito público, ligado aos princípios gerais, vê os fatos com visão segura, coordena-os nos lugares respectivos e sabe tirar deles conseqüências úteis ao bem da maioria."
        },
        {
          "id": 7,
          "start": 114.28,
          "end": 125.63,
          "text": "Nas sociedades compostas de famílias, as crianças ficam sob a autoridade do chefe e são obrigadas a esperar que a morte lhes dê uma existência que só depende das leis."
        },
        {
          "id": 8,
          "start": 125.63,
          "end": 155.48,
          "text": "Habituadas a obedecer e a tremer, na idade da força, quando as paixões não são ainda refreadas pela moderação, espécie de temor prudente que é o fruto da experiência e da idade, como resistirão elas aos obstáculos que o vício opõe constantemente aos esforços da virtude, quando a velhice decrépita e medrosa tirar-lhes a coragem de tentar reformas ousadas, que aliás as seduzem pouco, porque não têm a esperança de recolher-lhes os frutos?"
        },
        {
          "id": 9,
          "start": 155.48,
          "end": 189.81,
          "text": "Nas repúblicas, em que todo homem é cidadão, a subordinação nas famílias não é efeito da força, mas de um contrato; e os filhos, uma vez saídos da idade em que a fraqueza e a necessidade de educação os mantêm sob a dependência natural dos pais, tornam-se desde então membros livres da sociedade: se ainda se submetem ao chefe da família, é apenas para participar das vantagens que esta lhes oferece, do mesmo modo que os cidadãos se sujeitam, sem perder a liberdade, ao chefe da grande sociedade política."
        },
        {
          "id": 10,
          "start": 189.81,
          "end": 198.78,
          "text": "Nas repúblicas compostas de famílias, os jovens, isto é, a parte mais considerável e mais útil da nação, ficam à discrição dos pais."
        },
        {
          "id": 11,
          "start": 198.78,
          "end": 217.54,
          "text": "Nas repúblicas de homens livres, os únicos laços que submetem os filhos ao pai são os sentimentos sagrados e invioláveis da natureza, que convidam os homens a ajudar-se mutuamente em suas necessidades recíprocas e que lhes inspiram o reconhecimento pelos benefícios recebidos."
        },
        {
          "id": 12,
          "start": 217.54,
          "end": 228.01,
          "text": "Esses santos deveres são muito mais alterados pelo vício das leis, que prescrevem uma submissão cega e obrigatória, do que pela maldade do coração humano."
        },
        {
          "id": 13,
          "start": 228.01,
          "end": 243.17,
          "text": "Essa oposição entre as leis fundamentais dos Estados políticos e as leis de família, é fonte de muitas outras contradições entre a moral pública e a moral particular, que se combatem continuamente no espírito de cada homem."
        },
        {
          "id": 14,
          "start": 243.17,
          "end": 251.53,
          "text": "A moral particular só inspira a submissão e o medo, ao passo que a moral pública anima a coragem e o espírito da liberdade."
        },
        {
          "id": 15,
          "start": 251.53,
          "end": 260.37,
          "text": "Guiado pela primeira, o homem limita seu bem-estar ao círculo estreito de um pequeno número de pessoas que ele nem mesmo escolheu."
        },
        {
          "id": 16,
          "start": 260.37,
          "end": 266.42,
          "text": "Inspirado pela outra, procura estender a felicidade sobre todas as classes da humanidade."
        },
        {
          "id": 17,
          "start": 266.42,
          "end": 279.27,
          "text": "A moral particular exige que cada qual se sacrifique continuamente a um falso ídolo que se chama o bem da família e que muitas vezes não é o bem real de nenhum dos indivíduos que a compõem."
        },
        {
          "id": 18,
          "start": 279.27,
          "end": 294.09,
          "text": "A moral pública ensina a procurar o bem-estar sem ferir as leis; e, se às vezes excita um cidadão a imolar-se pela pátria, recompensa-o pelo entusiasmo que lhe inspira antes do sacrifício e pela glória que lhe promete."
        },
        {
          "id": 19,
          "start": 294.09,
          "end": 312.51,
          "text": "Tantas contradições fazem que os homens desdenhem de praticar a virtude, que não podem reconhecer no meio das trevas de que a cercaram e que lhes parece distante, porque está envolta nessa obscuridade que oculta aos nossos olhos os objetos morais como os objetos físicos."
        },
        {
          "id": 20,
          "start": 312.51,
          "end": 319.86,
          "text": "Quantas vezes o cidadão que reflete sobre suas ações passadas não se terá admirado de achar-se um mau homem?"
        },
        {
          "id": 21,
          "start": 319.86,
          "end": 332.37,
          "text": "A medida que a sociedade cresce, cada um dos seus membros torna-se uma parte menor do todo, e o amor do bem público se enfraquece na mesma proporção, se as leis deixam de fortificá-lo."
        },
        {
          "id": 22,
          "start": 332.37,
          "end": 343.38,
          "text": "As sociedades políticas têm, como o corpo humano, um crescimento limitado; não poderiam estender-se além de certos limites, sem que sua economia fosse perturbada."
        },
        {
          "id": 23,
          "start": 343.38,
          "end": 351.06,
          "text": "Parece que a grandeza de um Estado deve estar na razão inversa do grau de atividade dos indivíduos que a compõem."
        },
        {
          "id": 24,
          "start": 351.06,
          "end": 362.14,
          "text": "Se essa atividade crescesse ao mesmo tempo que a população, as boas leis achariam um obstáculo, para prevenir os delitos, no próprio bem que tivessem podido fazer."
        },
        {
          "id": 25,
          "start": 362.14,
          "end": 370.44,
          "text": "Uma república muito vasta só pode escapar ao despotismo subdividindo-se num certo número de pequenos Estados confederados."
        },
        {
          "id": 26,
          "start": 370.44,
          "end": 381.38,
          "text": "Mas, para formar essa união, seria preciso um ditador poderoso, que tivesse a coragem de Sila (22), com tanto gênio para fundar quanto Sila o teve para destruir."
        },
        {
          "id": 27,
          "start": 381.38,
          "end": 385.6,
          "text": "Se tal homem for ambicioso, poderá esperar uma glória imortal."
        },
        {
          "id": 28,
          "start": 385.6,
          "end": 394.16,
          "text": "Se for filósofo, as bênçãos dos seus concidadãos o consolarão da perda de sua autoridade, mesmo sem pedir-lhes reconhecimento."
        },
        {
          "id": 29,
          "start": 394.16,
          "end": 403.54,
          "text": "Quando os sentimentos que nos unem à nação principiam a enfraquecer-se, os que nos ligam aos objetos que nos cercam adquirem novas forças."
        },
        {
          "id": 30,
          "start": 403.54,
          "end": 417.14,
          "text": "Assim, sob o despotismo feroz, os laços da amizade são mais duráveis; e as virtudes de família (virtudes sempre fracas) se tornam, então, as mais comuns, ou antes, são as únicas que ainda se praticam."
        },
        {
          "id": 31,
          "start": 417.14,
          "end": 425.57,
          "text": "Após todas essas observações, pode julgar-se quanto foram curtas e limitadas as opiniões da maioria dos nossos legisladores."
        }
      ],
      "imagens": []
    },
    {
      "numero": 8,
      "id": "capitulo-04",
      "titulo": "Capítulo 04: Da interpretação das leis",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 04 do clássico Dos Delitos e das Penas: Da interpretação das leis.",
      "duracaoSegundos": 363,
      "duracaoFormatada": "06:03",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-42-conclusao.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-42-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-42-conclusao.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 26.47,
          "text": "DE tudo o que acaba de ser exposto, pode deduzir-se um teorema geral utilíssimo, mas conforme ao uso, que é o legislador ordinário das nações: É que, para não ser um ato de violência contra o cidadão, a pena deve ser essencialmente pública, pronta, necessária, a menor das penas aplicáveis nas circunstâncias dadas, proporcionada ao delito e determinada pela lei."
        }
      ],
      "imagens": []
    },
    {
      "numero": 9,
      "id": "capitulo-05",
      "titulo": "Capítulo 05: Da obscuridade das leis",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 05 do clássico Dos Delitos e das Penas: Da obscuridade das leis.",
      "duracaoSegundos": 231,
      "duracaoFormatada": "03:51",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-cap05-da-obscuridade-das-leis.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-titulo-cap05-da-obscuridade-das-leis.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-05-da-obscuridade-das-leis.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 8.06,
          "text": "SE a interpretação arbitrária das leis é um mal, também o é a sua obscuridade, pois precisam ser interpretadas."
        },
        {
          "id": 2,
          "start": 8.06,
          "end": 14.74,
          "text": "Esse inconveniente é bem maior ainda quando as leis não são escritas em língua vulgar (10)."
        },
        {
          "id": 3,
          "start": 14.74,
          "end": 46.75,
          "text": "Enquanto o texto das leis não for um livro familiar, uma espécie de catecismo, enquanto forem escritas numa língua morta e ignorada do povo, e enquanto forem solenemente conservadas como misteriosos oráculos, o cidadão, que não puder julgar por si mesmo as conseqüências que devem ter os seus próprios atos sobre a sua liberdade e sobre os seus bens, ficará na dependência de um pequeno número de homens depositários e intérpretes das leis."
        },
        {
          "id": 4,
          "start": 46.75,
          "end": 66.13,
          "text": "Colocai o texto sagrado das leis nas mãos do povo, e, quanto mais homens houver que o lerem, tanto menos delitos haverá; pois não se pode duvidar que no espirito daquele que medita um crime, o conhecimento e a certeza das penas ponham freio à eloqüência das paixões."
        },
        {
          "id": 5,
          "start": 66.13,
          "end": 80.28,
          "text": "Que pensar dos homens,, quando se reflete que as leis da maior parte das nações estão escritas em línguas mortas e que esse costume bárbaro ainda subsiste nos países mais esclarecidos da Europa?"
        },
        {
          "id": 6,
          "start": 80.28,
          "end": 104.6,
          "text": "Dessas últimas reflexões resulta que, sem um corpo de leis escritas, jamais uma sociedade poderá tomar uma forma de governo fixo, em que a força resida no corpo político e não nos membros desse corpo; em que as leis não possam alterar-se e destruir-se pelo choque dos interesses particulares, nem reformar-se senão pela vontade geral."
        },
        {
          "id": 7,
          "start": 104.6,
          "end": 115.63,
          "text": "A razão e a experiência fizeram ver quantas tradições humanas se tornam mais duvidosas e mais contestadas, à medida que a gente se afasta de sua fonte."
        },
        {
          "id": 8,
          "start": 115.63,
          "end": 125.29,
          "text": "Ora, se não existe um momento estável do pacto social, como resistirão as leis ao movimento sempre vitorioso do tempo e das paixões?"
        },
        {
          "id": 9,
          "start": 125.29,
          "end": 136.83,
          "text": "Vê-se por aí, igualmente, a utilidade da imprensa, que pode, só ela, tornar todo o público, e não alguns particulares, depositário do código sagrado das leis."
        },
        {
          "id": 10,
          "start": 136.83,
          "end": 149.61,
          "text": "Foi a imprensa que dissipou esse tenebroso espírito de cabala e de intriga, que, não pode suportar a luz e que finge desprezar as ciências somente porque secretamente as teme."
        },
        {
          "id": 11,
          "start": 149.61,
          "end": 164.63,
          "text": "Se agora, na Europa, diminuem esses crimes atrozes que assombravam nossos pais, se saímos enfim desse estado de barbárie que tornava nossos antepassados ora escravos ora tiranos, é à imprensa que o devemos."
        },
        {
          "id": 12,
          "start": 164.63,
          "end": 178.28,
          "text": "Os que conhecem a história de dois ou três séculos e do nosso podem ver a humanidade, a generosidade, a tolerância mútua e as mais doces virtudes nasceram no seio do luxo e da indolência."
        },
        {
          "id": 13,
          "start": 178.28,
          "end": 187.86,
          "text": "Quais foram, ao contrário, as virtudes dessas épocas que, tão sem propósitos, se chamam séculos da boa fé e da simplicidade antiga?"
        },
        {
          "id": 14,
          "start": 187.86,
          "end": 201.87,
          "text": "A humanidade gemia sob o jugo da implacável superstição; a avareza e a ambição de um pequeno número de homens poderosos inundavam de sangue humano os palácios dos grandes e os tronos dos reis."
        },
        {
          "id": 15,
          "start": 201.87,
          "end": 205.28,
          "text": "Eram traições secretas e morticínios públicos."
        },
        {
          "id": 16,
          "start": 205.28,
          "end": 220.16,
          "text": "O povo só encontrava na nobreza opressores e tiranos; e os ministros do Evangelho, manchados na carnificina e as mãos ainda sangrentas, ousavam oferecer aos olhos do povo um Deus de misericórdia e de paz."
        },
        {
          "id": 17,
          "start": 220.16,
          "end": 230.76,
          "text": "Os que se levantam contra a pretensa corrupção do grande século em que vivemos não acharão ao menos que esse quadro abominável possa convir- lhe."
        }
      ],
      "imagens": []
    },
    {
      "numero": 10,
      "id": "capitulo-06",
      "titulo": "Capítulo 06: Da prisão",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 06 do clássico Dos Delitos e das Penas: Da prisão.",
      "duracaoSegundos": 234,
      "duracaoFormatada": "03:54",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-cap06-da-prisao.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-titulo-cap06-da-prisao.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-06-da-prisao.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 24.34,
          "text": "OUTORGA-SE, em geral, aos magistrados encarregados de fazer as leis, um direito contrário ao fim da sociedade, que é a segurança pessoal; refiro-me ao direito de prender discricionariamente os cidadãos, de tirar a liberdade ao inimigo sob pretextos frívolos, e, por conseguinte de deixar livres os que eles protegem, mau grado todos os indícios do delito."
        },
        {
          "id": 2,
          "start": 24.34,
          "end": 27.5,
          "text": "Como se tornou tão comum um erro tão funesto?"
        },
        {
          "id": 3,
          "start": 27.5,
          "end": 45.74,
          "text": "Embora a prisão difira das outras penas, por dever necessariamente preceder a declaração jurídica do delito, nem por isto deixa de ter, como todos os outros gêneros de castigos, o caráter essencial de que só a lei deve determinar o caso em que é preciso empregá-la."
        },
        {
          "id": 4,
          "start": 45.74,
          "end": 54.72,
          "text": "Assim, a lei deve estabelecer, de maneira fixa, por que indícios de delito um acusado pode ser preso e submetido a interrogatório."
        },
        {
          "id": 5,
          "start": 54.72,
          "end": 73.24,
          "text": "O clamor público, a fuga, as confissões particulares, o depoimento de um cúmplice do crime, as ameaças que o acusado pode fazer, seu ódio inveterado ao ofendido, um corpo de delito existente, e outras presunções semelhantes, bastam para permitir a prisão de um cidadão."
        },
        {
          "id": 6,
          "start": 73.24,
          "end": 90.38,
          "text": "Tais indícios devem, porém, ser especificados de maneira estável pela lei, e não pelo juiz, cujas sentenças se tornam um atentado à liberdade pública, quando não são simplesmente a aplicação particular de uma máxima geral emanada do código das leis."
        },
        {
          "id": 7,
          "start": 90.38,
          "end": 113.97,
          "text": "À medida que as penas forem mais brandas, quando as prisões já não forem a horrível mansão do desespero e da fome, quando a piedade e a humanidade penetrarem nas masmorras, quando enfim os executores impiedosos dos rigores da justiça abrirem os corações à compaixão, as leis poderão contentar-se com indícios mais fracos para ordenar a prisão."
        },
        {
          "id": 8,
          "start": 113.97,
          "end": 121.79,
          "text": "A prisão não deveria deixar nenhuma nota de infâmia sobre o acusado cuja inocência foi juridicamente reconhecida."
        },
        {
          "id": 9,
          "start": 121.79,
          "end": 134.88,
          "text": "Entre os romanos, quantos cidadãos não vemos, acusados anteriormente de crimes hediondos, mas em seguida reconhecidos inocentes, receberem da veneração do povo os primeiros cargos do Estado?"
        },
        {
          "id": 10,
          "start": 134.88,
          "end": 139.68,
          "text": "Porque é tão diferente, em nossos dias, a sorte de um inocente preso?"
        },
        {
          "id": 11,
          "start": 139.68,
          "end": 174.04,
          "text": "É porque o sistema atual da jurisprudência criminal apresenta aos nossos espíritos a idéia da força e do poder, em lugar da justiça; é porque se lançam, indistintamente, na mesma masmorra, o inocente suspeito e o criminoso convicto; é porque a prisão, entre nós, é antes um suplício que um meio de deter um acusado; é porque, finalmente, as forças que defendem externamente o trono e os direitos da nação estão separadas das que mantêm as leis no interior, quando deveriam estar estreitamente unidas."
        },
        {
          "id": 12,
          "start": 174.04,
          "end": 179.87,
          "text": "Na opinião pública, as prisões militares desonram bem menos do que as prisões civis."
        },
        {
          "id": 13,
          "start": 179.87,
          "end": 205.58,
          "text": "Se as tropas do Estado, reunidas sob a autoridade das leis comuns, sem contudo dependerem imediatamente dos magistrados, fossem encarregadas da guarda das prisões, a mancha de infâmia desapareceria ante o aparato e o fausto que acompanham os corpos militares; porque, em geral, a infâmia, como tudo o que depende das opiniões populares, se liga mais à forma do que ao fundo."
        },
        {
          "id": 14,
          "start": 205.58,
          "end": 220.39,
          "text": "Mas, como as leis e os costumes de um povo estão sempre atrasados de vários séculos em relação às luzes atuais, conservamos ainda a barbárie e as idéias ferozes dos caçadores do norte, nossos selvagens antepassados."
        },
        {
          "id": 15,
          "start": 220.39,
          "end": 226.36,
          "text": "Os nossos costumes e as nossas leis retardatárias estão bem longe das luzes dos povos."
        },
        {
          "id": 16,
          "start": 226.36,
          "end": 234.31,
          "text": "Ainda estamos dominados pelos preconceitos bárbaros que nos legaram os nossos avós, os bárbaros caçadores do norte."
        }
      ],
      "imagens": []
    },
    {
      "numero": 11,
      "id": "capitulo-07",
      "titulo": "Capítulo 07: Dos indícios do delito e da forma dos julgamentos",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 07 do clássico Dos Delitos e das Penas: Dos indícios do delito e da forma dos julgamentos.",
      "duracaoSegundos": 322,
      "duracaoFormatada": "05:22",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-cap07-dos-indicios-do-delito-e-da-forma-dos-julgamentos.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-titulo-cap07-dos-indicios-do-delito-e-da-forma-dos-julgamentos.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-07-dos-indicios-do-delito-e-da-forma-dos-julgamentos.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 35.78,
          "text": "JULGAMENTOS EIS um teorema geral, que pode ser muito útil para calcular a certeza de um fato e, principalmente, o valor dos indícios de um delito: Quando as provas de um fato se apoiam todas entre si, isto é, quando os indícios do delito não se sustentam senão uns pelos outros, quando a força de várias provas depende da verdade de uma só, o número dessas provas nada acrescenta nem subtrai à probabilidade do fato: merecem pouca consideração, porque, destruindo a única prova que parece certa, derrubais todas as outras."
        },
        {
          "id": 2,
          "start": 35.78,
          "end": 52.43,
          "text": "Mas, quando as provas são independentes, isto é quando cada indício se prova à parte, quanto mais numerosos forem esses indícios, tanto mais provável será o delito, porque a falsidade de uma prova em nada influi sobre a certeza das restantes."
        },
        {
          "id": 3,
          "start": 52.43,
          "end": 81.35,
          "text": "Não se admirem de ver-me empregar a palavra probabilidade ao tratar de crimes que, para merecerem um castigo, devem ser certos; porque, a rigor, toda certeza moral é apenas uma probabilidade, que merece, contudo, ser considerada como uma certeza, quando todo homem de bom senso é forçado a dar-lhe o seu assentimento, por uma espécie de hábito natural que resulta da necessidade de agir que é anterior a toda especulação."
        },
        {
          "id": 4,
          "start": 81.35,
          "end": 90.4,
          "text": "A certeza que se exige para convencer um culpado é, pois, a mesma que determina todos os homens nos seus mais importantes negócios."
        },
        {
          "id": 5,
          "start": 90.4,
          "end": 96.22,
          "text": "As provas de um delito podem distinguir-se em provas perfeitas e provas imperfeitas."
        },
        {
          "id": 6,
          "start": 96.22,
          "end": 103.21,
          "text": "As provas perfeitas são as que demonstram positivamente que é impossível que o acusado seja inocente."
        },
        {
          "id": 7,
          "start": 103.21,
          "end": 109.11,
          "text": "As provas são imperfeitas quando não excluem a possibilidade da inocência do acusado."
        },
        {
          "id": 8,
          "start": 109.11,
          "end": 134.4,
          "text": "Uma única prova perfeita é suficiente para autorizar a condenação; se se quiser, porém, condenar sobre provas imperfeitas, como cada uma dessas provas não estabelece a impossibilidade da inocência do acusado, é preciso que sejam em número muito grande para valerem uma prova perfeita, isto é, para provarem todas juntas que é impossível que o acusado não seja culpado."
        },
        {
          "id": 9,
          "start": 134.4,
          "end": 147.9,
          "text": "Acrescentarei ainda que as provas imperfeitas, às quais o acusado nada responde de satisfatório, embora deva, se é inocente, ter meios de justificar- se, se tornam por isso mesmo provas perfeitas."
        },
        {
          "id": 10,
          "start": 147.9,
          "end": 154.14,
          "text": "É, todavia, mais fácil sentir essa certeza moral de um delito do que defini-la exatamente."
        },
        {
          "id": 11,
          "start": 154.14,
          "end": 175.18,
          "text": "Eis o que me faz encarar como sábia a lei que, em algumas nações, dá ao juiz principal assessores que o magistrado não escolheu, mas que a sorte designou livremente; porque então a ignorância, que julga por sentimento, está menos sujeita ao erro do que homem instruído que decide segundo a incerta opinião."
        },
        {
          "id": 12,
          "start": 175.18,
          "end": 181.14,
          "text": "Quando as leis são claras e precisas, o dever do juiz limita-se à constatação do fato."
        },
        {
          "id": 13,
          "start": 181.14,
          "end": 207.73,
          "text": "Se são necessárias destreza e habilidade na investigação das provas de um delito, se se requerem clareza e precisão na maneira de apresentar o seu resultado, para julgar segundo esse mesmo resultado, basta o simples bom-senso: guia menos enganador do que todo o saber de um juiz acostumado a só procurar culpados por toda parte e levar tudo ao sistema que adotou segundo os seus estudos."
        },
        {
          "id": 14,
          "start": 207.73,
          "end": 212.94,
          "text": "Felizes as nações entre as quais o conhecimento das leis não é uma ciência."
        },
        {
          "id": 15,
          "start": 212.94,
          "end": 229.18,
          "text": "Lei sábia e cujos efeitos são sempre felizes é a que prescreve que cada um seja julgado por seus iguais; porque, quando se trata da fortuna e da liberdade de um cidadão, todos os sentimentos inspirados pela desigualdade devem silenciar."
        },
        {
          "id": 16,
          "start": 229.18,
          "end": 247.27,
          "text": "Ora, o desprezo com o qual o homem poderoso olha para a vitima do infortúnio, e a indignação que experimenta o homem de condição medíocre ao ver o culpado que está acima dele por sua condição, são sentimentos perigosos que não existem nos julgamentos de que falo."
        },
        {
          "id": 17,
          "start": 247.27,
          "end": 268.52,
          "text": "Quando o culpado e o ofendido estão em condições desiguais, os juizes devem ser escolhidos, metade entre os iguais do acusado e metade entre os do ofendido, para contrabalançar assim os interesses pessoais, que modificam, mau grado nosso, as aparências dos objetos, e para só deixar falar a verdade e as leis."
        },
        {
          "id": 18,
          "start": 268.52,
          "end": 284.35,
          "text": "Igualmente justo é que o culpado possa recusar um certo número dos juizes que lhe forem suspeitos, e, se o acusado gozar constantemente desse direito, exercê-lo-á com reserva; porque de outro modo pareceria condenar-se a si mesmo."
        },
        {
          "id": 19,
          "start": 284.35,
          "end": 295.25,
          "text": "Sejam públicos os julgamentos; sejam-no também as provas do crime: e a opinião, que é talvez o único laço das sociedades, porá freio à violência e às paixões."
        },
        {
          "id": 20,
          "start": 295.25,
          "end": 299.36,
          "text": "O povo dirá: Não somos escravos, mas protegidos pelas leis."
        },
        {
          "id": 21,
          "start": 299.36,
          "end": 308.82,
          "text": "Esse sentimento de segurança, que inspira a coragem, eqüivale a um tributo para o soberano que compreende os seus verdadeiros interesses."
        },
        {
          "id": 22,
          "start": 308.82,
          "end": 316.7,
          "text": "Não entrarei em outros pormenores sobre as precauções que exige o estabelecimento dessas espécies de instituições."
        },
        {
          "id": 23,
          "start": 316.7,
          "end": 321.84,
          "text": "Para aqueles aos quais é necessário tudo dizer, tudo eu diria inutilmente."
        }
      ],
      "imagens": []
    },
    {
      "numero": 12,
      "id": "capitulo-08",
      "titulo": "Capítulo 08: Das testemunhas",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 08 do clássico Dos Delitos e das Penas: Das testemunhas.",
      "duracaoSegundos": 336,
      "duracaoFormatada": "05:36",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-cap08-das-testemunhas.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-titulo-cap08-das-testemunhas.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-08-das-testemunhas.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 12.25,
          "text": "É IMPORTANTE, em toda boa legislação, determinar de maneira exata o grau de confiança que se deve dar às testemunhas e a natureza das provas necessárias para constatar o delito."
        },
        {
          "id": 2,
          "start": 12.25,
          "end": 23.94,
          "text": "Todo homem razoável, isto é, todo homem que puser ligação em suas idéias e que experimentar as mesmas sensações que os outros homens, poderá ser recebido em testemunho."
        },
        {
          "id": 3,
          "start": 23.94,
          "end": 31.28,
          "text": "Mas, a confiança que se lhe der deve medir-se pelo interesse que ele tem de dizer ou não dizer a verdade."
        },
        {
          "id": 4,
          "start": 31.28,
          "end": 53.63,
          "text": "É, pois, por motivos frívolos e absurdos que as leis não admitem em testemunho nem as mulheres, por causa de sua franqueza, nem os condenados, porque estes morreram civilmente, nem as pessoas com nota de infâmia, porque, em todos esses casos, uma testemunha pode dizer a verdade, quando não tem nenhum interesse em mentir."
        },
        {
          "id": 5,
          "start": 53.63,
          "end": 66.29,
          "text": "Entre os abusos de palavras que tiveram certa influência sobre os negócios deste mundo, um dos mais notáveis é o que faz considerar como nulo o depoimento de um culpado já condenado."
        },
        {
          "id": 6,
          "start": 66.29,
          "end": 74.94,
          "text": "Graves jurisconsultos fazem este raciocínio Este homem foi atingido por morte civil; ora, um morto já não é capaz de nada..."
        },
        {
          "id": 7,
          "start": 74.94,
          "end": 86.36,
          "text": "Muitas vítimas se sacrificaram a essa vã metáfora: e muitas vezes se tem contestado seriamente à verdade santa o direito de preferência sobre as formas judiciárias."
        },
        {
          "id": 8,
          "start": 86.36,
          "end": 110.86,
          "text": "Sem dúvida, é preciso que os depoimentos de um culpado já condenado não possam retardar o curso da justiça; mas porque, após a sentença, não conceder aos interesses da verdade e à terrível situação do culpado alguns instantes ainda, para justificar, se possível, ou aos seus cúmplices ou a si próprio, com depoimentos novos que mudam a natureza do fato?"
        },
        {
          "id": 9,
          "start": 110.86,
          "end": 143.03,
          "text": "As formalidades e criteriosas procrastinações são necessárias nos processos criminais, ou porque não deixam nada à arbitrariedade do juiz, ou porque fazem compreender ao povo que os julgamentos são feitos com solenidade e segundo as regras, e não precipitadamente ditados polo interesse; ou, finalmente, porque a maior parte dos homens, escravos do hábito, e mais inclinados a sentir do que raciocinar, fazem assim uma idéia mais augusta das funções do magistrado."
        },
        {
          "id": 10,
          "start": 143.03,
          "end": 152.72,
          "text": "A verdade, muitas vezes demasiado simples ou demasiado complicada, tem necessidade de certa pompa exterior para merecer o respeito do povo."
        },
        {
          "id": 11,
          "start": 152.72,
          "end": 159.99,
          "text": "As formalidades, porém, devem ser fixadas, por leis, nos limites em que não possam prejudicar a verdade."
        },
        {
          "id": 12,
          "start": 159.99,
          "end": 164.42,
          "text": "De outro modo, seria uma nova fonte de inconvenientes funestos."
        },
        {
          "id": 13,
          "start": 164.42,
          "end": 171.06,
          "text": "Disse eu que se podia admitir em testemunho toda pessoa que não tem nenhum interesse em mentir."
        },
        {
          "id": 14,
          "start": 171.06,
          "end": 183.93,
          "text": "Deve, pois, conceder-se à testemunha mais ou menos confiança, à proporções do ódio ou da amizade que ela tem ao acusado e de outras relações mais ou menos estreitas que ambos mantenham."
        },
        {
          "id": 15,
          "start": 183.93,
          "end": 197.15,
          "text": "Uma só testemunha não basta porque, negando o acusado o que a testemunha afirma, não há nada de certo e a justiça deve então respeitar o direito que cada um tem de ser julgado inocente (11)."
        },
        {
          "id": 16,
          "start": 197.15,
          "end": 206.49,
          "text": "Deve dar-se às testemunhas um crédito tanto mais circunspecto quanto mais atrozes são os crimes e mais inverosímeis as circunstâncias."
        },
        {
          "id": 17,
          "start": 206.49,
          "end": 211.89,
          "text": "Tais são, por exemplo, as acusações de magia e as ações gratuitamente cruéis."
        },
        {
          "id": 18,
          "start": 211.89,
          "end": 227.8,
          "text": "No primeiro caso, é melhor acreditar que as testemunhas mentem, porque é mais comum ver vários homens caluniarem de concerto, por ódio ou por ignorância, do que ver um só homem exercer um poder que Deus recusou a todo ser criado."
        },
        {
          "id": 19,
          "start": 227.8,
          "end": 238.74,
          "text": "Da mesma forma, não se deve admitir com precipitação a acusação de uma crueldade sem motivos, porque o homem só é cruel por interesse, por ódio ou por temor."
        },
        {
          "id": 20,
          "start": 238.74,
          "end": 249.25,
          "text": "O coração humano é incapaz de um sentimento inútil; todos os seus sentimentos são o resultado das impressões que os objetos causaram sobre os sentidos."
        },
        {
          "id": 21,
          "start": 249.25,
          "end": 270.71,
          "text": "Deve, igualmente, dar-se menos crédito a um homem que é membro de uma ordem, ou de uma casta, ou de uma sociedade particular, cujos costumes e máximas são em geral desconhecidos, ou diferem dos usos comuns, porque, além de suas próprias paixões, esse homem tem ainda as paixões da sociedade da qual faz parte."
        },
        {
          "id": 22,
          "start": 270.71,
          "end": 293.96,
          "text": "Enfim, os depoimentos das testemunhas devem ser quase nulos, quando se trata de algumas palavras das quais se quer fazer um crime; porque o tom, os gestos e tudo o que precede ou segue as diferentes idéias que os homens ligam a suas palavras, alteram e modificam de tal modo os discursos que é quase impossível repeti-los com exatidão."
        },
        {
          "id": 23,
          "start": 293.96,
          "end": 314.58,
          "text": "As ações violentas, que constituem os verdadeiros delitos, deixam traços notáveis na maioria das circunstâncias que as acompanham e efeitos que das mesmas derivam; mas, as palavras não deixam vestígio e só subsistem na memória, quase sempre infiel e muitas vezes influenciadas, dos que as ouviram."
        },
        {
          "id": 24,
          "start": 314.58,
          "end": 335.54,
          "text": "É, pois, infinitamente mais fácil fundar uma calúnia sobre discursos do que sobre ações, pois o número das circunstâncias que se alegam para provar as ações fornece ao acusado mais recursos para justificar-se; ao passo que um delito de palavras não apresenta, de ordinário, nenhum meio de justificação."
        }
      ],
      "imagens": []
    },
    {
      "numero": 13,
      "id": "capitulo-09",
      "titulo": "Capítulo 09: Das acusações secretas",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 09 do clássico Dos Delitos e das Penas: Das acusações secretas.",
      "duracaoSegundos": 264,
      "duracaoFormatada": "04:24",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-cap09-das-acusacoes-secretas.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-titulo-cap09-das-acusacoes-secretas.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-09-das-acusacoes-secretas.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 9.4,
          "text": "AS acusações secretas são um abuso manifesto, mas consagrado e tornado necessário em vários governos, pela fraqueza de sua constituição."
        },
        {
          "id": 2,
          "start": 9.4,
          "end": 12.37,
          "text": "Tal uso torna os homens falsos e pérfidos."
        },
        {
          "id": 3,
          "start": 12.37,
          "end": 17.48,
          "text": "Aquele que suspeita um delator no seu concidadão vê nele logo um inimigo."
        },
        {
          "id": 4,
          "start": 17.48,
          "end": 26.61,
          "text": "Costumam, então, mascarar-se os próprios sentimentos; e o hábito de ocultá-los a outrem faz que cedo sejam dissimulados a si mesmo."
        },
        {
          "id": 5,
          "start": 26.61,
          "end": 31.58,
          "text": "Como os homens que chegaram a esse ponto funesto são dignos de piedade!"
        },
        {
          "id": 6,
          "start": 31.58,
          "end": 42.64,
          "text": "Desorientados, sem guia e sem princípios estáveis, vagam ao acaso no vasto mar da incerteza, preocupados exclusivamente em escapar aos monstros que os ameaçam."
        },
        {
          "id": 7,
          "start": 42.64,
          "end": 47.69,
          "text": "Um futuro cheio de mil perigos envenena para eles os momentos presentes."
        },
        {
          "id": 8,
          "start": 47.69,
          "end": 53.01,
          "text": "Os prazeres duráveis da tranqüilidade e da segurança lhes são desconhecidos."
        },
        {
          "id": 9,
          "start": 53.01,
          "end": 53.84,
          "text": "Se gozaram."
        },
        {
          "id": 10,
          "start": 53.84,
          "end": 65.79,
          "text": ", apressadamente e na confusão, de alguns instantes de felicidade espalhados aqui e ali sobre o triste curso de sua desgraçada vida, bastarão para consolá-los de ter vivido?"
        },
        {
          "id": 11,
          "start": 65.79,
          "end": 72.36,
          "text": "Será entre tais homens que encontraremos soldados intrépidos, defensores da pátria e do trono?"
        },
        {
          "id": 12,
          "start": 72.36,
          "end": 102.35,
          "text": "Acharemos entre eles magistrados incorruptíveis, que saibam sustentar e desenvolver os verdadeiros interesses do soberano, com uma eloqüência livre e patriótica, que deponham ao mesmo tempo aos pés do monarca os tributos e as bênçãos de todos os cidadãos, que levem ao palácio dos grandes e ao humilde teto do pobre a segurança, a paz, a confiança, e que dêem ao trabalho e à indústria a esperança de uma sorte cada vez mais doce?..."
        },
        {
          "id": 13,
          "start": 102.35,
          "end": 108.09,
          "text": "É sobretudo este último sentimento que reanima os Estados e lhes dá uma vida nova."
        },
        {
          "id": 14,
          "start": 108.09,
          "end": 115.41,
          "text": "Quem poderá defender-se da calúnia, quando esta se arma com o escudo mais sólido da tirania: o sigilo?..."
        },
        {
          "id": 15,
          "start": 115.41,
          "end": 126.81,
          "text": "Miserável governo aquele em que o soberano suspeita um inimigo em cada súdito e se vê forçado, para garantir a tranqüilidade pública, a perturbar a de cada cidadão!"
        },
        {
          "id": 16,
          "start": 126.81,
          "end": 134.07,
          "text": "Quais são, pois, os motivos sobre os quais se apoiam os que justificam as acusações e as penas secretas?"
        },
        {
          "id": 17,
          "start": 134.07,
          "end": 135.8,
          "text": "A tranqüilidade pública?"
        },
        {
          "id": 18,
          "start": 135.8,
          "end": 139.12,
          "text": "A segurança e a manutenção da forma de governo?"
        },
        {
          "id": 19,
          "start": 139.12,
          "end": 151.49,
          "text": "É mister confessar que estranha constituição é aquela em que o governo, que tem por si a força e a opinião, ainda mais poderosa do que a força, parece todavia temer cada cidadão!"
        },
        {
          "id": 20,
          "start": 151.49,
          "end": 154.94,
          "text": "Receia-se que o acusador não esteja em segurança?"
        },
        {
          "id": 21,
          "start": 154.94,
          "end": 162.68,
          "text": "As leis são, então, insuficientes para defendê-lo, e os súditos são mais poderosos do que o soberano e as leis."
        },
        {
          "id": 22,
          "start": 162.68,
          "end": 166.69,
          "text": "Desejar-se-ia salvar o delator da infâmia a que se expõe?"
        },
        {
          "id": 23,
          "start": 166.69,
          "end": 173.74,
          "text": "Seria, então, confessar que se autorizam as calúnias secretas, mas que se punem as calúnias públicas."
        },
        {
          "id": 24,
          "start": 173.74,
          "end": 176.23,
          "text": "Apoiar-se-ão na natureza do delito?"
        },
        {
          "id": 25,
          "start": 176.23,
          "end": 190.19,
          "text": "Se o governo for bastante infeliz para considerar como crimes certos atos indiferentes ou mesmo úteis ao público, terá razão: as acusações e os julgamentos, nesse caso, jamais seriam bastante secretos."
        },
        {
          "id": 26,
          "start": 190.19,
          "end": 198.27,
          "text": "Pode haver, porém, um delito, isto é, uma ofensa à sociedade, que não seja do interesse de todos punir publicamente?"
        },
        {
          "id": 27,
          "start": 198.27,
          "end": 214.51,
          "text": "Respeito todos os governos; não falo de nenhum em particular e sei que há circunstâncias em que os abusos parecem de tal modo inerentes à constituição de um Estado, que não parece possível desarraigá-los sem destruir o corpo político."
        },
        {
          "id": 28,
          "start": 214.51,
          "end": 230.55,
          "text": "Mas, se eu tivesse de ditar novas leis em algum canto isolado do universo, minha mão trêmula se recusaria a autorizar as acusações secretas: julgaria ver toda a posteridade responsabilizar-me pelos males atrozes que elas acarretam."
        },
        {
          "id": 29,
          "start": 230.55,
          "end": 241.95,
          "text": "Já o disse Montesquieu: as acusações públicas são conformes ao espírito do governo republicano, no qual o zelo do bem geral deve ser a primeira paixão dos cidadãos."
        },
        {
          "id": 30,
          "start": 241.95,
          "end": 255.36,
          "text": "Nas monarquias, em que o amor da pátria é muito fraco, pela própria natureza do governo, é sábia a instituição de magistrados encarregados de acusar, em nome do público, os infratores das leis."
        },
        {
          "id": 31,
          "start": 255.36,
          "end": 263.86,
          "text": "Mas, todo governo, republicano ou monárquico, deve infligir ao caluniador a pena que o acusado sofreu, se ele for culpado."
        }
      ],
      "imagens": []
    },
    {
      "numero": 14,
      "id": "capitulo-10",
      "titulo": "Capítulo 10: Dos interrogatórios sugestivos",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 10 do clássico Dos Delitos e das Penas: Dos interrogatórios sugestivos.",
      "duracaoSegundos": 163,
      "duracaoFormatada": "02:43",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-cap10-dos-interrogatorios-sugestivos.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-titulo-cap10-dos-interrogatorios-sugestivos.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-10-dos-interrogatorios-sugestivos.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 18.24,
          "text": "NOSSAS leis proíbem os interrogatórios sugestivos, isto é, os que se fazem sobre o fato mesmo do delito; porque, segundo os nossos jurisconsultos, só se deve interrogar sobre a maneira pela qual o crime foi cometido e sobre as circunstâncias que o acompanham."
        },
        {
          "id": 2,
          "start": 18.24,
          "end": 25.49,
          "text": "Um juiz não pode, contudo, permitir as questões diretas, que sugiram ao acusado uma resposta imediata."
        },
        {
          "id": 3,
          "start": 25.49,
          "end": 32.74,
          "text": "O juiz que interroga, dizem os criminalistas, só deve ir ao fato indiretamente, e nunca em linha reta."
        },
        {
          "id": 4,
          "start": 32.74,
          "end": 58.44,
          "text": "Se se estabeleceu esse método para evitar sugerir ao acusado uma resposta que o salve, ou por que foi considerada coisa monstruosa e contra a natureza um homem acusar-se a si mesmo, qualquer que tenha sido o fim visado com a proibição dos interrogatórios sugestivos, fez-se cair as leis numa contradição bem notória, pois que ao mesmo tempo se autorizou a tortura."
        },
        {
          "id": 5,
          "start": 58.44,
          "end": 62.94,
          "text": "Haverá, com efeito, interrogatório mais sugestivo do que a dor?"
        },
        {
          "id": 6,
          "start": 62.94,
          "end": 73.93,
          "text": "O celerado robusto, que pode evitar uma pena longa e rigorosa, sofrendo com força tormentos de um instante, guarda um silêncio obstinado e se vê absolvido."
        },
        {
          "id": 7,
          "start": 73.93,
          "end": 84.56,
          "text": "Mas, a questão arranca ao homem fraco uma confissão pela qual ele se livra da dor presente, que o afeta mais fortemente do que todos os males futuros."
        },
        {
          "id": 8,
          "start": 84.56,
          "end": 98.15,
          "text": "E, se um interrogatório especial é contrário à natureza, obrigando o acusado a acusar-se a si mesmo, não será ele constrangido a isso mais violentamente pelos tormentos e as convulsões da dor?"
        },
        {
          "id": 9,
          "start": 98.15,
          "end": 106.53,
          "text": "Os homens, porém, se ocupam muito mais, em sua norma de conduta, com a diferença das palavras do que com a das coisas."
        },
        {
          "id": 10,
          "start": 106.53,
          "end": 117.58,
          "text": "Observemos, finalmente, que aquele que se obstina a não responder ao interrogatório a que é submetido merece sofrer uma pena que deve ser fixada pelas leis."
        },
        {
          "id": 11,
          "start": 117.58,
          "end": 132.15,
          "text": "É mister que essa pena seja muito pesada; porque o silêncio de um criminoso, perante o juiz que o interroga, é para a sociedade um escândalo e a justiça uma ofensa que cumpre prevenir tanto quanto possível."
        },
        {
          "id": 12,
          "start": 132.15,
          "end": 143.07,
          "text": "Mas, essa pena particular já não é necessária quando o crime já foi constatado e o criminoso convencido, pois nesse caso o interrogatório se torna inútil."
        },
        {
          "id": 13,
          "start": 143.07,
          "end": 154.26,
          "text": "Semelhantemente, as confissões do acusado não são necessárias quando provas suficientes demonstraram que ele é evidentemente culpado do crime de que se trata."
        },
        {
          "id": 14,
          "start": 154.26,
          "end": 163.34,
          "text": "Este último caso é o mais ordinário; e a experiência mostra que, na maior parte dos processos criminais, os culpados negam tudo."
        }
      ],
      "imagens": []
    },
    {
      "numero": 15,
      "id": "capitulo-11",
      "titulo": "Capítulo 11: Dos juramentos",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 11 do clássico Dos Delitos e das Penas: Dos juramentos.",
      "duracaoSegundos": 124,
      "duracaoFormatada": "02:04",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-cap11-dos-juramentos.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-titulo-cap11-dos-juramentos.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-11-dos-juramentos.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 11,
          "text": "OUTRA contradição entre as leis e os sentimentos naturais é exigir de um acusado o juramento de dizer a verdade, quando ele tem o maior interesse em calá-la."
        },
        {
          "id": 2,
          "start": 11,
          "end": 17.17,
          "text": "Como se o homem pudesse jurar de boa fé que vai contribuir para sua própria destruição!"
        },
        {
          "id": 3,
          "start": 17.17,
          "end": 23.62,
          "text": "Como se, o mais das vezes, a voz do interesse não abafasse no coração humano a da religião!"
        },
        {
          "id": 4,
          "start": 23.62,
          "end": 30.41,
          "text": "A história de todos os séculos prova que esse dom sagrado do céu é a coisa de que mais se abusa."
        },
        {
          "id": 5,
          "start": 30.41,
          "end": 38.96,
          "text": "E como a respeitarão os celerados, se ela é diariamente ultrajada pelos homens considerados mais sábios e mais virtuosos?"
        },
        {
          "id": 6,
          "start": 38.96,
          "end": 48.77,
          "text": "Os motivos que a religião opõe ao temor dos tormentos e ao amor à vida são quase sempre fracos demais, porque não impressionam os sentidos."
        },
        {
          "id": 7,
          "start": 48.77,
          "end": 54.17,
          "text": "As coisas do céu estão submetidas a leis inteiramente diversas das da terra."
        },
        {
          "id": 8,
          "start": 54.17,
          "end": 57.67,
          "text": "Porque comprometer essas leis umas com as outras?"
        },
        {
          "id": 9,
          "start": 57.67,
          "end": 63.07,
          "text": "Porque colocar o homem na atroz alternativa de ofender a Deus, ou perder-se?"
        },
        {
          "id": 10,
          "start": 63.07,
          "end": 68.88,
          "text": "É não deixar ao acusado senão a escolha de ser mau cristão ou mártir do juramento."
        },
        {
          "id": 11,
          "start": 68.88,
          "end": 84.44,
          "text": "Destrói-se dessa forma toda a força dos sentimentos religiosos, único apoio da honestidade no coração da maior parte dos homens; e pouco a pouco os juramentos não são mais do que uma simples formalidade sem conseqüências."
        },
        {
          "id": 12,
          "start": 84.44,
          "end": 95.79,
          "text": "Consulte-se a experiência e se reconhecerá que os juramentos são inúteis, pois não há juiz que não convenha que jamais o juramento faz o acusado dizer a verdade."
        },
        {
          "id": 13,
          "start": 95.79,
          "end": 105.32,
          "text": "A razão faz ver que assim deve ser, porque todas as leis opostas aos sentimentos naturais do homem são vãs e conseguintemente funestas."
        },
        {
          "id": 14,
          "start": 105.32,
          "end": 123.96,
          "text": "Tais leis podem ser comparadas a um dique que se elevasse diretamente no meio das águas de um rio para interromper-lhe o curso: ou o dique é imediatamente derrubado pela torrente que o leva, ou se forma debaixo dele um abismo que o mina e o destrói insensivelmente."
        }
      ],
      "imagens": []
    },
    {
      "numero": 16,
      "id": "capitulo-12",
      "titulo": "Capítulo 12: Da questão ou tortura",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 12 do clássico Dos Delitos e das Penas: Da questão ou tortura.",
      "duracaoSegundos": 895,
      "duracaoFormatada": "14:55",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-cap12-da-questao-ou-tortura.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-titulo-cap12-da-questao-ou-tortura.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-12-da-questao-ou-tortura.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 28.13,
          "text": "É uma barbaria consagrada pelo uso na maioria dos governos aplicar a tortura a um acusado enquanto se faz o processo, quer para arrancar dele a confissão do crime, quer para esclarecer as contradições em que caiu, quer para descobrir os cúmplices ou outros crimes de que não é acusado, mas do qual poderia ser culpado, quer enfim porque sofistas incompreensíveis pretenderam que a tortura purgava a infâmia."
        },
        {
          "id": 2,
          "start": 28.13,
          "end": 42.71,
          "text": "Um homem não pode ser considerado culpado antes da sentença do juiz; e a sociedade só lhe pode retirar a proteção pública depois que ele se convenceu de ter violado as condições com as quais estivera de acordo."
        },
        {
          "id": 3,
          "start": 42.71,
          "end": 52.25,
          "text": "O direito da força só pode, pois, autorizar um juiz a infligir uma pena a um cidadão quando ainda se duvida se ele é inocente ou culpado."
        },
        {
          "id": 4,
          "start": 52.25,
          "end": 56.88,
          "text": "Eis uma proposição bem simples: ou o delito é certo, ou é incerto."
        },
        {
          "id": 5,
          "start": 56.88,
          "end": 66.49,
          "text": "Se é certo, só deve ser punido com a pena fixada pela lei, e a tortura é inútil, pois já não se tem necessidade das confissões do acusado."
        },
        {
          "id": 6,
          "start": 66.49,
          "end": 70.77,
          "text": "Se o delito é incerto, não é hediondo atormentar um inocente?"
        },
        {
          "id": 7,
          "start": 70.77,
          "end": 75.88,
          "text": "Com efeito, perante as leis, é inocente aquele cujo delito não se provou."
        },
        {
          "id": 8,
          "start": 75.88,
          "end": 78.23,
          "text": "Qual o fim político dos castigos?"
        },
        {
          "id": 9,
          "start": 78.23,
          "end": 82.1,
          "text": "o terror que imprimem nos corações inclinados ao crime."
        },
        {
          "id": 10,
          "start": 82.1,
          "end": 93.51,
          "text": "Mas, que se deve pensar das torturas, esses suplícios secretos que a tirania emprega na obscuridade das prisões e que se reservam tanto ao inocente como ao culpado?"
        },
        {
          "id": 11,
          "start": 93.51,
          "end": 103.11,
          "text": "Importa que nenhum delito conhecido fique impune; mas, nem sempre é útil descobrir o autor de um delito encoberto nas trevas da incerteza."
        },
        {
          "id": 12,
          "start": 103.11,
          "end": 116.04,
          "text": "Um crime já cometido, para o qual já não há remédio, só pode ser punido pela sociedade política para impedir que os outros homens cometam outros semelhantes pela esperança da impunidade."
        },
        {
          "id": 13,
          "start": 116.04,
          "end": 131.17,
          "text": "Se é verdade que a maioria dos homens respeita as leis pelo temor ou pela virtude, se é provável que um cidadão prefira segui-las a violá-las, o juiz que ordena a tortura expõe-se constantemente a atormentar inocentes."
        },
        {
          "id": 14,
          "start": 131.17,
          "end": 145.41,
          "text": "Direi ainda que é monstruoso e absurdo exigir que um homem seja acusador de si mesmo, e procurar fazer nascer a verdade pelos tormentos, como se essa verdade residisse nos músculos e nas fibras do infeliz!"
        },
        {
          "id": 15,
          "start": 145.41,
          "end": 150.39,
          "text": "A lei que autoriza a tortura é uma lei que diz: “Homens, resisti à dor."
        },
        {
          "id": 16,
          "start": 150.39,
          "end": 175.4,
          "text": "A natureza vos deu um amor invencível ao vosso ser, e o direito inalienável de vos defenderdes; mas, eu quero criar em vós um sentimento inteiramente contrário; quero inspirar-vos um ódio de vós mesmos; ordeno-vos que vos tomeis vossos próprios acusadores e digais enfim a verdade ao meio das torturas que vos quebrarão os ossos e vos dilaceração os músculos..."
        },
        {
          "id": 17,
          "start": 175.4,
          "end": 190.75,
          "text": "” Esse meio infame de descobrir a verdade é um monumento da bárbara legislação dos nossos antepassados, que honravam com o nome de julgamentos de Deus as provas de fogo, as da água fervendo e a sorte incerta dos combates."
        },
        {
          "id": 18,
          "start": 190.75,
          "end": 203.95,
          "text": "Como se os elos dessa corrente eterna, cuja origem está no seio da Divindade, pudessem desunir-se ou romper-se a cada instante, ao sabor dos caprichos e das frívolas instituições dos homens!"
        },
        {
          "id": 19,
          "start": 203.95,
          "end": 219.57,
          "text": "A única diferença existente entre a tortura e as provas de fogo é que a tortura só prova o crime quando o acusado quer confessar, ao passo que as provas queimantes deixavam uma marca exterior, considerada como prova do crime."
        },
        {
          "id": 20,
          "start": 219.57,
          "end": 223.23,
          "text": "Todavia, essa diferença é mais aparente do que real."
        },
        {
          "id": 21,
          "start": 223.23,
          "end": 233.11,
          "text": "O acusado é tão capaz de não confessar o que se exige dele quanto o era outrora de impedir, sem fraude, os efeitos do fogo e da água fervendo."
        },
        {
          "id": 22,
          "start": 233.11,
          "end": 242.86,
          "text": "Todos os atos da nossa vontade são proporcionais à força das impressões sensíveis que os causam, e a sensibilidade de todo homem é limitada."
        },
        {
          "id": 23,
          "start": 242.86,
          "end": 258.2,
          "text": "Ora, se a impressão da dor se torna muito forte para ocupar todo o poder da alma, ela não deixa a quem a sofre nenhuma outra atividade que exercer senão tomar, no momento, a via mais curta para evitar os tormentos atuais."
        },
        {
          "id": 24,
          "start": 258.2,
          "end": 266.08,
          "text": "Dessa forma, o acusado já não pode deixar de responder, pois não poderia escapar às impressões do fogo e da água."
        },
        {
          "id": 25,
          "start": 266.08,
          "end": 280.38,
          "text": "O inocente exclamará, então, que é culpado, para fazer cessar torturas que já não pode suportar; e o mesmo meio empregado para distinguir o inocente do criminoso fará desaparecer toda diferença entre ambos."
        },
        {
          "id": 26,
          "start": 280.38,
          "end": 287.5,
          "text": "A tortura é muitas vezes um meio seguro de condenar o inocente fraco e de absolver o celerado robusto."
        },
        {
          "id": 27,
          "start": 287.5,
          "end": 307.89,
          "text": "É esse, de ordinário, o resultado terrível dessa barbárie que se julga capaz de produzir a verdade, desse uso digno dos canibais, e que os romanos, mau grado a dureza dos seus costumes, reservavam exclusivamente aos escravos, vítimas infelizes de um povo cuja feroz virtude tanto se tem gabado."
        },
        {
          "id": 28,
          "start": 307.89,
          "end": 323.58,
          "text": "De dois homens, igualmente inocentes ou igualmente culpados, aquele que for mais corajoso e mais robusto será absolvido; o mais fraco, porém, será condenado em virtude deste raciocínio: “Eu, juiz, preciso encontrar um culpado."
        },
        {
          "id": 29,
          "start": 323.58,
          "end": 328.56,
          "text": "Tu, que és vigoroso, soubeste resistir à dor, e por isso eu te absolvo."
        },
        {
          "id": 30,
          "start": 328.56,
          "end": 333.67,
          "text": "Tu, que és fraco, cedeste à força dos tormentos; portanto, eu te condeno."
        },
        {
          "id": 31,
          "start": 333.67,
          "end": 345.07,
          "text": "Bem sei que uma confissão arrancada pela violência da tortura não tem valor algum; mais, se não confirmares agora o que confessaste, far- te-ei atormentar de novo”."
        },
        {
          "id": 32,
          "start": 345.07,
          "end": 374.86,
          "text": "O resultado da questão depende, pois, de temperamento e de cálculo, que varia em cada homem na proporção de sua força e sensibilidade; de maneira que, para prever o resultado da tortura, bastaria resolver o problema seguinte, mais digno de um matemático do que de um juiz: “Conhecidas a força dos músculos e a sensibilidade das fibras de um acusado, achar o grau de dor que o obrigará a confessar-se culpado de determinado crime”."
        },
        {
          "id": 33,
          "start": 374.86,
          "end": 397.11,
          "text": "Interrogam um acusado para conhecer a verdade; mas, se tão dificilmente a distinguem no ar, nos gestos e na fisionomia de um homem tranqüilo, como a descobrirão nos traços descompostos pelas convulsões da dor, quando todos os sinais, que traem às vezes a verdade na fronte dos culpados, estiverem alterados e confundidos?"
        },
        {
          "id": 34,
          "start": 397.11,
          "end": 406.17,
          "text": "Toda ação violenta faz desaparecer as pequenas diferenças dos movimentos pelos quais se distingue, às vezes, a verdade da mentira."
        },
        {
          "id": 35,
          "start": 406.17,
          "end": 415.15,
          "text": "Resulta ainda do uso das torturas uma conseqüência bastante notável: é que o inocente se acha numa posição pior que a do culpado."
        },
        {
          "id": 36,
          "start": 415.15,
          "end": 428.08,
          "text": "Com efeito, o inocente submetido à questão tem tudo contra si: ou será condenado, se confessar o crime que não cometeu, ou será absolvido, mas depois de sofrer tormentos que não mereceu."
        },
        {
          "id": 37,
          "start": 428.08,
          "end": 441.07,
          "text": "O culpado, ao contrário, tem por si um conjunto favorável: será absolvido se suportar a tortura com firmeza, e evitará os suplícios de que foi ameaçado, sofrendo uma pena muito mais leve."
        },
        {
          "id": 38,
          "start": 441.07,
          "end": 445.56,
          "text": "Assim, o inocente tem tudo que perder, o culpado só pode ganhar."
        },
        {
          "id": 39,
          "start": 445.56,
          "end": 454.34,
          "text": "Essas verdades são sentidas, afinal, embora confusamente, pelos próprios legisladores; mas, nem por isso suprimiram a tortura."
        },
        {
          "id": 40,
          "start": 454.34,
          "end": 463.05,
          "text": "Limitam-se a achar que as confissões do acusado pelos tormentos são nulas se não forem em seguida confirmadas pelo juramento."
        },
        {
          "id": 41,
          "start": 463.05,
          "end": 467.33,
          "text": "Se, porém, recusar-se a confirmá-las, será torturado de novo."
        },
        {
          "id": 42,
          "start": 467.33,
          "end": 482.81,
          "text": "Em alguns países e segundo certos jurisconsultos, essas odiosas violências não são permitidas mais do que três vezes; em outros, porém, e segundo outros doutores, o direito de torturar fica inteiramente à discrição do juiz."
        },
        {
          "id": 43,
          "start": 482.81,
          "end": 491.59,
          "text": "É inútil fundamentar essas reflexões com os inumeráveis exemplos de inocentes que se confessaram culpados no meio de torturas."
        },
        {
          "id": 44,
          "start": 491.59,
          "end": 495.46,
          "text": "Não há povo, não há século que não possa citar os seus."
        },
        {
          "id": 45,
          "start": 495.46,
          "end": 502.09,
          "text": "Os homens são sempre os mesmos: vêem as coisas presentes sem preocupar-se com as conseqüências."
        },
        {
          "id": 46,
          "start": 502.09,
          "end": 515.92,
          "text": "Não há homem que, elevando suas idéias além das primeiras necessidades da vida, não tenha ouvido a voz interior da natureza chamá-lo a si e não tenha sido tentado a se lançar de novo nos braços dela."
        },
        {
          "id": 47,
          "start": 515.92,
          "end": 521.03,
          "text": "Mas, o uso, esse tirano das almas vulgares, o comprime e o retém no erro."
        },
        {
          "id": 48,
          "start": 521.03,
          "end": 533.61,
          "text": "O segundo motivo, pelo qual se submete à questão um homem que se supõe culpado, é a esperança de esclarecer as contradições em que ele caiu nos interrogatórios que o fizeram sofrer."
        },
        {
          "id": 49,
          "start": 533.61,
          "end": 556.9,
          "text": "Mas, o medo do suplício, a incerteza do julgamento que vai ser pronunciado, a solenidade dos processos, a majestade do juiz, a própria ignorância, igualmente comum à maior parte dos acusados inocentes ou culpados, são outras tantas razões para fazer cair em contradição, não só a inocência que treme como o crime que procura ocultar-se."
        },
        {
          "id": 50,
          "start": 556.9,
          "end": 573.28,
          "text": "Poder-se-ia crer que as contradições, tão ordinárias no homem, ainda mesmo quando este tem o espírito tranqüilo, não se multiplicarão nesses momentos de perturbação, nos quais a idéia de escapar a um perigo iminente absorve toda a alma?"
        },
        {
          "id": 51,
          "start": 573.28,
          "end": 589.93,
          "text": "Em terceiro lugar, submeter um acusado à tortura, para descobrir se ele é culpado de outros crimes além daquele de que é acusado, é fazer este odioso raciocínio: “Tu és culpado de um delito; é, pois, possível que tenhas cometido cem outros."
        },
        {
          "id": 52,
          "start": 589.93,
          "end": 595.81,
          "text": "Essa suspeita me preocupa; quero certificar-me; vou empregar minha prova de verdade."
        },
        {
          "id": 53,
          "start": 595.81,
          "end": 605.21,
          "text": "As leis te farão sofrer pelos crimes que cometeste, pelos que poderias cometer e por aqueles dos quais eu quero considerar-te culpado”."
        },
        {
          "id": 54,
          "start": 605.21,
          "end": 610.6,
          "text": "Aplica-se igualmente a questão a um acusado para descobrir os seus cúmplices."
        },
        {
          "id": 55,
          "start": 610.6,
          "end": 624.07,
          "text": "Mas, se está provado que a tortura não é nada menos do que um meio certo de descobrir a verdade, como fará ela conhecer os cúmplices, quando esse conhecimento é uma das verdades que se procuram?"
        },
        {
          "id": 56,
          "start": 624.07,
          "end": 629.4,
          "text": "É certo que aquele que se acusa a si mesmo mais facilmente acusará a outrem."
        },
        {
          "id": 57,
          "start": 629.4,
          "end": 634.37,
          "text": "Além disso, será justo atormentar um homem pelos crimes de outro homem?"
        },
        {
          "id": 58,
          "start": 634.37,
          "end": 647.92,
          "text": "Não podem descobrir-se os cúmplices pelos interrogatórios do acusado e das testemunhas, pelo exame das provas e do corpo de delito, em suma, por todos os meios empregados para constatar o delito?"
        },
        {
          "id": 59,
          "start": 647.92,
          "end": 652.41,
          "text": "Os cúmplices fogem quase sempre, logo que o companheiro é preso."
        },
        {
          "id": 60,
          "start": 652.41,
          "end": 670.86,
          "text": "Só a incerteza da sorte que os espera condena-os ao exílio e livra a sociedade dos novos atentados que poderia recear deles; ao passo que o suplício do culpado que ela tem nas mãos amedronta os outros homens e os desvia do crime, sendo esse o único fim dos castigos."
        },
        {
          "id": 61,
          "start": 670.86,
          "end": 677.5,
          "text": "A pretensa necessidade de purgar a infâmia é ainda um dos absurdos motivos do uso das torturas."
        },
        {
          "id": 62,
          "start": 677.5,
          "end": 684.82,
          "text": "Um homem declarado infame pelas leis se torna puro porque confessa o crime enquanto lhe quebram os ossos?"
        },
        {
          "id": 63,
          "start": 684.82,
          "end": 690.49,
          "text": "Poderá a dor, que é uma sensação, destruir a infâmia, que é uma combinação moral?"
        },
        {
          "id": 64,
          "start": 690.49,
          "end": 697.12,
          "text": "Será a tortura um cadinho e a infâmia um corpo misto que deponha nele tudo o que tem de impuro?"
        },
        {
          "id": 65,
          "start": 697.12,
          "end": 702.45,
          "text": "Em verdade, abusos tão ridículos não deveriam ser tolerados no século XVIII."
        },
        {
          "id": 66,
          "start": 702.45,
          "end": 707.28,
          "text": "A infâmia não é um sentimento sujeito às leis ou regulado pela razão."
        },
        {
          "id": 67,
          "start": 707.28,
          "end": 709.29,
          "text": "É obra exclusiva da opinião."
        },
        {
          "id": 68,
          "start": 709.29,
          "end": 718.07,
          "text": "Ora, como a tortura torna infame aquele que a sofre, é absurdo que se queira lavar desse modo a infâmia com a própria infâmia."
        },
        {
          "id": 69,
          "start": 718.07,
          "end": 730.71,
          "text": "Não é difícil remontar a origem dessa lei estranha, porque os absurdos adotados por uma nação inteira se apoiam sempre em outras idéias estabelecidas e respeitadas nessa mesma nação."
        },
        {
          "id": 70,
          "start": 730.71,
          "end": 743.36,
          "text": "O uso de purgar a infâmia pela tortura parece ter sua fonte nas práticas da religião, que tanta influência exerce sobre o espírito dos homens de todos os países e de todos os tempos."
        },
        {
          "id": 71,
          "start": 743.36,
          "end": 755.52,
          "text": "A fé nos ensina que as nódoas contraídas pela fraqueza humana, quando não mereceram a cólera eterna do Ser supremo, são purificadas em outro mundo por um fogo incompreensível."
        },
        {
          "id": 72,
          "start": 755.52,
          "end": 767.89,
          "text": "Ora, a infâmia é uma nódoa civil; e, uma vez que a dor e o fogo do purgatório apagam as manchas espirituais, porque os tormentos da questão não tirariam a nódoa civil da infâmia?"
        },
        {
          "id": 73,
          "start": 767.89,
          "end": 779.44,
          "text": "Creio que se pode dar uma origem mais ou menos semelhante ao uso que observam certos tribunais de exigir as confissões do culpado como essenciais para sua condenação."
        },
        {
          "id": 74,
          "start": 779.44,
          "end": 788.28,
          "text": "Tal uso parece tirado do misterioso tribunal da penitência, no qual a confissão dos pecados é parte necessária dos sacramentos."
        },
        {
          "id": 75,
          "start": 788.28,
          "end": 805.84,
          "text": "É dessa forma que os homens abusam das luzes da revelação; e, como essas luzes são as únicas que iluminam os séculos da ignorância, a elas é que a dócil humanidade recorreu em todas as ocasiões, mas para fazer as aplicações mais falsas e mais infelizes."
        },
        {
          "id": 76,
          "start": 805.84,
          "end": 821.32,
          "text": "A solidez dos princípios que expusemos neste capítulo era conhecida dos legisladores romanos, que só submetiam à tortura os escravos, espécie de homens sem direito algum e sem nenhuma parte nas vantagens da sociedade civil."
        },
        {
          "id": 77,
          "start": 821.32,
          "end": 839.77,
          "text": "Esses princípios foram adotados na Inglaterra, nação que prova a excelência de suas leis pelos seus progressos nas ciências, pela superioridade do seu comércio, pela extensão de suas riquezas, por seu poder e por freqüentes exemplos de coragem e de virtude política."
        },
        {
          "id": 78,
          "start": 839.77,
          "end": 845.51,
          "text": "A Suécia, igualmente convencida da injustiça da tortura, já não permite o seu uso."
        },
        {
          "id": 79,
          "start": 845.51,
          "end": 867.41,
          "text": "Esse infame costume foi abolido por um dos mais sábios monarcas da Europa (12), que elevou a filosofia ao trono e que, legislador benévolo, amigo dos súditos, os tornou iguais e livres sob a dependência das leis; única liberdade que homens razoáveis podem esperar da sociedade; única igualdade que esta pode admitir."
        },
        {
          "id": 80,
          "start": 867.41,
          "end": 879.51,
          "text": "Enfim, as leis militares não admitiram a tortura; e, se esta pudesse existir em alguma parte, seria sem dúvida nos exércitos, compostos em grande parte da escória das nações."
        },
        {
          "id": 81,
          "start": 879.51,
          "end": 883.86,
          "text": "Coisa espantosa para quem não refletiu sobre a tirania do uso!"
        },
        {
          "id": 82,
          "start": 883.86,
          "end": 895.13,
          "text": "São homens endurecidos nos morticínios e familiarizados com o sangue que dão aos legisladores de um povo em paz o exemplo de julgar os homens com mais humanidade!"
        }
      ],
      "imagens": []
    },
    {
      "numero": 17,
      "id": "capitulo-13",
      "titulo": "Capítulo 13: Da duração do processo e da prescrição",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 13 do clássico Dos Delitos e das Penas: Da duração do processo e da prescrição.",
      "duracaoSegundos": 499,
      "duracaoFormatada": "08:19",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-13-duracao-do-processo-e-da-prescricao.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-13.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-13-duracao-do-processo-e-da-prescricao.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 21.92,
          "text": "QUANDO o delito é constatado e as provas são certas, é justo conceder ao acusado o tempo e os meios de justificar-se, se lhe for possível; é preciso, porém, que esse tempo seja bastante curto para não retardar demais o castigo que deve seguir de perto o crime, se se quiser que o mesmo seja um freio útil contra os celerados."
        },
        {
          "id": 2,
          "start": 21.92,
          "end": 37.23,
          "text": "Um mal entendido amor da humanidade poderá condenar logo essa presteza, a qual, porém, será aprovada pelos que tiverem refletido sobre os perigos múltiplos que as extremas procrastinações da legislação fazem correr à inocência."
        },
        {
          "id": 3,
          "start": 37.23,
          "end": 48.49,
          "text": "Cabe exclusivamente às leis fixar o espaço de tempo que se deve empregar para a investigação das provas do delito, e o que se deve conceder ao acusado para sua defesa."
        },
        {
          "id": 4,
          "start": 48.49,
          "end": 53.55,
          "text": "Se o juiz tivesse esse direito, estaria exercendo as funções do legislador."
        },
        {
          "id": 5,
          "start": 53.55,
          "end": 67.98,
          "text": "Quando se trata desses crimes atrozes cuja memória subsiste por muito tempo entre os homens, se os mesmos forem provados, não deve haver nenhuma prescrição em favor do criminoso que se subtrai ao castigo pela fuga."
        },
        {
          "id": 6,
          "start": 67.98,
          "end": 81.67,
          "text": "Não é esse, todavia, o caso dos delitos ignorados e pouco consideráveis: é mister fixar um tempo após o qual o acusado, bastante punido pelo exílio voluntário, possa reaparecer sem recear novos castigos."
        },
        {
          "id": 7,
          "start": 81.67,
          "end": 94.75,
          "text": "Com efeito, a obscuridade que envolveu por muito tempo o delito diminui muito a necessidade do exemplo, e permite devolver ao cidadão sua condição e seus direitos com o poder de torná-lo melhor."
        },
        {
          "id": 8,
          "start": 94.75,
          "end": 97.45,
          "text": "Só posso indicar aqui princípios gerais."
        },
        {
          "id": 9,
          "start": 97.45,
          "end": 105.07,
          "text": "Para fazer sua aplicação precisa, é mister considerar a legislação existente, os usos do país, as circunstâncias."
        },
        {
          "id": 10,
          "start": 105.07,
          "end": 133.66,
          "text": "Limito-me a acrescentar que, para um povo que reconhecesse as vantagens das penas moderadas, se as leis abreviassem ou prolongassem a duração dos processos e o tempo da prescrição segundo a gravidade do delito, se a prisão provisória e o exílio voluntário fossem contados como uma parte da pena merecida pelo culpado, chegar-se-ia a estabelecer assim uma justa progressão de castigos suaves para um grande número de delitos."
        },
        {
          "id": 11,
          "start": 133.66,
          "end": 149.91,
          "text": "Mas, o tempo que se emprega na investigação das provas e o que fixa a prescrição não devem ser prolongados em razão da gravidade do crime que se persegue, porque, enquanto um crime não está provado, quanto mais atroz, menos verossímil é ele."
        },
        {
          "id": 12,
          "start": 149.91,
          "end": 156.93,
          "text": "Será preciso, pois, às vezes, reduzir o tempo dos processos e aumentar o que se exige para a prescrição."
        },
        {
          "id": 13,
          "start": 156.93,
          "end": 174.39,
          "text": "Esse princípio parece, à primeira vista, contraditório em relação ao que estabeleci mais acima, e segundo o qual podem aplicar-se penas iguais para crimes diferentes, considerando como partes do castigo o exílio voluntário ou a prisão que precedeu a sentença."
        },
        {
          "id": 14,
          "start": 174.39,
          "end": 177.09,
          "text": "Procurarei explicar-me com mais clareza."
        },
        {
          "id": 15,
          "start": 177.09,
          "end": 180.13,
          "text": "Podem distinguir-se duas espécies de delitos."
        },
        {
          "id": 16,
          "start": 180.13,
          "end": 188.69,
          "text": "A primeira é a dos crimes atrozes, que começa pelo homicídio e que compreende toda a progressão dos mais horríveis assassínios."
        },
        {
          "id": 17,
          "start": 188.69,
          "end": 193.88,
          "text": "Incluiremos na segunda espécie os delitos menos hediondos do que o homicídio."
        },
        {
          "id": 18,
          "start": 193.88,
          "end": 196.31,
          "text": "Essa distinção é tirada da natureza."
        },
        {
          "id": 19,
          "start": 196.31,
          "end": 202.58,
          "text": "A segurança das pessoas é um direito natural; a segurança dos bens é um direito da sociedade."
        },
        {
          "id": 20,
          "start": 202.58,
          "end": 211.21,
          "text": "Há bem poucos motivos capazes de levar o homem a abafar no coração o sentimento natural da compaixão que o desvia do assassínio."
        },
        {
          "id": 21,
          "start": 211.21,
          "end": 226.66,
          "text": "Mas, como cada um é ávido de buscar o seu bem-estar, como o direito de propriedade não está gravado nos corações, sendo simples obra das convenções sociais, há uma porção de motivos que induzem os homens a violar tais convenções."
        },
        {
          "id": 22,
          "start": 226.66,
          "end": 235.42,
          "text": "Se se quiser estabelecer regras de probabilidade para essas duas espécies de delitos, é preciso colocá-las sobre bases diferentes."
        },
        {
          "id": 23,
          "start": 235.42,
          "end": 247.29,
          "text": "Nos grandes crimes, pela razão mesma de que são mais raros, deve diminuir-se a duração da instrução e do processo, porque a inocência do acusado é mais provável do que o crime."
        },
        {
          "id": 24,
          "start": 247.29,
          "end": 250.53,
          "text": "Deve-se, porém, prolongar o tempo da prescrição."
        },
        {
          "id": 25,
          "start": 250.53,
          "end": 260.38,
          "text": "Por esse meio, que acelera a sentença definitiva, tira-se aos maus a esperança de uma impunidade tanto mais perigosa quanto maiores são os crimes."
        },
        {
          "id": 26,
          "start": 260.38,
          "end": 276.16,
          "text": "Ao contrário, nos delitos menos consideráveis e mais comuns, é preciso prolongar o tempo dos processos, porque a inocência do acusado é menos provável, e diminuir o tempo fixado para a prescrição, porque a impunidade é menos perigosa."
        },
        {
          "id": 27,
          "start": 276.16,
          "end": 293.69,
          "text": "É mister, igualmente, notar que, se não se atender a isso, essa diferença de processo entre as duas espécies de delitos pode dar ao criminoso a esperança da impunidade, esperança tanto mais fundada quanto o crime for mais hediondo e, portanto, mais verossímil."
        },
        {
          "id": 28,
          "start": 293.69,
          "end": 313.18,
          "text": "Observemos, porém, que um acusado solto por falta de provas não é nem absolvido nem condenado; que pode ser preso de novo pelo mesmo crime e submetido a novo exame, se se descobrirem novos indícios do seu delito antes de terminar o tempo fixado para a prescrição, segundo o crime cometido."
        },
        {
          "id": 29,
          "start": 313.18,
          "end": 325.18,
          "text": "Tal é, pelo menos ao meu ver, o critério que se poderia seguir para preservar ao mesmo tempo a segurança dos cidadãos e a sua liberdade, sem favorecer uma em detrimento da outra."
        },
        {
          "id": 30,
          "start": 325.18,
          "end": 341.17,
          "text": "Esses dois bens são igualmente patrimônio inalienável de todos os cidadãos; e ambos estão cercados de perigos quando a segurança individual é abandonada ao capricho de um déspota e quando a liberdade é protegida pela desordem tumultuosa."
        },
        {
          "id": 31,
          "start": 341.17,
          "end": 347.37,
          "text": "Cometem-se na sociedade certos crimes que são ao mesmo tempo comuns e difíceis de constatar."
        },
        {
          "id": 32,
          "start": 347.37,
          "end": 353.71,
          "text": "Desde então, pois é quase impossível provar tais crimes, a inocência é provável perante a lei."
        },
        {
          "id": 33,
          "start": 353.71,
          "end": 364.57,
          "text": "E, como a esperança da impunidade contribui pouco para multiplicar essas espécies de delitos, que têm todos causas diferentes, a impunidade raramente é perigosa."
        },
        {
          "id": 34,
          "start": 364.57,
          "end": 370.5,
          "text": "Nesse caso, podem, pois, diminuir-se igualmente o tempo dos processos e o da prescrição."
        },
        {
          "id": 35,
          "start": 370.5,
          "end": 390.87,
          "text": "Mas, segundo os princípios aceitos, é principalmente para os crimes difíceis de provar, como o adultério, a pederastia, que se admitem arbitrariamente as presunções, as conjecturas, as semiprovas, como se um homem pudesse ser semi-inocente ou semi-culpado, e merecer ser semi-absolvido ou semi- punido!"
        },
        {
          "id": 36,
          "start": 390.87,
          "end": 414.81,
          "text": "É sobretudo nesse gênero de delitos que se exercem as crueldades da tortura sobre o acusado, sobre as testemunhas, sobre a família inteira do infeliz de quem se suspeita, segundo as odiosas lições de alguns criminalistas, que escreveram, com fria barbárie, compilações de iniqüidades que ousam apresentar como regras aos magistrados e como leis às nações."
        },
        {
          "id": 37,
          "start": 414.81,
          "end": 425.53,
          "text": "Quando se reflete sobre todas essas coisas, é-se forçado a reconhecer com amargura que a razão quase nunca tem sido consultada nas leis que se deram aos povos."
        },
        {
          "id": 38,
          "start": 425.53,
          "end": 440.5,
          "text": "Os crimes mais hediondos, os delitos mais obscuros e mais quiméricos, e portanto os mais inverossímeis, são precisamente os que se consideram constatados sobre simples conjecturas e indícios menos sólidos e mais equívocos."
        },
        {
          "id": 39,
          "start": 440.5,
          "end": 457.7,
          "text": "Dizer-se-ia que as leis e o magistrado só têm interesse em descobrir um crime, e não em procurar a verdade; e que o legislador não vê que se expõe constantemente ao risco de condenar um inocente, pronunciando-se sobre crimes inverossímeis ou mal provados."
        },
        {
          "id": 40,
          "start": 457.7,
          "end": 478.07,
          "text": "À maioria dos homens falta essa energia que produz igualmente as grandes ações e os grandes crimes, e que traz quase sempre juntas as virtudes magnânimas e os crimes monstruosos, nos Estados que só se mantêm pela atividade do governo, pelo orgulho nacional e pelo concurso das paixões pelo bem público."
        },
        {
          "id": 41,
          "start": 478.07,
          "end": 491.28,
          "text": "Quanto às nações cujo poderio é consolidado e constantemente sustentado por boas leis, as paixões enfraquecidas parecem mais capazes de manter a forma de governo estabelecida do que de melhorá-la."
        },
        {
          "id": 42,
          "start": 491.28,
          "end": 498.77,
          "text": "Daí resulta uma conseqüência importante: que os grandes crimes nem sempre são a prova da decadência de um povo."
        }
      ],
      "imagens": []
    },
    {
      "numero": 18,
      "id": "capitulo-14",
      "titulo": "Capítulo 14: Dos crimes começados, dos cúmplices, da impunidade",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 14 do clássico Dos Delitos e das Penas: Dos crimes começados, dos cúmplices, da impunidade.",
      "duracaoSegundos": 288,
      "duracaoFormatada": "04:48",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-14-crimes-comecados-cumplices-impunidade.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-14.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-14-crimes-comecados-cumplices-impunidade.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 17.96,
          "text": "IMPUNIDADE SE BEM que as leis não possam punir a intenção, não é menos verdadeira que uma ação que seja o começo de um delito e que prova a vontade de cometê-lo, merece um castigo, mas menos grande do que o que seria aplicado se o crime tivesse sido cometido."
        },
        {
          "id": 2,
          "start": 17.96,
          "end": 24.68,
          "text": "Esse castigo é necessário, porque é importante prevenir mesmo as primeiras tentativas dos crimes."
        },
        {
          "id": 3,
          "start": 24.68,
          "end": 40.07,
          "text": "Mas, como pode haver um intervalo entre a tentativa de um delito e a sua execução, é justo reservar uma pena maior ao crime consumado, para deixar àquele que apenas começou o crime alguns motivos que o impeçam de acabá-lo."
        },
        {
          "id": 4,
          "start": 40.07,
          "end": 48.12,
          "text": "Deve seguir-se a mesma gradação nas penas, em relação aos cúmplices, se estes não foram todos executantes imediatos."
        },
        {
          "id": 5,
          "start": 48.12,
          "end": 57.41,
          "text": "Quando vários homens se unem para enfrentar um perigo comum, quanto maior é o perigo, tanto mais procurarão torná-lo igual para todos."
        },
        {
          "id": 6,
          "start": 57.41,
          "end": 75.02,
          "text": "Se as leis punissem mais severamente os executantes do crime do que os simples cúmplices, seria mais difícil aos que meditam um atentado encontrar entre eles um homem que quisesse executá-lo, porque o risco seria maior, em virtude da diferença das penas."
        },
        {
          "id": 7,
          "start": 75.02,
          "end": 92.7,
          "text": "Há, contudo, um caso em que a gente deve afastar-se da regra que formulamos, e é quando o executante do crime recebeu dos cúmplices uma recompensa particular; como a diferença do risco foi compensada pela diferença das vantagens, o castigo deve ser igual."
        },
        {
          "id": 8,
          "start": 92.7,
          "end": 105.32,
          "text": "Se tais reflexões parecerem um tanto rebuscadas, reflita-se que é importantíssimo que as leis deixem aos cúmplices da má ação o mínimo de meios possível para que se ponham de acordo."
        },
        {
          "id": 9,
          "start": 105.32,
          "end": 112.32,
          "text": "Alguns tribunais oferecem a impunidade ao cúmplice de um grande crime que trair os seus companheiros."
        },
        {
          "id": 10,
          "start": 112.32,
          "end": 123.83,
          "text": "Esse expediente apresenta certas vantagens; mas, não está isento de perigos, de vez que a sociedade autoriza desse modo a traição, que repugna aos próprios celerados."
        },
        {
          "id": 11,
          "start": 123.83,
          "end": 144.07,
          "text": "Ela introduz os crimes de covardia, bem mais funestos do que os crimes de energia e de coragem, porque a coragem é pouco comum e espera apenas uma força benfazeja que a dirija para o bem público, ao passo que a covardia, muito mais geral, é um contágio que infecta rapidamente todas as almas."
        },
        {
          "id": 12,
          "start": 144.07,
          "end": 159.19,
          "text": "O tribunal que emprega a impunidade para conhecer um crime mostra que se pode encobrir esse crime, pois que ele não o conhece; e as leis descobrem-lhe a fraqueza, implorando o socorro do próprio celerado que as violou."
        },
        {
          "id": 13,
          "start": 159.19,
          "end": 172.08,
          "text": "Por outro lado, a esperança da impunidade, para o cúmplice que trai, pode prevenir grandes crimes e reanimar o povo, sempre apavorado quando vê crimes cometidos sem conhecer os culpados."
        },
        {
          "id": 14,
          "start": 172.08,
          "end": 181.86,
          "text": "Esse uso mostra ainda aos cidadãos que aquele que infringe as leis, isto é, as convenções públicas, já não é fiel às convenções particulares."
        },
        {
          "id": 15,
          "start": 181.86,
          "end": 208.48,
          "text": "Parece-me que uma lei geral, que prometesse a impunidade a todo cúmplice que revela um crime, seria preferível a uma declaração especial num caso particular: preveniria a união dos maus, pelo temor recíproco que inspiraria a cada um de se expor sozinho aos perigos; e os tribunais já não veriam os celerados encorajados pela idéia de que há casos em que se pode ter necessidade deles."
        },
        {
          "id": 16,
          "start": 208.48,
          "end": 216.67,
          "text": "De resto, seria preciso acrescentar aos dispositivos dessa lei que a impunidade traria consigo o banimento do delator."
        },
        {
          "id": 17,
          "start": 216.67,
          "end": 231.36,
          "text": "É, porém, em vão que procuro abafar os remorsos que me afligem, quando autorizo as santas leis, fiadoras sagradas da confiança pública, base respeitável dos costumes, a proteger a perfídia, a legitimar a traição."
        },
        {
          "id": 18,
          "start": 231.36,
          "end": 246.76,
          "text": "E que opróbrio para uma nação, se os seus magistrados, tornados infiéis, faltassem à promessa que fizeram e se apoiassem vergonhosamente em vãs sutilezas, para levar ao suplício aquele que respondeu ao convite das leis!..."
        },
        {
          "id": 19,
          "start": 246.76,
          "end": 260.27,
          "text": "Esses monstruosos exemplos não são raros; eis porque tanta gente só vê na sociedade política uma máquina complicada, na qual os mais hábeis ou os mais poderosos governam as molas ao seu capricho."
        },
        {
          "id": 20,
          "start": 260.27,
          "end": 286.69,
          "text": "Eis também o que multiplica esses homens frios, insensíveis a tudo o que encanta as almas ternas, que só experimentam sensações calculadas e que, todavia, sabem excitar nos outros os sentimentos mais caros e as paixões mais fortes, quando estas são úteis aos seus projetos; semelhantes ao músico hábil que, sem nada sentir ele próprio, tira do instrumento que domina sons tocantes."
        },
        {
          "id": 21,
          "start": 286.69,
          "end": 287.59,
          "text": "ou terríveis."
        }
      ],
      "imagens": []
    },
    {
      "numero": 19,
      "id": "capitulo-15",
      "titulo": "Capítulo 15: Da moderação das penas",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 15 do clássico Dos Delitos e das Penas: Da moderação das penas.",
      "duracaoSegundos": 364,
      "duracaoFormatada": "06:04",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-15-moderacao-das-penas.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-15.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-15-moderacao-das-penas.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 11.42,
          "text": "AS VERDADES até aqui expostas demonstram à evidência que o fim das penas não pode ser atormentar um ser sensível, nem fazer que um crime não cometido seja cometido."
        },
        {
          "id": 2,
          "start": 11.42,
          "end": 27.63,
          "text": "Como pode um corpo político, que, longe de se entregar às paixões, deve ocupar-se exclusivamente com pôr um freio nos particulares, exercer crueldades inúteis e empregar o instrumento do furor, do fanatismo e da covardia dos tiranos?"
        },
        {
          "id": 3,
          "start": 27.63,
          "end": 35.64,
          "text": "Poderão os gritos de um infeliz nos tormentos retirar do seio do passado, que não volta mais, uma ação já cometida?"
        },
        {
          "id": 4,
          "start": 35.64,
          "end": 35.92,
          "text": "Não."
        },
        {
          "id": 5,
          "start": 35.92,
          "end": 45.04,
          "text": "Os castigos têm por fim único impedir o culpado de ser nocivo futuramente à sociedade e desviar seus concidadãos da senda do crime."
        },
        {
          "id": 6,
          "start": 45.04,
          "end": 61.46,
          "text": "Entre as penas, e na maneira de aplicá-las proporcionalmente aos delitos, é mister, pois, escolher os meios que devem causar no espírito público a impressão mais eficaz e mais durável, e, ao mesmo tempo, menos cruel no corpo do culpado."
        },
        {
          "id": 7,
          "start": 61.46,
          "end": 72.67,
          "text": "Quem não estremece de horror ao ver na história tantos tormentos atrozes e inúteis, inventados e empregados friamente por monstros que se davam o nome de sábios?"
        },
        {
          "id": 8,
          "start": 72.67,
          "end": 95.71,
          "text": "Quem poderia deixar de tremer até ao fundo da alma, ao ver os milhares de infelizes que o desespero força a retomar a vida selvagem, para escapar a males insuportáveis causados ou tolerados por essas leis injustas que sempre acorrentaram e ultrajaram a multidão, para favorecer unicamente um pequeno número de homens privilegiados?"
        },
        {
          "id": 9,
          "start": 95.71,
          "end": 107.47,
          "text": "Mas, a superstição e a tirania os perseguem; acusam-nos de crimes impossíveis ou imaginários; ou então são culpados, mas somente de terem sido fiéis às leis da natureza."
        },
        {
          "id": 10,
          "start": 107.47,
          "end": 108.31,
          "text": "Não importa!"
        },
        {
          "id": 11,
          "start": 108.31,
          "end": 127.24,
          "text": "Homens dotados dos mesmos sentidos e sujeitos às mesmas paixões se comprazem em julgá-los criminosos, têm prazer em seus tormentos, dilaceram-nos com solenidade, aplicam-lhes torturas e os entregam ao espetáculo de uma multidão fanática que goza lentamente com suas dores."
        },
        {
          "id": 12,
          "start": 127.24,
          "end": 133.51,
          "text": "Quanto mais atrozes forem os castigos, tanto mais audacioso será o culpado para evitá-los."
        },
        {
          "id": 13,
          "start": 133.51,
          "end": 138.24,
          "text": "Acumulará os crimes, para subtrair-se à pena merecida pelo primeiro."
        },
        {
          "id": 14,
          "start": 138.24,
          "end": 148.05,
          "text": "Os países e os séculos em que os suplícios mais atrozes foram postos em prática, são também aqueles em que se viram os crimes mais horríveis."
        },
        {
          "id": 15,
          "start": 148.05,
          "end": 156.69,
          "text": "O mesmo espírito de ferocidade que ditava leis de sangue ao legislador, punha o punhal nas mãos do assassino e do parricida."
        },
        {
          "id": 16,
          "start": 156.69,
          "end": 165.04,
          "text": "Do alto do trono, o soberano dominava com uma verga de ferro; e os escravos só imolavam os tiranos para possuírem novos."
        },
        {
          "id": 17,
          "start": 165.04,
          "end": 177.92,
          "text": "À medida que os suplícios se tornam mais cruéis, a alma, semelhante aos fluidos que se põem sempre ao nível dos objetos que os cercam, endurece- se pelo espetáculo renovado da barbárie."
        },
        {
          "id": 18,
          "start": 177.92,
          "end": 191.63,
          "text": "A gente se habitua aos suplícios horríveis; e, depois de cem anos de crueldades multiplicadas, as paixões, sempre ativas, são menos refreadas pela roda e pela força do que antes o eram pela prisão."
        },
        {
          "id": 19,
          "start": 191.63,
          "end": 201.09,
          "text": "Para que o castigo produza o efeito que dele se deve esperar, basta que o mal que causa ultrapasse o bem que o culpado retirou do crime."
        },
        {
          "id": 20,
          "start": 201.09,
          "end": 210.21,
          "text": "Devem contar-se ainda como parte do castigo os terrores que precedem a execução e a perda das vantagens que o crime devia produzir."
        },
        {
          "id": 21,
          "start": 210.21,
          "end": 216.48,
          "text": "Toda severidade que ultrapasse os limites se torna supérflua e, por conseguinte, tirânica."
        },
        {
          "id": 22,
          "start": 216.48,
          "end": 224.76,
          "text": "Os males que os homens conhecem por funesta experiência regularão melhor a sua conduta do que aqueles que eles ignoram."
        },
        {
          "id": 23,
          "start": 224.76,
          "end": 230.33,
          "text": "Suponde duas nações entre aquelas em que as penas são proporcionais aos delitos."
        },
        {
          "id": 24,
          "start": 230.33,
          "end": 240.63,
          "text": "Sendo a escravidão perpétua o maior castigo em uma, e o suplício o maior em outra, é certo que essas duas penas inspirarão em cada uma igual terror."
        },
        {
          "id": 25,
          "start": 240.63,
          "end": 263.88,
          "text": "E, se houvesse uma razão para transportar para o primeiro povo os castigos mais rigorosos estabelecidos no segundo, a mesma razão conduziria a aumentar para este a crueldade dos suplícios, passando insensivelmente do uso da roda para tormentos mais lentos e mais requintados, em suma, para o último refinamento da ciência dos tiranos."
        },
        {
          "id": 26,
          "start": 263.88,
          "end": 272.65,
          "text": "A crueldade das penas produz ainda dois resultados funestos, contrários ao fim do seu estabelecimento, que é prevenir o crime."
        },
        {
          "id": 27,
          "start": 272.65,
          "end": 282.6,
          "text": "Em primeiro lugar, é muito difícil estabelecer uma justa proporção entre os delitos e as penas; porque, embora uma crueldade industriosa tenha."
        },
        {
          "id": 28,
          "start": 282.6,
          "end": 294.09,
          "text": "multiplicado as espécies de tormentos, nenhum suplício pode ultrapassar o último grau da força humana, limitada pela sensibilidade e a organização do corpo do homem."
        },
        {
          "id": 29,
          "start": 294.09,
          "end": 300.91,
          "text": "Além desses limites, se surgirem crimes mais hediondos, onde se encontrarão penas bastante cruéis?"
        },
        {
          "id": 30,
          "start": 300.91,
          "end": 306.76,
          "text": "Em segundo lugar, os suplícios mais horríveis podem acarretar às vezes a impunidade."
        },
        {
          "id": 31,
          "start": 306.76,
          "end": 311.14,
          "text": "A energia da natureza humana é circunscrita no mal como no bem."
        },
        {
          "id": 32,
          "start": 311.14,
          "end": 321.93,
          "text": "Espetáculos demasiado bárbaros só podem ser o resultado dos furores passageiros de um tirano, e não ser sustentados por um sistema constante de legislação."
        },
        {
          "id": 33,
          "start": 321.93,
          "end": 329.17,
          "text": "Se as leis são cruéis, ou logo serão modificadas, ou não mais poderão vigorar e deixarão o crime impune."
        },
        {
          "id": 34,
          "start": 329.17,
          "end": 335.58,
          "text": "Termino por esta reflexão: que o rigor das penas deve ser relativo ao estado atual da nação."
        },
        {
          "id": 35,
          "start": 335.58,
          "end": 344.14,
          "text": "São necessárias impressões fortes e sensíveis para impressionar o espírito grosseiro de um povo que sai do estado selvagem."
        },
        {
          "id": 36,
          "start": 344.14,
          "end": 349.5,
          "text": "Para abater o leão furioso, é necessário o raio, cujo ruído só faz irritá-lo."
        },
        {
          "id": 37,
          "start": 349.5,
          "end": 363.7,
          "text": "Mas, à medida que as almas se abrandam no estado de sociedade, o homem se torna mais sensível; e, se se quiser conservar as mesmas relações entre o objeto e a sensação, as penas devem ser menos rigorosas."
        }
      ],
      "imagens": []
    },
    {
      "numero": 20,
      "id": "capitulo-16",
      "titulo": "Capítulo 16: Da pena de morte",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 16 do clássico Dos Delitos e das Penas: Da pena de morte.",
      "duracaoSegundos": 1062,
      "duracaoFormatada": "17:42",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-16-pena-de-morte.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-16.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-16-pena-de-morte.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 12.52,
          "text": "ANTE o espetáculo dessa profusão de suplícios que jamais tornaram os homens melhores, eu quero examinar se a pena de morte é verdadeiramente útil e se é justa num governo sábio."
        },
        {
          "id": 2,
          "start": 12.52,
          "end": 17.4,
          "text": "Quem poderia ter dado a homens o direito de degolar seus semelhantes?"
        },
        {
          "id": 3,
          "start": 17.4,
          "end": 22.49,
          "text": "Esse direito não tem certamente a mesma origem que as leis que protegem."
        },
        {
          "id": 4,
          "start": 22.49,
          "end": 30.48,
          "text": "A soberania e as leis não são mais do que a soma das pequenas porções de liberdade que cada um cedeu à sociedade."
        },
        {
          "id": 5,
          "start": 30.48,
          "end": 35.72,
          "text": "Representam a vontade geral, resultado da união das vontades particulares."
        },
        {
          "id": 6,
          "start": 35.72,
          "end": 40.88,
          "text": "Mas, quem já pensou em dar a outros homens o direito de tirar-lhe a vida?"
        },
        {
          "id": 7,
          "start": 40.88,
          "end": 53.61,
          "text": "Será o caso de supor que, no sacrifício que faz de uma pequena parte de sua liberdade, tenha cada indivíduo querido arriscar a própria existência, o mais precioso de todos os bens?"
        },
        {
          "id": 8,
          "start": 53.61,
          "end": 59.34,
          "text": "Se assim fosse, como conciliar esse princípio com a máxima que proíbe o suicídio?"
        },
        {
          "id": 9,
          "start": 59.34,
          "end": 66.56,
          "text": "Ou o homem tem o direito de se matar, ou não pode ceder esse direito a outrem nem à sociedade inteira."
        },
        {
          "id": 10,
          "start": 66.56,
          "end": 70.44,
          "text": "A pena de morte não se apoia, assim, em nenhum direito."
        },
        {
          "id": 11,
          "start": 70.44,
          "end": 77.8,
          "text": "É uma guerra declarada a um cidadão pela nação, que julga a destruição desse cidadão necessária ou útil."
        },
        {
          "id": 12,
          "start": 77.8,
          "end": 84.45,
          "text": "Se eu provar, porém, que a morte não é útil nem necessária, terei ganho a causa da humanidade."
        },
        {
          "id": 13,
          "start": 84.45,
          "end": 117.34,
          "text": "A morte de um cidadão só pode ser encarada como necessária por dois motivos: nos momentos de confusão em que uma nação fica na alternativa de recuperar ou de perder sua liberdade, nas épocas de confusão, em que as leis são substituídas pela desordem, e quando um cidadão, embora privado de sua liberdade, pode ainda, por suas relações e seu crédito, atentar contra a segurança pública, podendo sua existência produzir uma revolução perigosa no governo estabelecido."
        },
        {
          "id": 14,
          "start": 117.34,
          "end": 151.64,
          "text": "Mas, sob o reino tranqüilo das leis, sob uma forma de governo aprovada pela nação inteira, num Estado bem defendido no exterior e sustentado no interior pela força e pela opinião talvez mais poderosa do que a própria força, num país em que a autoridade é exercida pelo próprio soberano, em que as riquezas só podem, proporcionar prazeres e não poder, não pode haver nenhuma necessidade de tirar a vida a um cidadão, a menos que a morte seja o único freio capaz de impedir novos crimes."
        },
        {
          "id": 15,
          "start": 151.64,
          "end": 159.28,
          "text": "A experiência de todos os séculos prova que a pena de morte nunca deteve celerados determinados a fazer mal."
        },
        {
          "id": 16,
          "start": 159.28,
          "end": 178.59,
          "text": "Essa verdade se apoia no exemplo dos romanos e nos vinte anos do reinado da imperatriz da Rússia, a benfeitora Izabel (13), que deu aos chefes dos povos uma lição mais ilustre do que todas as brilhantes conquistas que a pátria só alcança ao preço do sangue dos seus filhos."
        },
        {
          "id": 17,
          "start": 178.59,
          "end": 198.32,
          "text": "Se os homens, a quem a linguagem da razão é sempre suspeita e que só se rendem à autoridade dos antigos usos, se recusam à evidência dessas verdades, bastar-lhes-á interrogar a natureza e consultar o próprio coração para testemunhar os princípios que acabam de ser estabelecidos."
        },
        {
          "id": 18,
          "start": 198.32,
          "end": 215.79,
          "text": "O rigor do castigo causa menos efeito sobre o espírito humano do que a duração da pena, porque a nossa sensibilidade é mais fácil e mais constantemente afetada por uma impressão ligeira, mas freqüente, do que por um abalo violento, mas passageiro."
        },
        {
          "id": 19,
          "start": 215.79,
          "end": 231.77,
          "text": "Todo ser sensível está submetido ao império do hábito; e, como é este que ensina o homem a falar, a andar, a satisfazer suas necessidades, é também ele que grava no coração do homem as idéias de moral por impressões repetidas."
        },
        {
          "id": 20,
          "start": 231.77,
          "end": 251.51,
          "text": "O espetáculo atroz, mas momentâneo, da morte de um celerado é para o crime um freio menos poderoso do que o longo e contínuo exemplo de um homem privado de sua liberdade, tornado até certo ponto uma besta de carga e que repara com trabalhos penosos o dano que causou à sociedade."
        },
        {
          "id": 21,
          "start": 251.51,
          "end": 273.01,
          "text": "Essa volta freqüente do espectador a si mesmo: “Se eu cometesse um crime, estaria reduzido toda a minha vida a essa miserável condição”, – essa idéia terrível assombraria mais fortemente os espíritos do que o medo da morte, que se vê apenas um instante numa obscura distância que lhe enfraquece o horror."
        },
        {
          "id": 22,
          "start": 273.01,
          "end": 284.33,
          "text": "A impressão produzida pela visão dos suplícios não pode resistir à ação do tempo e das paixões, que logo apagam da memória dos homens as coisas mais essenciais."
        },
        {
          "id": 23,
          "start": 284.33,
          "end": 290.55,
          "text": "Por via de regra, as paixões violentas surpreendem vivamente, mas o seu efeito não dura."
        },
        {
          "id": 24,
          "start": 290.55,
          "end": 298.05,
          "text": "Produzirão uma dessas revoluções súbitas que fazem de repente de um homem comum um romano ou um espartano."
        },
        {
          "id": 25,
          "start": 298.05,
          "end": 305.33,
          "text": "Mas, num governo tranqüilo e livre, são necessárias menos paixões violentas do que impressões duráveis."
        },
        {
          "id": 26,
          "start": 305.33,
          "end": 316.86,
          "text": "Para a maioria dos que assistem à execução de um criminoso, o suplício deste é apenas um espetáculo; para a minoria, é um objeto de piedade mesclado de indignação."
        },
        {
          "id": 27,
          "start": 316.86,
          "end": 324.92,
          "text": "Esses dois sentimentos ocupam a alma do espectador, bem mais do que o terror salutar que é o fim da pena de morte."
        },
        {
          "id": 28,
          "start": 324.92,
          "end": 331.01,
          "text": "Mas, as penas moderadas e contínuas só produzem nos espectadores o sentimento do medo."
        },
        {
          "id": 29,
          "start": 331.01,
          "end": 344.09,
          "text": "No primeiro caso, sucede ao espectador do suplício o mesmo que ao espectador do drama; e, assim como o avaro retorna ao seu cofre, o homem violento e injusto retorna às suas injustiças."
        },
        {
          "id": 30,
          "start": 344.09,
          "end": 357.81,
          "text": "O legislador deve, por conseguinte, pôr limites ao rigor das penas, quando o suplício não se torna mais do que um espetáculo e parece ordenado mais para ocupar a força do que para punir o crime."
        },
        {
          "id": 31,
          "start": 357.81,
          "end": 365.1,
          "text": "Para que uma pena seja justa, deve ter apenas o grau de rigor bastante para desviar os homens do crime."
        },
        {
          "id": 32,
          "start": 365.1,
          "end": 374.57,
          "text": "Ora, não há homem que possa vacilar entre o crime, mau grado a vantagem que este prometa, e o risco de perder para sempre a liberdade."
        },
        {
          "id": 33,
          "start": 374.57,
          "end": 384.76,
          "text": "Assim, pois, a escravidão perpétua, substituindo a pena de morte, tem todo o rigor necessário para afastar do crime o espírito mais determinado."
        },
        {
          "id": 34,
          "start": 384.76,
          "end": 395.44,
          "text": "Digo mais: encara-se muitas vezes a morte de modo tranqüilo e firme, uns por fanatismo, outros por essa vaidade que nos acompanha mesmo além do túmulo."
        },
        {
          "id": 35,
          "start": 395.44,
          "end": 401.59,
          "text": "Alguns, desesperados, fatigados da vida, vêem na morte um meio de se livrar da miséria."
        },
        {
          "id": 36,
          "start": 401.59,
          "end": 408.38,
          "text": "Mas, o fanatismo e a vaidade desaparecem nas cadeias, sob os golpes, em meio às barras de ferro."
        },
        {
          "id": 37,
          "start": 408.38,
          "end": 412.2,
          "text": "O desespero não lhes põe fim aos males, mas os começa."
        },
        {
          "id": 38,
          "start": 412.2,
          "end": 420.76,
          "text": "Nossa alma resiste mais à violência das dores extremas, apenas passageiras, do que ao tempo e à continuidade do desgosto."
        },
        {
          "id": 39,
          "start": 420.76,
          "end": 432.36,
          "text": "Todas as forças da alma, reunindo-se contra males passageiros, podem enfraquecer-lhes a ação; mas, todas as suas molas acabam por ceder a penas longas e constantes."
        },
        {
          "id": 40,
          "start": 432.36,
          "end": 448.34,
          "text": "Numa nação em que a pena de morte é empregada, é forçoso, para cada exemplo que se dá, um novo crime; ao passo que a escravidão perpétua de um único culpado põe sob os olhos do povo um exemplo que subsiste sempre, e se repete."
        },
        {
          "id": 41,
          "start": 448.34,
          "end": 470.55,
          "text": "Se é mister que os homens tenham sempre sob os olhos os efeitos do poder das leis, é preciso que os suplícios sejam freqüentes, e desde então é preciso também que os crimes se multipliquem; o que provará que a pena de morte não causa toda a impressão que deveria produzir, e que é inútil quando julgada necessária."
        },
        {
          "id": 42,
          "start": 470.55,
          "end": 478.12,
          "text": "Dir-se-á que a escravidão perpétua é também uma pena rigorosa e, por conseguinte, tão cruel quanto a morte."
        },
        {
          "id": 43,
          "start": 478.12,
          "end": 498.84,
          "text": "Responderei que, reunindo num ponto todos os momentos infelizes da vida de um escravo, sua vida seria talvez mais horrível do que os suplícios mais atrozes; mas, esses momentos ficam espalhados por todo o curso da vida, ao passo que a pena de morte exerce todas as suas forças num só instante."
        },
        {
          "id": 44,
          "start": 498.84,
          "end": 518.65,
          "text": "A vantagem da pena da escravidão para a sociedade é que amedronta mais aquele que a testemunha do que quem a sofre, porque o primeiro considera a soma de todos os momentos infelizes, ao passo que o segundo se alheia de suas penas futuras, pelo sentimento da infelicidade presente."
        },
        {
          "id": 45,
          "start": 518.65,
          "end": 521.19,
          "text": "A imaginação aumenta todos os males."
        },
        {
          "id": 46,
          "start": 521.19,
          "end": 535.12,
          "text": "Aquele que sofre encontra em sua alma, endurecida pelo hábito da desgraça, consolações e recursos que as testemunhas dos seus males não conhecem, porque julgam segundo sua sensibilidade do momento."
        },
        {
          "id": 47,
          "start": 535.12,
          "end": 542.62,
          "text": "É somente por uma boa educação que se aprende a desenvolver e a dirigir os sentimentos do próprio coração."
        },
        {
          "id": 48,
          "start": 542.62,
          "end": 551.18,
          "text": "Mas, embora os celerados não possam perceber os seus princípios, nem por isso deixam de agir segundo um certo raciocínio."
        },
        {
          "id": 49,
          "start": 551.18,
          "end": 566.95,
          "text": "Ora, eis mais ou menos, como raciocina um assassino ou um ladrão, que só se afasta do crime pelo medo do poder ou da roda: “Quais são, afinal, as leis que devo respeitar e que deixam tão grande intervalo entre mim e o rico?"
        },
        {
          "id": 50,
          "start": 566.95,
          "end": 575.3,
          "text": "O homem opulento recusa-me com dureza a pequena esmola que lhe peço e me manda para o trabalho, que eu jamais conheci."
        },
        {
          "id": 51,
          "start": 575.3,
          "end": 576.71,
          "text": "Quem fez essas leis?"
        },
        {
          "id": 52,
          "start": 576.71,
          "end": 589.73,
          "text": "Homens ricos e poderosos, que jamais se dignaram de visitar a miserável choupana do pobre, que não viram repartir um pão grosseiro aos seus pobres filhos famintos e à sua mãe desolada."
        },
        {
          "id": 53,
          "start": 589.73,
          "end": 596.87,
          "text": "Rompamos as convenções, vantajosas somente para alguns tiranos covardes, mas funestas para a maioria."
        },
        {
          "id": 54,
          "start": 596.87,
          "end": 599.35,
          "text": "Ataquemos a injustiça em sua fonte."
        },
        {
          "id": 55,
          "start": 599.35,
          "end": 609.88,
          "text": "Sim retornarei ao meu estado de independência natural, viverei livre, provarei por algum tempo os frutos felizes da minha astúcia e da minha coragem."
        },
        {
          "id": 56,
          "start": 609.88,
          "end": 624.45,
          "text": "À frente de alguns homens determinados como eu, corrigirei os enganos da fortuna e verei meus tiranos tremer e empalidecer quando virem aquele que o seu fausto insolente punha abaixo dos cavalos e dos cães."
        },
        {
          "id": 57,
          "start": 624.45,
          "end": 635.7,
          "text": "Talvez venha uma época de dor e de arrependimento, mas essa época será curta; e por um dia de sofrimento, terei gozado vários anos de liberdade e de prazeres”."
        },
        {
          "id": 58,
          "start": 635.7,
          "end": 652.11,
          "text": "Se a religião se apresentar então ao espírito desse infeliz, não o intimidará; diminuirá mesmo aos seus olhos o horror do último suplício, oferecendo-lhe a esperança de um arrependimento fácil e da felicidade eterna que é seu fruto."
        },
        {
          "id": 59,
          "start": 652.11,
          "end": 676.23,
          "text": "Mas aquele que tem diante dos olhos um grande número de anos, ou mesmo a vida inteira que passar na escravidão e na dor, exposto ao desprezo dos seus concidadãos, dos quais fora um igual, escravo dessas leis pelas quais era protegido, faz uma comparação útil de todos os males, do êxito incerto do crime e do pouco tempo que terá para gozar."
        },
        {
          "id": 60,
          "start": 676.23,
          "end": 687.68,
          "text": "O exemplo sempre presente dos infelizes que ele vê vítimas da imprudência impressiona-o muito mais do que os suplícios, que podem endurecê-lo, mas não corrigi-lo."
        },
        {
          "id": 61,
          "start": 687.68,
          "end": 694.12,
          "text": "A pena de morte é ainda funesta à sociedade, pelos exemplos de crueldade que dá aos homens."
        },
        {
          "id": 62,
          "start": 694.12,
          "end": 710.03,
          "text": "Se as paixões ou a necessidade da guerra ensinam a espalhar o sangue humano, as leis, cujo fim é suavizar os costumes, deveriam multiplicar essa barbaria, tanto mais horrível quanto dá a morte com mais aparato e formalidades?"
        },
        {
          "id": 63,
          "start": 710.03,
          "end": 721.99,
          "text": "Não é absurdo que as leis, que são a expressão da vontade geral, que detestam e punem o homicídio, ordenem um morticínio público, para desviar os cidadãos do assassínio?"
        },
        {
          "id": 64,
          "start": 721.99,
          "end": 725.03,
          "text": "Quais são as leis mais justas e mais úteis?"
        },
        {
          "id": 65,
          "start": 725.03,
          "end": 735.28,
          "text": "São as que todos proporiam e desejariam observar, nesses momentos em que o interesse particular se cala ou se identifica com o interesse público."
        },
        {
          "id": 66,
          "start": 735.28,
          "end": 738.68,
          "text": "Qual é o sentimento geral sobre a pena de morte?"
        },
        {
          "id": 67,
          "start": 738.68,
          "end": 762.02,
          "text": "Está traçado em caracteres indeléveis nesses movimentos de indignação e de desprezo que nos inspira a simples visão do carrasco, que não é contudo senão o executor inocente da vontade pública, um cidadão honesto que contribui para o bem geral e que defende a segurança do Estado no interior, como o soldado, a defende no exterior."
        },
        {
          "id": 68,
          "start": 762.02,
          "end": 764.92,
          "text": "Qual é, pois, a origem dessa contradição?"
        },
        {
          "id": 69,
          "start": 764.92,
          "end": 770.01,
          "text": "E porque esse sentimento de horror resiste a todos os esforços da razão?"
        },
        {
          "id": 70,
          "start": 770.01,
          "end": 792.64,
          "text": "É que, numa parte recôndita da nossa alma, na qual os princípios naturais ainda não foram alterados, descobrimos um sentimento que nos grita que um homem não tem nenhum direito legítimo sobre a vida de outro homem, e que só a necessidade, que estende por toda parte o seu cetro de ferro, pode dispor da nossa existência."
        },
        {
          "id": 71,
          "start": 792.64,
          "end": 804.31,
          "text": "Que se deve pensar ao ver o sábio magistrado e os ministros sagrados da justiça fazer arrastar um culpado à morte, com cerimônia, com tranqüilidade, com indiferença?"
        },
        {
          "id": 72,
          "start": 804.31,
          "end": 823.76,
          "text": "E, enquanto o infeliz espera o golpe fatal, por entre convulsões e angústias, o juiz que acaba de o condenar deixa friamente o tribunal para ir provar em paz as doçuras e os prazeres da vida, e talvez louvar-se, com secreta complacência, pela autoridade que acaba de exercer."
        },
        {
          "id": 73,
          "start": 823.76,
          "end": 840.95,
          "text": "Não será o caso de dizer que essas leis são apenas a máscara da tirania, que essas formalidades cruéis e refletidas da justiça são simplesmente um pretexto para imolar-nos com mais confiança, como vítimas sacrificadas ao despotismo insaciável?"
        },
        {
          "id": 74,
          "start": 840.95,
          "end": 847.88,
          "text": "O assassínio, que nos aparece como um crime horrível, nós o vemos cometer friamente e sem remorso."
        },
        {
          "id": 75,
          "start": 847.88,
          "end": 851.06,
          "text": "Não poderemos autorizar-nos com esse exemplo?"
        },
        {
          "id": 76,
          "start": 851.06,
          "end": 857.22,
          "text": "Pintavam-nos a morte violenta como uma cena terrível, e é apenas questão de um momento."
        },
        {
          "id": 77,
          "start": 857.22,
          "end": 866.13,
          "text": "Será menos ainda para aquele que tiver coragem de ir-lhe ao encontro e de poupar-se desse modo tudo o que ela tem de doloroso."
        },
        {
          "id": 78,
          "start": 866.13,
          "end": 879.14,
          "text": "Tais são os tristes e funestos raciocínios que perdem uma cabeça já disposta ao crime, um espírito mais capaz de se deixar conduzir pelos abusos da religião do que pela religião mesma."
        },
        {
          "id": 79,
          "start": 879.14,
          "end": 886.99,
          "text": "A história dos homens é um imenso oceano de erros, no qual se vê sobrenadar uma ou outra verdade mal conhecida."
        },
        {
          "id": 80,
          "start": 886.99,
          "end": 902.62,
          "text": "Não me oponham, pois, o exemplo da maior parte das nações, que, em quase todos os tempos, aplicaram a pena de morte contra certos crimes; esses exemplos nenhuma força têm contra a verdade que é sempre tempo de reconhecer."
        },
        {
          "id": 81,
          "start": 902.62,
          "end": 910.97,
          "text": "Nesse caso, aprovar-se-iam os sacrifícios humanos, porque estiveram geralmente em uso entre todos os povos primitivos."
        },
        {
          "id": 82,
          "start": 910.97,
          "end": 932.12,
          "text": "Mas, se descubro alguns povos que se abstiveram, mesmo durante um curto espaço de tempo do emprego da pena de morte, posso prevalecer-me disso com razão; pois o destino das grandes verdades é não brilhar senão com a duração do relâmpago, no meio da longa noite de trevas que envolve o gênero humano."
        },
        {
          "id": 83,
          "start": 932.12,
          "end": 944.71,
          "text": "Ainda não chegaram os dias felizes em que a verdade eliminará o erro e se tornará apanágio de maioria, em que o gênero humano não será iluminado somente pelas verdades reveladas."
        },
        {
          "id": 84,
          "start": 944.71,
          "end": 953.69,
          "text": "Sinto quanto a voz fraca de um filósofo será facilmente abafada pelos gritos tumultuosos dos fanáticos escravos do preconceito."
        },
        {
          "id": 85,
          "start": 953.69,
          "end": 990.96,
          "text": "Mas, o pequeno número de sábios espalhados pela superfície da terra saberá entender-me; seu coração aprovará meus esforços; e se, mau grado todos os obstáculos que a afastam do trono, a verdade pudesse penetrar até aos ouvidos dos príncipes, saibam eles que essa verdade lhes leva os votos secretos da humanidade inteira; saibam que, se protegerem a verdade santa, sua glória ofuscará a dos mais famosos conquistadores e a eqüitativa posteridade colocará seus nomes acima dos Titos (14), dos Antoninos (15) e dos Trajanos (16)."
        },
        {
          "id": 86,
          "start": 990.96,
          "end": 995.28,
          "text": "Feliz o gênero humano, se, pela primeira vez, recebesse leis!"
        },
        {
          "id": 87,
          "start": 995.28,
          "end": 1061.83,
          "text": "Hoje, que vemos elevados nos tronos da Europa príncipes benfeitores, amigos das virtudes pacíficas, protetores das ciências e das artes, pais dos seus povos, e cidadãos coroados; quando esses príncipes, consolidando sua autoridades, trabalham para a felicidade dos seus súditos, quando destroem esse despotismo intermediário, tanto mais cruel quanto menos solidamente estabelecido, quando comprimem os tiranos subalternos que interceptam os votos do povo e os impedem de chegar até ao trono, onde seriam escutados; quando se considera que, se tais príncipes deixam subsistir leis defeituosas, é porque são premidos pela extrema dificuldade de destruir erros acreditados por uma longa série de séculos e protegidos por um certo número de homens interessados que punem: todo cidadão esclarecido deve desejar com ardor que o poder desses soberanos ainda aumente e se torne bastante grande para permitir-lhes a reforma de uma legislação funesta."
        }
      ],
      "imagens": []
    },
    {
      "numero": 21,
      "id": "capitulo-17",
      "titulo": "Capítulo 17: Do banimento e das confiscações",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 17 do clássico Dos Delitos e das Penas: Do banimento e das confiscações.",
      "duracaoSegundos": 216,
      "duracaoFormatada": "03:36",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-17-banimento-e-confiscacoes.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-17.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-17-banimento-e-confiscacoes.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 14.34,
          "text": "AQUELE que perturba a tranqüilidade pública, que não obedece às leis, que viola as condições sob as quais os homens se sustentam e se defendem mutuamente, esse deve ser excluído da sociedade, isto é, banido."
        },
        {
          "id": 2,
          "start": 14.34,
          "end": 26.05,
          "text": "Parece-me que se poderiam banir aqueles que, acusados de um crime atroz, são suspeitos de culpa com maior verossimilhança, mas sem estar plenamente convencidos do crime."
        },
        {
          "id": 3,
          "start": 26.05,
          "end": 40.73,
          "text": "Em casos semelhantes, seria mister que uma lei, a menos arbitrária e a mais precisa possível, condenasse ao banimento aquele que pusesse a nação na fatal alternativa de fazer uma injustiça ou de temer um acusado."
        },
        {
          "id": 4,
          "start": 40.73,
          "end": 51.19,
          "text": "Seria mister, igualmente, que essa lei deixasse ao banido o direito sagrado de poder a todo instante provar sua inocência e recuperar os seus direitos."
        },
        {
          "id": 5,
          "start": 51.19,
          "end": 64.98,
          "text": "Seria mister, enfim, que houvesse razões mais fortes para banir um cidadão acusado pela primeira vez do que para condenar a essa pena um estrangeiro ou um homem que já tivesse sido chamado à justiça."
        },
        {
          "id": 6,
          "start": 64.98,
          "end": 73.99,
          "text": "Mas, deve aquele que se bane, que se exclui para sempre da sociedade de que fazia parte, ser ao mesmo tempo privado dos seus bens?"
        },
        {
          "id": 7,
          "start": 73.99,
          "end": 77.8,
          "text": "Essa questão pode ser encarada sob diferentes aspectos."
        },
        {
          "id": 8,
          "start": 77.8,
          "end": 81.47,
          "text": "A perda dos bens é uma pena maior que a do banimento."
        },
        {
          "id": 9,
          "start": 81.47,
          "end": 88.81,
          "text": "Deve, pois, haver casos em que, para proporcionar a pena ao crime, se confiscarão todos os bens do banido."
        },
        {
          "id": 10,
          "start": 88.81,
          "end": 99.41,
          "text": "Em outras circunstâncias, só será despojado de uma parte de sua fortuna; e, para certos delitos, o banimento não será acompanhado de nenhuma confiscação."
        },
        {
          "id": 11,
          "start": 99.41,
          "end": 120.88,
          "text": "O culpado poderá perder todos os seus bens, se a lei que pronuncia o banimento declara rompidos todos os laços que o ligavam à sociedade; porque desde então o cidadão está morto, resta somente o homem; e, perante a sociedade, a morte política de um cidadão deve ter as mesmas conseqüências que a morte natural."
        },
        {
          "id": 12,
          "start": 120.88,
          "end": 135.64,
          "text": "Segundo essa máxima, dir-se-á talvez que é evidente que os bens do culpado deveriam reverter para os herdeiros legítimos, e não para o príncipe; não é nisso, porém, que me apoiarei para desaprovar as confiscações."
        },
        {
          "id": 13,
          "start": 135.64,
          "end": 151.36,
          "text": "Se alguns jurisconsultos sustentaram que as confiscações punham um freio às vinganças dos particulares banidos, tirando-lhes o poder de ser nocivos, é que não refletiram que não basta uma pena produzir algum bem para ser justa."
        },
        {
          "id": 14,
          "start": 151.36,
          "end": 154,
          "text": "Uma pena só é justa quando necessária."
        },
        {
          "id": 15,
          "start": 154,
          "end": 177.83,
          "text": "Um legislador não autorizará nunca uma injustiça útil, se quer prevenir as invasões da tirania, que vela sem cessar, que seduz e abusa pelo pretexto falaz de algumas vantagens momentâneas, e que faz deperecer em pranto e na miséria um povo cuja ruína prepara, para espalhar a abundância e a felicidade sobre uma minoria de homens privilegiados."
        },
        {
          "id": 16,
          "start": 177.83,
          "end": 187.66,
          "text": "O uso das confiscações põe continuamente a prêmio a cabeça do infeliz sem defesa, e faz o inocente sofrer os castigos reservados aos culpados."
        },
        {
          "id": 17,
          "start": 187.66,
          "end": 196.88,
          "text": "Pior ainda, as confiscações podem fazer do homem de bem um criminoso, pois o levam ao crime, reduzindo-o à indigência e ao desespero."
        },
        {
          "id": 18,
          "start": 196.88,
          "end": 215.93,
          "text": "E, além disso, não há espetáculo mais hediondo que o de uma família inteira coberta de infâmia, mergulhada nos horrores da miséria pelo crime do seu chefe, crime que essa família, submetida à autoridade do culpado, não poderia prevenir, mesmo que tivesse os meios para tanto."
        }
      ],
      "imagens": []
    },
    {
      "numero": 22,
      "id": "capitulo-18",
      "titulo": "Capítulo 18: Da infâmia",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 18 do clássico Dos Delitos e das Penas: Da infâmia.",
      "duracaoSegundos": 158,
      "duracaoFormatada": "02:38",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-18-infamia.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-18.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-18-infamia.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 13.43,
          "text": "A INFÂMIA é um sinal da improbação pública, que priva o culpado da consideração, da confiança que a sociedade tinha nele e dessa espécie de fraternidade que une os cidadãos de um mesmo país."
        },
        {
          "id": 2,
          "start": 13.43,
          "end": 23.88,
          "text": "Como os efeitos da infâmia não dependem absolutamente das leis, é mister que a vergonha que a lei inflige se baseie na moral, ou na opinião pública."
        },
        {
          "id": 3,
          "start": 23.88,
          "end": 42.54,
          "text": "Se se tentasse manchar de infâmia uma ação que a opinião não julga infame, ou a lei deixaria de ser respeitada, ou as idéias aceitas de probidade e de morai desapareceriam, mau grado todas as declamações dos moralistas, sempre impotentes contra a força do exemplo."
        },
        {
          "id": 4,
          "start": 42.54,
          "end": 51.44,
          "text": "Declarar infames ações indiferentes em si mesmas, é diminuir a infâmia das que efetivamente merecem ser designadas desse modo."
        },
        {
          "id": 5,
          "start": 51.44,
          "end": 61.33,
          "text": "Bem necessário é evitar que se punam com penas corporais e dolorosas certos delitos fundados no orgulho e que fazem dos castigos uma glória."
        },
        {
          "id": 6,
          "start": 61.33,
          "end": 66.63,
          "text": "Tal é o fanatismo, que só pode ser reprimido pelo ridículo e pela vergonha."
        },
        {
          "id": 7,
          "start": 66.63,
          "end": 85,
          "text": "Se se humilhar à orgulhosa vaidade dos fanáticos perante uma grande multidão de espectadores, devem esperar-se felizes efeitos dessa pena, pois que a própria verdade tem necessidade dos maiores esforços para se defender, quando é atacada pela arma do ridículo."
        },
        {
          "id": 8,
          "start": 85,
          "end": 99.98,
          "text": "Opondo assim a força à força e a opinião à opinião, um legislador esclarecido dissipa no espírito do povo a admiração que lhe causa um falso princípio, cujo absurdo lhe foi dissimulado com raciocínios especiosos."
        },
        {
          "id": 9,
          "start": 99.98,
          "end": 109.31,
          "text": "As penas infamantes devem ser raras, porque o emprego demasiado freqüente do poder da opinião enfraquece a força da própria opinião."
        },
        {
          "id": 10,
          "start": 109.31,
          "end": 120.89,
          "text": "A infâmia não deve cair tão pouco sobre um grande número de pessoas ao mesmo tempo, porque a infâmia de um grande número não é mais, em breve, a infâmia de ninguém."
        },
        {
          "id": 11,
          "start": 120.89,
          "end": 135.02,
          "text": "Tais são os meios de harmonizar as relações invariáveis das coisas e de atender à natureza, que, sempre ativa e jamais sujeita aos limites do tempo, destrói e revoga todas as leis que se afastam dela."
        },
        {
          "id": 12,
          "start": 135.02,
          "end": 157.7,
          "text": "Não é só nas belas-artes que é preciso seguir fielmente a natureza: as instituições políticas, ao menos aquelas que têm um caráter de sabedoria e elementos de duração, se fundam na natureza; e a verdadeira política não é outra coisa senão a arte de dirigir para o mesmo fim de utilidade os sentimentos imutáveis do homem."
        }
      ],
      "imagens": []
    },
    {
      "numero": 23,
      "id": "capitulo-19",
      "titulo": "Capítulo 19: Da publicidade e da presteza das penas",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 19 do clássico Dos Delitos e das Penas: Da publicidade e da presteza das penas.",
      "duracaoSegundos": 308,
      "duracaoFormatada": "05:08",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-19-publicidade-e-presteza-das-penas.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-19.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-19-publicidade-e-presteza-das-penas.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 6.89,
          "text": "QUANTO mais pronta for a pena e mais de perto seguir o delito, tanto mais justa e útil ela será."
        },
        {
          "id": 2,
          "start": 6.89,
          "end": 7.68,
          "text": "Mais justa."
        },
        {
          "id": 3,
          "start": 7.68,
          "end": 20.03,
          "text": "porque poupará ao acusado os cruéis tormentos da, incerteza, tormentos supérfluos, cujo horror aumenta para ele na razão da força de imaginação e do sentimento de fraqueza."
        },
        {
          "id": 4,
          "start": 20.03,
          "end": 31.94,
          "text": "A presteza do julgamento é justa ainda porque, a perda da liberdade sendo já uma pena, esta só deve preceder a condenação na estrita medida que a necessidade o exige."
        },
        {
          "id": 5,
          "start": 31.94,
          "end": 45.08,
          "text": "Se a prisão é apenas um meio de deter um cidadão até que ele seja julgado culpado, como esse meio é aflitivo e cruel, deve-se, tanto quanto possível, suavizar-lhe o rigor e a duração."
        },
        {
          "id": 6,
          "start": 45.08,
          "end": 56.78,
          "text": "Um cidadão detido só deve ficar na prisão o tempo necessário para a instrução do processo; e os mais antigos detidos têm direito de ser julgados em primeiro lugar."
        },
        {
          "id": 7,
          "start": 56.78,
          "end": 65.97,
          "text": "O acusado não deve ser encerrado senão na medida em que for necessário para o impedir de fugir ou de ocultar as provas do crime."
        },
        {
          "id": 8,
          "start": 65.97,
          "end": 69.7,
          "text": "O processo mesmo deve ser conduzido sem protelações."
        },
        {
          "id": 9,
          "start": 69.7,
          "end": 75.44,
          "text": "Que contraste hediondo entre a indolência de um juiz e a angústia de um acusado!"
        },
        {
          "id": 10,
          "start": 75.44,
          "end": 87.29,
          "text": "De um lado, um magistrado insensível, que passa os dias no bem-estar e nos prazeres, e de outro um infeliz que definha, a chorar no fundo de uma masmorra abominável."
        },
        {
          "id": 11,
          "start": 87.29,
          "end": 101.64,
          "text": "Os efeitos do castigo que se segue ao crime devem ser em geral impressionantes e sensíveis para os que o testemunharam; haverá, porém, necessidade de que esse castigo seja tão cruel para quem o sofre?"
        },
        {
          "id": 12,
          "start": 101.64,
          "end": 112.91,
          "text": "Quando os homens se reuniram em sociedade, foi para só se sujeitarem aos mínimos males possíveis; e não há país que possa negar esse princípio incontestável."
        },
        {
          "id": 13,
          "start": 112.91,
          "end": 135.17,
          "text": "Eu disse que a presteza da pena é útil; e é certo que, quanto menos tempo decorrer entre o delito e a pena, tanto mais os espíritos ficarão compenetrados da idéia de que não há crimes sem castigo; tanto mais se habituarão a considerar o crime como a causa da qual o castigo é o efeito necessário e inseparável."
        },
        {
          "id": 14,
          "start": 135.17,
          "end": 140.55,
          "text": "É a ligação das idéias que sustenta todo o edifício do entendimento humano."
        },
        {
          "id": 15,
          "start": 140.55,
          "end": 147.94,
          "text": "Sem ela, o prazer e a dor seriam sentimentos isolados, sem efeito, tão cedo esquecidos quanto sentidos."
        },
        {
          "id": 16,
          "start": 147.94,
          "end": 160.36,
          "text": "Os homens sem idéias gerais e princípios universais, isto é, os homens ignorantes e embrutecidos, não agem senão segundo as idéias mais vizinhas e mais imediatamente unidas."
        },
        {
          "id": 17,
          "start": 160.36,
          "end": 171.92,
          "text": "Negligenciam as relações distantes, e essas idéias complicadas, que só se apresentam ao homem fortemente apaixonado por um objeto, ou aos espíritos esclarecidos."
        },
        {
          "id": 18,
          "start": 171.92,
          "end": 177.3,
          "text": "A luz da atenção dissipa no homem apaixonado as trevas que cercam o vulgar."
        },
        {
          "id": 19,
          "start": 177.3,
          "end": 193.88,
          "text": "O homem instruído, acostumado a percorrer e a comparar rapidamente um grande número de idéias e de sentimentos opostos, tira do contraste um resultado que constitui a base de sua conduta, desde então menos incerta e menos perigosa."
        },
        {
          "id": 20,
          "start": 193.88,
          "end": 210.25,
          "text": "É, pois, da maior importância punir prontamente um crime cometido, se se quiser que, no espírito grosseiro do vulgo, a pintura sedutora das vantagens de uma ação criminosa desperte imediatamente a idéia de um castigo inevitável."
        },
        {
          "id": 21,
          "start": 210.25,
          "end": 217.07,
          "text": "Uma pena por demais retardada torna menos estreita a união dessas duas idéias: crime e castigo."
        },
        {
          "id": 22,
          "start": 217.07,
          "end": 233.51,
          "text": "Se o suplício de um acusado causa então alguma impressão, e somente como espetáculo, pois só se apresenta ao espectador quando o horror do crime, que contribui para fortificar o horror da pena, já está enfraquecido nos espíritos."
        },
        {
          "id": 23,
          "start": 233.51,
          "end": 252.89,
          "text": "Poder-se-ia ainda estreitar mais a ligação das idéias de crime e de castigo, dando à pena toda a conformidade possível com a natureza do delito, a fim de que o receio de um castigo especial afaste o espírito do caminho a que conduzia a perspectiva de um crime vantajoso."
        },
        {
          "id": 24,
          "start": 252.89,
          "end": 261.86,
          "text": "É preciso que a idéia do suplício esteja sempre presente no coração do homem fraco e domine o sentimento que o leva ao crime."
        },
        {
          "id": 25,
          "start": 261.86,
          "end": 276.07,
          "text": "Entre vários povos, punem-se os crimes pouco consideráveis com a prisão ou com a escravidão num país distante, isto é, manda-se o culpado levar um exemplo inútil a uma sociedade que ele não ofendeu."
        },
        {
          "id": 26,
          "start": 276.07,
          "end": 294.59,
          "text": "Como os homens não se entregam, a princípio, aos maiores crimes, a maior parte dos que assistem ao suplício de um celerado, acusado de algum crime monstruoso, não experimentam nenhum sentimento de terror ao verem um castigo que jamais imaginam poder merecer."
        },
        {
          "id": 27,
          "start": 294.59,
          "end": 307.87,
          "text": "Ao contrário, a punição pública dos pequenos delitos mais comuns causar-lhe-á na alma uma impressão salutar que os afastará de grandes crimes, desviando-os primeiro dos que o são menos."
        }
      ],
      "imagens": []
    },
    {
      "numero": 24,
      "id": "capitulo-20",
      "titulo": "Capítulo 20: Que o castigo deve ser inevitável, das graças",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 20 do clássico Dos Delitos e das Penas: Que o castigo deve ser inevitável, das graças.",
      "duracaoSegundos": 275,
      "duracaoFormatada": "04:35",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-20-castigo-inevitavel-gracas.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-20.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-20-castigo-inevitavel-gracas.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 15.49,
          "text": "GRAÇAS NÃO é o rigor do suplício que previne os crimes com mais segurança, mas a certeza do castigo, o zelo vigilante do magistrado e essa severidade inflexível que só é uma virtude no juiz quando as leis são brandas."
        },
        {
          "id": 2,
          "start": 15.49,
          "end": 30.27,
          "text": "A perspectiva de um castigo moderado, mas inevitável causará sempre uma forte impressão mais forte do que o vago temor de um suplício terrível, em relação ao qual se apresenta alguma esperança de impunidade."
        },
        {
          "id": 3,
          "start": 30.27,
          "end": 55.04,
          "text": "O homem treme à idéia dos menores males, quando vê a impossibilidade de evitá-los; ao passo que a esperança, doce filha do céu, que tantas vezes nos proporciona todos os bens, afasta sempre a idéia dos tormentos mais cruéis, por pouco que ela seja sustentada pelo exemplo da impunidade, que a fraqueza ou o amor do ouro tão freqüentemente concede."
        },
        {
          "id": 4,
          "start": 55.04,
          "end": 61.46,
          "text": "As vezes, a gente se abstém de punir um delito pouco importante, quando o ofendido perdoa."
        },
        {
          "id": 5,
          "start": 61.46,
          "end": 65.89,
          "text": "É um ato de benevolência, mas um ato contrário ao bem público."
        },
        {
          "id": 6,
          "start": 65.89,
          "end": 76.02,
          "text": "Um particular pode bem não exigir a reparação do mal que se lhe fez; mas, o perdão que ele concede não pode destruir a necessidade do exemplo."
        },
        {
          "id": 7,
          "start": 76.02,
          "end": 84.45,
          "text": "O direito de punir não pertence a nenhum cidadão em particular; pertence às leis, que são o órgão da vontade de todos."
        },
        {
          "id": 8,
          "start": 84.45,
          "end": 92.08,
          "text": "Um cidadão ofendido pode renunciar à sua porção desse direito, mas não tem nenhum poder sobre a dos outros."
        },
        {
          "id": 9,
          "start": 92.08,
          "end": 98.87,
          "text": "Quando as penas se tiverem tornado menos cruéis, a demência e o perdão serão menos necessários."
        },
        {
          "id": 10,
          "start": 98.87,
          "end": 102.93,
          "text": "Feliz a nação que não mais lhes desse o nome de virtudes!"
        },
        {
          "id": 11,
          "start": 102.93,
          "end": 121.07,
          "text": "A demência, que se tem visto em alguns soberanos substituir outras qualidades que lhes faltavam para cumprir os deveres do trono, deveria ser banida de uma legislação sábia na qual as penas fossem brandas e a justiça feita com formas prontas e regulares."
        },
        {
          "id": 12,
          "start": 121.07,
          "end": 135.7,
          "text": "Essa verdade parecerá dura apenas aos que vivem submetidos aos abusos de uma jurisprudência criminal que concede a graça e o perdão necessários em razão mesmo da atrocidade das penas e do absurdo das leis."
        },
        {
          "id": 13,
          "start": 135.7,
          "end": 149.05,
          "text": "O direito de conceder graça é sem dúvida a mais bela prerrogativa do trono; é o mais precioso atributo do poder soberano; mas, ao mesmo tempo, é uma improbação tácita das leis existentes."
        },
        {
          "id": 14,
          "start": 149.05,
          "end": 178.96,
          "text": "O soberano que se ocupa com a felicidade pública e que julga contribuir para ela exercendo o direito de conceder graça, eleva-se então contra o código criminal, consagrado, mau grado seus vícios, pelos preconceitos antigos, pelo calhamaço impostor dos comentadores, pelo grave aparelho das velhas formalidades, enfim, pelo sufrágio dos semi-sábios, sempre mais insinuantes e mais escutados do que os verdadeiros sábios."
        },
        {
          "id": 15,
          "start": 178.96,
          "end": 206.44,
          "text": "Sendo a clemência virtude do legislador e não do executor das leis, devendo manifestar-se no Código e não em julgamentos particulares, se se deixar ver aos homens que o crime pode ser perdoado e que o castigo nem sempre é a sua conseqüência necessária, nutre-se neles a esperança da impunidade; faz- se com que aceitem os suplícios não como atos de justiça, mas como atos de violência."
        },
        {
          "id": 16,
          "start": 206.44,
          "end": 221.22,
          "text": "Quando o soberano concede graça a um criminoso, não será o caso de dizer que sacrifica a segurança pública à de um particular e que, por um ato de cega benevolência, pronuncia um decreto geral de impunidade?"
        },
        {
          "id": 17,
          "start": 221.22,
          "end": 229.93,
          "text": "Sejam, pois, as leis inexoráveis, sejam os executores das leis inflexíveis; seja, porém, o legislador indulgente e humano."
        },
        {
          "id": 18,
          "start": 229.93,
          "end": 259.91,
          "text": "Arquiteto prudente, dê por base ao seu edifício o amor que todo homem tem ao próprio bem-estar, e saiba fazer resultar o bem geral do concurso dos interesses particulares; não se verá, assim, constrangido a recorrer a leis imperfeitas, a meios pouco refletidos que separam a cada instante os interesses da sociedade dos cidadãos; não será forçado a elevar sobre o medo e a desconfiança o simulacro da felicidade pública."
        },
        {
          "id": 19,
          "start": 259.91,
          "end": 274.9,
          "text": "Filósofo profundo e sensível, terá deixado aos seus irmãos o gozo pacífico da pequena porção de felicidade que o Ser supremo lhes concedeu nesta terra, que não é mais do que um ponto no meio de todos os mundos."
        }
      ],
      "imagens": []
    },
    {
      "numero": 25,
      "id": "capitulo-21",
      "titulo": "Capítulo 21: Dos asilos",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 21 do clássico Dos Delitos e das Penas: Dos asilos.",
      "duracaoSegundos": 196,
      "duracaoFormatada": "03:16",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-21-asilos.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-21.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-21-asilos.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 1.55,
          "text": "SERÃO justos os asilos?"
        },
        {
          "id": 2,
          "start": 1.55,
          "end": 7.22,
          "text": "E será útil o uso estabelecido entre as nações de permutarem entre si os criminosos?"
        },
        {
          "id": 3,
          "start": 7.22,
          "end": 13.9,
          "text": "Em toda a extensão de um Estado político, não deve haver nenhum lugar fora da dependência das leis."
        },
        {
          "id": 4,
          "start": 13.9,
          "end": 19.5,
          "text": "A força destas deve seguir o cidadão por toda a parte, como a sombra segue o corpo."
        },
        {
          "id": 5,
          "start": 19.5,
          "end": 39.88,
          "text": "Há pouca diferença entre a impunidade e os asilos; e, como o melhor meio de impedir o crime é a perspectiva de um castigo certo e inevitável, os asilos, que representam um abrigo contra a ação das leis, convidam mais ao crime do que as penas o evitam, do momento em que se tem a esperança de evitá-los."
        },
        {
          "id": 6,
          "start": 39.88,
          "end": 53.24,
          "text": "Multiplicar os asilos é formar pequenas soberanias, porque, quando as leis não têm poder, novas potências se formam de ordem comum, estabelece-se um espírito oposto ao do corpo inteiro da sociedade."
        },
        {
          "id": 7,
          "start": 53.24,
          "end": 61.54,
          "text": "Vê-se, na história de todos os povos, que os asilos foram a fonte de grandes revoluções nos Estados e nas opiniões humanas."
        },
        {
          "id": 8,
          "start": 61.54,
          "end": 70.52,
          "text": "Pretenderam alguns que, cometido um crime num lugar, isto é, um ato contrário às leis, teriam estas em toda parte o direito de punir."
        },
        {
          "id": 9,
          "start": 70.52,
          "end": 74.63,
          "text": "Será a qualidade de súdito, nesse caso, um caráter indelével?"
        },
        {
          "id": 10,
          "start": 74.63,
          "end": 77.6,
          "text": "Será o nome de súdito pior que o de escravo?"
        },
        {
          "id": 11,
          "start": 77.6,
          "end": 83.14,
          "text": "E admitir-se-á que um homem habite um país e seja submetido às leis de outro país?"
        },
        {
          "id": 12,
          "start": 83.14,
          "end": 90.96,
          "text": "que suas ações fiquem ao mesmo tempo subordinadas a dois soberanos e a duas legislações muitas vezes contraditórias?"
        },
        {
          "id": 13,
          "start": 90.96,
          "end": 105.61,
          "text": "Ousou-se dizer, assim, que um crime cometido em Constantinopla podia ser punido em Paris, porque aquele que ofende uma sociedade humana merece ter todos os homens por inimigos e deve ser objeto da execração universal."
        },
        {
          "id": 14,
          "start": 105.61,
          "end": 116.33,
          "text": "No entanto, os juizes não são vingadores do gênero humano em geral; são os defensores das convenções particulares que ligam entre si um certo número de homens."
        },
        {
          "id": 15,
          "start": 116.33,
          "end": 130.84,
          "text": "Um crime só deve ser punido no país onde foi cometido, porque é somente aí, e não em outra parte, que os homens são forçados a reparar, pelo exemplo da pena, os funestos efeitos que o exemplo do crime pode produzir."
        },
        {
          "id": 16,
          "start": 130.84,
          "end": 150.48,
          "text": "Um celerado, cujos crimes precedentes não puderam violar as leis de uma sociedade da qual não era membro, pode bem ser temido e expulso dessa sociedade; mas, as leis não podem infligir-lhe outra pena, pois são feitas somente para punir o mal que lhe é feito, e não o crime que não as ofende."
        },
        {
          "id": 17,
          "start": 150.48,
          "end": 155.74,
          "text": "Será, pois, útil que as nações permutem reciprocamente entre si os criminosos?"
        },
        {
          "id": 18,
          "start": 155.74,
          "end": 164.92,
          "text": "Certamente, a persuasão de não encontrar nenhum lugar na terra em que o crime possa ficar impune seria um meio bem eficaz de preveni-lo."
        },
        {
          "id": 19,
          "start": 164.92,
          "end": 195.96,
          "text": "Não ousarei, porém, decidir essa questão, até que as leis, tornando-se mais conformes aos sentimentos naturais do homem, com penas mais brandas, impedindo o arbítrio dos juizes e da opinião, assegurem a inocência e preservem a virtude das perseguições da inveja; até que a tirania, relegada ao Oriente, tenha deixado a Europa sob o doce império da razão, dessa razão eterna que une com um laço indissolúvel os interesses dos soberanos aos interesses dos povos."
        }
      ],
      "imagens": []
    },
    {
      "numero": 26,
      "id": "capitulo-22",
      "titulo": "Capítulo 22: Do uso de pôr a cabeça a prêmio",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 22 do clássico Dos Delitos e das Penas: Do uso de pôr a cabeça a prêmio.",
      "duracaoSegundos": 153,
      "duracaoFormatada": "02:33",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-22-cabeca-a-premio.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-22.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-22-cabeca-a-premio.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 9.66,
          "text": "SERÁ vantajoso para a sociedade pôr a prêmio a cabeça de um criminoso, armar cada cidadão de um punhal e fazer assim outros tantos carrascos?"
        },
        {
          "id": 2,
          "start": 9.66,
          "end": 12.95,
          "text": "Ou o criminoso saiu do país, ou ainda está nele."
        },
        {
          "id": 3,
          "start": 12.95,
          "end": 20.97,
          "text": "No primeiro caso, excitam- se os cidadãos a cometer um assassínio, a atingir talvez um inocente, a merecer suplícios."
        },
        {
          "id": 4,
          "start": 20.97,
          "end": 30.98,
          "text": "Faz-se uma injúria à nação estrangeira, espezinha-se-lhe a autoridade, autoriza-se que se façam semelhantes usurpações entre os próprios vizinhos."
        },
        {
          "id": 5,
          "start": 30.98,
          "end": 38.31,
          "text": "Se o criminoso ainda está no país cujas leis violou, o governo que põe sua cabeça a prêmio revela fraqueza."
        },
        {
          "id": 6,
          "start": 38.31,
          "end": 43.38,
          "text": "Quando a gente tem força para defender- se não compra o socorro de outrem."
        },
        {
          "id": 7,
          "start": 43.38,
          "end": 53.46,
          "text": "Além disso, o uso de pôr a prêmio a cabeça de um cidadão anula todas as idéias de moral e de virtude, tão fracas e tão abaladas no espírito humano."
        },
        {
          "id": 8,
          "start": 53.46,
          "end": 57.57,
          "text": "De um lado, as leis punem a traição; de outro, autorizam-na."
        },
        {
          "id": 9,
          "start": 57.57,
          "end": 65.52,
          "text": "O legislador aperta com uma das mãos os laços de sangue e de amizade, e com a outra recompensa aquele que os quebra."
        },
        {
          "id": 10,
          "start": 65.52,
          "end": 75.25,
          "text": "Sempre em contradição consigo mesmo, ora procura espalhar a confiança e animar os que duvidam, ora semeia a desconfiança em todos os corações."
        },
        {
          "id": 11,
          "start": 75.25,
          "end": 77.92,
          "text": "Para prevenir um crime, faz nascer cem."
        },
        {
          "id": 12,
          "start": 77.92,
          "end": 87.38,
          "text": "Semelhantes usos só convêm às nações fracas, cujas leis só servem para sustentar por um momento um edifício de ruínas que todo se esboroa."
        },
        {
          "id": 13,
          "start": 87.38,
          "end": 98.21,
          "text": "Mas, à medida que as luzes de uma nação se difundem, a boa fé e a confiança recíproca se tornam necessárias, e a política é, enfim, constrangida a admiti-las."
        },
        {
          "id": 14,
          "start": 98.21,
          "end": 105.82,
          "text": "Então, desmancham-se e previnem-se mais facilmente as cabalas, os artifícios, as manobras obscuras e indiretas."
        },
        {
          "id": 15,
          "start": 105.82,
          "end": 111.37,
          "text": "Então, também, o interesse geral sai sempre vencedor dos interesses particulares."
        },
        {
          "id": 16,
          "start": 111.37,
          "end": 121.03,
          "text": "Os povos esclarecidos poderiam buscar lições em alguns séculos de ignorância, nos quais a moral particular era sustentada pela moral pública."
        },
        {
          "id": 17,
          "start": 121.03,
          "end": 126.86,
          "text": "As nações só serão felizes quando a sã moral estiver estreitamente ligada à política."
        },
        {
          "id": 18,
          "start": 126.86,
          "end": 153.24,
          "text": "Mas, leis que recompensam a traição, que acendem entre os cidadãos uma guerra clandestina, que excitam suspeitas recíprocas, opor-se- ão sempre a essa união tão necessária da política e da moral; união que daria aos homens segurança e paz, que lhes aliviaria a miséria e que traria às nações mais, longos intervalos de repouso e concórdia do que aqueles de que até ao presente gozaram."
        }
      ],
      "imagens": []
    },
    {
      "numero": 27,
      "id": "capitulo-23",
      "titulo": "Capítulo 23: Que as penas devem ser proporcionadas aos delitos",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 23 do clássico Dos Delitos e das Penas: Que as penas devem ser proporcionadas aos delitos.",
      "duracaoSegundos": 261,
      "duracaoFormatada": "04:21",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-23-proporcionadas.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-23-proporcionadas.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-23-proporcionadas.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 10.38,
          "text": "AOS DELITOS O INTERESSE de todos não é somente que se cometam poucos crimes, mais ainda que os delitos mais funestos à sociedade sejam os mais raros."
        },
        {
          "id": 2,
          "start": 10.38,
          "end": 22.08,
          "text": "Os meios que a legislação emprega para impedir os crimes devem, pois, ser mais fortes à medida que o delito é mais contrário ao bem público e pode tornar-se mais comum."
        },
        {
          "id": 3,
          "start": 22.08,
          "end": 22.43,
          "text": "Deve."
        },
        {
          "id": 4,
          "start": 22.43,
          "end": 26.19,
          "text": "pois, haver uma proporção entre os delitos e as penas."
        },
        {
          "id": 5,
          "start": 26.19,
          "end": 69.11,
          "text": "Se o prazer e a dor são os dois grandes motores dos seres sensíveis; se, entre os motivos que determinam os homens em todas as suas ações, o supremo Legislador colocou como os mais poderosos as recompensas e as penas; se dois crimes que atingem desigualmente a sociedade recebem o mesmo castigo, o homem inclinado ao crime, não tendo que temer uma pena maior para o crime mais monstruoso, decidir-se-á mais facilmente pelo delito que lhe seja mais vantajosos; e a distribuição desigual das penas produzirá a contradição, tão notória quando freqüente, de que as leis terão de punir os crimes que tiveram feito nascer."
        },
        {
          "id": 6,
          "start": 69.11,
          "end": 103.38,
          "text": "Se se estabelece um mesmo castigo, a pena de morte por exemplo, para quem mata um faisão e para quem mata um homem ou falsifica um escrito importante, em breve não se fará mais nenhuma diferença entre esses delitos; destruir-se-ão no coração do homem os sentimentos morais, obra de muitos séculos, cimentada por ondas de sangue, estabelecida com lentidão através mil obstáculos, edifício que só se pode elevar com o socorro dos mais sublimes motivos e o aparato das mais solenes formalidades."
        },
        {
          "id": 7,
          "start": 103.38,
          "end": 121.29,
          "text": "Seria em vão que se tentaria prevenir todos os abusos que se originam da fermentação contínua das paixões humanas; esses abusos crescem em razão da população e do choque dos interesses particulares, que é impossível dirigir em linha reta para o bem público."
        },
        {
          "id": 8,
          "start": 121.29,
          "end": 129.09,
          "text": "Não se pode provar essa asserção com toda a exatidão matemática; pode-se, porém, apoiá-la com exemplos notáveis."
        },
        {
          "id": 9,
          "start": 129.09,
          "end": 135.85,
          "text": "Lançai os olhos sobre a história, e vereis crescerem os abusos à medida que os impérios aumentam."
        },
        {
          "id": 10,
          "start": 135.85,
          "end": 151.94,
          "text": "Ora, como o espírito nacional se enfraquece na mesma proporção, o pendor para o crime crescerá em razão da vantagem  que cada um descobre no abuso mesmo; e a necessidade de agravar as penas seguirá necessariamente igual progressão."
        },
        {
          "id": 11,
          "start": 151.94,
          "end": 158.56,
          "text": "Semelhante à gravitação dos corpos, uma força secreta impele-nos sempre para o nosso bem estar."
        },
        {
          "id": 12,
          "start": 158.56,
          "end": 163.5,
          "text": "Essa impulsão só é enfraquecida pelos obstáculos que as leis lhe opõem."
        },
        {
          "id": 13,
          "start": 163.5,
          "end": 168.31,
          "text": "Todos os diversos atos do homem são efeitos dessa tendência interior."
        },
        {
          "id": 14,
          "start": 168.31,
          "end": 181.06,
          "text": "As penas são os obstáculos políticos que impedem os funestos efeitos do choque dos interesses pessoais, sem destruir-lhes a causa, que é o amor de si mesmo, inseparável da humanidade."
        },
        {
          "id": 15,
          "start": 181.06,
          "end": 193.95,
          "text": "O legislador deve ser um arquiteto hábil, que saiba ao mesmo tempo empregar todas as forças que podem contribuir para consolidar o edifício e enfraquecer todas as que possam arruiná-lo."
        },
        {
          "id": 16,
          "start": 193.95,
          "end": 211.43,
          "text": "Supondo-se a necessidade da reunião dos homens em sociedade, mediante convenções estabelecidas pelos interesses opostos de cada particular, achar- se-á um progressão de crimes, dos quais o maior será aquele que tende à destruição da própria sociedade."
        },
        {
          "id": 17,
          "start": 211.43,
          "end": 216.24,
          "text": "Os menores delitos serão as pequenas ofensas feitas aos particulares."
        },
        {
          "id": 18,
          "start": 216.24,
          "end": 225.99,
          "text": "Entre esses dois extremos estarão compreendidos todos os atos opostos ao bem público, desde o mais criminoso até ao menos passível de culpa."
        },
        {
          "id": 19,
          "start": 225.99,
          "end": 239.44,
          "text": "Se os cálculos exatos pudessem aplicar-se a todas as combinações obscuras que fazem os homens agir, seria mister procurar e fixar uma progressão de penas correspondente à progressão dos crimes."
        },
        {
          "id": 20,
          "start": 239.44,
          "end": 247.8,
          "text": "O quadro dessas duas progressões seria a medida da liberdade ou da escravidão da humanidade ou da maldade de cada nação."
        },
        {
          "id": 21,
          "start": 247.8,
          "end": 261.31,
          "text": "Bastará, contudo, que o legislador sábio estabeleça divisões principais na distribuição das penas proporcionadas aos delitos e que, sobretudo, não aplique os menores castigos aos maiores crimes."
        }
      ],
      "imagens": []
    },
    {
      "numero": 28,
      "id": "capitulo-24",
      "titulo": "Capítulo 24: Da medida dos delitos",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 24 do clássico Dos Delitos e das Penas: Da medida dos delitos.",
      "duracaoSegundos": 256,
      "duracaoFormatada": "04:16",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-24-medida.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-24-medida.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-24-medida.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 5.69,
          "text": "JÁ observamos que a verdadeira medida dos delitos é o dano causado à sociedade."
        },
        {
          "id": 2,
          "start": 5.69,
          "end": 23.98,
          "text": "Eis aí uma dessas verdades que, embora evidentes para o espírito menos perspicaz, mas ocultas por um concurso singular de circunstâncias, só são conhecidas de um pequeno número de pensadores em todos os países e em todos os séculos cujas leis conhecemos."
        },
        {
          "id": 3,
          "start": 23.98,
          "end": 36.65,
          "text": "As opiniões espalhadas pelos déspotas e as paixões dos tiranos abafaram as noções simples e as idéias naturais que constituíam sem dúvida a filosofia das sociedades primitivas."
        },
        {
          "id": 4,
          "start": 36.65,
          "end": 57.6,
          "text": "Mas, se a tirania comprimiu a natureza por uma ação insensível, ou por impressões violentas sobre os espíritos da multidão, hoje, enfim, as luzes do nosso século dissipam os tenebrosos projetos do despotismo, reconduzindo-nos aos princípios da filosofia e mostrando-no- los com mais certeza."
        },
        {
          "id": 5,
          "start": 57.6,
          "end": 70.49,
          "text": "Esperemos que a funesta experiência dos séculos passados não seja perdida e que os princípios naturais reapareçam entre os homens, mau grado todos os obstáculos que se lhes opõem."
        },
        {
          "id": 6,
          "start": 70.49,
          "end": 86.47,
          "text": "A grandeza do crime não depende da intenção de quem o comete, como erroneamente o julgaram alguns: porque a intenção do acusado depende das impressões causadas pelos objetos presentes e das disposições precedentes da alma."
        },
        {
          "id": 7,
          "start": 86.47,
          "end": 96.05,
          "text": "Esses sentimentos variam em todos os homens e no mesmo indivíduo, com a rápida sucessão das idéias, das paixões e das circunstâncias."
        },
        {
          "id": 8,
          "start": 96.05,
          "end": 105.41,
          "text": "Se se punisse a intenção, seria preciso ter não só um Código particular para cada cidadão, mas uma nova lei penal para cada crime."
        },
        {
          "id": 9,
          "start": 105.41,
          "end": 117.29,
          "text": "Muitas vezes, com a melhor das intenções, um cidadão faz à sociedade os maiores males, ao passo que um outro lhe presta grandes serviços com a vontade de prejudicar."
        },
        {
          "id": 10,
          "start": 117.29,
          "end": 127.01,
          "text": "Outros jurisconsultos medem a gravidade do crime pela dignidade da pessoa ofendida, de preferência ao mal que possa causar à sociedade."
        },
        {
          "id": 11,
          "start": 127.01,
          "end": 143.93,
          "text": "Se esse método fosse aceito, uma pequena irreverência para com o Ser supremo mereceria uma pena bem mais severa do que o assassínio de um monarca, pois a superioridade da natureza divina compensaria infinitamente a diferença da ofensa."
        },
        {
          "id": 12,
          "start": 143.93,
          "end": 150.41,
          "text": "Outros, finalmente, julgaram o delito tanto mais grave quanto maior a ofensa, à Divindade."
        },
        {
          "id": 13,
          "start": 150.41,
          "end": 163.01,
          "text": "Sentir-se-á facilmente quanto essa opinião é falsa, se se examinarem com sangue-frio as verdadeiras relações que unem os homens entre si e as que existem entre o homem e Deus."
        },
        {
          "id": 14,
          "start": 163.01,
          "end": 165.82,
          "text": "As primeiras são relações de igualdade."
        },
        {
          "id": 15,
          "start": 165.82,
          "end": 176.04,
          "text": "Só a necessidade faz nascer; do choque das paixões e da posição dos interesses particulares, a idéia da unidade comum, base da justiça humana."
        },
        {
          "id": 16,
          "start": 176.04,
          "end": 197.71,
          "text": "Ao contrário, as relações que existem entre o homem e Deus são relações de dependência, que nos submetem a um ser perfeito e criador de todas as coisas, a um senhor soberano que somente a si reservou o direito de ser ao mesmo tempo legislador e juiz, somente ele pode ser a um tempo uma e outra coisa."
        },
        {
          "id": 17,
          "start": 197.71,
          "end": 222.05,
          "text": "Se ele estabeleceu penas eternas para aquele que infringiu suas leis, qual será o inseto bastante temerário que ousará vir em socorro de sua justiça divina, para empreender vingar o ser que se basta a si mesmo, que os crimes não podem entristecer, que os castigos não podem alegrar e que é o único na natureza a agir de maneira constante?"
        },
        {
          "id": 18,
          "start": 222.05,
          "end": 234.5,
          "text": "A grandeza do pecado ou da ofensa para com Deus depende da maldade do coração; e, para que os homens pudessem sondar esse abismo, ser-lhes-ia preciso o socorro da revelação."
        },
        {
          "id": 19,
          "start": 234.5,
          "end": 242.35,
          "text": "Como poderiam eles determinar as penas dos diferentes crimes, sobre princípios cuja base lhes é desconhecida?"
        },
        {
          "id": 20,
          "start": 242.35,
          "end": 247.25,
          "text": "Seria arriscado punir quando Deus perdoa e perdoar quando Deus pune."
        },
        {
          "id": 21,
          "start": 247.25,
          "end": 255.53,
          "text": "Se os homens ofendem a Deus com o pecado, muitas vezes o ofendem mais ainda encarregando-se do cuidado de vingá-lo."
        }
      ],
      "imagens": []
    },
    {
      "numero": 29,
      "id": "capitulo-25",
      "titulo": "Capítulo 25: Divisão dos delitos",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 25 do clássico Dos Delitos e das Penas: Divisão dos delitos.",
      "duracaoSegundos": 191,
      "duracaoFormatada": "03:11",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-25-divisao.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-25-divisao.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-25-divisao.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 5.93,
          "text": "HÁ crimes que tendem diretamente à destruição da sociedade ou dos que a representam."
        },
        {
          "id": 2,
          "start": 5.93,
          "end": 10.74,
          "text": "Outros atingem o cidadão em sua vida, nos seus bens ou em sua honra."
        },
        {
          "id": 3,
          "start": 10.74,
          "end": 18.01,
          "text": "Outros, finalmente, são atos contrários ao que a lei prescreve ou proíbe, tendo em vista o bem público."
        },
        {
          "id": 4,
          "start": 18.01,
          "end": 29.53,
          "text": "Todo ato não compreendido numa dessas classes não pode ser considerado como crime, nem punido como tal, senão pelos que descobrem nisso o seu interesse particular."
        },
        {
          "id": 5,
          "start": 29.53,
          "end": 40.97,
          "text": "Por não se ter sabido guardar esses limites é que se vê em todas as nações uma oposição entre as leis e a moral, e muitas vezes uma oposição entre aquelas mesmas."
        },
        {
          "id": 6,
          "start": 40.97,
          "end": 44.51,
          "text": "O homem de bem está exposto às penas mais severas."
        },
        {
          "id": 7,
          "start": 44.51,
          "end": 48.25,
          "text": "As palavras vício e virtude não passam de sons vagos."
        },
        {
          "id": 8,
          "start": 48.25,
          "end": 57.93,
          "text": "A existência do cidadão envolve-se de incerteza; e os corpos políticos caem numa letargia funesta, que os conduz insensivelmente à ruína."
        },
        {
          "id": 9,
          "start": 57.93,
          "end": 68.1,
          "text": "Cada cidadão pode fazer tudo o que não é contrário às leis, sem temer outros inconvenientes além dos que podem resultar de sua ação em si mesma."
        },
        {
          "id": 10,
          "start": 68.1,
          "end": 76.86,
          "text": "Esse dogma político deveria ser gravado no espírito dos povos, proclamado pelos magistrados supremos e protegido pelas leis."
        },
        {
          "id": 11,
          "start": 76.86,
          "end": 90.42,
          "text": "Sem esse dogma sagrado, toda sociedade legítima não pode subsistir por muito tempo, porque ele é a justa recompensa do sacrifício que os homens fizeram de sua independência e de sua liberdade."
        },
        {
          "id": 12,
          "start": 90.42,
          "end": 112.04,
          "text": "É essa opinião que torna as almas fortes e generosas, que eleva o espírito, que inspira aos homens uma virtude superior ao medo e os faz desprezar essa miserável maleabilidade que tudo aprova e que é a única virtude dos homens bastante fracos para suportar constantemente uma existência precária e incerta."
        },
        {
          "id": 13,
          "start": 112.04,
          "end": 125.96,
          "text": "Percorram-se, com visão filosófica, as leis e a história das nações, e se verão quase sempre os nomes de vício e virtude, de bom e mau cidadão, mudarem de valor segundo o tempo e as circunstâncias."
        },
        {
          "id": 14,
          "start": 125.96,
          "end": 140.3,
          "text": "Não são, porém, as reformas operadas no Estado ou nos negócios públicos que causarão essa revolução das idéias; esta será a conseqüência dos erros e dos interesses passageiros dos diferente legisladores."
        },
        {
          "id": 15,
          "start": 140.3,
          "end": 150.4,
          "text": "Muitas vezes se verão as paixões de um século servir de base à moral dos  séculos seguintes, e formar toda a política dos que presidem às leis."
        },
        {
          "id": 16,
          "start": 150.4,
          "end": 167.43,
          "text": "Mas, as paixões fortes, filhas do fanatismo e do entusiasmo, obrigam a pouco e pouco, à força de excessos, o legislador à prudência, e podem tornar-se um instrumento útil nas mãos da astúcia ou do poder, quando o tempo as tiver enfraquecido."
        },
        {
          "id": 17,
          "start": 167.43,
          "end": 191.3,
          "text": "Foi do enfraquecimento das paixões fortes que nasceram entre os homens as noções obscuras de honra e virtude; e essa obscuridade subsistirá sempre, porque as idéias mudam com o tempo, que deixa sobreviver os nomes às coisas, que variam segundo os lugares e os climas; é que a moral esta submetida, como os impérios, a limites geográficos."
        }
      ],
      "imagens": []
    },
    {
      "numero": 30,
      "id": "capitulo-26",
      "titulo": "Capítulo 26: Dos crimes de lesa-majestade",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 26 do clássico Dos Delitos e das Penas: Dos crimes de lesa-majestade.",
      "duracaoSegundos": 53,
      "duracaoFormatada": "00:53",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-26-lesa-majestade.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-26-lesa-majestade.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-26-lesa-majestade.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 7.28,
          "text": "OS crimes de lesa-majestade foram postos na classe dos grandes crimes, porque são funestos à sociedade."
        },
        {
          "id": 2,
          "start": 7.28,
          "end": 18.37,
          "text": "Mas, a tirania e a ignorância, que confundem as palavras e as idéias mais claras, deram esse nome a uma multidão de delitos de natureza inteiramente diversa."
        },
        {
          "id": 3,
          "start": 18.37,
          "end": 27.69,
          "text": "Aplicaram-se as penas mais graves a faltas leves; e, nessa ocasião como em mil outras, o homem é muitas vezes vítima de uma palavra."
        },
        {
          "id": 4,
          "start": 27.69,
          "end": 34.97,
          "text": "Toda espécie de delito é nociva à sociedade; mas, nem todos os delitos tendem imediatamente a destruir."
        },
        {
          "id": 5,
          "start": 34.97,
          "end": 41.54,
          "text": "É preciso julgar as ações morais por seus efeitos positivos e ter em conta o tempo e o lugar."
        },
        {
          "id": 6,
          "start": 41.54,
          "end": 52.56,
          "text": "Só a arte das interpretações odiosas, que é ordinariamente a ciência dos escravos, pode confundir coisas que a verdade eterna separou por limites imutáveis."
        }
      ],
      "imagens": []
    },
    {
      "numero": 31,
      "id": "capitulo-27",
      "titulo": "Capítulo 27: Dos atentados contra a segurança dos particulares",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 27 do clássico Dos Delitos e das Penas: Dos atentados contra a segurança dos particulares.",
      "duracaoSegundos": 434,
      "duracaoFormatada": "07:14",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-27-atentados.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-27-atentados.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-27-atentados.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 14.36,
          "text": "PARTICULARES E, PRINCIPALMENTE, DAS  VIOLÊNCIAS DEPOIS dos crimes que atingem a sociedade, ou o soberano que a representa, vêm os atentados contra a segurança dos particulares."
        },
        {
          "id": 2,
          "start": 14.36,
          "end": 25.22,
          "text": "Como essa segurança é o fim de todas as sociedades humanas, não se pode deixar de punir com as penas mais graves aquele que a atinge."
        },
        {
          "id": 3,
          "start": 25.22,
          "end": 33.38,
          "text": "Entre esses crimes, uns são atentados contra a vida, outros contra a honra, e outros contra os bens."
        },
        {
          "id": 4,
          "start": 33.38,
          "end": 39.34,
          "text": "Falaremos antes dos primeiros, que devem ser punidos com penas corporais."
        },
        {
          "id": 5,
          "start": 39.34,
          "end": 46.6,
          "text": "Os atentados contra a vida e a liberdade dos cidadãos estão no número dos grandes crimes."
        },
        {
          "id": 6,
          "start": 46.6,
          "end": 87.65,
          "text": "Compreendem-se, nessa classe, não somente os assassínios e os assaltos cometidos por homens do povo, mas, igualmente as violências da mesma natureza exercidas pelos grandes e pelos magistrados: crimes tanto mais graves quanto as ações dos homens elevados agem sobre a multidão com muito mais influência e os seus excessos destroem no espírito dos cidadãos as idéias de justiça e de dever, para substituir as do direito do mais forte: direito igualmente perigoso para quem dele abusa e para quem o sofre."
        },
        {
          "id": 7,
          "start": 87.65,
          "end": 108.7,
          "text": "Se os grandes e os ricos podem escapar a preço de dinheiro às penas que merecem os atentados contra a segurança do fraco e do pobre, as riquezas, que, sob a proteção das leis, são a recompensa da indústria, tornar-se-ão alimento da tirania e das iniqüidades."
        },
        {
          "id": 8,
          "start": 108.7,
          "end": 122.99,
          "text": "Não mais existe liberdade todas as vezes que as leis permitem que em certas circunstâncias um cidadão deixe de ser um homem para tornar-se uma coisa que se possa pôr a prêmio."
        },
        {
          "id": 9,
          "start": 122.99,
          "end": 138,
          "text": "Vê-se, então, a astúcia dos homens poderosos ocupada completamente com o aumento de sua força e dos seus privilégios, aproveitando todas as combinações que a lei lhes torna favoráveis."
        },
        {
          "id": 10,
          "start": 138,
          "end": 148.2,
          "text": "Eis o mágico segredo que transformou a massa dos cidadãos em bestas de carga; foi assim que os grandes acorrentaram escravos."
        },
        {
          "id": 11,
          "start": 148.2,
          "end": 156.61,
          "text": "É por isso que certos governos, que têm todas as aparências de liberdade, gemem sob uma tirania oculta."
        },
        {
          "id": 12,
          "start": 156.61,
          "end": 171.3,
          "text": "É pelos privilégios dos grandes que os usos tirânicos se fortificam insensivelmente, depois de se terem introduzido na constituição, por vias  que o legislador negligenciou fechar."
        },
        {
          "id": 13,
          "start": 171.3,
          "end": 189.83,
          "text": "Os homens sabem opor diques bastante fortes à tirania declarada; mas, muitas vezes, não vêem o inseto imperceptível que mina sua obra e que abre por fim, à torrente devastadora, uma estrada tanto mais segura quanto mais oculta."
        },
        {
          "id": 14,
          "start": 189.83,
          "end": 199.7,
          "text": "Quais serão, pois, as penas reservadas aos crimes dos nobres, cujos privilégios ocupam tão grande lugar na legislação da."
        },
        {
          "id": 15,
          "start": 199.7,
          "end": 201.5,
          "text": "maior parte dos povos?"
        },
        {
          "id": 16,
          "start": 201.5,
          "end": 242.22,
          "text": "Não examinarei se essa distinção hereditária entre plebeus e nobres é útil ao governo, ou necessária às monarquias; nem se é verdade que a nobreza é um poder intermediário próprio para conter em justos limites o povo e o soberano; nem se essa ordem isolada da sociedade não tem o inconveniente de reunir num círculo estreito todas as vantagens da indústria, todas as esperanças e toda a felicidade: como essas ilhotas encantadoras e férteis que se encontram no meio dos desertos terríveis da Arábia."
        },
        {
          "id": 17,
          "start": 242.22,
          "end": 262.29,
          "text": "Quando fosse verdade que a desigualdade é inevitável e mesmo útil na sociedade, é certo que só deveria existir entre os indivíduos e em virtude das dignidades e do mérito, mas não entre as ordens do Estado; que as distinções não devem permanecer."
        },
        {
          "id": 18,
          "start": 262.29,
          "end": 276.33,
          "text": "num só lugar, mas circular em todas as partes do corpo político; que as desigualdades sociais devem nascer e desaparecer a cada instante, mas não perpetuar-se nas famílias."
        },
        {
          "id": 19,
          "start": 276.33,
          "end": 290.29,
          "text": "Seja qual for a conclusão de todas essas questões, limitar-me-ei, a dizer que as penas das pessoas de mais alta linhagem devem ser as mesmas que as do último dos cidadãos."
        },
        {
          "id": 20,
          "start": 290.29,
          "end": 296.49,
          "text": "A igualdade civil é anterior a todas as distinções de honras, e de riquezas."
        },
        {
          "id": 21,
          "start": 296.49,
          "end": 304.98,
          "text": "Se todos os cidadãos não dependerem igualmente das mesmas leis, as distinções deixarão de ser legítimas."
        },
        {
          "id": 22,
          "start": 304.98,
          "end": 337.21,
          "text": "Deve supor-se que os homens, renunciando à liberdade despótica que receberam da natureza, para se reunirem em sociedade, disseram entre si: “Aquele que for mais industrioso obterá as maiores honras, a glória do seu nome passará aos seus descendentes; mas, não obstante as honras e as riquezas, não receará menos do que o último dos cidadãos a violação, das leis que o elevaram acima dos outros”."
        },
        {
          "id": 23,
          "start": 337.21,
          "end": 350.92,
          "text": "É verdade que não há assembléia geral do gênero humano em que se tenha aprovado semelhante decreto; este se funda, porém, na natureza imutável dos sentimentos do homem."
        },
        {
          "id": 24,
          "start": 350.92,
          "end": 368.22,
          "text": "A igualdade perante as leis não destrói as vantagens que os príncipes  julgam retirar da nobreza: apenas impede os inconvenientes das distinções e torna as leis respeitáveis, tirando toda esperança de impunidade."
        },
        {
          "id": 25,
          "start": 368.22,
          "end": 386.91,
          "text": "Dir-se-á, talvez, que a mesma pena, aplicada contra o nobre e contra o plebeu, torna-se completamente diversa e mais grave para o primeiro, por causa da educação que recebeu, e da infâmia que se espalha sobre uma família ilustre."
        },
        {
          "id": 26,
          "start": 386.91,
          "end": 396.14,
          "text": "Responderei no entanto, que o castigo se mede pelo dano causado à sociedade, e não pela sensibilidade do culpado."
        },
        {
          "id": 27,
          "start": 396.14,
          "end": 404.21,
          "text": "Ora, o exemplo do crime é tanto mais funesto quanto é dado por um cidadão de condição mais elevada."
        },
        {
          "id": 28,
          "start": 404.21,
          "end": 416.37,
          "text": "Acrescentarei que a igualdade da pena só pode ser exterior, e não pode ser proporcionada ao grau de sensibilidade, que é diferente em cada indivíduo."
        },
        {
          "id": 29,
          "start": 416.37,
          "end": 426.82,
          "text": "Quanto à infâmia que cobre uma família inocente, o soberano pode facilmente apagá-la com demonstrações públicas de benevolência."
        },
        {
          "id": 30,
          "start": 426.82,
          "end": 433.92,
          "text": "Sabe-se que tais demonstrações de favor têm foros de razão no povo crédulo e admirador."
        }
      ],
      "imagens": []
    },
    {
      "numero": 32,
      "id": "capitulo-28",
      "titulo": "Capítulo 28: Das injúrias",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 28 do clássico Dos Delitos e das Penas: Das injúrias.",
      "duracaoSegundos": 305,
      "duracaoFormatada": "05:05",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-28-injurias.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-28-injurias.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-28-injurias.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 11.73,
          "text": "AS injúrias pessoais, contrárias à honra, isto é, a essa justa porção de estima que todo homem tem o direito de esperar dos seus concidadãos, devem ser punidas pela infâmia."
        },
        {
          "id": 2,
          "start": 11.73,
          "end": 22.92,
          "text": "Há uma contradição notória entre as leis, ocupadas sobretudo com a proteção da fortuna e da vida de cada cidadão, e as leis do que se chama a honra, que preferem a ."
        },
        {
          "id": 3,
          "start": 22.92,
          "end": 23.94,
          "text": "opinião a tudo."
        },
        {
          "id": 4,
          "start": 23.94,
          "end": 32.96,
          "text": "A palavra honra é uma daquelas sobre as quais se fizeram os mais brilhantes raciocínios, sem ligar-se a nenhuma idéia fixa e precisa."
        },
        {
          "id": 5,
          "start": 32.96,
          "end": 44.49,
          "text": "Tal é a triste condição do espírito humano, que conhece melhor as revoluções dos corpos celestes do que as verdades que o tocam de perto e que importam em sua felicidade."
        },
        {
          "id": 6,
          "start": 44.49,
          "end": 53.71,
          "text": "As noções morais que mais o interessam lhe são incertas; só as entrevê cercadas de trevas e flutuando ao sabor do turbilhão das paixões."
        },
        {
          "id": 7,
          "start": 53.71,
          "end": 69.24,
          "text": "Esse fenômeno deixará de causar espanto quando se considerar que, semelhantes aos objetos que se confundem aos nossos olhos, porque estão próximos demais, as idéias morais, perdem a clareza por estarem demasiado ao nosso alcance."
        },
        {
          "id": 8,
          "start": 69.24,
          "end": 80.29,
          "text": "Apesar de sua simplicidade, discernimos com dificuldade os diversos princípios de moral e julgamos, muitas vezes sem conhecê-los, os sentimentos do coração humano."
        },
        {
          "id": 9,
          "start": 80.29,
          "end": 95.35,
          "text": "Quem observar com alguma atenção a natureza e os homens, não se admirará de todas essas coisas; pensará que, para ser feliz e tranqüilo, o homem talvez não tenha necessidade de tantas leis, nem de tão grande aparato moral."
        },
        {
          "id": 10,
          "start": 95.35,
          "end": 104.57,
          "text": "A idéia da honra é uma idéia complexa, formada não somente de várias idéias simples, mas também de várias idéias complexas por si mesma."
        },
        {
          "id": 11,
          "start": 104.57,
          "end": 125.25,
          "text": "Segundo os diferentes aspectos sob os quais a idéia da honra se apresenta ao espírito, algumas vezes ela encerra e outras exclui certos elementos que a compõem, só conservando nessas diferentes situações um pequeno número de elementos comuns, como várias quantidades algébricas admitindo um divisor comum."
        },
        {
          "id": 12,
          "start": 125.25,
          "end": 134.68,
          "text": "Para achar esse divisor comum das diferentes idéias que os homens fazem da honra, lancemos um rápido olhar sobre a formação das sociedades."
        },
        {
          "id": 13,
          "start": 134.68,
          "end": 147.02,
          "text": "As primeiras leis e os primeiros magistrados originaram-se da necessidade  de impedir os abusos que teria ocasionado o despotismo natural de todo homem mais robusto do que o vizinho."
        },
        {
          "id": 14,
          "start": 147.02,
          "end": 157.05,
          "text": "Foi esse o objeto do estabelecimento das sociedades e essa a base real ou aparente de todas as leis, mesmo as que encerram princípios de destruição."
        },
        {
          "id": 15,
          "start": 157.05,
          "end": 169.13,
          "text": "Mas, a aproximação dos homens e os progressos dos seus conhecimentos fizeram nascer em seguida uma infinidade de necessidades e ligações recíprocas entre os membros da sociedade."
        },
        {
          "id": 16,
          "start": 169.13,
          "end": 178.01,
          "text": "Nem todas essas necessidades tinham sido previstas pela lei, e os meios atuais de cada cidadão não lhe bastavam para satisfazê-las."
        },
        {
          "id": 17,
          "start": 178.01,
          "end": 190.55,
          "text": "Começou então a estabelecer-se o poder da opinião, por meio da qual podem obter-se certas vantagens que as leis não podiam proporcionar, e evitar males de que elas não podiam preservar."
        },
        {
          "id": 18,
          "start": 190.55,
          "end": 195.64,
          "text": "É a opinião que constitui, muitas vezes, o suplício do sábio e do medíocre."
        },
        {
          "id": 19,
          "start": 195.64,
          "end": 201.27,
          "text": "É ela que concede às aparências da virtude o respeito que recusa à própria virtude."
        },
        {
          "id": 20,
          "start": 201.27,
          "end": 208.66,
          "text": "É a opinião que de um vil celerado faz um missionário ardente, quando esconde seu interesse nessa hipocrisia."
        },
        {
          "id": 21,
          "start": 208.66,
          "end": 218.09,
          "text": "Sob o reinado da opinião, a estima dos outros homens não é somente útil, mas indispensável a quem permanecer ao nível dos seus concidadãos."
        },
        {
          "id": 22,
          "start": 218.09,
          "end": 230.9,
          "text": "O ambicioso procura os sufrágios da opinião que lhe serve os projetos; o homem vão mendiga-os, como um testemunho do próprio mérito; o homem de honra exige-os, porque não pode dispensá-los."
        },
        {
          "id": 23,
          "start": 230.9,
          "end": 241.68,
          "text": "Essa honra, que muita gente prefere à própria existência, só foi conhecida depois que os homens se reuniram em sociedade; não pode ser posta no depósito comum."
        },
        {
          "id": 24,
          "start": 241.68,
          "end": 255.38,
          "text": "O sentimento que nos liga à honra não é outra coisa senão uma volta momentânea ao estado de natureza, um movimento que nos subtrai por um instante a leis cuja proteção é insuficiente em certas ocasiões."
        },
        {
          "id": 25,
          "start": 255.38,
          "end": 265.08,
          "text": "Segue-se daí que, na extrema liberdade política, como na extrema dependência, as idéias de honra desaparecem ou se confundem com outras idéias."
        },
        {
          "id": 26,
          "start": 265.08,
          "end": 274.3,
          "text": "Num estado de liberdade ilimitada, as leis protegem tão fortemente que não se tem necessidade de buscar os sufrágios da opinião pública."
        },
        {
          "id": 27,
          "start": 274.3,
          "end": 284.07,
          "text": "No estado de escravidão absoluta, o despotismo, que anula a existência civil, só deixa a cada indivíduo uma personalidade precária e momentânea."
        },
        {
          "id": 28,
          "start": 284.07,
          "end": 292.34,
          "text": "A honra só é, pois, um princípio fundamental nas monarquias temperadas, onde o despotismo do senhor é limitado pelas leis."
        },
        {
          "id": 29,
          "start": 292.34,
          "end": 298.51,
          "text": "A honra produz quase, numa monarquia, o efeito que produz a revolta nos Estados despóticos."
        },
        {
          "id": 30,
          "start": 298.51,
          "end": 305.5,
          "text": "O  súdito entra por um momento no estado de natureza e o soberano tem a recordação da antiga igualdade."
        }
      ],
      "imagens": []
    },
    {
      "numero": 33,
      "id": "capitulo-29",
      "titulo": "Capítulo 29: Dos duelos",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 29 do clássico Dos Delitos e das Penas: Dos duelos.",
      "duracaoSegundos": 122,
      "duracaoFormatada": "02:02",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-29-duelos.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-29-duelos.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-29-duelos.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 10.87,
          "text": "A HONRA, que não é senão a necessidade dos sufrágios públicos, deu nascimento aos combates singulares, que só puderam estabelecer-se na desordem das más leis."
        },
        {
          "id": 2,
          "start": 10.87,
          "end": 23.8,
          "text": "Se os duelos não estiveram em uso na antigüidade, como algumas pessoas o crêem, é que os antigos não se reuniam armados com um ar de desconfiança, nos templos, no teatro e entre os amigos."
        },
        {
          "id": 3,
          "start": 23.8,
          "end": 38.52,
          "text": "Talvez também, sendo o duelo um espetáculo muito comum que vis escravos davam ao povo, os homens livres tivessem receio de que os combates singulares não bastassem para que eles fossem considerados homens honrados."
        },
        {
          "id": 4,
          "start": 38.52,
          "end": 45.26,
          "text": "Seja como for, é em vão que se experimentou entre os modernos impedir os duelos com pena de morte."
        },
        {
          "id": 5,
          "start": 45.26,
          "end": 53.86,
          "text": "Essas leis severas não puderam destruir um costume fundado numa espécie de honra, mais cara aos homens do que a própria vida."
        },
        {
          "id": 6,
          "start": 53.86,
          "end": 73.81,
          "text": "O cidadão que recusa um duelo vê-se presa do desprezo dos seus concidadãos; é forçado a levar uma vida solitária, a renunciar aos encantos da sociedade, ou a expor-se constantemente aos insultos e à vergonha, cujos repetidos golpes o afetam de maneira mais cruel do que a idéia do suplício."
        },
        {
          "id": 7,
          "start": 73.81,
          "end": 80.41,
          "text": "Por que motivo serão os duelos menos freqüentes entre os homens do povo do que entre os grandes?"
        },
        {
          "id": 8,
          "start": 80.41,
          "end": 93.69,
          "text": "É somente porque o povo não traz espada, é porque tem menos necessidade de sufrágios públicos do que os homens de condição mais elevada, que se observam entre si com mais desconfiança e inveja."
        },
        {
          "id": 9,
          "start": 93.69,
          "end": 121.75,
          "text": "Não é inútil repetir aqui o que já se disse certa vez: que o melhor meio de impedir o duelo é punir o agressor, isto é, aquele que deu lugar à querela, a declarar inocente aquele que, sem procurar tirar a espada, se viu constrangido a defender a própria honra, isto é, a opinião, que as leis não protegem suficientemente, e mostrar aos seus concidadãos que pode respeitar as leis, mas que não teme os homens."
        }
      ],
      "imagens": []
    },
    {
      "numero": 34,
      "id": "capitulo-30",
      "titulo": "Capítulo 30: Do roubo",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 30 do clássico Dos Delitos e das Penas: Do roubo.",
      "duracaoSegundos": 119,
      "duracaoFormatada": "01:59",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-30-roubo.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-30-roubo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-30-roubo.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 5.34,
          "text": "UM roubo cometido sem violência só deveria ser punido com uma pena pecuniária."
        },
        {
          "id": 2,
          "start": 5.34,
          "end": 9.52,
          "text": "É justo que quem rouba o bem de outrem seja despojado do seu."
        },
        {
          "id": 3,
          "start": 9.52,
          "end": 39.65,
          "text": "Mas, se o roubo é ordinariamente o crime da miséria e do desespero, se esse delito só é cometido por essa classe de homens infortunados, a quem o direito de propriedade (direito terrível e talvez desnecessário) só deixou a existência como único bem, as penas pecuniárias contribuirão simplesmente para multiplicar os roubos, aumentando o número dos indigentes, arrancando o pão a uma família inocente, para dá-lo a um rico talvez criminoso."
        },
        {
          "id": 4,
          "start": 39.65,
          "end": 60.67,
          "text": "A pena mais natural do roubo será, pois, essa espécie de escravidão, que é a única que se pode chamar justa, isto é, a escravidão temporária, que torna a sociedade senhora absoluta da pessoa e do trabalho do culpado, para fazê-lo expiar, por essa dependência, o dano que causou e a violação do pacto social."
        },
        {
          "id": 5,
          "start": 60.67,
          "end": 67.04,
          "text": "Se, porém, o roubo é acompanhado de violência, é justo ajuntar à servidão as penas corporais."
        },
        {
          "id": 6,
          "start": 67.04,
          "end": 81.49,
          "text": "Outros escritores mostraram, antes de mim, os inconvenientes graves que resultam do uso de aplicar as mesmas penas contra os roubos cometidos com violência e contra aqueles em que o ladrão só empregou a astúcia."
        },
        {
          "id": 7,
          "start": 81.49,
          "end": 88.2,
          "text": "Fez- se ver quanto é absurdo pôr na mesma balança uma certa soma de dinheiro e a vida de um homem."
        },
        {
          "id": 8,
          "start": 88.2,
          "end": 103.67,
          "text": "O roubo com violência e o roubo de astúcia são delitos absolutamente diferentes; e a sã política deve admitir, ainda mais do que as matemáticas, o axioma certo de que entre dois objetos heterogêneos, há uma distância infinita."
        },
        {
          "id": 9,
          "start": 103.67,
          "end": 110.18,
          "text": "Essas coisas foram ditas; mas, é sempre útil repetir verdades que jamais se puseram em prática."
        },
        {
          "id": 10,
          "start": 110.18,
          "end": 118.87,
          "text": "Os corpos políticos conservam por muito tempo o movimento recebido; é, porém, moroso e difícil imprimir-lhes um novo movimento."
        }
      ],
      "imagens": []
    },
    {
      "numero": 35,
      "id": "capitulo-31",
      "titulo": "Capítulo 31: Do contrabando",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 31 do clássico Dos Delitos e das Penas: Do contrabando.",
      "duracaoSegundos": 160,
      "duracaoFormatada": "02:40",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-31-contrabando.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-31-contrabando.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-31-contrabando.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 13.13,
          "text": "O CONTRABANDO é um verdadeiro delito, que ofende o soberano e a nação, mas cuja pena não deveria ser infamante, porque a opinião pública não empresta nenhuma infâmia a essa espécie de delito."
        },
        {
          "id": 2,
          "start": 13.13,
          "end": 22.68,
          "text": "Porque, pois, o contrabando, que é um roubo feito ao príncipe, e por conseguinte à nação, não acarreta a infâmia sobre aquele que o exerce?"
        },
        {
          "id": 3,
          "start": 22.68,
          "end": 31.48,
          "text": "É que os delitos que os homens não consideram nocivos aos seus interesses não afetam bastante para excitar a indignação pública."
        },
        {
          "id": 4,
          "start": 31.48,
          "end": 32.86,
          "text": "Tal é o contrabando."
        },
        {
          "id": 5,
          "start": 32.86,
          "end": 42.69,
          "text": "Os homens, sobre os quais as conseqüências remotas de um ato só produzem impressões fracas, não vêem o dano que o contrabando pode causar-lhes."
        },
        {
          "id": 6,
          "start": 42.69,
          "end": 46.88,
          "text": "Chegam mesmo, às vezes, a retirar dele vantagens momentâneas."
        },
        {
          "id": 7,
          "start": 46.88,
          "end": 60.42,
          "text": "Não vêem senão o mal causado ao príncipe, e, para recusarem estima ao culpado, só têm uma razão premente contra o ladrão, o falsário e alguns outros criminosos que podem prejudicá-los pessoalmente."
        },
        {
          "id": 8,
          "start": 60.42,
          "end": 69.36,
          "text": "Essa maneira de sentir é conseqüência do princípio incontestável de que todo ser sensível só se interessa pelos males que conhece."
        },
        {
          "id": 9,
          "start": 69.36,
          "end": 96.99,
          "text": "O contrabando é um delito gerado pelas próprias leis, porque, quanto mais se aumentam os direitos, tanto maior é a vantagem do contrabando; a tentação de exercê-lo é também tão forte quanto mais fácil é cometer essa espécie de delito, sobretudo se os objetos proibidos são de pequeno volume, e se são interditos numa tão grande circunferência de território que a extensão deste torne difícil guardá-lo."
        },
        {
          "id": 10,
          "start": 96.99,
          "end": 105.86,
          "text": "O confisco das mercadorias proibidas, e mesmo de tudo o que se acha apreendido com objetos de contrabando, é uma pena justíssima."
        },
        {
          "id": 11,
          "start": 105.86,
          "end": 117.82,
          "text": "Para torná- lo mais eficaz, seria preciso que os direitos fossem pouco consideráveis; pois os homens só se arriscam na proporção do lucro que o êxito possa proporcionar-lhes."
        },
        {
          "id": 12,
          "start": 117.82,
          "end": 122.98,
          "text": "Será, porém, o caso de deixar impune o culpado que não tem nada que perder?"
        },
        {
          "id": 13,
          "start": 122.98,
          "end": 123.25,
          "text": "Não."
        },
        {
          "id": 14,
          "start": 123.25,
          "end": 142.43,
          "text": "Os impostos são parte tão essencial e tão difícil numa boa legislação, e estão de tal modo comprometidos em certas espécies de contrabando, que tal delito merece uma pena considerável, como a prisão e mesmo a servidão, mas uma prisão e uma servidão análogas à natureza do delito."
        },
        {
          "id": 15,
          "start": 142.43,
          "end": 160.44,
          "text": "Por exemplo, a prisão de um contrabandista de fumo não deve ser a do assassino ou a do ladrão; e, sem dúvida, o castigo mais conveniente ao gênero do delito seria aplicar à utilidade do fisco a servidão e o trabalho daquele que pretendeu fraudar-lhe os direitos."
        }
      ],
      "imagens": []
    },
    {
      "numero": 36,
      "id": "capitulo-32",
      "titulo": "Capítulo 32: Das falências",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 32 do clássico Dos Delitos e das Penas: Das falências.",
      "duracaoSegundos": 356,
      "duracaoFormatada": "05:56",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-32-falencias.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-capitulo-32-falencias.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-32-falencias.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 14.23,
          "text": "O LEGISLADOR que percebe o preço da boa fé nos contratos, e que quer proteger a segurança do comércio, deve dar recurso aos credores sobre a pessoa mesma dos seus devedores, quando estes abrem falência."
        },
        {
          "id": 2,
          "start": 14.23,
          "end": 19.37,
          "text": "Importa, porém, não confundir o falido fraudulento com o que é de boa fé."
        },
        {
          "id": 3,
          "start": 19.37,
          "end": 34.09,
          "text": "O primeiro deveria ser punido como o são os moedeiros falsos, porque não é maior o crime de falsificar o metal amoedado, que constitui a garantia dos homens entre si, do que falsificar essas obrigações mesmas."
        },
        {
          "id": 4,
          "start": 34.09,
          "end": 53.32,
          "text": "Mas, o falido de boa fé, o infeliz que pode provar evidentemente aos seus juizes que a infidelidade de outrem, as perdas dos seus correspondentes, ou enfim contratempos que a prudência humana não poderia evitar, o despojaram dos seus bens, deve ser tratado com menos rigor."
        },
        {
          "id": 5,
          "start": 53.32,
          "end": 67.62,
          "text": "Por que motivos bárbaros ousar-se-á mergulhá-lo nas masmorras, privá-lo do único bem que lhe resta na miséria, a liberdade, e confundi-lo com os criminosos e forçá-lo a arrepender-se de ter sido honesto?"
        },
        {
          "id": 6,
          "start": 67.62,
          "end": 73.18,
          "text": "Vivia tranqüilo, ao abrigo de sua probidade, e contava com a proteção das leis."
        },
        {
          "id": 7,
          "start": 73.18,
          "end": 96.35,
          "text": "Se as violou, é que não estava em seu poder conformar-se exatamente a essas leis severas, que o poder e a avidez insensível impuseram e que o pobre aceitou seduzido pela esperança que subsiste sempre no coração do homem e que o faz acreditar que todos os acontecimentos felizes serão para ele e todas as desgraças para os outros."
        },
        {
          "id": 8,
          "start": 96.35,
          "end": 114.74,
          "text": "O medo de ser ofendido predomina geralmente na alma sobre a vontade de prejudicar; e os homens, entregando-se às suas primeiras impressões, amam as leis cruéis, se bem que seja do seu interesse viver sob leis brandas, pois eles próprios estão submetidos a elas."
        },
        {
          "id": 9,
          "start": 114.74,
          "end": 139.39,
          "text": "Mas, voltemos ao falido de boa fé: não o desobriguem de sua dívida senão depois que ele a tiver pago inteiramente; recusem-lhe o direito de subtrair- se aos credores sem o consentimento destes, e a liberdade de levar adiante sua indústria; forcem-no a empregar seu trabalho e seus talentos no pagamento do que deve, proporcionalmente aos seus lucros."
        },
        {
          "id": 10,
          "start": 139.39,
          "end": 146.78,
          "text": "Mas, sob nenhum pretexto legítimo, não se poderá fazê-lo sofrer uma prisão injusta e inútil aos credores."
        },
        {
          "id": 11,
          "start": 146.78,
          "end": 156.22,
          "text": "Dir-se-á, talvez, que os horrores da prisão obrigarão o falido a revelar as  trapaças que ocasionaram uma falência suspeita de fraude."
        },
        {
          "id": 12,
          "start": 156.22,
          "end": 165.45,
          "text": "É bem raro, porém, que essa espécie de tortura seja necessária, se se fizer um exame rigoroso da conduta e dos negócios do acusado."
        },
        {
          "id": 13,
          "start": 165.45,
          "end": 170.94,
          "text": "Se a fraude do falido for muito duvidosa, será melhor optar por sua inocência."
        },
        {
          "id": 14,
          "start": 170.94,
          "end": 184.47,
          "text": "Há uma máxima geralmente certa em legislação, segundo a qual a impunidade de um culpado tem graves inconvenientes; mas, a impunidade é pouco perigosa quando o delito é difícil de constatar-se."
        },
        {
          "id": 15,
          "start": 184.47,
          "end": 193.62,
          "text": "Alegar-se-á também a necessidade de proteger os interesses do comércio, assim como o direito de propriedade, que deve ser sagrado."
        },
        {
          "id": 16,
          "start": 193.62,
          "end": 202.15,
          "text": "Mas, o comércio e o direito de propriedade não são o fim do pacto social, são apenas meios que podem conduzir a esse fim."
        },
        {
          "id": 17,
          "start": 202.15,
          "end": 223.42,
          "text": "Se se submeterem todos os membros da sociedade a leis cruéis, para preservá-los dos inconvenientes que são as conseqüências naturais do estado social, isso será faltar ao fim procurando atingi-lo; e esse é o erro funesto que perde o espírito humano em todas as ciências, mas sobretudo na política (17)."
        },
        {
          "id": 18,
          "start": 223.42,
          "end": 236.38,
          "text": "Poder-se-ia distinguir a fraude do delito grave, mas menos odioso, e fazer uma diferença entre o delito grave e a pequena falta, que seria preciso separar também da perfeita inocência."
        },
        {
          "id": 19,
          "start": 236.38,
          "end": 242.36,
          "text": "No primeiro caso, aplicar-se-iam ao culpado as penas aplicáveis ao crime de falsário."
        },
        {
          "id": 20,
          "start": 242.36,
          "end": 247.58,
          "text": "O segundo delito seria punido com penas menores, com a perda da liberdade."
        },
        {
          "id": 21,
          "start": 247.58,
          "end": 262.51,
          "text": "Deixar-se-ia ao falido inteiramente inocente a escolha dos meios que desejasse empregar para estabelecer os seus negócios; e, no caso de um delito leve, dar-se-ia aos credores o direito de prescrever esses meios."
        },
        {
          "id": 22,
          "start": 262.51,
          "end": 273.28,
          "text": "Mas, a distinção entre faltas graves e leves deve ser obra da lei, que é a única imparcial; seria perigoso abandoná-la à prudência arbitrária de um juiz."
        },
        {
          "id": 23,
          "start": 273.28,
          "end": 282.72,
          "text": "É tão necessário fixar limites na política quanto nas ciências matemáticas, porque o bem público se mede como os espaços e a extensão."
        },
        {
          "id": 24,
          "start": 282.72,
          "end": 295.12,
          "text": "Seria fácil ao legislador previdente impedir a maior parte das falências fraudulentas e remediar a desgraça do homem laborioso, que falta aos seus compromissos sem ser culpado."
        },
        {
          "id": 25,
          "start": 295.12,
          "end": 315.47,
          "text": "Possam todos os cidadãos consultar a cada instante os registros públicos, nos quais se terá uma nota exata de todos os contratos; e que contribuições sabiamente repartidas entre os comerciantes felizes formem um banco, do qual se tirem somas convenientes para socorrer a indústria infeliz."
        },
        {
          "id": 26,
          "start": 315.47,
          "end": 321.25,
          "text": "Tais estabelecimentos só poderão ter vantagens numerosas, sem inconvenientes real."
        },
        {
          "id": 27,
          "start": 321.25,
          "end": 340.69,
          "text": "Mas essas leis fáceis, a um tempo tão simples e tão sublimes; essas leis que esperam apenas o sinal do legislador para espalhar sobre as nações a abundância e a força; essas leis que seriam motivo de reconhecimento eterno de todas as gerações, são desconhecidas ou rejeitadas."
        },
        {
          "id": 28,
          "start": 340.69,
          "end": 356.18,
          "text": "Um espírito de hesitação, idéias estreitas, a tímida prudência do momento, uma rotina obstinada, que teme as inovações mais úteis: tais são os móveis ordinários dos legisladores que regulam o destino da fraca humanidade."
        }
      ],
      "imagens": []
    },
    {
      "numero": 37,
      "id": "capitulo-33",
      "titulo": "Capítulo 33: Dos delitos que perturbam a tranquilidade pública",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 33 do clássico Dos Delitos e das Penas: Dos delitos que perturbam a tranquilidade pública.",
      "duracaoSegundos": 153,
      "duracaoFormatada": "02:33",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-33-dos-delitos-que-perturbam-a-tranquilidade-publica.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-33-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-33-dos-delitos-que-perturbam-a-tranquilidade-publica.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 38.76,
          "text": "TRANQÜILIDADE PÚBLICA A TERCEIRA espécie de delitos que distinguimos compreende os que perturbam particularmente o repouso e a tranqüilidade pública: as querelas e o tumulto de pessoas que se batem na via pública, destinada ao comércio e à passagem dos cidadãos, e os discursos fanáticos que excitam facilmente as paixões de uma populaça curiosa e que emprestam grande força da multidão dos auditores e sobretudo um certo entusiasmo obscuro e misterioso, com poder bem maior sobre o espírito do povo do que a tranqüila razão, cuja linguagem a multidão não entende."
        },
        {
          "id": 2,
          "start": 38.76,
          "end": 78.9,
          "text": "Iluminar as cidades durante a noite à custa do público; colocar guardas de segurança nos diversos bairros das cidades; reservar ao silêncio e à tranqüilidade sagrada dos templos, protegidos pelo governo, os discursos de moral religiosa, e as arengas destinadas a sustentar os interesses particulares e públicos às assembléias da nação, aos parlamentos aos lugares, enfim, onde reside a majestade soberana: tais são as medidas próprias para prevenir a perigosa fermentação das paixões populares; e são esses os principais objetos que devem ocupar a vigilância do magistrado de polícia."
        },
        {
          "id": 3,
          "start": 78.9,
          "end": 99.93,
          "text": "Mas, se esse magistrado não age segundo leis conhecidas e familiares a todos os cidadãos; se pode, ao contrário, fazer ao seu capricho leis que julga serem necessárias, abre assim a porta à tirania, que ronda sem cessar em torno das barreiras que a liberdade pública lhe fixou e que só procura transpô-las."
        },
        {
          "id": 4,
          "start": 99.93,
          "end": 110.65,
          "text": "Creio não haver exceção à regra geral de que os cidadãos devem saber o que precisam fazer para serem culpados, e o que precisam evitar para serem inocentes."
        },
        {
          "id": 5,
          "start": 110.65,
          "end": 121.99,
          "text": "Um governo que tem necessidade de censores, ou de qualquer outra espécie de magistrados arbitrários, prova que é mal organizado e que sua constituição não tem força."
        },
        {
          "id": 6,
          "start": 121.99,
          "end": 132.23,
          "text": "Num país em que o destino dos cidadãos está entregue à incerteza, a tirania oculta imola mais vítimas do que o tirano mais cruel que age abertamente."
        },
        {
          "id": 7,
          "start": 132.23,
          "end": 134.71,
          "text": "Este ultimo revolta, mas não avilta."
        },
        {
          "id": 8,
          "start": 134.71,
          "end": 152.71,
          "text": "O verdadeiro tirano começa sempre reinando sobre a opinião; quando é senhor dela, apressa-se a comprimir as almas corajosas, das quais tem tudo que temer, porque só se apresentam com o archote da verdade, quer no fogo das paixões, quer na ignorância dos perigos."
        }
      ],
      "imagens": []
    },
    {
      "numero": 38,
      "id": "capitulo-34",
      "titulo": "Capítulo 34: Da ociosidade",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 34 do clássico Dos Delitos e das Penas: Da ociosidade.",
      "duracaoSegundos": 105,
      "duracaoFormatada": "01:45",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-34-da-ociosidade.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-34-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-34-da-ociosidade.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 26.77,
          "text": "OS governos sábios não sofrem, no seio do trabalho e da indústria, uma espécie de ociosidade que é contrária ao fim político do estado social: quero falar de certas pessoas ociosas e inúteis que não dão à sociedade nem trabalho nem riquezas, que acumulam sempre sem jamais perder, que o vulgo respeita com uma admiração estúpida e que são aos olhos do sábio um objeto de desprezo."
        },
        {
          "id": 2,
          "start": 26.77,
          "end": 47.19,
          "text": "Quero falar de certas pessoas que não conhecem necessidade de administrar ou aumentar as comodidades da vida, único motivo capaz de excitar a atividade humana, e que indiferentes à prosperidade do Estado, só se inflamam com paixão por opiniões que lhes agradam, mas que podem ser perigosas."
        },
        {
          "id": 3,
          "start": 47.19,
          "end": 55.5,
          "text": "Austeros declamadores confundiram essa espécie de ociosidade com a que é fruto das riquezas adquiridas pela indústria."
        },
        {
          "id": 4,
          "start": 55.5,
          "end": 65.79,
          "text": "Cabe exclusivamente às leis, e não à virtude rígida (mas fechada em idéias estreitas) de alguns censores, definir a espécie de ociosidade punível."
        },
        {
          "id": 5,
          "start": 65.79,
          "end": 94.81,
          "text": "Não se pode encarar como ociosidade funesta em política aquela que, gozando do fruto dos vícios ou das virtudes de alguns antepassados, dá contudo pão e existência à pobreza industriosa, da troca dos prazeres atuais que recebe desta e que põe o pobre na contingência de travar a guerra pacífica que a indústria sustenta contra a opulência e que sucedeu aos combates sangrentos e incertos da força contra a força."
        },
        {
          "id": 6,
          "start": 94.81,
          "end": 104.81,
          "text": "Essa espécie de ociosidade pode mesmo tornar-se vantajosa, à medida que a sociedade aumenta e que o governo deixa aos cidadãos mais liberdade."
        }
      ],
      "imagens": []
    },
    {
      "numero": 39,
      "id": "capitulo-35",
      "titulo": "Capítulo 35: Do suicídio",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 35 do clássico Dos Delitos e das Penas: Do suicídio.",
      "duracaoSegundos": 420,
      "duracaoFormatada": "07:00",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-35-do-suicidio.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-35-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-35-do-suicidio.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 12.66,
          "text": "O SUICÍDIO é um delito que parece não poder ser submetido a nenhuma pena propriamente dita; pois essa pena só poderia recair sobre um corpo insensível e sem vida, ou sobre inocentes."
        },
        {
          "id": 2,
          "start": 12.66,
          "end": 26.16,
          "text": "Ora, o castigo que se aplicasse contra os restos inanimados do culpado não poderia produzir outra impressão sobre os espectadores senão a que estes experimentariam ao verem fustigar uma estátua."
        },
        {
          "id": 3,
          "start": 26.16,
          "end": 35.62,
          "text": "Se a pena é aplicada à família inocente, ela é odiosa e tirânica, porque já não há liberdade quando as penas não são puramente pessoais."
        },
        {
          "id": 4,
          "start": 35.62,
          "end": 62.97,
          "text": "Os homens amam demasiado a vida; estão ligados a ela por todos os objetos que os cercam; a imagem sedutora do prazer e a doce esperança, amável feiticeira que mistura algumas gotas de felicidade ao licor envenenado dos males que ingerimos a grandes tragos, encantam muito fortemente os corações dos mortais, para que se possa temer que a impunidade contribua para tornar o suicídio mais comum."
        },
        {
          "id": 5,
          "start": 62.97,
          "end": 72.5,
          "text": "Se se obedece às leis pelo temor de um suplício doloroso, aquele que se mata nada tem que temer, pois a morte destrói toda sensibilidade."
        },
        {
          "id": 6,
          "start": 72.5,
          "end": 77.44,
          "text": "Não é, pois, esse motivo que poderá deter a mão desesperada do suicida."
        },
        {
          "id": 7,
          "start": 77.44,
          "end": 84.54,
          "text": "Mas, aquele que se mata faz menos mal à sociedade do que aquele que renuncia para sempre à sua pátria."
        },
        {
          "id": 8,
          "start": 84.54,
          "end": 91.7,
          "text": "O primeiro deixa tudo ao seu país, ao passo que o outro lhe rouba sua pessoa e uma parte dos seus bens."
        },
        {
          "id": 9,
          "start": 91.7,
          "end": 92.47,
          "text": "Direi mais."
        },
        {
          "id": 10,
          "start": 92.47,
          "end": 105.2,
          "text": "Como a força de uma nação consiste no número dos cidadãos, aquele que abandona o seu país para entregar-se a outro causa à sociedade o dobro do prejuízo que lhe pode causar o suicida."
        },
        {
          "id": 11,
          "start": 105.2,
          "end": 115.85,
          "text": "A questão reduz-se, pois, a saber se é útil ou perigoso à sociedade deixar a cada um dos membros que a compõem uma liberdade perpétua de afastar-se dela."
        },
        {
          "id": 12,
          "start": 115.85,
          "end": 125.31,
          "text": "Toda lei que não é forte por si mesma, toda lei cuja execução pode ser impedida em certas circunstâncias, jamais deveria ser promulgada."
        },
        {
          "id": 13,
          "start": 125.31,
          "end": 151.54,
          "text": "A opinião, que governa os espíritos, obedece às impressões lentas e indiretas que o legislador sabe dar-lhe; resiste, porém, aos seus esforços, quando são violentos e diretos; e as leis inúteis, que logo são desprezadas, comunicam seu aviltamento às leis mais salutares, que costumam ser vistas antes como obstáculos a vencer do que como a salvaguarda da tranqüilidade pública."
        },
        {
          "id": 14,
          "start": 151.54,
          "end": 165.25,
          "text": "Ora, como a energia dos nossos sentimentos é limitada, se se quiser obrigar os homens a respeitar objetos estranhos ao bem da sociedade, eles terão menos veneração pelas leis verdadeiramente úteis."
        },
        {
          "id": 15,
          "start": 165.25,
          "end": 180.07,
          "text": "Não me deterei no desenvolvimento das conseqüências vantajosas que um sábio dispensador da felicidade pública poderá tirar desse princípio; procurarei apenas provar que não é necessário fazer do Estado uma prisão."
        },
        {
          "id": 16,
          "start": 180.07,
          "end": 197.53,
          "text": "Uma lei que tentasse tirar aos cidadãos a liberdade de abandonar seu país, seria uma lei inútil; porque, a menos que rochedos inacessíveis ou mares impraticáveis separem esse país de todos os outros, como guardar todos os pontos de sua circunferência?"
        },
        {
          "id": 17,
          "start": 197.53,
          "end": 199.83,
          "text": "Como guardar os próprios guardas?"
        },
        {
          "id": 18,
          "start": 199.83,
          "end": 207.83,
          "text": "O imigrante que leva tudo o que possui não deixa nada sobre que as leis possam fazer cair a pena com que o ameaçam."
        },
        {
          "id": 19,
          "start": 207.83,
          "end": 224.94,
          "text": "Seu delito já não pode ser punido, desde que foi cometido; e infligir-lhe um castigo antes que ele seja consumado, é punir a intenção e não o fato, é exercer um poder tirano sobre o pensamento, sempre livre e sempre independente das leis humanas."
        },
        {
          "id": 20,
          "start": 224.94,
          "end": 229.6,
          "text": "Tentar-se-á punir o fugitivo com o confisco dos bens que ele deixa?"
        },
        {
          "id": 21,
          "start": 229.6,
          "end": 238.79,
          "text": "Mas a conclusão, que não se pode impedir por pouco que se respeitem os contratos dos cidadãos entre si, tornaria esse meio ilusório."
        },
        {
          "id": 22,
          "start": 238.79,
          "end": 257.78,
          "text": "Além disso, semelhante lei destruiria todo comércio entre as nações; e, se se punisse o emigrado, no caso dele regressar aos país, isso significaria impedi-lo de reparar o prejuízo que causou à sociedade e banir para sempre aquele que uma vez se tivesse afastado da pátria."
        },
        {
          "id": 23,
          "start": 257.78,
          "end": 268.85,
          "text": "Enfim, a proibição de sair de um país só faz aumentar, em quem o habita, o desejo de abandoná-lo, ao passo que desvia os estrangeiros de nele se estabelecerem."
        },
        {
          "id": 24,
          "start": 268.85,
          "end": 282.2,
          "text": "Que se deve, pois, pensar de um governo que não tem outro meio senão o temor, para reter os homens em sua pátria, à qual eles estão naturalmente ligados pelas primeiras impressões da infância?"
        },
        {
          "id": 25,
          "start": 282.2,
          "end": 289.51,
          "text": "A maneira mais certa de fixar os homens em sua pátria é aumentar o bem- estar respectivo de cada cidadão."
        },
        {
          "id": 26,
          "start": 289.51,
          "end": 306.49,
          "text": "Do mesmo modo que todo governo deve empregar os maiores esforços para fazer pender a seu favor a balança do comércio, assim também o maior interesse do soberano e da nação é que a soma de felicidade seja aí maior do que entre os povos vizinhos."
        },
        {
          "id": 27,
          "start": 306.49,
          "end": 323.88,
          "text": "Os prazeres do luxo não são os principais elementos dessa felicidade: embora impedindo as riquezas de se reunirem numa só mão, eles se tornam um remédio necessário à desigualdade, que toma mais força à medida que a sociedade faz mais progressos (18)."
        },
        {
          "id": 28,
          "start": 323.88,
          "end": 344.96,
          "text": "Mas, os prazeres do luxo são a base da felicidade pública, num país em que a segurança dos bens e a liberdade das pessoas dependem exclusivamente das leis, porque então esses prazeres favorecem a população; ao passo que se tornam um instrumento de tirania para um povo cujos direitos não são garantidos."
        },
        {
          "id": 29,
          "start": 344.96,
          "end": 369.11,
          "text": "Assim como os animais mais generosos e os livres habitantes dos ares preferem as solidões inacessíveis e as florestas longínquas, onde sua liberdade não corre risco, aos campos alegres e férteis, que o homem, seu inimigo, semeou de armadilhas, assim também os homens evitam o próprio prazer, quando este lhes é oferecido pela mão dos tiranos (19)."
        },
        {
          "id": 30,
          "start": 369.11,
          "end": 379.4,
          "text": "Está, pois, demonstrado que a lei que prende os cidadãos ao seu país é inútil e injusta; e o mesmo juízo deve ser feito sobre a que pune o suicídio."
        },
        {
          "id": 31,
          "start": 379.4,
          "end": 386.5,
          "text": "Trata-se de um crime que Deus pune após a morte do culpado, e somente Deus pode punir depois da morte."
        },
        {
          "id": 32,
          "start": 386.5,
          "end": 394.29,
          "text": "Não é, porém, um crime perante os homens, porque o castigo recai sobre a família inocente e não sobre o culpado."
        },
        {
          "id": 33,
          "start": 394.29,
          "end": 419.69,
          "text": "Se me objetarem que o medo desse castigo pode, contudo, deter a mão do infeliz determinado a morrer, responderei que quem renuncia tranqüilamente à doçura de viver e odeia bastante a existência terrena para preferir-lhe uma eternidade talvez infeliz, não se comoverá decerto com a consideração remota e menos forte da vergonha que o crime atrairá sobre sua família."
        }
      ],
      "imagens": []
    },
    {
      "numero": 40,
      "id": "capitulo-36",
      "titulo": "Capítulo 36: De certos delitos difíceis de constatar",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 36 do clássico Dos Delitos e das Penas: De certos delitos difíceis de constatar.",
      "duracaoSegundos": 337,
      "duracaoFormatada": "05:37",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-36-de-certos-delitos-dificeis-de-constatar.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-36-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-36-de-certos-delitos-dificeis-de-constatar.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 6.48,
          "text": "COMETEM-SE na sociedade certos delitos que são bastante freqüentes, mas que é difícil provar."
        },
        {
          "id": 2,
          "start": 6.48,
          "end": 10.04,
          "text": "Tais são o adultério, a pederastia, o infanticídio."
        },
        {
          "id": 3,
          "start": 10.04,
          "end": 23.07,
          "text": "O adultério é um crime que, considerado sob o ponto de vista político, só é tão freqüente porque as leis não são fixas e porque os dois sexos são naturalmente atraídos um pelo outro (20)."
        },
        {
          "id": 4,
          "start": 23.07,
          "end": 32.12,
          "text": "Se eu falasse a povos ainda privados das luzes da religião, diria que há uma grande diferença entre esse delito e todos os outros."
        },
        {
          "id": 5,
          "start": 32.12,
          "end": 51.5,
          "text": "O adultério é produzido pelo abuso de uma necessidade constante, comum a todos os mortais, anterior à sociedade; ao passo que os outros delitos, que tendem mais ou menos à destruição do pacto social, são antes o efeito das paixões do momento do que das necessidades da natureza."
        },
        {
          "id": 6,
          "start": 51.5,
          "end": 65.08,
          "text": "Os que leram a história e estudaram os homens podem reconhecer que o número dos delitos produzidos pela tendência de um sexo para outro é, no mesmo clima, sempre igual a uma quantidade constante."
        },
        {
          "id": 7,
          "start": 65.08,
          "end": 82.3,
          "text": "Se assim é, toda lei, todo costume cujo fim fosse diminuir a soma total dos efeitos dessa paixão, seria inútil e até funesta, porque o efeito dessa lei seria sobrecarregar uma porção da sociedade com suas próprias necessidades e com as dos outros."
        },
        {
          "id": 8,
          "start": 82.3,
          "end": 97.42,
          "text": "O partido mais sábio seria, pois, seguir até certo ponto o declive do rio das paixões e dividir-lhe o curso num número de regatos suficientes para impedir em toda parte dois excessos contrários, a seca e as enchentes."
        },
        {
          "id": 9,
          "start": 97.42,
          "end": 104.81,
          "text": "A fidelidade conjugal é sempre mais segura à proporção que os casamentos são mais numerosos e mais livres."
        },
        {
          "id": 10,
          "start": 104.81,
          "end": 123.27,
          "text": "Se os preconceitos hereditários os conciliam, se o poder paterno os forma e os impede ao seu capricho, a galanteria quebra-lhes secretamente os laços, mau grado as declamações dos moralistas vulgares, sempre ocupados em gritar contra os efeitos, omitindo as causas."
        },
        {
          "id": 11,
          "start": 123.27,
          "end": 134.07,
          "text": "Mas, essas reflexões são inúteis para aqueles que os motivos sublimes da religião mantêm nos limites do dever, que o pendor da natureza os leva a transpor."
        },
        {
          "id": 12,
          "start": 134.07,
          "end": 149.96,
          "text": "O adultério é um delito de um instante; envolve-se de mistério; cobre-se de um véu que as próprias leis se empenham em conservar, véu necessário, mas de tal modo transparente que só faz aumentar os encantos do objeto que oculta."
        },
        {
          "id": 13,
          "start": 149.96,
          "end": 162.02,
          "text": "As ocasiões são tão fáceis, as conseqüências tão duvidosas, que é bem mais fácil ao legislador preveni-lo quando não foi cometido do que reprimi-lo quando já se estabeleceu."
        },
        {
          "id": 14,
          "start": 162.02,
          "end": 169.75,
          "text": "Regra geral: em todo delito que, por sua natureza, deve quase sempre ficar impune, a pena é um aguilhão a mais."
        },
        {
          "id": 15,
          "start": 169.75,
          "end": 189.54,
          "text": "Nossa imaginação é mais vivamente excitada e se empenha com mais ardor em perseguir o objeto dos seus desejos, quando as dificuldades que se apresentam não são insuperáveis e quando não têm um aspecto bastante desencorajador, relativamente ao grau de atividade que se tem no espírito."
        },
        {
          "id": 16,
          "start": 189.54,
          "end": 203.2,
          "text": "Os obstáculos se tornam, por assim dizer, tantas barreiras que impedem nossa imaginação caprichosa de afastar- se delas, e que continuamente a forçam a pensar nas conseqüências da ação que medita."
        },
        {
          "id": 17,
          "start": 203.2,
          "end": 213.3,
          "text": "Então a alma se apega bem mais fortemente aos lados agradáveis que a seduzem do que às conseqüências perigosas cuja idéia se esforça por afastar."
        },
        {
          "id": 18,
          "start": 213.3,
          "end": 232.82,
          "text": "A pederastia, que as leis punem com tanta severidade e contra a qual se empregam tão facilmente essas torturas atrozes que triunfam da própria inocência, é menos o efeito das necessidades do homem isolado e livre do que o desvio das paixões do homem escravo que vive em sociedade."
        },
        {
          "id": 19,
          "start": 232.82,
          "end": 266.47,
          "text": "Se às vezes ela é produzida pela sociedade dos prazeres, é bem freqüentemente o efeito dessa educação que, para tornar os homens úteis aos outros, começa por torná-los inúteis a si mesmos, nessas casas em que uma juventude numerosa, viva, ardente, mas separada por obstáculos intransponíveis do sexo, do qual a natureza lhe pinta fortemente todos os encantos, prepara para si uma velhice antecipada, consumindo de antemão, inutilmente para a humanidade, um vigor apenas desenvolvido."
        },
        {
          "id": 20,
          "start": 266.47,
          "end": 278.53,
          "text": "O infanticídio é ainda o resultado quase inevitável da cruel alternativa em que se acha uma infeliz, que só cedeu por fraqueza, ou que sucumbiu sob os esforços da violência."
        },
        {
          "id": 21,
          "start": 278.53,
          "end": 308.42,
          "text": "De um lado a infâmia, de outro a morte de um ser incapaz de sentir a perda da vida: como não havia de preferir esse último partido, que a rouba à vergonha, à miséria, juntamente com o desgraçado filhinho' O melhor meio de prevenir essa espécie de delito seria proteger com leis eficazes a fraqueza e a infelicidade contra essa espécie de tirania, que só se levanta contra os vícios que não se podem cobrir com o manto da virtude."
        },
        {
          "id": 22,
          "start": 308.42,
          "end": 314.97,
          "text": "Não pretendo enfraquecer o justo horror que devem inspirar os crimes de que acabamos de falar."
        },
        {
          "id": 23,
          "start": 314.97,
          "end": 337.27,
          "text": "Eu quis indicar suas fontes e penso que me será permitido tirar daí a conseqüência geral de que não se pode chamar precisamente justa ou necessária (o que é a mesma coisa) a punição de um delito que as leis não procuraram prevenir com os melhores meios possíveis e segundo as circunstâncias em que se encontra uma nação."
        }
      ],
      "imagens": []
    },
    {
      "numero": 41,
      "id": "capitulo-37",
      "titulo": "Capítulo 37: De uma espécie particular de delito",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 37 do clássico Dos Delitos e das Penas: De uma espécie particular de delito.",
      "duracaoSegundos": 170,
      "duracaoFormatada": "02:50",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-37-de-uma-especie-particular-de-delito.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-37-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-37-de-uma-especie-particular-de-delito.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 9.76,
          "text": "OS QUE lerem esta obra se aperceberão sem dúvida de que não falei de uma espécie de delito cuja punição inundou a Europa de sangue humano."
        },
        {
          "id": 2,
          "start": 9.76,
          "end": 41.67,
          "text": "Não descrevi esses espetáculos espantosos em que o fanatismo elevava constantemente fogueiras, em que homens vivos serviam de alimento às chamas, em a que multidão feroz se comprazia em ouvir os gemidos abafados dos infelizes, em que cidadãos corriam, como a um espetáculo agradável, a contemplar a morte dos seus irmãos, no meio dos turbilhões de negra fumaça, em que os lugares públicos ficavam cobertos de destroços palpitantes e de cinzas humanas."
        },
        {
          "id": 3,
          "start": 41.67,
          "end": 52.28,
          "text": "Os homens esclarecidos verão que o país onde habito, o século em que vivo e a matéria de que trato não me permitiram examinar a natureza desse delito."
        },
        {
          "id": 4,
          "start": 52.28,
          "end": 85.47,
          "text": "Seria, aliás, empresa demasiado longa e que me desviaria muito do meu assunto, querer provar, contra o exemplo de várias nações, a necessidade de uma inteira conformidade de opinião num Estado político; procurar demonstrar como certas crenças religiosas, entre as quais só podem achar-se diferenças sutis, obscuras e muito acima da capacidade humana, podem contudo perturbar a tranqüilidade pública, a menos que somente uma seja autorizada e todas as outras proscritas."
        },
        {
          "id": 5,
          "start": 85.47,
          "end": 109.17,
          "text": "Seria preciso fazer ver ainda como algumas dessas crenças, tornando-se mais claras pela fermentações dos espíritos, podem fazer nascer do choque das opiniões a verdade, que então sobrenada depois de ter aniquilado o erro, ao passo que outras seitas, pouco firmes em suas bases; têm necessidade, para manter-se, de se apoiarem na força."
        },
        {
          "id": 6,
          "start": 109.17,
          "end": 139.8,
          "text": "Seria demasiado longo, igualmente, mostrar que, para reunir todos os cidadãos de um Estado numa perfeita conformidade de opiniões religiosas, é preciso tiranizar os espíritos e constrangê-los a vergar sob o jugo da força, embora essa violência se oponha à razão e à autoridade que mais respeitamos (21), que nos recomenda a doçura e o amor dos nossos irmãos, embora seja evidente que a força só faz hipócritas e, portanto, almas vis."
        },
        {
          "id": 7,
          "start": 139.8,
          "end": 153.03,
          "text": "Deve-se crer que todas essas coisas estarão demonstradas e conformes aos interesses da humanidade, se houver em alguma parte uma autoridade legítima e reconhecida que as ponha em prática."
        },
        {
          "id": 8,
          "start": 153.03,
          "end": 169.73,
          "text": "Quanto a mim, só falo aqui dos crimes que pertencem ao homem natural e que violam o contrato social; devo silenciar, porém, sobre os pecados cuja punição mesmo temporal deve ser determinada segundo outras regras que não as da filosofia."
        }
      ],
      "imagens": []
    },
    {
      "numero": 42,
      "id": "capitulo-38",
      "titulo": "Capítulo 38: De algumas fontes gerais de erros e de injustiças na legislação",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 38 do clássico Dos Delitos e das Penas: De algumas fontes gerais de erros e de injustiças na legislação.",
      "duracaoSegundos": 289,
      "duracaoFormatada": "04:49",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-38-de-algumas-fontes-gerais-de-erros-e-de-injusticas-na-legislacao.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-38-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-38-de-algumas-fontes-gerais-de-erros-e-de-injusticas-na-legislacao.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 13.69,
          "text": "DE INJUSTIÇAS NA LEGISLAÇÃO E, em primeiro lugar, das falsas idéias de utilidade AS FALSAS idéias que os legisladores fizeram da utilidade são uma das fontes mais fecundas de erros e injustiças."
        },
        {
          "id": 2,
          "start": 13.69,
          "end": 31.13,
          "text": "É ter falsas idéias de utilidade ocupar-se mais com inconvenientes particulares do que com inconvenientes gerais; querer comprimir os sentimentos naturais em lugar de procurar excitá-los; impor silêncio à razão e dizer ao pensamento: “Sê escravo”."
        },
        {
          "id": 3,
          "start": 31.13,
          "end": 40.23,
          "text": "É ter ainda falsas idéias de utilidade sacrificar mil vantagens reais ao temor de uma desvantagem imaginária ou pouco importante."
        },
        {
          "id": 4,
          "start": 40.23,
          "end": 53.78,
          "text": "Não teria certamente idéias justas quem desejasse tirar aos homens o fogo e a água, porque esses dois elementos causam incêndios e inundações, e quem só soubesse impedir o mal pela destruição."
        },
        {
          "id": 5,
          "start": 53.78,
          "end": 74.53,
          "text": "Podem considerar-se igualmente como contrárias ao fim de utilidade as leis que proíbem o porte de armas, pois só desarmam o cidadão pacífico, ao passo que deixam o ferro nas mãos do celerado, bastante acostumado a violar as convenções mais sagradas para respeitar as que são apenas arbitrárias."
        },
        {
          "id": 6,
          "start": 74.53,
          "end": 101.92,
          "text": "Além disso, essas convenções são pouco importantes; há pouco perigo em infringi-las e, por outro lado, se as leis que desarmam fossem executadas com rigor, destruiriam a liberdade pessoal, tão preciosa ao homem tão respeitável aos olhos do legislador esclarecido; submeteriam a inocência a todas as investigações, a todos os vexames arbitrários que só devem ser reservados aos criminosos."
        },
        {
          "id": 7,
          "start": 101.92,
          "end": 118.08,
          "text": "Tais leis só servem para multiplicar os assassínios, entregam o cidadão sem defesa aos golpes do celerado, que fere com mais audácia um homem desarmado; favorecem o bandido que ataca, em detrimento do homem honesto que é atacado."
        },
        {
          "id": 8,
          "start": 118.08,
          "end": 138.41,
          "text": "Essas leis são simplesmente o ruído das impressões tumultuosas que produzem certos fatos particulares; não podem ser o resultado de combinações sábias que pesam numa mesma balança os males e os bens; não é para prevenir os delitos, mas pelo vil sentimento do medo, que se fazem tais leis."
        },
        {
          "id": 9,
          "start": 138.41,
          "end": 175.89,
          "text": "É por uma falsa idéia de utilidade que se procura submeter uma multidão de seres sensíveis à regularidade simétrica que pode receber uma matéria bruta e inanimada; que se negligenciam os motivos presentes, únicos capazes de impressionar o espírito humano de maneira forte e durável, para empregar motivos remotos, cuja impressão é fraca e passageira, a menos que uma grande força de imaginação, que só se se encontra num pequeno número de homens, supra o afastamento do objeto, mantendo-o sob relações que o aumentam e o aproximam."
        },
        {
          "id": 10,
          "start": 175.89,
          "end": 186.33,
          "text": "Enfim, também podem chamar-se falsas idéias de utilidade as que separam o bem geral dos interesses particulares, sacrificando as coisas às palavras."
        },
        {
          "id": 11,
          "start": 186.33,
          "end": 204.54,
          "text": "Há, entre o estado de sociedade e o estado de natureza, a diferença de que o homem selvagem só faz mal a outrem quando nisso descobre alguma vantagem para si, ao passo que o homem social é às vezes levado, por leis viciosas, a prejudicar sem nenhum proveito."
        },
        {
          "id": 12,
          "start": 204.54,
          "end": 219.58,
          "text": "O déspota espalha o medo e o abatimento na alma dos seus escravos, mas esse medo e esse abatimento voltam-se contra ele próprio, logo lhe enchem o coração e o tornam presa de males maiores do que os que ele causa."
        },
        {
          "id": 13,
          "start": 219.58,
          "end": 228.26,
          "text": "Aquele que se compraz em inspirar o terror corre poucos riscos, se teme apenas a própria família e as pessoas que o cercam."
        },
        {
          "id": 14,
          "start": 228.26,
          "end": 234.89,
          "text": "Mas, quando o terror é geral, quando fere uma grande multidão de homens, o tirano deve tremer."
        },
        {
          "id": 15,
          "start": 234.89,
          "end": 260.16,
          "text": "Receie a temeridade, o desespero; receie sobretudo o homem audacioso, mas prudente, que souber com habilidade sublevar contra ele os descontentes, tanto mais fáceis de serem seduzidos quando se despertarem em suas almas as mais caras esperanças e quando se tiver o cuidado de mostrar-lhes os perigos da empresa repartidos entre um grande número de cúmplices."
        },
        {
          "id": 16,
          "start": 260.16,
          "end": 267.36,
          "text": "Juntai a isso que os infelizes dão menos valor à sua existência na proporção dos males que os afligem."
        },
        {
          "id": 17,
          "start": 267.36,
          "end": 272.87,
          "text": "Eis, sem dúvida, porque as ofensas são quase sempre seguidas de ofensas novas."
        },
        {
          "id": 18,
          "start": 272.87,
          "end": 288.89,
          "text": "A tirania e o ódio são sentimentos duráveis, que se sustentam e tomam novas forças à medida que se exercem; ao passo que, em nossos corações corruptos, o amor e os sentimentos ternos se enfraquecem e se extinguem na ociosidade."
        }
      ],
      "imagens": []
    },
    {
      "numero": 43,
      "id": "capitulo-39",
      "titulo": "Capítulo 39: Do espírito de família",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 39 do clássico Dos Delitos e das Penas: Do espírito de família.",
      "duracaoSegundos": 426,
      "duracaoFormatada": "07:06",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-39-do-espirito-de-familia.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-39-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-39-do-espirito-de-familia.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 4.76,
          "text": "O ESPIRÍTO da família é outra fonte geral de injustiças na legislação."
        },
        {
          "id": 2,
          "start": 4.76,
          "end": 22.57,
          "text": "Se as disposições cruéis e os outros vícios das leis penais foram aprovados pelos legisladores mais esclarecidos, nas repúblicas mais livres, é que se considerou o Estado antes como uma sociedade de famílias do que como a associação de um certo número de homens."
        },
        {
          "id": 3,
          "start": 22.57,
          "end": 42.63,
          "text": "Suponha-se uma nação composta de cem mil homens, distribuídos em vinte mil famílias de cinco pessoas cada uma, inclusive o chefe que a representa; se a associação é feita por famílias, haveria vinte mil cidadãos e oitenta mil escravos; se é feita por indivíduos, haveria cem mil cidadãos livres."
        },
        {
          "id": 4,
          "start": 42.63,
          "end": 64.04,
          "text": "No primeiro caso, seria uma república composta de vinte mil pequenas monarquias; no segundo, tudo respirará o espírito de liberdade, que animará os cidadãos, não somente nas praças públicas e nas assembléias nacionais, mas ainda sob o teto doméstico, onde residem os principais elementos de felicidade e de miséria."
        },
        {
          "id": 5,
          "start": 64.04,
          "end": 95.18,
          "text": "Se a associação é feita por famílias, as leis e os costumes, que são sempre o resultado dos sentimentos habituais dos membros da sociedade política, serão obra dos chefes dessas famílias; ver-se-á em breve o espírito monárquico introduzir-se aos poucos na própria república, e os seus efeitos só encontrarão obstáculos na oposição dos interesses particulares, porque os sentimentos naturais de liberdade e de igualdade já terão deixado de viver nos corações."
        },
        {
          "id": 6,
          "start": 95.18,
          "end": 114.28,
          "text": "O espírito de família é um espirito de minúcia limitado pelos mais insignificantes pormenores; ao passo que o espírito público, ligado aos princípios gerais, vê os fatos com visão segura, coordena-os nos lugares respectivos e sabe tirar deles conseqüências úteis ao bem da maioria."
        },
        {
          "id": 7,
          "start": 114.28,
          "end": 125.63,
          "text": "Nas sociedades compostas de famílias, as crianças ficam sob a autoridade do chefe e são obrigadas a esperar que a morte lhes dê uma existência que só depende das leis."
        },
        {
          "id": 8,
          "start": 125.63,
          "end": 155.48,
          "text": "Habituadas a obedecer e a tremer, na idade da força, quando as paixões não são ainda refreadas pela moderação, espécie de temor prudente que é o fruto da experiência e da idade, como resistirão elas aos obstáculos que o vício opõe constantemente aos esforços da virtude, quando a velhice decrépita e medrosa tirar-lhes a coragem de tentar reformas ousadas, que aliás as seduzem pouco, porque não têm a esperança de recolher-lhes os frutos?"
        },
        {
          "id": 9,
          "start": 155.48,
          "end": 189.81,
          "text": "Nas repúblicas, em que todo homem é cidadão, a subordinação nas famílias não é efeito da força, mas de um contrato; e os filhos, uma vez saídos da idade em que a fraqueza e a necessidade de educação os mantêm sob a dependência natural dos pais, tornam-se desde então membros livres da sociedade: se ainda se submetem ao chefe da família, é apenas para participar das vantagens que esta lhes oferece, do mesmo modo que os cidadãos se sujeitam, sem perder a liberdade, ao chefe da grande sociedade política."
        },
        {
          "id": 10,
          "start": 189.81,
          "end": 198.78,
          "text": "Nas repúblicas compostas de famílias, os jovens, isto é, a parte mais considerável e mais útil da nação, ficam à discrição dos pais."
        },
        {
          "id": 11,
          "start": 198.78,
          "end": 217.54,
          "text": "Nas repúblicas de homens livres, os únicos laços que submetem os filhos ao pai são os sentimentos sagrados e invioláveis da natureza, que convidam os homens a ajudar-se mutuamente em suas necessidades recíprocas e que lhes inspiram o reconhecimento pelos benefícios recebidos."
        },
        {
          "id": 12,
          "start": 217.54,
          "end": 228.01,
          "text": "Esses santos deveres são muito mais alterados pelo vício das leis, que prescrevem uma submissão cega e obrigatória, do que pela maldade do coração humano."
        },
        {
          "id": 13,
          "start": 228.01,
          "end": 243.17,
          "text": "Essa oposição entre as leis fundamentais dos Estados políticos e as leis de família, é fonte de muitas outras contradições entre a moral pública e a moral particular, que se combatem continuamente no espírito de cada homem."
        },
        {
          "id": 14,
          "start": 243.17,
          "end": 251.53,
          "text": "A moral particular só inspira a submissão e o medo, ao passo que a moral pública anima a coragem e o espírito da liberdade."
        },
        {
          "id": 15,
          "start": 251.53,
          "end": 260.37,
          "text": "Guiado pela primeira, o homem limita seu bem-estar ao círculo estreito de um pequeno número de pessoas que ele nem mesmo escolheu."
        },
        {
          "id": 16,
          "start": 260.37,
          "end": 266.42,
          "text": "Inspirado pela outra, procura estender a felicidade sobre todas as classes da humanidade."
        },
        {
          "id": 17,
          "start": 266.42,
          "end": 279.27,
          "text": "A moral particular exige que cada qual se sacrifique continuamente a um falso ídolo que se chama o bem da família e que muitas vezes não é o bem real de nenhum dos indivíduos que a compõem."
        },
        {
          "id": 18,
          "start": 279.27,
          "end": 294.09,
          "text": "A moral pública ensina a procurar o bem-estar sem ferir as leis; e, se às vezes excita um cidadão a imolar-se pela pátria, recompensa-o pelo entusiasmo que lhe inspira antes do sacrifício e pela glória que lhe promete."
        },
        {
          "id": 19,
          "start": 294.09,
          "end": 312.51,
          "text": "Tantas contradições fazem que os homens desdenhem de praticar a virtude, que não podem reconhecer no meio das trevas de que a cercaram e que lhes parece distante, porque está envolta nessa obscuridade que oculta aos nossos olhos os objetos morais como os objetos físicos."
        },
        {
          "id": 20,
          "start": 312.51,
          "end": 319.86,
          "text": "Quantas vezes o cidadão que reflete sobre suas ações passadas não se terá admirado de achar-se um mau homem?"
        },
        {
          "id": 21,
          "start": 319.86,
          "end": 332.37,
          "text": "A medida que a sociedade cresce, cada um dos seus membros torna-se uma parte menor do todo, e o amor do bem público se enfraquece na mesma proporção, se as leis deixam de fortificá-lo."
        },
        {
          "id": 22,
          "start": 332.37,
          "end": 343.38,
          "text": "As sociedades políticas têm, como o corpo humano, um crescimento limitado; não poderiam estender-se além de certos limites, sem que sua economia fosse perturbada."
        },
        {
          "id": 23,
          "start": 343.38,
          "end": 351.06,
          "text": "Parece que a grandeza de um Estado deve estar na razão inversa do grau de atividade dos indivíduos que a compõem."
        },
        {
          "id": 24,
          "start": 351.06,
          "end": 362.14,
          "text": "Se essa atividade crescesse ao mesmo tempo que a população, as boas leis achariam um obstáculo, para prevenir os delitos, no próprio bem que tivessem podido fazer."
        },
        {
          "id": 25,
          "start": 362.14,
          "end": 370.44,
          "text": "Uma república muito vasta só pode escapar ao despotismo subdividindo-se num certo número de pequenos Estados confederados."
        },
        {
          "id": 26,
          "start": 370.44,
          "end": 381.38,
          "text": "Mas, para formar essa união, seria preciso um ditador poderoso, que tivesse a coragem de Sila (22), com tanto gênio para fundar quanto Sila o teve para destruir."
        },
        {
          "id": 27,
          "start": 381.38,
          "end": 385.6,
          "text": "Se tal homem for ambicioso, poderá esperar uma glória imortal."
        },
        {
          "id": 28,
          "start": 385.6,
          "end": 394.16,
          "text": "Se for filósofo, as bênçãos dos seus concidadãos o consolarão da perda de sua autoridade, mesmo sem pedir-lhes reconhecimento."
        },
        {
          "id": 29,
          "start": 394.16,
          "end": 403.54,
          "text": "Quando os sentimentos que nos unem à nação principiam a enfraquecer-se, os que nos ligam aos objetos que nos cercam adquirem novas forças."
        },
        {
          "id": 30,
          "start": 403.54,
          "end": 417.14,
          "text": "Assim, sob o despotismo feroz, os laços da amizade são mais duráveis; e as virtudes de família (virtudes sempre fracas) se tornam, então, as mais comuns, ou antes, são as únicas que ainda se praticam."
        },
        {
          "id": 31,
          "start": 417.14,
          "end": 425.57,
          "text": "Após todas essas observações, pode julgar-se quanto foram curtas e limitadas as opiniões da maioria dos nossos legisladores."
        }
      ],
      "imagens": []
    },
    {
      "numero": 44,
      "id": "capitulo-40",
      "titulo": "Capítulo 40: Do espírito do fisco",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 40 do clássico Dos Delitos e das Penas: Do espírito do fisco.",
      "duracaoSegundos": 269,
      "duracaoFormatada": "04:29",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-40-do-espirito-do-fisco.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-40-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-40-do-espirito-do-fisco.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 3.59,
          "text": "HOUVE um tempo em que todas as penas eram pecuniárias."
        },
        {
          "id": 2,
          "start": 3.59,
          "end": 8.18,
          "text": "Os crimes dos súditos eram para o príncipe uma espécie de patrimônio."
        },
        {
          "id": 3,
          "start": 8.18,
          "end": 14.43,
          "text": "Os atentados contra a segurança pública eram objeto de lucro, sobre o qual se sabia especular."
        },
        {
          "id": 4,
          "start": 14.43,
          "end": 20.01,
          "text": "O soberano e os magistrados achavam seu interesse nos delitos que deveriam prevenir."
        },
        {
          "id": 5,
          "start": 20.01,
          "end": 29.12,
          "text": "Os julgamentos não eram, então, nada menos do que um processo entre o fisco que percebia o preço do crime, e o culpado que devia pagá-lo."
        },
        {
          "id": 6,
          "start": 29.12,
          "end": 36.7,
          "text": "Fazia-se disso um negócio civil, contencioso, como se se tratasse de uma querela particular, e não do bem público."
        },
        {
          "id": 7,
          "start": 36.7,
          "end": 48.66,
          "text": "Parecia que o fisco tinha outros direitos que exercer além da proteção da tranqüilidade pública, e o culpado outras penas que sofrer além das que a necessidade do exemplo o exigia."
        },
        {
          "id": 8,
          "start": 48.66,
          "end": 62.49,
          "text": "O juiz, estabelecido para apurar a verdade com ânimo imparcial, não era mais do que o advogado do fisco; e aquele que se chamava o protetor e o ministro das leis era apenas o exator dos dinheiros do príncipe."
        },
        {
          "id": 9,
          "start": 62.49,
          "end": 79.78,
          "text": "Nesse sistema, quem se confessasse culpado se reconhecia, pela própria confissão, devedor do fisco; e, como era esse o fim de todos os processos criminais, toda a arte do juiz consistia em obter essa confissão da maneira mais favorável aos interesses do fisco."
        },
        {
          "id": 10,
          "start": 79.78,
          "end": 90.02,
          "text": "É ainda para esse mesmo fim fiscal que tende hoje toda a jurisprudência criminal, pois os efeitos permanecem por muito tempo depois de cessadas as causas."
        },
        {
          "id": 11,
          "start": 90.02,
          "end": 109.29,
          "text": "O acusado que recusa confessar-se culpado, embora convencido por provas certas, sofrerá uma pena mais leve do que se tivesse confessado; não lhe será aplicada a tortura pelos outros crimes que poderia ter cometido, precisamente porque não confessou o crime principal de que está convencido."
        },
        {
          "id": 12,
          "start": 109.29,
          "end": 116.41,
          "text": "Mas, se o crime é confessado, o juiz apodera-se do corpo do culpado; dilacera-o metodicamente; e faz dele,."
        },
        {
          "id": 13,
          "start": 116.41,
          "end": 120.66,
          "text": "por assim dizer, um fundo do qual tira todo o proveito possível."
        },
        {
          "id": 14,
          "start": 120.66,
          "end": 126.91,
          "text": "Uma vez reconhecida a existência do delito, a confissão do acusado se torna prova convincente."
        },
        {
          "id": 15,
          "start": 126.91,
          "end": 148.12,
          "text": "Acredita-se tornar essa prova menos suspeita, arrancando a confissão do crime pelos tormentos e pelo desespero; e se estabeleceu que a confissão não basta para condenar o culpado, se esse culpado é calmo, se fala desembaraçadamente, se não está cercado das formalidades judiciárias e do aparato aterrador dos suplícios."
        },
        {
          "id": 16,
          "start": 148.12,
          "end": 181.43,
          "text": "Excluem-se cuidadosamente da instrução de um processo as investigações e as provas que, esclarecendo o fato de maneira a favorecer o acusado, poderiam prejudicar as pretensões do fisco; e, se às vezes se poupam alguns tormentos ao culpado, não é nem por piedade para com a desgraça, nem por indulgência para com a fraqueza, mas porque as confissões obtidas são suficientes para os direitos do fisco, esse ídolo que já não passa de uma quimera e que a mudança das circunstâncias nos torna inconcebível."
        },
        {
          "id": 17,
          "start": 181.43,
          "end": 197.05,
          "text": "O juiz, quando exerce suas funções, não é mais do que o inimigo do culpado, isto é, de um infeliz curvado ao peso das cadeias, minado pelo sofrimento, que os tormentos esperam e que o futuro mais terrível cerca de horror e de assombro."
        },
        {
          "id": 18,
          "start": 197.05,
          "end": 213.07,
          "text": "Não é a verdade o que ele procura; quer descobrir no acusado um culpado; prepara-lhe armadilhas, parece que tem tudo que perder e que teme, se não puder convencer o acusado, diminuir a infalibilidade que o homem se arroga em todas as coisas."
        },
        {
          "id": 19,
          "start": 213.07,
          "end": 218.39,
          "text": "O juiz tem o poder de determinar por que indícios se pode encarcerar um cidadão."
        },
        {
          "id": 20,
          "start": 218.39,
          "end": 223.44,
          "text": "E declarar que esse cidadão é culpado, antes de poder provar que é inocente."
        },
        {
          "id": 21,
          "start": 223.44,
          "end": 227.43,
          "text": "Não se parecerá tal informação com um procedimento ofensivo?"
        },
        {
          "id": 22,
          "start": 227.43,
          "end": 234.54,
          "text": "E eis, todavia, a marcha da jurisprudência criminal, em quase toda a Europa, no século XVIII, em plena luz."
        },
        {
          "id": 23,
          "start": 234.54,
          "end": 251.23,
          "text": "Mal se conhece nos tribunais o verdadeiro processo das informações, isto é, a investigação imparcial do fato, prescrita pela razão, seguida nas leis militares, empregada mesmo por esses déspotas da Ásia, nos assuntos que só interessam os particulares."
        },
        {
          "id": 24,
          "start": 251.23,
          "end": 268.85,
          "text": "Nossos descendentes, sem dúvida mais felizes do que nós, terão dificuldade em conceber essa complicação torturosa dos mais estranhos absurdos, e esse sistema de iniqüidades incríveis, que só o filósofo poderá julgar possível, estudando a natureza do coração humano."
        }
      ],
      "imagens": []
    },
    {
      "numero": 45,
      "id": "capitulo-41",
      "titulo": "Capítulo 41: Dos meios de prevenir crimes",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 41 do clássico Dos Delitos e das Penas: Dos meios de prevenir crimes.",
      "duracaoSegundos": 878,
      "duracaoFormatada": "14:38",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-41-dos-meios-de-prevenir-crimes.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-41-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-41-dos-meios-de-prevenir-crimes.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 24.23,
          "text": "É MELHOR prevenir os crimes do que ter de puni-los; e todo legislador sábio deve procurar antes impedir o mal do que repará-lo, pois uma boa legislação não é senão a arte de proporcionar aos homens o maior bem-estar possível e preservá-los de todos os sofrimentos que se lhes possam causar, segundo o cálculo dos bens e dos males desta vida."
        },
        {
          "id": 2,
          "start": 24.23,
          "end": 31.47,
          "text": "Mas, os meios que até hoje se empregam são em geral insuficientes ou contrários ao fim que se propõem."
        },
        {
          "id": 3,
          "start": 31.47,
          "end": 41.85,
          "text": "Não é possível submeter a atividade tumultuosa de uma massa de cidadãos a uma ordem geométrica, que não apresente nem irregularidade nem confusão."
        },
        {
          "id": 4,
          "start": 41.85,
          "end": 51.93,
          "text": "Embora as leis da natureza sejam sempre simples e sempre constantes, não impedem que os planetas se desviem às vezes dos movimentos habituais."
        },
        {
          "id": 5,
          "start": 51.93,
          "end": 65.15,
          "text": "Como poderiam, pois, as leis humanas, em meio ao choque das paixões e dos sentimentos opostos da dor e do prazer, impedir que não haja alguma perturbação e algum desarranjo na sociedade?"
        },
        {
          "id": 6,
          "start": 65.15,
          "end": 70.12,
          "text": "É essa, porém, a quimera dos homens limitados, quando têm algum poder."
        },
        {
          "id": 7,
          "start": 70.12,
          "end": 90.01,
          "text": "Se se proíbem aos cidadãos uma porção de atos indiferentes, não tendo tais atos nada de nocivo, não se previnem os crimes: ao contrário, faz-se que surjam novos, porque se mudam arbitrariamente as idéias ordinárias de vício e virtude, que todavia se proclamam eternas e imutáveis."
        },
        {
          "id": 8,
          "start": 90.01,
          "end": 99.6,
          "text": "Além disso, a que ficaria o homem reduzido, se fosse preciso interdizer-lhe tudo o que pode ser para ele uma ocasião de praticar o mal?"
        },
        {
          "id": 9,
          "start": 99.6,
          "end": 103.51,
          "text": "Seria preciso começar por tirar-lhe o uso dos sentidos."
        },
        {
          "id": 10,
          "start": 103.51,
          "end": 113.6,
          "text": "Para um motivo que leva os homens a cometer um crime, há mil outros que os levam a ações indiferentes, que só são delitos perante as más leis."
        },
        {
          "id": 11,
          "start": 113.6,
          "end": 119.92,
          "text": "Ora, quanto mais se estender a esfera dos crimes, tanto mais se fará que sejam cometidos."
        },
        {
          "id": 12,
          "start": 119.92,
          "end": 136.19,
          "text": "porque se verão os delitos multiplicar-se à medida que os motivos de delitos especificados pelas leis forem mais numerosos, sobretudo se a maioria dessas leis não passarem de privilégios, isto é, de um pequeno número de senhores."
        },
        {
          "id": 13,
          "start": 136.19,
          "end": 138.11,
          "text": "Quereis prevenir os crimes?"
        },
        {
          "id": 14,
          "start": 138.11,
          "end": 150.97,
          "text": "Fazeis leis simples e claras; fazei-as amar; e esteja a nação inteira pronta a armar-se para defendê-las, sem que a minoria de que falamos se preocupe constantemente em destruí-las."
        },
        {
          "id": 15,
          "start": 150.97,
          "end": 160.99,
          "text": "Não favoreçam elas nenhuma classe particular; protejam igualmente cada membro da sociedade; receie-as o cidadão e trema somente diante delas."
        },
        {
          "id": 16,
          "start": 160.99,
          "end": 168.16,
          "text": "O temor que as leis inspiram é salutar, o temor que os homens inspiram é uma fonte funesta de crimes."
        },
        {
          "id": 17,
          "start": 168.16,
          "end": 175.12,
          "text": "Os homens escravos são sempre mais debochados, mais covardes, mais cruéis do que os homens livres."
        },
        {
          "id": 18,
          "start": 175.12,
          "end": 184.93,
          "text": "Estes investigam as ciências; ocupam-se com os interesses da nação; vêem os objetos sob um ponto de vista elevado, e fazem grandes coisas."
        },
        {
          "id": 19,
          "start": 184.93,
          "end": 195.51,
          "text": "Mas, os escravos, satisfeitos com os prazeres do momento, procuram no ruído do deboche uma distração para o aniquilamento em que se vêem mergulhados."
        },
        {
          "id": 20,
          "start": 195.51,
          "end": 209.65,
          "text": "Toda sua vida está cercada de incertezas, e, como para eles os delitos não estão determinados, não sabem quais serão suas conseqüências: e isso empresta nova força à paixão que os leva a praticá-los."
        },
        {
          "id": 21,
          "start": 209.65,
          "end": 216.83,
          "text": "Num povo que o clima torna indolente, a incerteza das leis entretém e aumenta a inação e a estupidez."
        },
        {
          "id": 22,
          "start": 216.83,
          "end": 228.34,
          "text": "Numa nação voluptuosa, mas ativa, as leis incertas fazem que a atividade dos cidadãos se limite a pequenas cabalas e intrigas, surdas, que semeiam a desconfiança."
        },
        {
          "id": 23,
          "start": 228.34,
          "end": 233.52,
          "text": "Então, o homem mais prudente é aquele que sabe melhor dissimular e trair."
        },
        {
          "id": 24,
          "start": 233.52,
          "end": 252.42,
          "text": "Num povo forte e corajoso, a incerteza das leis é forçada por fim e substituir-se por uma legislação precisa; isso, porém, só acontece depois de revoluções freqüentes, que conduziram esse povo, alternativamente, da liberdade à escravidão e da escravidão à liberdade."
        },
        {
          "id": 25,
          "start": 252.42,
          "end": 254.34,
          "text": "Quereis prevenir os crimes?"
        },
        {
          "id": 26,
          "start": 254.34,
          "end": 257.25,
          "text": "Marche a liberdade acompanhada das luzes."
        },
        {
          "id": 27,
          "start": 257.25,
          "end": 267.48,
          "text": "Se as ciências produzem alguns males, é quando estão pouco difundidas; mas, à medida que se estendem, as vantagens que trazem se tornam maiores."
        },
        {
          "id": 28,
          "start": 267.48,
          "end": 277.64,
          "text": "Um impostor ousado (que não pode ser um homem vulgar) faz-se adorar por um povo ignorante e só é objeto de desprezo para uma nação esclarecida."
        },
        {
          "id": 29,
          "start": 277.64,
          "end": 294.69,
          "text": "O homem instruído sabe comparar os objetos, considerá-los sob diversos pontos-de-vista e modificar os próprios sentimentos pelos dos outros, porque vê nos seus semelhantes os mesmos desejos e as mesmas aversões que agem sobre o seu coração."
        },
        {
          "id": 30,
          "start": 294.69,
          "end": 317.92,
          "text": "Se prodigalizardes luzes ao povo, a ignorância e a calúnia desaparecerão diante delas, a autoridade injusta tremerá, só as leis permanecerão inabaláveis, todo-poderosas; e o homem esclarecido amará uma constituição cujas vantagens são evidentes, uma vez conhecidos seus dispositivos, e que dá bases sólidas à segurança pública."
        },
        {
          "id": 31,
          "start": 317.92,
          "end": 335.9,
          "text": "Poderá ele lamentar essa inútil partícula de liberdade de que se privou, se a comparar com a soma de todas as outras liberdades que os seus concidadãos lhe sacrificaram, e se pensar que, sem as leis, estes últimos poderiam armar-se e unir-se contra ele?"
        },
        {
          "id": 32,
          "start": 335.9,
          "end": 349.18,
          "text": "Dotado de uma alma sensível, verifica-se que, sob boas leis, o homem só perdeu a funesta liberdade de praticar o mal, forçado a bendizer o trono e o soberano que só o ocupa para proteger."
        },
        {
          "id": 33,
          "start": 349.18,
          "end": 353.23,
          "text": "Não é verdade que as ciências sejam nocivas à humanidade."
        },
        {
          "id": 34,
          "start": 353.23,
          "end": 357.64,
          "text": "Se às vezes deram maus resultados, é que o mal era inevitável."
        },
        {
          "id": 35,
          "start": 357.64,
          "end": 374.19,
          "text": "Multiplicando-se os homens sobre a superfície da terra, viram-se nascer a guerra, algumas artes grosseiras, e as primeiras leis, que não eram senão convenções momentâneas e que pereciam com a necessidade passageira que as produziria."
        },
        {
          "id": 36,
          "start": 374.19,
          "end": 388.97,
          "text": "Foi então que a filosofia começou a aparecer; seus primeiros princípios foram pouco numerosos e sabiamente escolhidos, porque a preguiça e a pouca sagacidade dos primeiros homens os preservam de muitos erros."
        },
        {
          "id": 37,
          "start": 388.97,
          "end": 403.46,
          "text": "Mas, multiplicadas as necessidades juntamente com a espécie humana, foram necessárias impressões mais fortes e mais duráveis para impedir as voltas freqüentes, e cada dia mais funestas ao estado selvagem."
        },
        {
          "id": 38,
          "start": 403.46,
          "end": 420.94,
          "text": "Foram, pois, um grande bem para a humanidade (digo um grande bem sob o aspecto político) os primeiros erros religiosos que povoaram o universo de falsas divindades e que inventaram um mundo invisível de espíritos encarregados de governar a terra."
        },
        {
          "id": 39,
          "start": 420.94,
          "end": 432.87,
          "text": "Foram benfeitores do gênero humano esses homens audaciosos que ousaram enganar seus semelhantes para servi-los e que arrastaram a ignorância temerosa ao pé dos altares."
        },
        {
          "id": 40,
          "start": 432.87,
          "end": 456.53,
          "text": "Apresentando aos homens objetos fora do alcance dos sentidos, interessaram-nos na investigação desses objetos, que fugiam diante deles à medida que os julgavam mais próximos; forçaram-nos a respeitar o que não conheciam bem e souberam concentrar para esse único fim, que os impressionava fortemente, todas as paixões que os agitavam."
        },
        {
          "id": 41,
          "start": 456.53,
          "end": 463.35,
          "text": "Tal foi a sorte de todas as nações que se formaram da reunião de diferentes povoações selvagens."
        },
        {
          "id": 42,
          "start": 463.35,
          "end": 474.86,
          "text": "Foi a época da formação das grandes sociedades; e as idéias religiosas foram sem dúvida o único laço que pode obrigar os homens a viverem constantemente sob leis."
        },
        {
          "id": 43,
          "start": 474.86,
          "end": 477.56,
          "text": "Não falo desse povo que Deus escolheu."
        },
        {
          "id": 44,
          "start": 477.56,
          "end": 486.15,
          "text": "Os milagres mais extraordinários e os favores mais assinalados que o céu lhe prodigalizou substituíram a política humana."
        },
        {
          "id": 45,
          "start": 486.15,
          "end": 502.21,
          "text": "Mas, como os erros podem subdividir-se ao infinito, as falsas ciências que tais erros produziram fizeram dos homens uma multidão fanática de cegos, perdidos no labirinto em que se encerraram e prestes a chocar-se a cada passo."
        },
        {
          "id": 46,
          "start": 502.21,
          "end": 514.79,
          "text": "Então, alguns filósofos sensíveis lamentaram o antigo estado selvagem; e foi nessa primeira época que os conhecimentos, ou antes, as opiniões, tornaram-se funestos à humanidade."
        },
        {
          "id": 47,
          "start": 514.79,
          "end": 524.59,
          "text": "Pode considerar-se como uma época mais ou menos semelhante o momento terrível em que é preciso passar do erro à verdade, das trevas à luz."
        },
        {
          "id": 48,
          "start": 524.59,
          "end": 540.72,
          "text": "O choque terrível dos preconceitos úteis a um pequeno número de homens poderosos contra as verdades vantajosas para a multidão fraca, e a fermentação de todas as paixões sublevadas, causam males infinitos aos infelizes humanos."
        },
        {
          "id": 49,
          "start": 540.72,
          "end": 563.73,
          "text": "Percorrendo a história, cujos principais acontecimentos, após certos intervalos, se reproduzem quase sempre, detenhamo-nos na passagem perigosa, mas indispensável, da ignorância à filosofia, e portanto da escravidão à liberdade; e veremos quantas vezes uma geração inteira é sacrificada à felicidade da que deve suceder-lhe."
        },
        {
          "id": 50,
          "start": 563.73,
          "end": 588.53,
          "text": "Quando, porém, a calma está restabelecida, quando já está extinto o incêndio cujas flamas purificaram a nação, livrando-a dos males que a oprimiam, a verdade, que primeiro se arrastava com lentidão, precipita os passos, senta-se nos tronos ao lado dos monarcas e, por fim, nas assembléias das nações, sobretudo nas repúblicas, obtém culto e altares."
        },
        {
          "id": 51,
          "start": 588.53,
          "end": 595.92,
          "text": "Poder-se-á acreditar, então, que as luzes que esclarecem a multidão são mais perigosas do que as trevas?"
        },
        {
          "id": 52,
          "start": 595.92,
          "end": 605.15,
          "text": "E que filósofo se persuadirá de que o conhecimento exato das relações que unem os objetos entre si possa ser funesto à humanidade?"
        },
        {
          "id": 53,
          "start": 605.15,
          "end": 630.8,
          "text": "Se o semi-saber é mais perigoso do que a ignorância cega, porque aos males que produz a ignorância acrescenta ainda os erros inumeráveis que resultam inevitavelmente de uma visão limitada aquém dos limites da verdade, sem dúvida o dom mais precioso que um soberano pode conceder à nação e a si mesmo é confiar o depósito sagrado das leis a um homem esclarecido."
        },
        {
          "id": 54,
          "start": 630.8,
          "end": 661.7,
          "text": "Acostumado a ver a verdade sem temê-la, acima dessa necessidade geral dos sufrágios públicos, necessidade que nunca está satisfeita e que tão freqüentemente faz sucumbir a virtude; habituado a tudo considerar sob os pontos de vista mais elevados, ele vê a nação como uma família, os seus concidadãos como irmãos; e a distância que separa os grandes do povo lhe parece tanto menor quanto sabe envolver com o olhar maior massa de homens."
        },
        {
          "id": 55,
          "start": 661.7,
          "end": 678.12,
          "text": "O sábio tem necessidades e interesses que o vulgo desconhece; é para ele uma necessidade não desmentir, em sua conduta pública, os princípios que estabeleceu nos seus escritos e o hábito que adquiriu de amar a verdade por si mesma."
        },
        {
          "id": 56,
          "start": 678.12,
          "end": 693.11,
          "text": "Tais homens fariam a felicidade de uma nação; mas, para tornar essa felicidade durável, é preciso que boas leis aumentem de tal forma o número dos sábios que quase já não seja possível fazer uma escolha errônea."
        },
        {
          "id": 57,
          "start": 693.11,
          "end": 706.89,
          "text": "Outro meio de prevenir os delitos é afastar do santuário das leis a própria sombra da corrupção, interessando os magistrados em conservar em toda a sua pureza o depósito que a nação lhes confia."
        },
        {
          "id": 58,
          "start": 706.89,
          "end": 729.55,
          "text": "Quanto mais numerosos forem os tribunais, tanto menos se poderá temer que violem as leis, porque, entre vários homens que se observam mutuamente, a vantagem de aumentar a autoridade comum é tanto menor quanto menor a parcela de autoridade de cada um e muito pouco considerável para contrabalançar os perigos da empresa."
        },
        {
          "id": 59,
          "start": 729.55,
          "end": 753.28,
          "text": "Se o soberano dá muito aparato, pompa e autoridade à magistratura; se ao mesmo tempo fecha todo acesso aos lamentos justos ou mal fundados do fraco, que se julga oprimido; se acostuma os súditos a temer os magistrados mais do que as leis, aumentará sem dúvida o poder dos juizes, mas somente à custa da segurança pública e particular."
        },
        {
          "id": 60,
          "start": 753.28,
          "end": 764.72,
          "text": "Podem ainda prevenir-se os crimes recompensando a virtude; e pode-se observar que as leis atuais de todas as nações guardam a esse respeito um profundo silêncio."
        },
        {
          "id": 61,
          "start": 764.72,
          "end": 782.34,
          "text": "Se os prêmios propostos pelas academias aos autores das descobertas úteis alargaram os conhecimentos e aumentaram o número dos bons livros, imagine-se que recompensas concedidas por um monarca benfeitor não multiplicariam também as ações virtuosas."
        },
        {
          "id": 62,
          "start": 782.34,
          "end": 788.73,
          "text": "A moeda da honra, distribuída com sabedoria, jamais se esgota e produz sempre bons frutos."
        },
        {
          "id": 63,
          "start": 788.73,
          "end": 798.54,
          "text": "Afim, o meio mais seguro, mas ao mesmo tempo mais difícil de tornar os homens menos inclinados a praticar o mal, é aperfeiçoar a educação."
        },
        {
          "id": 64,
          "start": 798.54,
          "end": 803.22,
          "text": "O assunto é vasto demais para entrar nos limites que me prescrevi."
        },
        {
          "id": 65,
          "start": 803.22,
          "end": 822.19,
          "text": "Ouso, porém, dizer que está tão estreitamente ligado com a natureza do governo que será apenas um campo estéril e cultivado somente por um pequeno número de sábios, até chegarem os séculos ainda distantes em que as leis não terão outro fim senão a felicidade pública."
        },
        {
          "id": 66,
          "start": 822.19,
          "end": 833.35,
          "text": "Um grande homem, que esclarece os seus semelhantes e que é por estes perseguido, desenvolveu as máximas principais de uma educação verdadeiramente útil (23)."
        },
        {
          "id": 67,
          "start": 833.35,
          "end": 844.57,
          "text": "Fez ver que ela consistia bem menos na multidão confusa dos objetos que se apresentam às crianças do que na escolha e na precisão com as quais se lhes expõem."
        },
        {
          "id": 68,
          "start": 844.57,
          "end": 855.73,
          "text": "Provou que é preciso substituir as cópias pelos originais nos fenômenos morais ou físicos que o acaso ou a habilidade do mestre oferece ao espírito do aluno."
        },
        {
          "id": 69,
          "start": 855.73,
          "end": 868.16,
          "text": "Ensinou a conduzir as crianças à virtude, pela estrada fácil do sentimento, a afastá-las do mal pela força invencível de necessidade e dos inconvenientes que seguem a má ação."
        },
        {
          "id": 70,
          "start": 868.16,
          "end": 877.54,
          "text": "Demostrou que o método incerto da autoridade imperiosa deveria ser abandonado, pois só produz uma obediência hipócrita e passageira."
        }
      ],
      "imagens": []
    },
    {
      "numero": 46,
      "id": "capitulo-42",
      "titulo": "Capítulo 42: Conclusão",
      "autor": "Cesare Beccaria",
      "descricao": "Capítulo 42 do clássico Dos Delitos e das Penas: Conclusão.",
      "duracaoSegundos": 26,
      "duracaoFormatada": "00:26",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/audiobook-capitulo-42-conclusao.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-42-titulo.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capitulo-42-conclusao.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 26.47,
          "text": "DE tudo o que acaba de ser exposto, pode deduzir-se um teorema geral utilíssimo, mas conforme ao uso, que é o legislador ordinário das nações: É que, para não ser um ato de violência contra o cidadão, a pena deve ser essencialmente pública, pronta, necessária, a menor das penas aplicáveis nas circunstâncias dadas, proporcionada ao delito e determinada pela lei."
        }
      ],
      "imagens": []
    },
    {
      "numero": 47,
      "id": "apendice",
      "titulo": "Apêndice",
      "autor": "Cesare Beccaria",
      "descricao": "Reflexões e notas complementares sobre os princípios fundamentais das penas.",
      "duracaoSegundos": 3197,
      "duracaoFormatada": "53:17",
      "audioUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/apendice.mp3",
      "audioTituloUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/titulo-apendice.mp3",
      "srtUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/apendice.srt",
      "cues": [
        {
          "id": 1,
          "start": 0,
          "end": 24,
          "text": "RESPOSTAS ÀS “NOTAS E OBSERVAÇÕES” DE UM FRADE DOMINICANO SOBRE O LIVRO “DOS DELITOS E DAS PENAS” ESSAS Notas e Observações não passam de uma coleção de injúrias contra o autor do livro Dos Delitos e Das Penas, que é chamado fanático, impostor, escritor falso e perigoso, satírico desenfreado, sedutor do público."
        },
        {
          "id": 2,
          "start": 24,
          "end": 36.04,
          "text": "É acusado de distilar o fel mais amargo, de juntar a contradições vergonhosas os traços pérfidos e ocultos da dissimulação e de ser obscuro por perversidade."
        },
        {
          "id": 3,
          "start": 36.04,
          "end": 41.25,
          "text": "O crítico pode estar certo de que não responderei às personalidades."
        },
        {
          "id": 4,
          "start": 41.25,
          "end": 49.07,
          "text": "Representa ele o meu livro como uma obra horrível, virulenta e de uma licença venenosa, infame, ímpia."
        },
        {
          "id": 5,
          "start": 49.07,
          "end": 59.96,
          "text": "Encontra nele blasfêmias impudentes, insolentes ironias, pilhérias indecentes, sutilezas perigosas, motejos escandalosos, calúnias grosseiras."
        },
        {
          "id": 6,
          "start": 59.96,
          "end": 70.39,
          "text": "A religião e o respeito devido aos soberanos são o pretexto para duas das mais graves acusações que se acham nessas Notas e Observações."
        },
        {
          "id": 7,
          "start": 70.39,
          "end": 75.3,
          "text": "Serão estas as únicas às quais me julgarei obrigado a responder."
        },
        {
          "id": 8,
          "start": 75.3,
          "end": 77.14,
          "text": "Comecemos pela primeira."
        },
        {
          "id": 9,
          "start": 77.14,
          "end": 79.28,
          "text": "I – Acusação de impiedade 1."
        },
        {
          "id": 10,
          "start": 79.28,
          "end": 89.02,
          "text": "– “O autor do livro Dos Delitos e das Penas não conhece essa justiça que tem origem no legislador eterno, que tudo vê e prevê”."
        },
        {
          "id": 11,
          "start": 89.02,
          "end": 92.78,
          "text": "Eis mais ou menos o silogismo do autor das Notas."
        },
        {
          "id": 12,
          "start": 92.78,
          "end": 101.37,
          "text": "“O autor do livro Dos Delitos não aprova que a interpretação da lei dependa da vontade e do capricho de um juiz."
        },
        {
          "id": 13,
          "start": 101.37,
          "end": 111.49,
          "text": "– Ora, aquele que não quer confiar a interpretação da lei à vontade e aos caprichos de um juiz não crê numa justiça emanada de Deus."
        },
        {
          "id": 14,
          "start": 111.49,
          "end": 116.01,
          "text": "– O autor não admite, pois, uma justiça puramente divina..."
        },
        {
          "id": 15,
          "start": 116.01,
          "end": 116.32,
          "text": "” 2."
        },
        {
          "id": 16,
          "start": 116.32,
          "end": 123.45,
          "text": "– “Segundo o autor do livro Dos Delitos e das Penas, a Escritura santa só contém imposturas”."
        },
        {
          "id": 17,
          "start": 123.45,
          "end": 134.65,
          "text": "Em toda a obra Dos Delitos e das Penas, só se trata da Escritura santa uma única vez; é quando, a propósito dos erros religiosos, no capítulo XLI."
        },
        {
          "id": 18,
          "start": 134.65,
          "end": 146.61,
          "text": "eu disse que não falava desse povo eleito de Deus, para o qual os milagres mais extraordinários e as graças mais assinaladas substituíram a política humana."
        },
        {
          "id": 19,
          "start": 146.61,
          "end": 146.76,
          "text": "3."
        },
        {
          "id": 20,
          "start": 146.76,
          "end": 157.19,
          "text": "– “Toda a gente sensata encontrou no autor do livro Dos Delitos e das Penas um inimigo do cristianismo, um mau homem e um mau filósofo”."
        },
        {
          "id": 21,
          "start": 157.19,
          "end": 165.78,
          "text": "Pouco me importa parecer ao meu crítico bom ou mau filósofo; os que me conhecem asseguram que não sou mau homem."
        },
        {
          "id": 22,
          "start": 165.78,
          "end": 191.39,
          "text": "Serei, então, inimigo do cristianismo, quando insisto para que a tranqüilidade dos templos seja assegurada sob a proteção do governo, e quando digo, ao falar da sorte das grandes verdades, que a revelação é a única que se conservou em sua pureza, em meio às nuvens tenebrosas com que o erro envolveu o universo durante tantos séculos?"
        },
        {
          "id": 23,
          "start": 191.39,
          "end": 191.54,
          "text": "4."
        },
        {
          "id": 24,
          "start": 191.54,
          "end": 200.2,
          "text": "– “O autor do livro Dos Delitos e das Penas fala da religião como se se tratasse de uma simples máxima política”."
        },
        {
          "id": 25,
          "start": 200.2,
          "end": 206.49,
          "text": "O autor do livro Dos Delitos e das Penas chama à religião “um dom sagrado do céu”."
        },
        {
          "id": 26,
          "start": 206.49,
          "end": 213.85,
          "text": "Será provável que ele trate como simples máxima política o que lhe parece um dom sagrado do céu?"
        },
        {
          "id": 27,
          "start": 213.85,
          "end": 214.01,
          "text": "5."
        },
        {
          "id": 28,
          "start": 214.01,
          "end": 217.61,
          "text": "– “O autor é inimigo declarado do Ser supremo”."
        },
        {
          "id": 29,
          "start": 217.61,
          "end": 223.67,
          "text": "Peço de todo meu coração que esse Ser supremo perdoe a todos os que me ofendem."
        },
        {
          "id": 30,
          "start": 223.67,
          "end": 223.82,
          "text": "6."
        },
        {
          "id": 31,
          "start": 223.82,
          "end": 237.85,
          "text": "– “Se o cristianismo causou algumas desgraças e alguns morticínios, ele exagera-os e silencia sobre os bens e as vantagens que a luz do Evangelho espalhou sobre todo o gênero humano”."
        },
        {
          "id": 32,
          "start": 237.85,
          "end": 249.35,
          "text": "Não se encontrará um único lugar no meu livro que faça menção aos males causados pelo Evangelho; não citei mesmo um só fato que com isso se relacione."
        },
        {
          "id": 33,
          "start": 249.35,
          "end": 249.51,
          "text": "7."
        },
        {
          "id": 34,
          "start": 249.51,
          "end": 258.56,
          "text": "– “O autor profere uma blasfêmia contra os ministros da religião, ao dizer que suas mãos sujaram-se de sangue humano”."
        },
        {
          "id": 35,
          "start": 258.56,
          "end": 270.67,
          "text": "Todos os que escreveram a história, desde Carlos Magno (24) até Otão-o- Grande (25), e mesmo depois desse príncipe, proferiram muitas vezes a mesma blasfêmia."
        },
        {
          "id": 36,
          "start": 270.67,
          "end": 275.35,
          "text": "Ignorar-se-á que, durante três séculos, o clero, os abades e."
        },
        {
          "id": 37,
          "start": 275.35,
          "end": 280.18,
          "text": "os bispos não tiveram escrúpulo algum em marchar para a guerra?"
        },
        {
          "id": 38,
          "start": 280.18,
          "end": 292.98,
          "text": "E não será o caso de dizer, sem blasfemar, que os eclesiásticos que se achavam no meio das batalhas e que participaram da carnificina sujavam as mãos de sangue humano?"
        },
        {
          "id": 39,
          "start": 292.98,
          "end": 293.14,
          "text": "8."
        },
        {
          "id": 40,
          "start": 293.14,
          "end": 307.63,
          "text": "– “Os prelados da Igreja católica, tão recomendáveis por sua doçura e sua humanidade, passam, no livro Dos Delitos e das Penas, por ser os autores de suplícios tão bárbaros quanto inúteis”."
        },
        {
          "id": 41,
          "start": 307.63,
          "end": 313.15,
          "text": "Não tenho culpa de ser obrigado a repetir mais de uma vez a mesma coisa."
        },
        {
          "id": 42,
          "start": 313.15,
          "end": 319.82,
          "text": "Não se citará na minha obra uma só frase que diga que os prelados inventaram suplícios."
        },
        {
          "id": 43,
          "start": 319.82,
          "end": 319.97,
          "text": "9."
        },
        {
          "id": 44,
          "start": 319.97,
          "end": 328.72,
          "text": "– “A heresia não pode chamar-se crime de lesa-majestade divina, segundo o autor do livro Dos Delitos e das Penas”."
        },
        {
          "id": 45,
          "start": 328.72,
          "end": 334.47,
          "text": "Não há em todo o meu livro uma palavra que possa dar lugar a tal imputação."
        },
        {
          "id": 46,
          "start": 334.47,
          "end": 339.6,
          "text": "Propus-me apenas tratar Dos Delitos e das Penas, e não dos pecados."
        },
        {
          "id": 47,
          "start": 339.6,
          "end": 357.55,
          "text": "Eu disse, falando do crime de lesa-majestade, que somente a ignorância e a tirania, que confundem as palavras e as idéias mais claras, podem chamar por esse nome e punir como tais, com o último suplício, delitos de natureza diferente."
        },
        {
          "id": 48,
          "start": 357.55,
          "end": 374.26,
          "text": "O crítico talvez ignore quanto se abusa da palavra lesa-majestade nos tempos de tirania e de ignorância, aplicando-a a delitos de gênero inteiramente diverso, pois não conduziam imediatamente à destruição da sociedade."
        },
        {
          "id": 49,
          "start": 374.26,
          "end": 392.51,
          "text": "Consulte a lei dos imperadores Graciano (26), Valentiniano (27) e Teodósio (28); observe como são considerados criminosos de lesa- majestade aqueles que ousam duvidar da bondade da escolha do imperador, quando este conferia algum emprego."
        },
        {
          "id": 50,
          "start": 392.51,
          "end": 403.25,
          "text": "Uma outra lei de Valentiniano, de Teodósio e de Arcácio (29) ensinar-lhe-á que os moedeiros falsos também eram criminosos de lesa-majestade."
        },
        {
          "id": 51,
          "start": 403.25,
          "end": 415.05,
          "text": "Era preciso um decreto do Senado para livrar da acusação de lesa-majestade aquele que tivesse fundido estátuas dos imperadores, embora velhas e mutiladas."
        },
        {
          "id": 52,
          "start": 415.05,
          "end": 440.2,
          "text": "Somente depois de um edito dos imperadores Severo (30) e Antonino é que se deixou de intentar a ação de lesa-majestade contra os que vendiam as estátuas dos imperadores; e esses príncipes baixaram um decreto que proibia a perseguição por esse crime daqueles que acaso tivessem lançado uma pedra contra a estátua de um imperador."
        },
        {
          "id": 53,
          "start": 440.2,
          "end": 447.1,
          "text": "Domiciano (31) condenou à morte uma dama romana, por se ter despido diante de sua estátua."
        },
        {
          "id": 54,
          "start": 447.1,
          "end": 457.3,
          "text": "Tibério (32) mandou matar, como criminoso de lesa-majestade, um cidadão que vendera uma casa em que se achava a estátua do imperador."
        },
        {
          "id": 55,
          "start": 457.3,
          "end": 476.55,
          "text": "Em séculos menos distantes do nosso, verá Henrique VIII (33) abusar de tal modo das leis que fez perecer por um suplício infame o duque de Norfolk, sob o pretexto de crime de lesa-majestade, porque ele juntara as armas da Inglaterra às de sua família."
        },
        {
          "id": 56,
          "start": 476.55,
          "end": 492.65,
          "text": "Esse monarca chegou a declarar culpado do mesmo crime quem quer que ousasse prever a morte do príncipe; daí resultou que, na sua última moléstia, os seus médicos recusaram adverti-lo do perigo em que se achava."
        },
        {
          "id": 57,
          "start": 492.65,
          "end": 492.88,
          "text": "10."
        },
        {
          "id": 58,
          "start": 492.88,
          "end": 504.23,
          "text": "– “Segundo o autor do livro Dos Delitos e das Penas, os hereges anatematizados pela Igreja e proscritos pelos príncipes são vítimas de uma palavra”."
        },
        {
          "id": 59,
          "start": 504.23,
          "end": 507.3,
          "text": "Todas essas interpretações são forçadas."
        },
        {
          "id": 60,
          "start": 507.3,
          "end": 520.1,
          "text": "Limitei-me a falar do crime de lesa-majestade humana; e a palavra lesa-majestade serviu muitas vezes de pretexto à tirania, sobretudo ao tempo dos imperadores romanos."
        },
        {
          "id": 61,
          "start": 520.1,
          "end": 527.46,
          "text": "Toda ação que tivesse a desgraça de desagradar-lhes tornava-se logo um crime de lesa- majestade."
        },
        {
          "id": 62,
          "start": 527.46,
          "end": 535.28,
          "text": "Suetônio (34) diz que o crime de lesa-majestade era o delito dos que não tinham cometido delito algum."
        },
        {
          "id": 63,
          "start": 535.28,
          "end": 548.55,
          "text": "Se eu disse que a ignorância e a tirania deram esse nome a delitos de natureza diferente e tornaram os homens vítimas de uma palavra, não fiz senão falar segundo a história."
        },
        {
          "id": 64,
          "start": 548.55,
          "end": 548.78,
          "text": "11."
        },
        {
          "id": 65,
          "start": 548.78,
          "end": 573.62,
          "text": "– “Não será uma horrível blasfêmia sustentar, com o autor do livro Dos Delitos e das Penas, que a eloqüência, a declamação e as mais sublimes verdades são um freio demasiado fraco para reter por muito tempo as paixões humanas?” Não penso que a acusação de blasfêmia recaia sobre o que eu disse da eloqüência e da declamação."
        },
        {
          "id": 66,
          "start": 573.62,
          "end": 580.91,
          "text": "O acusador quis, de certo, referir-se à insuficiência que eu atribuo às mais sublimes verdades."
        },
        {
          "id": 67,
          "start": 580.91,
          "end": 587.81,
          "text": "Pergunto-lhe se julga que na Itália se conhecem essas sublimes verdades, isto é, as da fé."
        },
        {
          "id": 68,
          "start": 587.81,
          "end": 590.49,
          "text": "Sem dúvida, responder-me-á que sim."
        },
        {
          "id": 69,
          "start": 590.49,
          "end": 595.47,
          "text": "Mas serviram tais verdades de freio às paixões humanas na Itália?"
        },
        {
          "id": 70,
          "start": 595.47,
          "end": 603.29,
          "text": "Todos os oradores sacros, todos os juizes, todos os homens, numa palavra, assegurar-me-ão o contrário."
        },
        {
          "id": 71,
          "start": 603.29,
          "end": 622.62,
          "text": "É um fato, pois, que as sublimes verdades são, para as paixões humanas, um freio que as não refreia ou que logo se parte; e, enquanto houver num país católico, juizes criminosos, prisões e castigos, estará provada a insuficiência das sublimes verdades."
        },
        {
          "id": 72,
          "start": 622.62,
          "end": 622.85,
          "text": "12."
        },
        {
          "id": 73,
          "start": 622.85,
          "end": 630.13,
          "text": "– “O autor do livro Dos Delitos e das Penas escreve imposturas sacrílegas contra a Inquisição”."
        },
        {
          "id": 74,
          "start": 630.13,
          "end": 635.81,
          "text": "Meu livro não faz nenhuma menção, nem direta, nem indireta, da Inquisição."
        },
        {
          "id": 75,
          "start": 635.81,
          "end": 645.54,
          "text": "Pergunto, porém, ao meu acusador se lhe parece bem conforme ao espírito da Igreja a condenação de homens à morte nas fogueiras."
        },
        {
          "id": 76,
          "start": 645.54,
          "end": 661.8,
          "text": "Não é do seio mesmo de Roma, sob os olhos do vigário de Jesus Cristo, na capital da religião católica, que se cumprem hoje, para com protestantes de qualquer nação, todos os deveres de humanidade e hospitalidade?"
        },
        {
          "id": 77,
          "start": 661.8,
          "end": 684.04,
          "text": "Os últimos papas, e sobretudo o atual, receberam e recebem com a maior bondade os ingleses, os holandeses e os russos; esses povos, de seitas e religiões diferentes, têm em Roma toda a liberdade passível, e ninguém está mais certo do que eles de gozar ali da proteção das leis e do governo."
        },
        {
          "id": 78,
          "start": 684.04,
          "end": 684.27,
          "text": "13."
        },
        {
          "id": 79,
          "start": 684.27,
          "end": 693.39,
          "text": "– “O autor do livro Dos Delitos e das Penas representa, sob cores odiosas, as ordens religiosas e sobretudo os frades”."
        },
        {
          "id": 80,
          "start": 693.39,
          "end": 706.81,
          "text": "Seria difícil citar um só lugar do meu livro que faça menção de ordens religiosas ou de frades, a menos que se interprete arbitrariamente o capitulo em que falo da ociosidade."
        },
        {
          "id": 81,
          "start": 706.81,
          "end": 707.04,
          "text": "14."
        },
        {
          "id": 82,
          "start": 707.04,
          "end": 729.97,
          "text": "– “O autor do livro Dos Delitos e das Penas é um desses escritores ímpios, para os quais os eclesiásticos não passam de charlatães, os monarcas de tiranos, os santos de fanáticos, a religião de impostura, e que nem mesmo respeitam a majestade do Criador, contra o qual vomitam blasfêmias hediondas”."
        },
        {
          "id": 83,
          "start": 729.97,
          "end": 732.5,
          "text": "Passemos às acusações de sedição."
        },
        {
          "id": 84,
          "start": 732.5,
          "end": 734.64,
          "text": "II – Acusações de sedição 1."
        },
        {
          "id": 85,
          "start": 734.64,
          "end": 744.23,
          "text": "– “O autor do livro Dos Delitos e das Penas considera todos os príncipes e todos os soberanos do século como tiranos cruéis”."
        },
        {
          "id": 86,
          "start": 744.23,
          "end": 757.49,
          "text": "Só uma vez falei no meu livro dos soberanos e dos príncipes que reinam atualmente na Europa; e eis o que digo: “Feliz o gênero humano, se, pela primeira vez, recebesse leis!"
        },
        {
          "id": 87,
          "start": 757.49,
          "end": 762.94,
          "text": "Hoje, que vemos elevados nos tronos da Europa, etc.” (Ver o fim do cap."
        },
        {
          "id": 88,
          "start": 762.94,
          "end": 763.32,
          "text": "XVI)."
        },
        {
          "id": 89,
          "start": 763.32,
          "end": 763.47,
          "text": "2."
        },
        {
          "id": 90,
          "start": 763.47,
          "end": 776.05,
          "text": "– “Não podem deixar de espantar a confiança e a liberdade com que o autor do livro Dos Delitos e das Penas se volta furioso contra os soberanos e os eclesiásticos”."
        },
        {
          "id": 91,
          "start": 776.05,
          "end": 779.19,
          "text": "A confiança e a liberdade não são um mal."
        },
        {
          "id": 92,
          "start": 779.19,
          "end": 786.63,
          "text": "Qui ambulat simpliciter, ambulat confidenter; qui autem depravat vias suas, manifestus erit (35)."
        },
        {
          "id": 93,
          "start": 786.63,
          "end": 798.29,
          "text": "Se aprovei nos súditos certo espírito de independência, foi na medida que se submetessem às leis e fossem respeitosos para com os primeiros magistrados."
        },
        {
          "id": 94,
          "start": 798.29,
          "end": 824.66,
          "text": "Desejo mesmo que os homens, não tendo que temer a escravidão, mas gozando de sua liberdade sob a proteção das leis, se tornem soldados intrépidos, defensores da pátria e do trono, cidadãos virtuosos e magistrados incorruptíveis, que levem ao pé do trono os tributos e o amor de todas as ordens da nação e que espalhem nas cabanas a segurança e."
        },
        {
          "id": 95,
          "start": 824.66,
          "end": 828.04,
          "text": "a esperança de uma sorte cada vez mais doce."
        },
        {
          "id": 96,
          "start": 828.04,
          "end": 842.83,
          "text": "Já não estamos nos séculos de Calígula (36), de Nero (37), de Heliogábalo (38); e o crítico faz muito pouca justiça aos príncipes reinantes acreditando que os meus princípios possam ofendê-los."
        },
        {
          "id": 97,
          "start": 842.83,
          "end": 842.99,
          "text": "3."
        },
        {
          "id": 98,
          "start": 842.99,
          "end": 854.26,
          "text": "– “O autor do livro Dos Delitos e das Penas sustenta que o interesse do particular supera o de toda a sociedade em geral ou dos que a representam”."
        },
        {
          "id": 99,
          "start": 854.26,
          "end": 865.15,
          "text": "Se houvesse tal absurdo no livro Dos Delitos e das Penas, não creio que o meu adversário tivesse feito um livro de 191 páginas para refutá-lo."
        },
        {
          "id": 100,
          "start": 865.15,
          "end": 865.3,
          "text": "4."
        },
        {
          "id": 101,
          "start": 865.3,
          "end": 872.89,
          "text": "– “O autor do livro Dos Delitos e das Penas contesta aos soberanos o direito de punir com a morte”."
        },
        {
          "id": 102,
          "start": 872.89,
          "end": 884.62,
          "text": "Como não se trata aqui nem de religião nem de governo, mas somente da justeza de um raciocínio, meu acusador tem toda a liberdade de julgar o que quiser."
        },
        {
          "id": 103,
          "start": 884.62,
          "end": 902.34,
          "text": "Reduzo o meu silogismo desta forma: Não se deve infligir a pena de morte, se esta não é verdadeiramente útil e necessária; Mas, a pena de morte não é necessária nem verdadeiramente útil; Não deve, pois, infligir-se a pena de morte."
        },
        {
          "id": 104,
          "start": 902.34,
          "end": 907.86,
          "text": "Não é este o lugar para uma dissertação sobre os direitos dos soberanos."
        },
        {
          "id": 105,
          "start": 907.86,
          "end": 918.82,
          "text": "O crítico não quererá, certamente, sustentar que se deva infligir a pena de morte, mesmo quando ela não é verdadeiramente útil, nem necessária."
        },
        {
          "id": 106,
          "start": 918.82,
          "end": 924.11,
          "text": "Proposta tão cruel e escandalosa não pode sair da boca de um cristão."
        },
        {
          "id": 107,
          "start": 924.11,
          "end": 932.62,
          "text": "Se a segunda parte do silogismo não é exata, tratar-se-á de um crime de lesa- lógica e nunca de lesa-majestade."
        },
        {
          "id": 108,
          "start": 932.62,
          "end": 951.41,
          "text": "Podem, aliás, escusar-se os meus pretensos erros; assemelham-se eles àqueles em que incidiram tantos cristãos zelosos da primitiva Igreja (39); assemelham-se àqueles em que incorreram os frades da época de Teodósio-o-Grande, no fim do IV século."
        },
        {
          "id": 109,
          "start": 951.41,
          "end": 973.26,
          "text": "Nos seus Anais da Itália, diz Muratori (40) que, no ano 389, “Teodósio fez uma lei pela qual ordenava aos frades que permanecessem nos conventos, porque levavam a caridade pelo próximo ao ponto de arrancar os criminosos das mãos da justiça, não querendo que se mandasse matar ninguém”."
        },
        {
          "id": 110,
          "start": 973.26,
          "end": 981.77,
          "text": "Minha caridade não vai tão longe e convirei de bom grado que a daquele tempo se conduzia por falsos princípios."
        },
        {
          "id": 111,
          "start": 981.77,
          "end": 986.76,
          "text": "Uma ação violenta contra a autoridade pública é sempre criminosa."
        },
        {
          "id": 112,
          "start": 986.76,
          "end": 989.82,
          "text": "Restam-me ainda duas palavras que dizer."
        },
        {
          "id": 113,
          "start": 989.82,
          "end": 1002.48,
          "text": "Haverá no mundo uma lei que proíba dizer-se ou escrever-se que um Estado pode existir e conservar a paz interna sem empregar a pena de morte contra qualquer culpado?"
        },
        {
          "id": 114,
          "start": 1002.48,
          "end": 1004.32,
          "text": "Conta Deodoro (41) (liv."
        },
        {
          "id": 115,
          "start": 1004.32,
          "end": 1004.85,
          "text": "I, cap."
        },
        {
          "id": 116,
          "start": 1004.85,
          "end": 1021.42,
          "text": "LXV) que Sabacão, rei do Egito, fez-se admirar como modelo de demência, porque comutou as penas capitais nas da escravidão e porque deu um emprego feliz à sua autoridade condenando os culpados aos trabalhos públicos."
        },
        {
          "id": 117,
          "start": 1021.42,
          "end": 1022.87,
          "text": "Estrabão (42) (liv."
        },
        {
          "id": 118,
          "start": 1022.87,
          "end": 1038.13,
          "text": "XI) informa-nos que havia, perto do Cáucaso, algumas nações que não conheciam a pena de morte, mesmo quando o delito merecia os maiores suplícios, nemini mortem irrogare, quamvis pessima merito (43)."
        },
        {
          "id": 119,
          "start": 1038.13,
          "end": 1053.16,
          "text": "Essa verdade é consignada na história romana, na época da lei Pórcia, que proíbe que se tire a vida de um cidadão romano, se a sentença de morte não for revestida do consenso geral de todo o povo."
        },
        {
          "id": 120,
          "start": 1053.16,
          "end": 1055.92,
          "text": "Tito Lívio (44) fala dessa lei (liv."
        },
        {
          "id": 121,
          "start": 1055.92,
          "end": 1056.46,
          "text": "X, cap."
        },
        {
          "id": 122,
          "start": 1056.46,
          "end": 1056.76,
          "text": "IX)."
        },
        {
          "id": 123,
          "start": 1056.76,
          "end": 1076.85,
          "text": "Finalmente, o exemplo recente de um reinado de vinte anos, no mais vasto império do mundo, a Rússia, atesta ainda essa verdade: a imperatriz Isabel, morta há alguns anos, jurou, ao subir ao trono dos czares, que não faria morrer nenhum culpado sob o seu reinado."
        },
        {
          "id": 124,
          "start": 1076.85,
          "end": 1089.5,
          "text": "Essa augusta princesa nunca deixou de cumprir o feliz compromisso que assumira, sem interromper o curso da justiça criminal e sem prejudicar a tranqüilidade pública."
        },
        {
          "id": 125,
          "start": 1089.5,
          "end": 1100.09,
          "text": "Se esses fatos são incontestáveis, será, então verdade dizer que um Estado pode subsistir e ser feliz sem punir de morte nenhum criminoso."
        },
        {
          "id": 126,
          "start": 1100.09,
          "end": 1111.28,
          "text": "EXTRATO DA CORRESPONDÊNCIA DE BECCARIA E DE MORELLET SOBRE O LIVRO \"DOS DELITOS E DAS PENAS\" De Morellet (45) a Beccaria Paris, fevereiro de 1766."
        },
        {
          "id": 127,
          "start": 1111.28,
          "end": 1122.71,
          "text": "Senhor: Sem ter a honra de conhecer-vos, julgo-me no direito de endereçar-vos um exemplar da tradução que fiz de vossa obra Dei Delitti e delle Pene."
        },
        {
          "id": 128,
          "start": 1122.71,
          "end": 1139.19,
          "text": "Os homens de letras são cosmopolitas e de todas as nações; estão ligados por laços mais estreitos do que os que unem os cidadãos de um mesmo país, os habitantes de uma mesma cidade e os membros de uma mesma família."
        },
        {
          "id": 129,
          "start": 1139.19,
          "end": 1160.89,
          "text": "Julgo, pois, poder entrar convosco num comércio de idéias e de sentimentos que me será bastante agradável, se não vos recusardes ao entusiasmo de um homem que vos estima sem conhecer-vos pessoalmente, mas que adquiriu esses sentimentos por vós na leitura do vosso excelente trabalho."
        },
        {
          "id": 130,
          "start": 1160.89,
          "end": 1161.58,
          "text": "Foi o sr."
        },
        {
          "id": 131,
          "start": 1161.58,
          "end": 1170.86,
          "text": "de Malesherbes (46), com quem tenho a honra de conviver, que me empenhou em fazer passar vosso livro para a nossa língua."
        },
        {
          "id": 132,
          "start": 1170.86,
          "end": 1175.38,
          "text": "Eu não tinha necessidade, para tanto, de esforçar-me muito."
        },
        {
          "id": 133,
          "start": 1175.38,
          "end": 1192.41,
          "text": "Era-me uma ocupação agradável tornar-me, para minha nação e para o país em que nossa língua está difundida, o intérprete e o órgão das idéias fortes e grandes e dos sentimentos de benevolência de que vossa obra está cheia."
        },
        {
          "id": 134,
          "start": 1192.41,
          "end": 1207.43,
          "text": "Parecia-me que me associaria ao bem que fazíeis aos homens e que poderia igualmente pretender certo reconhecimento da parte dos corações sensíveis, aos quais são caros os interesses da humanidade."
        },
        {
          "id": 135,
          "start": 1207.43,
          "end": 1211.04,
          "text": "Faz hoje oito dias que minha tradução apareceu."
        },
        {
          "id": 136,
          "start": 1211.04,
          "end": 1221.08,
          "text": "Eu não quis escrever-vos mais cedo, porque julguei dever esperar que pudesse instruir-vos sobre a impressão causada por vossa obra."
        },
        {
          "id": 137,
          "start": 1221.08,
          "end": 1239.1,
          "text": "Ouso, pois, assegurar-vos, Senhor, que o êxito é universal e que, além da atenção despertada pelo livro, se formaram pelo autor sentimentos que podem lisonjear-vos ainda mais, isto é, a estima, o reconhecimento, o interesse, a amizade."
        },
        {
          "id": 138,
          "start": 1239.1,
          "end": 1246.31,
          "text": "Estou particularmente encarregado de apresentar-vos os agradecimentos e os cumprimentos do sr."
        },
        {
          "id": 139,
          "start": 1246.31,
          "end": 1247.84,
          "text": "Diderot (47), do Sr."
        },
        {
          "id": 140,
          "start": 1247.84,
          "end": 1249.53,
          "text": "Helvétius (48), do Sr."
        },
        {
          "id": 141,
          "start": 1249.53,
          "end": 1250.68,
          "text": "de Buffon (49)."
        },
        {
          "id": 142,
          "start": 1250.68,
          "end": 1252.98,
          "text": "Já conversamos muito com o sr."
        },
        {
          "id": 143,
          "start": 1252.98,
          "end": 1260.03,
          "text": "Diderot sobre vossa obra, que é bem capaz de pôr fogo a uma cabeça tão quente como é a dele."
        },
        {
          "id": 144,
          "start": 1260.03,
          "end": 1266.63,
          "text": "Terei algumas observações que vos comunicar, que são o resultado das nossas conversas."
        },
        {
          "id": 145,
          "start": 1266.63,
          "end": 1267.01,
          "text": "O sr."
        },
        {
          "id": 146,
          "start": 1267.01,
          "end": 1278.13,
          "text": "de Buffon serviu-se das expressões mais fortes para testemunhar-me o prazer que vosso livro lhe causou; e pede-vos aceiteis os seus cumprimentos."
        },
        {
          "id": 147,
          "start": 1278.13,
          "end": 1280.51,
          "text": "Levei também vosso livro ao Sr."
        },
        {
          "id": 148,
          "start": 1280.51,
          "end": 1289.33,
          "text": "Rousseau (50), que está em Paris de viagem para a Inglaterra, aonde vai estabelecer-se, e que parte por estes dias."
        },
        {
          "id": 149,
          "start": 1289.33,
          "end": 1294.46,
          "text": "Ainda não posso dizer-vos sua impressão, porque não tornei a vê-lo."
        },
        {
          "id": 150,
          "start": 1294.46,
          "end": 1298.3,
          "text": "Talvez possa conhecê-la hoje por intermédio do Sr."
        },
        {
          "id": 151,
          "start": 1298.3,
          "end": 1304.35,
          "text": "Hume (51), com quem irei jantar; estou, porém, certo da impressão que ele terá."
        },
        {
          "id": 152,
          "start": 1304.35,
          "end": 1304.74,
          "text": "O sr."
        },
        {
          "id": 153,
          "start": 1304.74,
          "end": 1312.25,
          "text": "Hume, que vive há tempos conosco, encarregou-me, igualmente, de dizer-vos mil coisas de sua parte."
        },
        {
          "id": 154,
          "start": 1312.25,
          "end": 1321.84,
          "text": "A essas pessoas, que conheceis por sua reputação, acrescento um homem infinitamente estimável que as reúne em sua casa, o Sr."
        },
        {
          "id": 155,
          "start": 1321.84,
          "end": 1341.31,
          "text": "barão d'Holbach (52), autor de excelentes trabalhos impressos, de química e de história natural, e de muitos outros que não foram publicados; filósofo profundo, juiz esclarecidíssimo de todos os gêneros de conhecimentos, alma sensível e aberta à amizade."
        },
        {
          "id": 156,
          "start": 1341.31,
          "end": 1349.67,
          "text": "Não posso exprimir-vos a impressão que vosso livro lhe causou, nem quanto ele ama e estima a obra, e o autor."
        },
        {
          "id": 157,
          "start": 1349.67,
          "end": 1361.63,
          "text": "Como passamos a vida em casa dele, seria preciso que o conhecêsseis primeiro, porque, se pudermos ter a honra de atrair-vos a Paris, esta casa será a vossa."
        },
        {
          "id": 158,
          "start": 1361.63,
          "end": 1367.23,
          "text": "Envio- vos, pois, igualmente, os seus agradecimentos e as suas saudações."
        },
        {
          "id": 159,
          "start": 1367.23,
          "end": 1368.69,
          "text": "Não vos falo do Sr."
        },
        {
          "id": 160,
          "start": 1368.69,
          "end": 1375.97,
          "text": "d'Alembert (53), que vos escreveu e me disse que queria juntar ainda uma palavra à minha carta."
        },
        {
          "id": 161,
          "start": 1375.97,
          "end": 1379.42,
          "text": "Deveis conhecer sua opinião sobre vossa obra."
        },
        {
          "id": 162,
          "start": 1379.42,
          "end": 1384.25,
          "text": "Quanto à tradução, compete-lhe dizer-vos se ficou satisfeito..."
        },
        {
          "id": 163,
          "start": 1384.25,
          "end": 1403.65,
          "text": "Não vos ocultarei a mais forte razão que me determinou a tratar de vos dar alguma boa opinião de mim: a esperança de que me perdoareis mais facilmente a liberdade que tomei de fazer algumas modificações na disposição de algumas partes do vosso trabalho."
        },
        {
          "id": 164,
          "start": 1403.65,
          "end": 1412.62,
          "text": "Apresentei no prefácio as razões gerais que me justificam: convosco, porém, devo alongar-me um pouco a esse respeito."
        },
        {
          "id": 165,
          "start": 1412.62,
          "end": 1427.42,
          "text": "Para o espírito filosófico que se torna senhor da matéria, nada mais fácil do que apreender o conjunto de vosso tratado, cujas partes se ligam estreitamente e dependem todas do mesmo princípio."
        },
        {
          "id": 166,
          "start": 1427.42,
          "end": 1443.52,
          "text": "Mas, para os leitores vulgares e menos instruídos, e sobretudo para os leitores franceses, julgo ter seguido um caminho mais regular e em tudo mais conforme ao gênio de minha nação e à feição dos nossos livros."
        },
        {
          "id": 167,
          "start": 1443.52,
          "end": 1453.64,
          "text": "A única objeção que posso temer é a censura de ter diminuído a força e o calor do original, pelo restabelecimento mesmo dessa ordem."
        },
        {
          "id": 168,
          "start": 1453.64,
          "end": 1460.85,
          "text": "Eis minhas respostas: Sei que a verdade tem a maior necessidade da eloqüência e do sentimento."
        },
        {
          "id": 169,
          "start": 1460.85,
          "end": 1469.29,
          "text": "Seria absurdo pensar o contrário, e sobretudo não seria convosco que se poderia avançar tão estranho paradoxo."
        },
        {
          "id": 170,
          "start": 1469.29,
          "end": 1483.01,
          "text": "Mas, se não é preciso sacrificar o calor à ordem, creio não ser preciso tão pouco sacrificar a ordem ao calor; e tudo irá bem se se puderem conciliar essas duas coisas a um tempo."
        },
        {
          "id": 171,
          "start": 1483.01,
          "end": 1487.23,
          "text": "Resta, pois, examinar, se me saí bem nessa conciliação."
        },
        {
          "id": 172,
          "start": 1487.23,
          "end": 1497.81,
          "text": "Se minha tradução tem menos calor do que o original, seria preciso atribuir essa falha a muitas outras causas, e não à diferença da ordem."
        },
        {
          "id": 173,
          "start": 1497.81,
          "end": 1509.39,
          "text": "Seria ou a fraqueza do estilo do tradutor, ou a natureza mesma de toda tradução, que deve ficar abaixo do original, sobretudo nas coisas de sentimento."
        },
        {
          "id": 174,
          "start": 1509.39,
          "end": 1513.45,
          "text": "Não devo dissimular-vos outra objeção que me fizeram."
        },
        {
          "id": 175,
          "start": 1513.45,
          "end": 1520.12,
          "text": "Disseram-me que um autor poderia chocar-se ao ver em sua obra modificações mesmo úteis."
        },
        {
          "id": 176,
          "start": 1520.12,
          "end": 1524.49,
          "text": "Mas, Senhor, essa maneira de ver não poderia ser a vossa."
        },
        {
          "id": 177,
          "start": 1524.49,
          "end": 1526.56,
          "text": "Assim pelo menos o julguei."
        },
        {
          "id": 178,
          "start": 1526.56,
          "end": 1541.52,
          "text": "Um homem de gênio, que fez uma obra admirável, cheia de idéias novas e fortes, e excelente pelo fundo, deve poder ouvir dizer friamente que o seu livro não tem toda a ordem de que era suscetível."
        },
        {
          "id": 179,
          "start": 1541.52,
          "end": 1548.65,
          "text": "Deve ir mesmo até à adoção das modificações feitas, se forem úteis e baseadas em boas razões."
        },
        {
          "id": 180,
          "start": 1548.65,
          "end": 1551.71,
          "text": "Eis Senhor, a coragem que espero de vós."
        },
        {
          "id": 181,
          "start": 1551.71,
          "end": 1565.36,
          "text": "Rejeitai, dentre as modificações feitas por mim, aquelas que vos parecem mal-entendidas; conservai as que estiverem bem, e acreditai que só tereis feito aumentar vossa reputação."
        },
        {
          "id": 182,
          "start": 1565.36,
          "end": 1572.19,
          "text": "Sois digno de que eu use para convosco dessa confiança, e me lisonjeio de que o aproveis."
        },
        {
          "id": 183,
          "start": 1572.19,
          "end": 1580.24,
          "text": "Terminarei minha justificativa citando-vos grandes autoridades que aplaudiram a liberdade por mim tomada."
        },
        {
          "id": 184,
          "start": 1580.24,
          "end": 1580.62,
          "text": "O sr."
        },
        {
          "id": 185,
          "start": 1580.62,
          "end": 1585.07,
          "text": "d'Alembert permite-me que vos diga ser essa a sua opinião."
        },
        {
          "id": 186,
          "start": 1585.07,
          "end": 1585.45,
          "text": "O sr."
        },
        {
          "id": 187,
          "start": 1585.45,
          "end": 1591.28,
          "text": "Hume, que leu com muito cuidado o original e a tradução, é do mesmo parecer."
        },
        {
          "id": 188,
          "start": 1591.28,
          "end": 1597.72,
          "text": "Eu poderia citar-vos ainda numerosas pessoas instruídas que assim também o julgaram."
        },
        {
          "id": 189,
          "start": 1597.72,
          "end": 1610.76,
          "text": "A avidez com a qual o público recebeu aqui vossa obra faz-me acreditar que a nossa primeira edição breve estará esgotada e que, antes de um mês, será preciso fazer outra."
        },
        {
          "id": 190,
          "start": 1610.76,
          "end": 1630.92,
          "text": "Se, na disposição que apresentei, separei idéias que devam estar ligadas, ou fiz aproximações que vos pareçam prejudicar o sentido, peço-vos que a respeito me participeis vossas observações, e, numa nova edição, não deixarei de conformar-me com vossas opiniões..."
        },
        {
          "id": 191,
          "start": 1630.92,
          "end": 1646.18,
          "text": "Termino, Senhor, esta longa carta, rogando-vos que me considereis como um dos vossos maiores admiradores e como um dos homens que mais vivamente desejam participar de vossa estima e de vossa amizade."
        },
        {
          "id": 192,
          "start": 1646.18,
          "end": 1651.7,
          "text": "Muito me afligiria a idéia de não vô-lo poder dizer um dia a vós mesmos."
        },
        {
          "id": 193,
          "start": 1651.7,
          "end": 1665.96,
          "text": "Estou ansioso por ter vossas notícias, conhecer vosso juízo sobre a minha tradução, saber se continuais a marchar na bela estrada que vos abristes e a ocupar-vos com o bem da humanidade."
        },
        {
          "id": 194,
          "start": 1665.96,
          "end": 1672.79,
          "text": "É com tais sentimentos de respeito, de estima e de amizade que tenho a honra de ser, etc."
        },
        {
          "id": 195,
          "start": 1672.79,
          "end": 1673.48,
          "text": "Morellet."
        },
        {
          "id": 196,
          "start": 1673.48,
          "end": 1676.77,
          "text": "De Beccaria a Morellet Milão, maio de 1766."
        },
        {
          "id": 197,
          "start": 1676.77,
          "end": 1690.12,
          "text": "Permiti-me, Senhor, que empregue convosco as fórmulas usadas na vossa língua, como mais cômodas, mais simples, mais verdadeiras, mais dignas por isso de um filósofo como vós."
        },
        {
          "id": 198,
          "start": 1690.12,
          "end": 1698.09,
          "text": "Permiti-me, igualmente, que me sirva de um copista, por ser a carta que vos escrevi muito pouco legível."
        },
        {
          "id": 199,
          "start": 1698.09,
          "end": 1710.44,
          "text": "A mais profunda estima, o maior reconhecimento, a mais terna amizade, são os sentimentos que fez nascer em mim a carta encantadora que vos dignastes escrever-me."
        },
        {
          "id": 200,
          "start": 1710.44,
          "end": 1720.02,
          "text": "Eu não saberia exprimir-vos quanto me honra ver minha obra traduzida na língua de uma nação que esclarece e instrui a Europa."
        },
        {
          "id": 201,
          "start": 1720.02,
          "end": 1723.24,
          "text": "Tudo devo, eu mesmo, aos livros franceses."
        },
        {
          "id": 202,
          "start": 1723.24,
          "end": 1732.21,
          "text": "Foram eles que desenvolveram em minha alma os sentimentos de humanidade sufocados por oito anos de educação fanática."
        },
        {
          "id": 203,
          "start": 1732.21,
          "end": 1750.92,
          "text": "Eu já respeitava vosso nome pelos excelentes artigos que inseristes na obra imortal da Enciclopédia (54); e foi para mim a mais agradável surpresa saber que um homem de letras da vossa reputação dignava-se de traduzir o meu tratado Dos Delitos."
        },
        {
          "id": 204,
          "start": 1750.92,
          "end": 1762.81,
          "text": "Agradeço-vos, de todo o meu coração, o presente que me fizeste de vossa tradução, assim como vossa atenção em satisfazer o interesse que eu tinha em lê-la."
        },
        {
          "id": 205,
          "start": 1762.81,
          "end": 1769.17,
          "text": "Li-a com um prazer que não posso exprimir-vos, e achei que embelezastes o original."
        },
        {
          "id": 206,
          "start": 1769.17,
          "end": 1790.41,
          "text": "Protesto-vos com a maior sinceridade que a ordem que seguistes parece-me, a mim mesmo, mais natural e preferível à minha, e que lamento que a nova edição italiana esteja quase terminada, porque do contrário eu me poria inteira ou quase inteiramente de acordo com o vosso plano."
        },
        {
          "id": 207,
          "start": 1790.41,
          "end": 1804.52,
          "text": "Minha obra nada perdeu de sua força em vossa tradução, exceto nos lugares em que o caráter essencial a uma e a outra língua estabeleceu certa diferença entre vossa expressão e a minha."
        },
        {
          "id": 208,
          "start": 1804.52,
          "end": 1816.33,
          "text": "A língua italiana é mais maleável e dócil, e talvez, por ser menos cultivada no gênero filosófico, possa adotar expressões que a vossa recusaria empregar."
        },
        {
          "id": 209,
          "start": 1816.33,
          "end": 1823.99,
          "text": "Não vejo solidez na objeção que vos fizeram, de que a mudança da ordem poderia fazer perder a força."
        },
        {
          "id": 210,
          "start": 1823.99,
          "end": 1833.43,
          "text": "A força consiste na escolha das expressões e na aproximação das idéias; e a confusão só pode prejudicar esses dois efeitos."
        },
        {
          "id": 211,
          "start": 1833.43,
          "end": 1838.56,
          "text": "O receio de ferir o amor-próprio do autor não devia deter-vos mais."
        },
        {
          "id": 212,
          "start": 1838.56,
          "end": 1868.62,
          "text": "Primeiro, porque, como vós mesmo o dissestes com razão em vosso excelente prefácio, um livro em que se defende a causa da humanidade, uma vez tornado público, pertence ao mundo e a todas as nações; e, relativamente a mim em particular, eu teria feito muito poucos progressos na filosofia do coração, que coloco acima da do espírito, se não tivesse adquirido a coragem de ver e amar a verdade."
        },
        {
          "id": 213,
          "start": 1868.62,
          "end": 1886.41,
          "text": "Espero que a quinta edição, que deve aparecer breve, esteja logo esgotada; e asseguro-vos que na sexta observarei inteiramente, ou quase inteiramente, a ordem de vossa tradução, que dá maior relevo às verdades que tratei de coligir."
        },
        {
          "id": 214,
          "start": 1886.41,
          "end": 1902.13,
          "text": "Digo quase inteiramente, porque, segundo uma leitura única e rápida que fiz até este momento não posso decidir-me com inteiro conhecimento de causa sobre as particularidades como já o fiz sobre o conjunto."
        },
        {
          "id": 215,
          "start": 1902.13,
          "end": 1919.3,
          "text": "A impaciência que meus amigos têm de ler vossa tradução forçou-me, Senhor a deixá-la sair de minhas mãos logo depois de a ter tido, e sou obrigado a dar em outra carta a explicação de certas passagens que julgastes obscuras."
        },
        {
          "id": 216,
          "start": 1919.3,
          "end": 1929.12,
          "text": "Devo dizer-vos, porém, que tive, ao escrever, os exemplos de Machiavelli (55), de Galileu (56) e de Giannone ante os meus olhos."
        },
        {
          "id": 217,
          "start": 1929.12,
          "end": 1936.86,
          "text": "Ouvi o ruído das cadeias firmar a superstição, e os gritos de fanatismo abafar os gemidos da verdade."
        },
        {
          "id": 218,
          "start": 1936.86,
          "end": 1943.76,
          "text": "A visão desse espetáculo medonho determinou-me, algumas vezes, a envolver a luz de nuvens."
        },
        {
          "id": 219,
          "start": 1943.76,
          "end": 1946.98,
          "text": "Quis defender a humanidade sem ser mártir."
        },
        {
          "id": 220,
          "start": 1946.98,
          "end": 1953.2,
          "text": "Essa idéia, de que eu devia ser obscuro, tornou-me às vezes tal, sem necessidade."
        },
        {
          "id": 221,
          "start": 1953.2,
          "end": 1967,
          "text": "Acrescentai a isso a inexperiência e a falta de hábito de escrever, perdoáveis num autor que tem apenas vinte e sete anos e que há somente cinco anos entrou na carreira das letras."
        },
        {
          "id": 222,
          "start": 1967,
          "end": 1984.94,
          "text": "Ser-me-ia impossível pintar-vos, Senhor, a satisfação com a qual vejo o interesse que tomais por mim, e quanto me comovem as demonstrações de estima que me dais, e que não posso aceitar sem ser vão, nem rejeitar sem fazer-vos injúria."
        },
        {
          "id": 223,
          "start": 1984.94,
          "end": 1998.13,
          "text": "Recebi com o mesmo reconhecimento e a mesma confusão as coisas lisonjeiras que me dissestes da parte desses homens célebres que honram a humanidade, a Europa e a sua nação."
        },
        {
          "id": 224,
          "start": 1998.13,
          "end": 2018.29,
          "text": "D'Alembert, Diderot, Helvétius, Buffon, Hume, nomes ilustres que não se pode ouvir pronunciar sem ficar comovido, assim como vossas obras imortais, são minha leitura contínua, o objeto de minhas ocupações durante o dia e de minhas meditações no silêncio da noite."
        },
        {
          "id": 225,
          "start": 2018.29,
          "end": 2027.04,
          "text": "Cheio das verdades que ensinais, como poderia eu incensar o erro e aviltar-me ao ponto de mentir à posteridade?..."
        },
        {
          "id": 226,
          "start": 2027.04,
          "end": 2044.13,
          "text": "Minha única ocupação é cultivar em paz a filosofia, e contentar assim três sentimentos muito vivos em mim: o amor à reputação literária, o amor à liberdade e a compaixão pelas desgraças dos homens, escravos de tantos erros."
        },
        {
          "id": 227,
          "start": 2044.13,
          "end": 2051.88,
          "text": "Data de cinco anos a época de minha conversão à filosofia, e devo-a à leitura das Cartas Persas (57)."
        },
        {
          "id": 228,
          "start": 2051.88,
          "end": 2057.17,
          "text": "A segunda obra que completou a revolução do meu espírito foi a do sr."
        },
        {
          "id": 229,
          "start": 2057.17,
          "end": 2057.94,
          "text": "Helvétius."
        },
        {
          "id": 230,
          "start": 2057.94,
          "end": 2068.67,
          "text": "Foi ele quem me lançou com força no caminho da verdade e quem primeiro despertou minha atenção para a cegueira e as desgraças da humanidade."
        },
        {
          "id": 231,
          "start": 2068.67,
          "end": 2073.88,
          "text": "Devo à leitura do Espírito (58) uma grande parte de minhas idéias..."
        },
        {
          "id": 232,
          "start": 2073.88,
          "end": 2074.27,
          "text": "O Sr."
        },
        {
          "id": 233,
          "start": 2074.27,
          "end": 2081.63,
          "text": "conde Firmiani regressou a Milão há vários dias, mas está muito ocupado, e ainda não pude vê-lo."
        },
        {
          "id": 234,
          "start": 2081.63,
          "end": 2086.46,
          "text": "Ele protegeu meu livro, e é a ele que devo minha tranqüilidade."
        },
        {
          "id": 235,
          "start": 2086.46,
          "end": 2097.96,
          "text": "Remeter-vos-ei breve algumas explicações das passagens que achastes obscuras e que não pretendo justificar, porque não escrevi para não ser entendido."
        },
        {
          "id": 236,
          "start": 2097.96,
          "end": 2107.32,
          "text": "Rogo-vos encarecidamente me envieis vossas observações e as dos vossos amigos, para que eu as aproveite numa sexta edição."
        },
        {
          "id": 237,
          "start": 2107.32,
          "end": 2113.76,
          "text": "Comunicai- me, sobretudo, o resultado de vossas palestras, sobre meu livro com o sr."
        },
        {
          "id": 238,
          "start": 2113.76,
          "end": 2114.37,
          "text": "Diderot."
        },
        {
          "id": 239,
          "start": 2114.37,
          "end": 2119.66,
          "text": "Desejo vivamente saber que impressão teve de mim essa alma sublime..."
        },
        {
          "id": 240,
          "start": 2119.66,
          "end": 2121.65,
          "text": "Tenho a honra de ser, etc."
        },
        {
          "id": 241,
          "start": 2121.65,
          "end": 2126.87,
          "text": "Beccaria Notas (1) – Jurisconsulto alemão, do começo do século XVII."
        },
        {
          "id": 242,
          "start": 2126.87,
          "end": 2130.55,
          "text": "(2) – Jurisconsulto piemontês, falecido em 1575."
        },
        {
          "id": 243,
          "start": 2130.55,
          "end": 2136.76,
          "text": "(3) – Jurisconsulto italiano, famoso por sua crueldade, falecido em Roma em 1618."
        },
        {
          "id": 244,
          "start": 2136.76,
          "end": 2139.29,
          "text": "Deixou uma obra em treze volumes."
        },
        {
          "id": 245,
          "start": 2139.29,
          "end": 2155.93,
          "text": "(4) – Alusão ao frade Vincenzo Facchinei di Gorfri, do convento de Vallombrosa, que escreveu Notas e Observações cuja resposta vem publicada as Notas e Observações cuja resposta vem publicada no Apêndice deste volume."
        },
        {
          "id": 246,
          "start": 2155.93,
          "end": 2168.43,
          "text": "(5) – Thomas Hobbes (1588-1679), filósofo inglês autor do Leviatan, obra em que defende o materialismo em filosofia, o egoísmo em moral e o despotismo em política."
        },
        {
          "id": 247,
          "start": 2168.43,
          "end": 2179.24,
          "text": "(6) – Alusão a Jean-Jacques Rousseau, de cuja autoria são os livros: Discursos sobre as Ciências e as Artes e sobre a Origem da Desigualdade."
        },
        {
          "id": 248,
          "start": 2179.24,
          "end": 2192.96,
          "text": "(7) – Charles de Secondat, barão de Montesquieu (1689-1755), grande escritor francês, autor das Cartas Persas e dos livros Grandeza e Decadência dos Romanos e O Espírito das Leis."
        },
        {
          "id": 249,
          "start": 2192.96,
          "end": 2198.33,
          "text": "(8) – “Observe-se que a palavra direito não contradiz a palavra força."
        },
        {
          "id": 250,
          "start": 2198.33,
          "end": 2203.16,
          "text": "O direito é a força submetida a leis para vantagens da maioria."
        },
        {
          "id": 251,
          "start": 2203.16,
          "end": 2209.76,
          "text": "Entendo por justiça os laços que reúnem de maneira estável os interesses particulares."
        },
        {
          "id": 252,
          "start": 2209.76,
          "end": 2213.74,
          "text": "Se esses laços se quebrassem, não haveria sociedade."
        },
        {
          "id": 253,
          "start": 2213.74,
          "end": 2221.18,
          "text": "É mister que se evite ligar à palavra justiça a idéia de uma força física ou de um ser existente."
        },
        {
          "id": 254,
          "start": 2221.18,
          "end": 2230.61,
          "text": "A justiça é pura e simplesmente o ponto de vista sob o qual os homens encaram as coisas morais para o bem-estar de cada um."
        },
        {
          "id": 255,
          "start": 2230.61,
          "end": 2241.65,
          "text": "Não pretendo falar aqui de justiça de Deus, que é de outra natureza, tendo relações imediatas com as penas e as recompensas de uma vida futura”."
        },
        {
          "id": 256,
          "start": 2241.65,
          "end": 2259.37,
          "text": "(9) – “Se cada cidadão tem obrigações a cumprir para com a sociedade, a sociedade tem igualmente obrigações a cumprir para com cada cidadão, pois a natureza de um contrato consiste em obrigar igualmente as duas partes contratantes."
        },
        {
          "id": 257,
          "start": 2259.37,
          "end": 2277,
          "text": "Essa cadeia de obrigações mútuas, que desce do trono até à cabana e que liga igualmente o maior e o menor dos membros da sociedade, tem como único fim o interesse público, que consiste na observação das convenções úteis à maioria."
        },
        {
          "id": 258,
          "start": 2277,
          "end": 2281.45,
          "text": "Violada uma dessas convenções, abre-se a porta à desordem."
        },
        {
          "id": 259,
          "start": 2281.45,
          "end": 2289.88,
          "text": "– A palavra obrigação é uma das que se empregam mais freqüentemente em moral do que em qualquer outra ciência."
        },
        {
          "id": 260,
          "start": 2289.88,
          "end": 2294.18,
          "text": "Existem obrigações a cumprir no comércio e na sociedade."
        },
        {
          "id": 261,
          "start": 2294.18,
          "end": 2304.84,
          "text": "Uma obrigação supõe um raciocínio moral, convenções racionadas; não se pode, porém, emprestar à palavra obrigação uma idéia física ou real."
        },
        {
          "id": 262,
          "start": 2304.84,
          "end": 2308.59,
          "text": "É uma palavra abstrata que precisa ser explicada."
        },
        {
          "id": 263,
          "start": 2308.59,
          "end": 2315.19,
          "text": "Ninguém pode obrigar-vos a cumprir obrigações sem saberdes quais são tais obrigações”."
        },
        {
          "id": 264,
          "start": 2315.19,
          "end": 2316.49,
          "text": "Nota de Beccaria."
        },
        {
          "id": 265,
          "start": 2316.49,
          "end": 2319.79,
          "text": "(10) – Isto é, em vernáculo e não em latim."
        },
        {
          "id": 266,
          "start": 2319.79,
          "end": 2329.6,
          "text": "(11) – “Entre os criminalistas, ao contrário, a confiança que merece uma testemunha aumenta em proporção da atrocidade do crime."
        },
        {
          "id": 267,
          "start": 2329.6,
          "end": 2341.56,
          "text": "Apoiam-se eles neste axioma de ferro, ditado pela mais cruel imbecilidade: In atrocissimis leviores conjecturae sufficiunt, et licet judici jura transgredi."
        },
        {
          "id": 268,
          "start": 2341.56,
          "end": 2373.46,
          "text": "Traduzamos essa máxima hedionda, para que a Europa conheça ao menos um dos revoltantes princípios e tão numerosos aos quais está submetida quase sem o saber: “Nos delitos mais atrozes, isto é, menos provável, bastam as mais ligeiras circunstâncias, e o juiz pode pôr-se acima das leis.” Os absurdos em uso na legislação são muitas vezes o resultado do medo, fonte inesgotável das inconseqüências e dos erros humanos."
        },
        {
          "id": 269,
          "start": 2373.46,
          "end": 2406.13,
          "text": "Os legisladores, ou antes, os jurisconsultos, cujas opiniões são consideradas após sua morte como espécies de oráculos, e que, como escritores vendidos ao interesse, se tornaram árbitros soberanos da sorte dos homens, os legisladores, repito, receosos de ver condenar inocentes, sobrecarregaram a jurisprudência de formalidades e exceções inúteis, cuja exata observação colocaria a desordem e a impunidade no trono da justiça."
        },
        {
          "id": 270,
          "start": 2406.13,
          "end": 2417.93,
          "text": "Outras vezes, assombrados com certos crimes atrozes e difíceis de provar, acharam que deviam desprezar essas formalidades que eles próprios estabeleceram."
        },
        {
          "id": 271,
          "start": 2417.93,
          "end": 2418.7,
          "text": "Foi assim."
        },
        {
          "id": 272,
          "start": 2418.7,
          "end": 2432.5,
          "text": "que, dominados ora por um despotismo impertinente, ora por temores pueris, fizeram dos julgamentos mais graves uma espécie de jogo abandonado ao acaso e aos caprichos do arbítrio”."
        },
        {
          "id": 273,
          "start": 2432.5,
          "end": 2447.99,
          "text": "(12) – Refere-se Beccaria a Gustavo III (1746-1792), que subiu ao trono da Suécia, em 1771, tendo feito um governo liberal e posto em prática numerosas idéias defendidas pelos enciclopedistas franceses."
        },
        {
          "id": 274,
          "start": 2447.99,
          "end": 2454.43,
          "text": "Morreu assassinado aos 46 anos de idade, vítima de uma conspiração dos aristocratas."
        },
        {
          "id": 275,
          "start": 2454.43,
          "end": 2462.18,
          "text": "(13) – Isabel Petrovna (1709-1762), filha de Pedro-o-Grande, tendo subido ao trono da Rússia em 1741."
        },
        {
          "id": 276,
          "start": 2462.18,
          "end": 2473.83,
          "text": "(14) – Tito, filho de Vespasiano, imperador romano de 76 a 81, cognominado a delícia do gênero humano, em virtude dos grandes benefícios feitos ao povo."
        },
        {
          "id": 277,
          "start": 2473.83,
          "end": 2484.49,
          "text": "“Perdi o dia” (Diem perdidi), – costumava ele dizer quando se passava um dia sem que tivesse tido ocasião de praticar alguma ação generosa."
        },
        {
          "id": 278,
          "start": 2484.49,
          "end": 2496.15,
          "text": "(15) – Antonino o Piedoso foi um dos sete imperadores romanos (Nerva, Trajano, Adriano, Antonio, Marco Aurélio, Vero e Cômodo) que reinaram de 96 a 192."
        },
        {
          "id": 279,
          "start": 2496.15,
          "end": 2503.28,
          "text": "Seu governo, de 138 a 161, caracterizou-se por um notável espírito de moderação e de justiça."
        },
        {
          "id": 280,
          "start": 2503.28,
          "end": 2508.18,
          "text": "(16) – Um dos sete imperadores antoninos, excelente organizador."
        },
        {
          "id": 281,
          "start": 2508.18,
          "end": 2509.64,
          "text": "Reinou de 98 a 117."
        },
        {
          "id": 282,
          "start": 2509.64,
          "end": 2514.85,
          "text": "(17) – “Nas primeiras edições desta obra, eu mesmo cometi esse erro."
        },
        {
          "id": 283,
          "start": 2514.85,
          "end": 2527.12,
          "text": "Ousei dizer que o falido de boa fé devia ser guardado como penhor de sua dívida, reduzido ao estado de escravidão e obrigado a trabalhar por conta dos credores."
        },
        {
          "id": 284,
          "start": 2527.12,
          "end": 2530.88,
          "text": "Envergonho-me de ter escrito essas coisas cruéis."
        },
        {
          "id": 285,
          "start": 2530.88,
          "end": 2536.71,
          "text": "Acusaram-me de impiedade e de sedição, sem que eu fosse sedicioso nem ímpio."
        },
        {
          "id": 286,
          "start": 2536.71,
          "end": 2548.59,
          "text": "Ataquei os direitos da humanidade, e ninguém se levantou contra mim...” (18) – “O comércio ou a troca dos prazeres do luxo não deixa de ter inconvenientes."
        },
        {
          "id": 287,
          "start": 2548.59,
          "end": 2559.02,
          "text": "Esses prazeres são preparados por muitos agentes, mas partem de um pequeno número de mãos e se distribuem a um pequeno número de homens."
        },
        {
          "id": 288,
          "start": 2559.02,
          "end": 2563.7,
          "text": "A maioria só raramente pode prová-los numa pequena proporção."
        },
        {
          "id": 289,
          "start": 2563.7,
          "end": 2568.15,
          "text": "Eis porque o homem se lamenta quase sempre de sua miséria."
        },
        {
          "id": 290,
          "start": 2568.15,
          "end": 2573.74,
          "text": "Mas, esse sentimento é apenas o efeito da comparação e nada tem de real”."
        },
        {
          "id": 291,
          "start": 2573.74,
          "end": 2596.52,
          "text": "(19) – “Quando a extensão de um país aumenta em proporção maior do que a população, o luxo favorece o despotismo, porque a indústria particular diminui à medida que os homens estão mais dispersos, e, quanto menos indústria houver, mais os pobres dependerão dos ricos, cujo fausto os faz subsistir."
        },
        {
          "id": 292,
          "start": 2596.52,
          "end": 2605.95,
          "text": "Torna-se, então, tão difícil para os oprimidos reunirem-se contra os opressores, que as insurreições deixam de ser temidas."
        },
        {
          "id": 293,
          "start": 2605.95,
          "end": 2622.36,
          "text": "Os homens poderosos obtém com muito mais facilidade a submissão, a obediência, a veneração e essa espécie de culto que torna mais sensível a distância que o despotismo estabelece entre o homem poderoso e o infeliz."
        },
        {
          "id": 294,
          "start": 2622.36,
          "end": 2631.1,
          "text": "– Os homens são mais independentes quando são menos observados, e são menos observados quando são em maior número."
        },
        {
          "id": 295,
          "start": 2631.1,
          "end": 2642.98,
          "text": "– Por outro lado, quando a população aumenta em maior proporção do que a extensão do país, o luxo torna-se, ao contrário, uma barreira contra o despotismo."
        },
        {
          "id": 296,
          "start": 2642.98,
          "end": 2646.74,
          "text": "– Anima a indústria com a atividade dos cidadãos."
        },
        {
          "id": 297,
          "start": 2646.74,
          "end": 2660.16,
          "text": "O rico encontra em torno de si bastantes prazeres para entregar-se completamente ao luxo de ostentação, o único capaz de firmar no espírito do povo a idéia de sua dependência."
        },
        {
          "id": 298,
          "start": 2660.16,
          "end": 2680.25,
          "text": "E pode observar-se que nos Estados vastos, mas fracos e despovoados, o luxo de ostentação deve prevalecer, se outras causas não o impedem; ao passo que o luxo de comodidade tenderá a diminuir cada vez mais a ostentação nos países mais populosos do que extensos”."
        },
        {
          "id": 299,
          "start": 2680.25,
          "end": 2686,
          "text": "(20) – “Essa atração se parece em muitas coisas com a gravitação universal."
        },
        {
          "id": 300,
          "start": 2686,
          "end": 2689.91,
          "text": "A força dessas duas causas diminui com a distância."
        },
        {
          "id": 301,
          "start": 2689.91,
          "end": 2701.79,
          "text": "Se a gravitação modifica os movimentos dos corpos, a atração natural de um sexo para outro afeta todos os movimentos da alma, enquanto durar sua atividade."
        },
        {
          "id": 302,
          "start": 2701.79,
          "end": 2715.6,
          "text": "Essas causas diferem pelo fato de que a gravitação se põe em equilíbrio com os obstáculos que encontra, ao passo que a paixão do amor adquire com os obstáculos mais força e vigor”."
        },
        {
          "id": 303,
          "start": 2715.6,
          "end": 2717.05,
          "text": "(21) – O Evangelho."
        },
        {
          "id": 304,
          "start": 2717.05,
          "end": 2720.12,
          "text": "(22) – Ditador romano, nascido em 136 a."
        },
        {
          "id": 305,
          "start": 2720.12,
          "end": 2720.27,
          "text": "C."
        },
        {
          "id": 306,
          "start": 2720.27,
          "end": 2731.47,
          "text": "Companheiro e mais tarde rival de Mário, cônsul em 88, vencedor de Mitridates, chefe do partido aristocrático e depois senhor de Roma e da Itália."
        },
        {
          "id": 307,
          "start": 2731.47,
          "end": 2740.59,
          "text": "Proscreveu os adversários, reformou a constituição romana em sentido favorável ao Senado e conseguiu enorme influência."
        },
        {
          "id": 308,
          "start": 2740.59,
          "end": 2746.19,
          "text": "Abdicou inesperadamente em pleno fastígio e morreu no ano seguinte (80 a."
        },
        {
          "id": 309,
          "start": 2746.19,
          "end": 2746.5,
          "text": "C.)."
        },
        {
          "id": 310,
          "start": 2746.5,
          "end": 2771.72,
          "text": "(23) – Referencia à obra Emilio ou Da Educação (1762), romance filosófico em que Jean-Jacques Rousseau propõe um sistema de educação baseado no princípio de que “o homem é naturalmente bom” e de que, sendo má a educação dada pela sociedade, conviria estabelecer “uma educação negativa, como a melhor, ou antes, como a única boa”."
        },
        {
          "id": 311,
          "start": 2771.72,
          "end": 2779.24,
          "text": "A despeito de certos paradoxos, esse livro teve influência salutar sobre a educação daquela época."
        },
        {
          "id": 312,
          "start": 2779.24,
          "end": 2789.67,
          "text": "(24) – Carlos Magno ou Carlos I (742-814), rei dos Francos e imperador do Ocidente, era filho de Pepino-o-Breve, do qual sucedeu em 768."
        },
        {
          "id": 313,
          "start": 2789.67,
          "end": 2802.47,
          "text": "Político profundo e hábil organizador, estimava e protegia as letras, criando escolas, rodeando-se de homens eminentes e governando com sabedoria o seu imenso império."
        },
        {
          "id": 314,
          "start": 2802.47,
          "end": 2810.6,
          "text": "(25) – Otão I, o Grande (912-973), imperador da Alemanha desde 936, tendo governado com grande habilidade."
        },
        {
          "id": 315,
          "start": 2810.6,
          "end": 2813.44,
          "text": "(26) – Imperador romano de 375 a 383."
        },
        {
          "id": 316,
          "start": 2813.44,
          "end": 2822.1,
          "text": "(27) – Imperador romano de 364 a 375, cujo governo foi assinalado por grande severidade e intolerância religiosa."
        },
        {
          "id": 317,
          "start": 2822.1,
          "end": 2831.3,
          "text": "(28) – Teodósio I, o Grande (346-395), imperador romano que contribuiu para o triunfo do cristianismo sobre o paganismo."
        },
        {
          "id": 318,
          "start": 2831.3,
          "end": 2837.13,
          "text": "(29) – Arcádio (376-408), filho de Teodósio, imperador do Oriente desde 395."
        },
        {
          "id": 319,
          "start": 2837.13,
          "end": 2843.03,
          "text": "(30) – Alexandre Severo (208-235), imperador romano, sucessor de Heliogábalo."
        },
        {
          "id": 320,
          "start": 2843.03,
          "end": 2850.16,
          "text": "(31) – Imperador romano de 81 a 96, filho de Vespasiano e de Tito, célebre por sua crueldade."
        },
        {
          "id": 321,
          "start": 2850.16,
          "end": 2854.99,
          "text": "Morreu assassinado, sendo cúmplice do crime sua própria mulher."
        },
        {
          "id": 322,
          "start": 2854.99,
          "end": 2857.29,
          "text": "Foi o último dos doze Césares."
        },
        {
          "id": 323,
          "start": 2857.29,
          "end": 2862.89,
          "text": "(32) – Segundo imperador romano, de 14 a 37, famoso por sua desumanidade."
        },
        {
          "id": 324,
          "start": 2862.89,
          "end": 2871.86,
          "text": "(33) – Henrique VIII (1491-1547), rei da Inglaterra desde 1509, rompeu com a Igreja católica e fundou o anglicanismo."
        },
        {
          "id": 325,
          "start": 2871.86,
          "end": 2875.08,
          "text": "Instruído, artista, mas cruel e libertino."
        },
        {
          "id": 326,
          "start": 2875.08,
          "end": 2883.44,
          "text": "(34) – Historiador latino, autor da obra Os doze Césares, coleção de anedotas de imenso interesse documental."
        },
        {
          "id": 327,
          "start": 2883.44,
          "end": 2892.03,
          "text": "(35) – “Quem caminha livremente, caminha com confiança; quem, porém, se desvia do seu caminho, será descoberto”."
        },
        {
          "id": 328,
          "start": 2892.03,
          "end": 2895.94,
          "text": "(36) – Calígula (12-41), imperador romano desde 37."
        },
        {
          "id": 329,
          "start": 2895.94,
          "end": 2903.84,
          "text": "Famoso por sua crueldade, desejava que o povo romano tivesse uma só cabeça para decepá- la de um golpe."
        },
        {
          "id": 330,
          "start": 2903.84,
          "end": 2910.05,
          "text": "Sua insensatez chegou ao ponto de dar o titulo de cônsul ao seu cavalo Incitatus."
        },
        {
          "id": 331,
          "start": 2910.05,
          "end": 2915.57,
          "text": "(37) – Imperador romano de 54 a 68, que se celebrizou por sua crueldade."
        },
        {
          "id": 332,
          "start": 2915.57,
          "end": 2922.55,
          "text": "(38) – Imperador romano de 218 a 222 e que se tornou famoso por suas loucuras e crueldades."
        },
        {
          "id": 333,
          "start": 2922.55,
          "end": 2929.6,
          "text": "(39) – “Podem consultar-se os santos padres e, entre outros, Tertuliano na sua Apolog., cap."
        },
        {
          "id": 334,
          "start": 2929.6,
          "end": 2937.65,
          "text": "XXXVII, onde ele diz que os cristãos tinham por máxima sofrer ante a própria morte do que dá-la a alguém."
        },
        {
          "id": 335,
          "start": 2937.65,
          "end": 2940.49,
          "text": "E, no seu Tratado de Idolatria, caps."
        },
        {
          "id": 336,
          "start": 2940.49,
          "end": 2956.36,
          "text": "XVII e XXI, condena ele toda espécie de cargos públicos, como interditos aos cristãos, porque não era possível exercê-los sem que, às vezes, fosse obrigado a pronunciar a pena de morte contra os criminosos”."
        },
        {
          "id": 337,
          "start": 2956.36,
          "end": 2961.5,
          "text": "(40) – Lodovico Antonio Muratori (1672-1750), historiador Italiano."
        },
        {
          "id": 338,
          "start": 2961.5,
          "end": 2966.18,
          "text": "(41) – Deodoro da Sicília, autor de uma Biblioteca Histórica."
        },
        {
          "id": 339,
          "start": 2966.18,
          "end": 2970.39,
          "text": "(42) – Geógrafo grego, autor de uma preciosa Geografia."
        },
        {
          "id": 340,
          "start": 2970.39,
          "end": 2971.85,
          "text": "Morreu sob Tibério."
        },
        {
          "id": 341,
          "start": 2971.85,
          "end": 2976.91,
          "text": "(43) – “Não condenar ninguém à morte, nem mesmo pelo pior delito”."
        },
        {
          "id": 342,
          "start": 2976.91,
          "end": 2978.75,
          "text": "(44) – Tito Lívio (59 a."
        },
        {
          "id": 343,
          "start": 2978.75,
          "end": 2978.9,
          "text": "C."
        },
        {
          "id": 344,
          "start": 2978.9,
          "end": 2979.44,
          "text": "– 19 d."
        },
        {
          "id": 345,
          "start": 2979.44,
          "end": 2982.66,
          "text": "C.), historiador latino, nascido em Pádua."
        },
        {
          "id": 346,
          "start": 2982.66,
          "end": 2991.48,
          "text": "Deixou, sob o título de Décadas, uma história romana, mais notável pelo estilo do que pela autenticidade dos fatos."
        },
        {
          "id": 347,
          "start": 2991.48,
          "end": 2999.22,
          "text": "(45) – André Morellet (1727-1819), abade, literato e economista francês, colaborador da Enciclopédia."
        },
        {
          "id": 348,
          "start": 2999.22,
          "end": 3011.42,
          "text": "(46) – Chrétien-Guillaume de Lamoignon de Malesherbes (1721-1794), magistrado de grande reputação, ministro sob Luiz XVI, que ele defendeu perante a Convenção."
        },
        {
          "id": 349,
          "start": 3011.42,
          "end": 3012.95,
          "text": "Morreu no cadafalso."
        },
        {
          "id": 350,
          "start": 3012.95,
          "end": 3024.3,
          "text": "(47) – Denis Diderot (1713-1784), filósofo francês, ardente propagandista das idéias filosóficas do século XVIII, um dos fundadores da Enciclopédia."
        },
        {
          "id": 351,
          "start": 3024.3,
          "end": 3026.75,
          "text": "Deixou várias obras importantes."
        },
        {
          "id": 352,
          "start": 3026.75,
          "end": 3034.34,
          "text": "(48) – Claude-Arien Hélvetius (1715-1771), literato e filósofo francês, autor do livro Do Espírito."
        },
        {
          "id": 353,
          "start": 3034.34,
          "end": 3042.78,
          "text": "(49) – Georges-Louis Leclerc de Buffon (1707 1778), naturalista e escritor francês, autor da História Natural."
        },
        {
          "id": 354,
          "start": 3042.78,
          "end": 3061.56,
          "text": "(50) – Jean-Jacques Rousseau (1712-1778), filósofo e escritor francês, nascido em Genebra, autor da Nova Heloísa, do Contrato Social, do Emilio ou Da Educação, Confissões e Discursos sobre as Ciências e as Artes e sobre a Origem da Desigualdade."
        },
        {
          "id": 355,
          "start": 3061.56,
          "end": 3073.14,
          "text": "(51) – David Hume (1711-1776), filósofo e historiador inglês, criador da filosofia fenomenista, autor de um célebre Ensaio sobre o Entendimento Humano."
        },
        {
          "id": 356,
          "start": 3073.14,
          "end": 3091.62,
          "text": "(52) – Paul-Henri Holbach (1723-1789), barão, filósofo materialista francês, amigo e protetor dos Enciclopedistas (53) – Jean le Rond d'Alembert (1717-1783), célebre escritor, filósofo e matemático francês, um dos fundadores da Enciclopédia."
        },
        {
          "id": 357,
          "start": 3091.62,
          "end": 3105.27,
          "text": "(54) – Publicação monumental, dirigida por d' Alembert e Diderot, que foi uma verdadeira máquina de guerra posta ao serviço das doutrinas filosóficas do século XVIII (1751-1772)."
        },
        {
          "id": 358,
          "start": 3105.27,
          "end": 3114.55,
          "text": "(55) – Nicolau Machiavelli (1469-1527) político e historiador italiano, autor das Décadas sobre Tito Lívio e do Príncipe."
        },
        {
          "id": 359,
          "start": 3114.55,
          "end": 3122.29,
          "text": "(56) – Galileu Galilei (1564-1642), ilustre matemático, físico e astrônomo italiano, nascido em Pisa."
        },
        {
          "id": 360,
          "start": 3122.29,
          "end": 3139.62,
          "text": "Proclamou, partilhando a teoria de Copérnico, que o Sol, e não a Terra, é o centro do mundo planetário, e que a Terra gira em torno de si mesma e tem também, como os outros planetas, um movimento de translação ao redor do Sol."
        },
        {
          "id": 361,
          "start": 3139.62,
          "end": 3148.05,
          "text": "Foi por isso denunciado como herege e obrigado pela Inquisição a abjurar de joelhos as suas afirmações (1633)."
        },
        {
          "id": 362,
          "start": 3148.05,
          "end": 3156.8,
          "text": "Depois dessa abjuração, que o livrou da fogueira, foi condenado ao cativeiro e morreu cego alguns anos mais tarde."
        },
        {
          "id": 363,
          "start": 3156.8,
          "end": 3159.48,
          "text": "É famosa sua frase: E pur si muove!"
        },
        {
          "id": 364,
          "start": 3159.48,
          "end": 3164.69,
          "text": "(E contudo se move!), que teria proferido ao ser obrigado a abjurar."
        },
        {
          "id": 365,
          "start": 3164.69,
          "end": 3170.21,
          "text": "(57) – Cartas satíricas que Montesquieu publicou em 1721, sob o anônimo."
        },
        {
          "id": 366,
          "start": 3170.21,
          "end": 3188.39,
          "text": "É uma correspondência imaginária de dois persas chegados à Europa, Rica e Uzbek, dirigida aos seus amigos da Pérsia e na qual o autor passa em revista, com plena liberdade, a política, a religião e toda a sociedade francesa de sua época."
        },
        {
          "id": 367,
          "start": 3188.39,
          "end": 3197.28,
          "text": "(58) – Obra publicada em 1758 e na qual Helvétius aconselha o materialismo, tendo provocado os mais vivos protestos."
        }
      ],
      "imagens": []
    }
  ]
};

export const AUDIOBOOKS_EM_BREVE: AudiobookLivro[] = [
  {
    "id": "livro-classico-122",
    "tableId": 122,
    "titulo": "Justiça: O que é fazer a coisa certa",
    "autor": "Michael J. Sandel",
    "ano": "2009",
    "descricao": "A obra \"Justiça: O que é fazer a coisa certa\", de Michael J. Sandel, publicada originalmente em 2008, insere-se em um contexto global permeado por intensos debates sobre a equidade...",
    "sinopse": "A obra \"Justiça: O que é fazer a coisa certa\", de Michael J. Sandel, publicada originalmente em 2008, insere-se em um contexto global permeado por intensos debates sobre a equidade na distribuição de bens, a justiça social e o papel do Estado na edificação de uma sociedade mais justa. Posicionando-se na rica tradição dos clássicos do pensamento político, Sandel, um renomado filósofo político, adota uma metodologia intrinsecamente socrática. Essa abordagem convida o leitor a engajar-se em um diálogo profundo e reflexivo acerca dos dilemas morais que subjazem às nossas concepções de justiça. A m...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/justica_o_que_e_fazer_a_coisa_certa_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
    {
    "id": "livro-classico-124",
    "tableId": 124,
    "titulo": "O Monge e o Executivo",
    "autor": "James C. Hunter",
    "ano": "1998",
    "descricao": "A obra \"O Monge e o Executivo\", de James C. Hunter, publicada originalmente em 1998, transcende a categorização de um mero \"clássico\" para se firmar como um tratado seminal sobre a...",
    "sinopse": "A obra \"O Monge e o Executivo\", de James C. Hunter, publicada originalmente em 1998, transcende a categorização de um mero \"clássico\" para se firmar como um tratado seminal sobre a natureza intrínseca da liderança e a edificação de relacionamentos interpessoais, com uma ressonância particularmente profunda e aplicável ao campo jurídico. Seu surgimento se deu em um período de crescente ceticismo em relação aos modelos de gestão tradicionalistas, que frequentemente se apoiavam em estruturas autoritárias e hierarquias inflexíveis, em contrapartida a uma demanda por abordagens mais humanizadas, co...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_monge_e_o_executivo_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-125",
    "tableId": 125,
    "titulo": "A Arte da Guerra",
    "autor": "Sun Tzu",
    "ano": "séc. V a.C.",
    "descricao": "A obra \"A Arte da Guerra\", atribuída ao célebre general e estrategista chinês Sun Tzu, emerge do turbulento contexto histórico da China Antiga, mais precisamente entre os Períodos ...",
    "sinopse": "A obra \"A Arte da Guerra\", atribuída ao célebre general e estrategista chinês Sun Tzu, emerge do turbulento contexto histórico da China Antiga, mais precisamente entre os Períodos das Primaveras e Outonos (771-476 a.C.) e dos Estados Combatentes (475-221 a.C.). Neste cenário de fragmentação política e beligerância constante, a sobrevivência e a prosperidade dos diversos estados chineses dependiam intrinsecamente da maestria em conduzir conflitos e assegurar a vitória militar. \"A Arte da Guerra\" transcende, assim, a mera compilação de táticas de combate, apresentando-se como um tratado filosófi...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-126",
    "tableId": 126,
    "titulo": "O Leviatã",
    "autor": "Thomas Hobbes",
    "ano": "1651",
    "descricao": "A obra \"O Leviatã\" (1651) de Thomas Hobbes emerge como um marco indelével no pensamento político e jurídico ocidental, concebida em meio ao caos e à violência da Guerra Civil Ingle...",
    "sinopse": "A obra \"O Leviatã\" (1651) de Thomas Hobbes emerge como um marco indelével no pensamento político e jurídico ocidental, concebida em meio ao caos e à violência da Guerra Civil Inglesa. O contexto histórico turbulento moldou profundamente a visão hobbesiana, levando-o a uma análise penetrante sobre a fragilidade da ordem social e a necessidade imperiosa de um poder soberano robusto para evitar o retorno a um estado de anarquia. Hobbes inicia sua argumentação a partir de um postulado hipotético: o estado de natureza. Neste cenário, desprovido de autoridade coercitiva, os seres humanos são impulsi...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_leviata_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-127",
    "tableId": 127,
    "titulo": "O que é Direito (Primeiros Passos)",
    "autor": "Roberto Lyra Filho",
    "ano": "1982",
    "descricao": "A obra \"O que é Direito (Primeiros Passos)\" de Roberto Lyra Filho, um marco na literatura jurídica brasileira, emerge em um período de intensa efervescência intelectual e social no...",
    "sinopse": "A obra \"O que é Direito (Primeiros Passos)\" de Roberto Lyra Filho, um marco na literatura jurídica brasileira, emerge em um período de intensa efervescência intelectual e social no Brasil, com o propósito de oferecer uma introdução crítica e acessível aos fundamentos do Direito. Publicado em um contexto onde a dogmática jurídica tendia a se apresentar de forma hermética e dissociada da realidade social, Lyra Filho empreende uma profunda desmistificação, convidando o leitor a apreender o Direito não como um corpo estático de normas, mas como um fenômeno dinâmico, intrinsecamente conectado às re...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_que_e_direito_primeiros_passos_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-128",
    "tableId": 128,
    "titulo": "Acesso à Justiça",
    "autor": "Mauro Cappelletti",
    "ano": "2009",
    "descricao": "A obra \"Acesso à Justiça\" de Mauro Cappelletti, publicada originalmente em 1974, surge em um contexto histórico de crescente crítica aos sistemas judiciais tradicionais, que se mos...",
    "sinopse": "A obra \"Acesso à Justiça\" de Mauro Cappelletti, publicada originalmente em 1974, surge em um contexto histórico de crescente crítica aos sistemas judiciais tradicionais, que se mostravam lentos, burocráticos e, fundamentalmente, inacessíveis para a vasta maioria da população. Cappelletti, influenciado pelas correntes do realismo jurídico e pela sociologia do direito, propõe uma análise crítica e multifacetada das \"barreiras\" que efetivamente impedem a plena realização do princípio fundamental do acesso à justiça. A obra não se limita a um diagnóstico, mas se debruça sobre a identificação e cla...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/acesso_a_justica_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-129",
    "tableId": 129,
    "titulo": "O Contrato Social",
    "autor": "Jean-Jacques Rousseau",
    "ano": "1762",
    "descricao": "Jean-Jacques Rousseau, em sua obra seminal \"O Contrato Social\" (1762), apresenta uma profunda reflexão sobre a legitimidade do poder político e a natureza da associação humana, pro...",
    "sinopse": "Jean-Jacques Rousseau, em sua obra seminal \"O Contrato Social\" (1762), apresenta uma profunda reflexão sobre a legitimidade do poder político e a natureza da associação humana, propondo uma reconfiguração radical da relação entre o indivíduo e o Estado. Publicado em um período de intensa efervescência intelectual e política na Europa, às vésperas da Revolução Francesa, o livro surge como um contraponto direto às teorias absolutistas e às estruturas sociais hierarquizadas da época, que Rousseau criticava como fontes de opressão e desigualdade. O filósofo genebrino inicia sua argumentação a part...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_contrato_social_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-130",
    "tableId": 130,
    "titulo": "O Espírito das Leis",
    "autor": "Montesquieu",
    "ano": "1748",
    "descricao": "A obra \"O Espírito das Leis\" (De l'esprit des lois), publicada anonimamente em 1748 por Charles-Louis de Secondat, Barão de La Brède e de Montesquieu, representa um divisor de água...",
    "sinopse": "A obra \"O Espírito das Leis\" (De l'esprit des lois), publicada anonimamente em 1748 por Charles-Louis de Secondat, Barão de La Brède e de Montesquieu, representa um divisor de águas na história do pensamento político e jurídico ocidental. Escrita em um período de transição intelectual, antecedendo a plena efervescência do Iluminismo e com as estruturas do absolutismo monárquico ainda consolidadas, o livro emerge como uma análise comparativa profunda e sistemática das diversas formas de governo e dos complexos sistemas legais que as sustentam. Montesquieu, demonstrando uma erudição notável e um...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-131",
    "tableId": 131,
    "titulo": "1984",
    "autor": "George Orwell",
    "ano": "1949",
    "descricao": "George Orwell, em sua obra seminal \"1984\", publicada em 1949, tece uma visão distópica e profética que transcende a mera ficção, servindo como um estudo de caso crucial para a comp...",
    "sinopse": "George Orwell, em sua obra seminal \"1984\", publicada em 1949, tece uma visão distópica e profética que transcende a mera ficção, servindo como um estudo de caso crucial para a compreensão dos perigos do totalitarismo e da erosão dos direitos humanos. Ambientado na Oceania, um dos três superestados globais, o romance centra-se em Winston Smith, um funcionário do Ministério da Verdade. Sua função é a reescrita contínua da história e a falsificação de documentos para alinhar o passado com a narrativa mutável do Partido, personificado pela figura onipresente e onisciente do \"Grande Irmão\". A socie...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/1984_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-132",
    "tableId": 132,
    "titulo": "O Advogado do Diabo",
    "autor": "Morris West",
    "ano": "1959",
    "descricao": "Publicado em 1963, 'O Advogado do Diabo' de Morris West emerge como um clássico atemporal que transcende a ficção para oferecer uma profunda meditação sobre a fé, a moralidade e a ...",
    "sinopse": "Publicado em 1963, 'O Advogado do Diabo' de Morris West emerge como um clássico atemporal que transcende a ficção para oferecer uma profunda meditação sobre a fé, a moralidade e a busca pela verdade, com ressonâncias significativas para o campo jurídico. A trama se desenrola na pitoresca, porém enigmática, ilha de Montelusa, na Itália, onde o Ceticismo do Monsenhor Merganti, um teólogo enviado pela Santa Sé, é posto à prova ao investigar os supostos milagres e a santidade de um homem local. A atmosfera carregada de tradições ancestrais e superstições da ilha serve como pano de fundo para uma i...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_advogado_do_diabo.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-133",
    "tableId": 133,
    "titulo": "A Luta pelo Direito",
    "autor": "Rudolf von Ihering",
    "ano": "1872",
    "descricao": "A obra \"A Luta pelo Direito\" (Der Kampf ums Recht), publicada em 1872 por Rudolf von Ihering, representa um divisor de águas na literatura jurídica, especialmente considerando o co...",
    "sinopse": "A obra \"A Luta pelo Direito\" (Der Kampf ums Recht), publicada em 1872 por Rudolf von Ihering, representa um divisor de águas na literatura jurídica, especialmente considerando o contexto do século XIX, um período marcado pela consolidação dos Estados Nacionais europeus e por intensos debates intelectuais. Ihering, figura proeminente da Escola Histórica do Direito, transcende a visão meramente positivista e descritiva da norma, propondo uma abordagem dinâmica e militante. Ele argumenta que o Direito não é um conjunto estático de regras, mas uma força viva, intrinsecamente ligada à vontade human...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-134",
    "tableId": 134,
    "titulo": "O Último Dia de um Condenado",
    "autor": "Victor Hugo",
    "ano": "1829",
    "descricao": "Victor Hugo, em sua obra seminal \"O Último Dia de um Condenado\", publicada originalmente em 1829, transcende a esfera literária para oferecer um robusto estudo de caso sobre a pena...",
    "sinopse": "Victor Hugo, em sua obra seminal \"O Último Dia de um Condenado\", publicada originalmente em 1829, transcende a esfera literária para oferecer um robusto estudo de caso sobre a pena de morte e seus efeitos corrosivos na psique humana. O romance emerge em um período de efervescência no debate jurídico e social francês acerca da reforma penal, onde a pena capital era uma realidade palpável, frequentemente executada em praça pública com um espetáculo de crueldade. Inserida no movimento romântico, a obra se distingue por sua veia crítica e social aguçada, utilizando a subjetividade exacerbada e a i...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_ultimo_dia_de_um_condenado_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-135",
    "tableId": 135,
    "titulo": "Como as Democracias Morrem",
    "autor": "Steven Levitsky e Daniel Ziblatt",
    "ano": "2018",
    "descricao": "Em \"Como as Democracias Morrem\", Steven Levitsky e Daniel Ziblatt, proeminentes cientistas políticos, desafiam a concepção tradicional de que o colapso democrático é precipitado po...",
    "sinopse": "Em \"Como as Democracias Morrem\", Steven Levitsky e Daniel Ziblatt, proeminentes cientistas políticos, desafiam a concepção tradicional de que o colapso democrático é precipitado por eventos cataclísmicos como golpes de Estado ou revoluções. Em vez disso, argumentam que a erosão democrática é um processo insidioso e gradual, orquestrado frequentemente por líderes eleitos que, operando dentro das próprias estruturas democráticas, trabalham para desmantelar seus alicerces. A obra se insere firmemente na tradição clássica da ciência política, dialogando com pensadores que investigaram a consolidaç...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/como_as_democracias_morrem_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-136",
    "tableId": 136,
    "titulo": "O Processo",
    "autor": "Franz Kafka",
    "ano": "1925",
    "descricao": "A obra \"O Processo\" (Der Process), de Franz Kafka, publicada postumamente em 1925, emerge de um panorama literário marcado pelo expressionismo e por uma crescente desilusão com as ...",
    "sinopse": "A obra \"O Processo\" (Der Process), de Franz Kafka, publicada postumamente em 1925, emerge de um panorama literário marcado pelo expressionismo e por uma crescente desilusão com as engrenagens sociais e burocráticas que caracterizaram o início do século XX. Inacabado e fragmentário, o romance narra a jornada de Josef K., um gerente de banco que, em seu trigésimo aniversário, é abruptamente detido por agentes de uma autoridade judicial até então desconhecida, sem que a natureza da acusação lhe seja explicitada. Essa premissa inicial estabelece o tom de uma narrativa que se debruça sobre a aliena...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_processo_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-137",
    "tableId": 137,
    "titulo": "O Mundo Assombrado pelos Demônios",
    "autor": "Carl Sagan",
    "ano": "1995",
    "descricao": "Publicado em 1995, \"O Mundo Assombrado pelos Demônios: A Ciência como uma Vela no Escuro\" de Carl Sagan emerge como um farol intelectual em uma época de crescente proliferação de p...",
    "sinopse": "Publicado em 1995, \"O Mundo Assombrado pelos Demônios: A Ciência como uma Vela no Escuro\" de Carl Sagan emerge como um farol intelectual em uma época de crescente proliferação de pseudociências, teorias conspiratórias e desinformação. Sagan, um renomado astrônomo e divulgador científico, utiliza sua erudição e clareza ímpar para desmistificar crenças infundadas e defender o pensamento crítico e o método científico como pilares da compreensão racional do mundo. A obra não se restringe a refutar alegações extraordinárias, como astrologia, relatos de abduções alienígenas ou curas milagrosas, mas ...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-138",
    "tableId": 138,
    "titulo": "Sobre a Liberdade",
    "autor": "John Stuart Mill",
    "ano": "1859",
    "descricao": "\"Sobre a Liberdade\" (On Liberty), publicado em 1859 por John Stuart Mill, é um dos tratados mais influentes sobre o liberalismo clássico e a defesa dos direitos individuais contra ...",
    "sinopse": "\"Sobre a Liberdade\" (On Liberty), publicado em 1859 por John Stuart Mill, é um dos tratados mais influentes sobre o liberalismo clássico e a defesa dos direitos individuais contra a interferência do Estado e da opinião pública. A obra foi concebida em um período de profundas transformações na Inglaterra vitoriana, marcado pela Revolução Industrial, pelo crescimento das cidades e pela expansão da democracia representativa. Mill, ciente dos benefícios da democracia, também antecipou um perigo inerente a ela: a ascensão da \"tirania da maioria\". Ele temia que, em uma sociedade onde a maioria detém...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-139",
    "tableId": 139,
    "titulo": "A República",
    "autor": "Platão",
    "ano": "séc. IV a.C.",
    "descricao": "\"A República\", obra monumental de Platão, concebida por volta de 380 a.C., transcende a esfera literária para se consolidar como um dos pilares da filosofia ocidental e um texto de...",
    "sinopse": "\"A República\", obra monumental de Platão, concebida por volta de 380 a.C., transcende a esfera literária para se consolidar como um dos pilares da filosofia ocidental e um texto de valor inestimável para o estudo do Direito. Inserida no efervescente cenário da Grécia Antiga, período de intensas transformações intelectuais e políticas, a obra se desdobra em um diálogo socrático, onde o mestre Sócrates, com sua inconfundível maiêutica, instiga a investigação sobre a essência da justiça. Essa busca não se limita à esfera individual, mas se expande vigorosamente para a estrutura da pólis, a cidade...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_republica_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-140",
    "tableId": 140,
    "titulo": "O Príncipe",
    "autor": "Nicolau Maquiavel",
    "ano": "1532",
    "descricao": "Nicolau Maquiavel, em sua obra seminal \"O Príncipe\", publicada postumamente em 1532, oferece um tratado de ciência política que se distancia radicalmente das idealizações moralizan...",
    "sinopse": "Nicolau Maquiavel, em sua obra seminal \"O Príncipe\", publicada postumamente em 1532, oferece um tratado de ciência política que se distancia radicalmente das idealizações moralizantes de seus predecessores. Escrito durante um período de intensa instabilidade política na Itália renascentista, marcado por divisões internas e a constante ameaça de potências estrangeiras, o livro surge como um manual pragmático para a aquisição e manutenção do poder principesco. Maquiavel, com uma análise crua e empírica, desmistifica a figura do governante, apresentando-o não como um líder guiado por virtudes mor...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_principe_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-141",
    "tableId": 141,
    "titulo": "Ética a Nicômaco",
    "autor": "Aristóteles",
    "ano": "séc. IV a.C.",
    "descricao": "A \"Ética a Nicômaco\", obra seminal de Aristóteles (384-322 a.C.), constitui um dos alicerces da filosofia moral ocidental, oferecendo um mergulho profundo e sistemático na investig...",
    "sinopse": "A \"Ética a Nicômaco\", obra seminal de Aristóteles (384-322 a.C.), constitui um dos alicerces da filosofia moral ocidental, oferecendo um mergulho profundo e sistemático na investigação da vida boa (*eudaimonia*), o bem supremo para o ser humano. Escrita em Atenas durante o século IV a.C., um período de efervescência intelectual e política, a obra reflete a preocupação aristotélica com a formação do cidadão virtuoso, apto a participar ativamente da *pólis* e a alcançar a plenitude existencial. Sua estrutura didática, dividida em dez livros, desdobra a argumentação de forma lógica e progressiva,...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/etica_a_nicomaco_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-142",
    "tableId": 142,
    "titulo": "Eles, os Juízes, Vistos por Nós, os Advogados",
    "autor": "Piero Calamandrei",
    "ano": "1935",
    "descricao": "O livro \"Eles, os Juízes, Vistos por Nós, os Advogados\", escrito pelo renomado jurista italiano Piero Calamandrei, representa um clássico da literatura jurídica, transcendo a mera ...",
    "sinopse": "O livro \"Eles, os Juízes, Vistos por Nós, os Advogados\", escrito pelo renomado jurista italiano Piero Calamandrei, representa um clássico da literatura jurídica, transcendo a mera exegese normativista para adentrar o âmago humano e ético da prática forense. Publicada em um período crucial da história italiana pós-Segunda Guerra Mundial, a obra emerge como uma resposta à necessidade premente de restauração da confiança nas instituições judiciais, em um contexto de profunda crise moral e institucional. Calamandrei, com sua vasta experiência como professor e advogado, oferece uma análise introspe...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/eles_os_juizes_vistos_por_nos_os_advogados_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-143",
    "tableId": 143,
    "titulo": "Virando a Própria Mesa",
    "autor": "Ricardo Semler",
    "ano": "1988",
    "descricao": "O livro \"Virando a Própria Mesa\", de Ricardo Semler, transcende a esfera da gestão empresarial para se posicionar como um marco teórico e prático de profunda relevância para o estu...",
    "sinopse": "O livro \"Virando a Própria Mesa\", de Ricardo Semler, transcende a esfera da gestão empresarial para se posicionar como um marco teórico e prático de profunda relevância para o estudo e a aplicação do Direito, especialmente para estudantes e profissionais da área jurídica. Publicado em um período de efervescência na busca por modelos organizacionais mais humanos e eficientes, a obra narra a experiência transformadora de Semler na Semco, empresa brasileira que, sob sua liderança, rompeu com as estruturas hierárquicas e burocráticas tradicionais. A filosofia central de Semler reside na implementa...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/virando_a_propria_mesa_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-144",
    "tableId": 144,
    "titulo": "Teoria Pura do Direito",
    "autor": "Hans Kelsen",
    "ano": "1934",
    "descricao": "A \"Teoria Pura do Direito\", em sua versão definitiva publicada em 1960, é a obra magna de Hans Kelsen, um jurista austríaco que revolucionou o pensamento jurídico no século XX. O c...",
    "sinopse": "A \"Teoria Pura do Direito\", em sua versão definitiva publicada em 1960, é a obra magna de Hans Kelsen, um jurista austríaco que revolucionou o pensamento jurídico no século XX. O contexto histórico em que Kelsen desenvolveu sua teoria é crucial para sua compreensão. Marcado pelas profundas crises políticas e ideológicas que varreram a Europa, especialmente após as duas Guerras Mundiais e a ascensão de regimes totalitários, Kelsen buscou, com sua \"pureza\", construir um método científico para o Direito, dissociando-o de quaisquer influências que pudessem comprometer sua objetividade e autonomia....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/teoria_pura_do_direito_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-145",
    "tableId": 145,
    "titulo": "Vigiar e Punir: Nascimento da Prisão",
    "autor": "Michel Foucault",
    "ano": "1975",
    "descricao": "A obra \"Vigiar e Punir: Nascimento da Prisão\", de Michel Foucault, é um marco incontornável nos estudos sobre o direito, a punição e as formas de poder na sociedade ocidental. Publ...",
    "sinopse": "A obra \"Vigiar e Punir: Nascimento da Prisão\", de Michel Foucault, é um marco incontornável nos estudos sobre o direito, a punição e as formas de poder na sociedade ocidental. Publicado originalmente em 1975, o livro insere-se no contexto intelectual pós-estruturalista, dialogando com debates sobre a história das ideias, a crítica das instituições e a análise das relações de poder. Foucault empreende uma profunda investigação genealógica, rastreando as transformações nas práticas punitivas desde o Antigo Regime até o advento da prisão como principal modalidade de sanção penal. Ele parte da aná...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/vigiar_e_punir_nascimento_da_prisao_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-146",
    "tableId": 146,
    "titulo": "A Meta: Um Processo de Melhoria Contínua",
    "autor": "Eliyahu M. Goldratt e Jeff Cox",
    "ano": "1925",
    "descricao": "A Meta: Um Processo de Melhoria Contínua, de Eliyahu M. Goldratt e Jeff Cox, transcende a mera literatura de gestão para se consolidar como um clássico indispensável na formação de...",
    "sinopse": "A Meta: Um Processo de Melhoria Contínua, de Eliyahu M. Goldratt e Jeff Cox, transcende a mera literatura de gestão para se consolidar como um clássico indispensável na formação de profissionais em diversas áreas, incluindo o Direito. Publicado originalmente em 1984, em um contexto de crescente globalização e intensificação da concorrência, o livro surge como uma resposta à necessidade de repensar os modelos tradicionais de produção e gestão, focando na otimização de processos e na busca incessante por eficiência. A obra se distancia de manuais técnicos e adota a forma de um romance empresaria...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_meta_um_processo_de_melhoria_continua_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-147",
    "tableId": 147,
    "titulo": "Introdução ao Estudo do Direito",
    "autor": "Tercio Sampaio Ferraz Júnior",
    "ano": "1988",
    "descricao": "A obra \"Introdução ao Estudo do Direito\", de Tercio Sampaio Ferraz Júnior, emerge como um marco na literatura jurídica brasileira, posicionando-se como um clássico indispensável pa...",
    "sinopse": "A obra \"Introdução ao Estudo do Direito\", de Tercio Sampaio Ferraz Júnior, emerge como um marco na literatura jurídica brasileira, posicionando-se como um clássico indispensável para a formação de novos juristas. Publicada em um período de efervescência intelectual e jurídica no Brasil, o livro reflete a necessidade de sistematizar e clarificar os fundamentos do fenômeno jurídico para um público acadêmico ainda em formação. Ferraz Júnior, com sua notória erudição e clareza expositiva, propõe uma imersão profunda nos pilares que sustentam o ordenamento jurídico, desmistificando conceitos que, à...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/introducao_ao_estudo_do_direito.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-148",
    "tableId": 148,
    "titulo": "A Era dos Direitos",
    "autor": "Norberto Bobbio",
    "ano": "1990",
    "descricao": "A obra \"A Era dos Direitos\", de Norberto Bobbio, é um marco incontornável na teoria dos direitos humanos e fundamentais, oferecendo aos estudantes de Direito uma análise profunda e...",
    "sinopse": "A obra \"A Era dos Direitos\", de Norberto Bobbio, é um marco incontornável na teoria dos direitos humanos e fundamentais, oferecendo aos estudantes de Direito uma análise profunda e multifacetada de um dos pilares do Estado Democrático de Direito. Publicado em um período de intensa reflexão sobre os limites e as possibilidades da proteção dos direitos humanos após os horrores do século XX, o livro se insere no contexto de um \"clássico\" do pensamento jurídico e filosófico, dialogando com as tradições do jusnaturalismo e do positivismo, mas propondo uma abordagem original e crítica. Bobbio, com s...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_era_dos_direitos_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-149",
    "tableId": 149,
    "titulo": "O Mundo de Sofia",
    "autor": "Jostein Gaarder",
    "ano": "1991",
    "descricao": "O Mundo de Sofia, obra seminal do escritor norueguês Jostein Gaarder, transcende a mera ficção para se consolidar como um portal de acesso à história do pensamento filosófico ocide...",
    "sinopse": "O Mundo de Sofia, obra seminal do escritor norueguês Jostein Gaarder, transcende a mera ficção para se consolidar como um portal de acesso à história do pensamento filosófico ocidental. Publicado em 1991, o romance se insere em um contexto de crescente busca por sentido e questionamento da realidade, especialmente entre os jovens, oferecendo uma narrativa envolvente para desmistificar conceitos complexos. A premissa central gira em torno de Sofia Amundsen, uma adolescente de 14 anos que se vê imersa em um mistério epistolar, recebendo cartas anônimas que a convidam a refletir sobre questões fu...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_de_sofia_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-150",
    "tableId": 150,
    "titulo": "A Riqueza das Nações",
    "autor": "Adam Smith",
    "ano": null,
    "descricao": "Uma investigação sobre a natureza e as causas da riqueza das nações é a obra mais famosa de Adam Smith....",
    "sinopse": "Uma investigação sobre a natureza e as causas da riqueza das nações é a obra mais famosa de Adam Smith....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_riqueza_das_nacoes.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-151",
    "tableId": 151,
    "titulo": "A Teoria das Formas de Governo",
    "autor": "Norberto Bobbio",
    "ano": null,
    "descricao": "Um clássico sobre a evolução histórica do pensamento político e as formas de governo....",
    "sinopse": "Um clássico sobre a evolução histórica do pensamento político e as formas de governo....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_teoria_das_formas_de_governo_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-152",
    "tableId": 152,
    "titulo": "O Espírito das Leis",
    "autor": "Charles de Montesquieu",
    "ano": null,
    "descricao": "A obra-prima que fundamenta a teoria da separação dos três poderes, essencial para o Estado Democrático de Direito....",
    "sinopse": "A obra-prima que fundamenta a teoria da separação dos três poderes, essencial para o Estado Democrático de Direito....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-153",
    "tableId": 153,
    "titulo": "Lições Preliminares de Direito",
    "autor": "Miguel Reale",
    "ano": null,
    "descricao": "Obra introdutória magistral, essencial para a compreensão dos conceitos fundamentais do Direito....",
    "sinopse": "Obra introdutória magistral, essencial para a compreensão dos conceitos fundamentais do Direito....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/licoes_preliminares_de_direito.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-154",
    "tableId": 154,
    "titulo": "O Futuro da Democracia",
    "autor": "Norberto Bobbio",
    "ano": null,
    "descricao": "Uma análise profunda das promessas não cumpridas da democracia e os desafios contemporâneos do sistema representativo....",
    "sinopse": "Uma análise profunda das promessas não cumpridas da democracia e os desafios contemporâneos do sistema representativo....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_futuro_da_democracia_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-155",
    "tableId": 155,
    "titulo": "O Manual Definitivo para entender a Filosofia do Direito",
    "autor": "Vários Autores",
    "ano": null,
    "descricao": "Um guia prático e direto para compreender as principais correntes filosóficas e pensadores do direito....",
    "sinopse": "Um guia prático e direto para compreender as principais correntes filosóficas e pensadores do direito....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/filosofia_do_direito.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  }
];

export const AUDIOBOOKS_CATALOGO: AudiobookLivro[] = [
  O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
  DOS_DELITOS_E_DAS_PENAS,
  ...AUDIOBOOKS_EM_BREVE
];
