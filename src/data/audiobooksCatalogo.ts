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
  audioTituloUrl: string;
  srtUrl: string;
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
  "duracaoTotalSegundos": 6400,
  "duracaoTotalFormatada": "106 min",
  "tags": [
    "Filosofia do Direito",
    "Jusnaturalismo",
    "Positivismo",
    "Clássicos",
    "Harvard Law"
  ],
  "capitulos": [
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
    "id": "livro-classico-123",
    "tableId": 123,
    "titulo": "Dos Delitos e das Penas",
    "autor": "Cesare Beccaria",
    "ano": "1764",
    "descricao": "A obra \"Dos Delitos e das Penas\", publicada anonimamente em 1764 por Cesare Beccaria, constitui um divisor de águas na história do Direito Penal, emergindo em um contexto europeu m...",
    "sinopse": "A obra \"Dos Delitos e das Penas\", publicada anonimamente em 1764 por Cesare Beccaria, constitui um divisor de águas na história do Direito Penal, emergindo em um contexto europeu marcado pelo absolutismo, pela arbitrariedade judicial e por um sistema punitivo desumano. O século XVIII era palco de penas cruéis, desproporcionais e frequentemente imbricadas em práticas arcaicas e supersticiosas, desprovidas de racionalidade. Beccaria, imbuído dos ideais iluministas de razão, progresso, direitos naturais e felicidade geral, propôs uma reestruturação radical do pensamento jurídico-penal. Sua aborda...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/dos_delitos_e_das_penas_manual.jpg",
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
  ...AUDIOBOOKS_EM_BREVE
];
