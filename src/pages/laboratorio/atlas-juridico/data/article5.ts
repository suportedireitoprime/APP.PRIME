import type {
  ArticleBlock,
  Flashcard,
  FunctionMeta,
  MarkerDef,
  NeighborArticle,
  Preview,
  QuizQuestion,
  Trecho,
} from '../types'

/**
 * Conteúdo do CP art. 5º — Territorialidade.
 * Fonte: texto compilado do Código Penal (Decreto-Lei nº 2.848/1940),
 * transcrito do HTML de referência do protótipo (atlas-juridico-art-5o).
 * Títulos dos artigos vizinhos conferidos contra o CP:
 *  - Art. 3º — Lei excepcional ou temporária
 *  - Art. 4º — Tempo do crime ("Considera-se praticado o crime no
 *    momento da ação ou omissão, ainda que outro seja o momento do
 *    resultado.")
 *  - Art. 6º — Lugar do crime ("Considera-se praticado o crime no
 *    lugar em que ocorreu a ação ou omissão, no todo ou em parte, bem
 *    como onde se produziu ou deveria produzir-se o resultado.")
 *  - Art. 7º — Extraterritorialidade
 */

export const ARTICLE_NUMBER = 5
export const ARTICLE_TITLE = 'Territorialidade'
export const ARTICLE_SUB = 'Onde a lei penal brasileira alcança.'
export const ARTICLE_LAW = 'Atlas Jurídico · Código Penal — Decreto-Lei nº 2.848/1940'

export const FUNCTIONS: FunctionMeta[] = [
  { id: 'texto', label: 'Texto', order: 1 },
  { id: 'ouvir', label: 'Ouvir', order: 2 },
  { id: 'assistir', label: 'Assistir', order: 3 },
  { id: 'entender', label: 'Entender', order: 4 },
  { id: 'praticar', label: 'Praticar', order: 5 },
  { id: 'aprofundar', label: 'Aprofundar', order: 6 },
  { id: 'estudo', label: 'Meu Estudo', order: 7 },
]

export const FUNCTION_LABELS: Record<FunctionMeta['id'], string> = {
  texto: 'Texto',
  ouvir: 'Ouvir',
  assistir: 'Assistir',
  entender: 'Entender',
  praticar: 'Praticar',
  aprofundar: 'Aprofundar',
  estudo: 'Meu Estudo',
}

export const PREVIEWS: Record<FunctionMeta['id'], Preview> = {
  texto: {
    id: 'texto',
    orderLabel: '1 de 7',
    title: 'Texto',
    cta: 'Começar a ler',
    time: '≈ 6 min de leitura',
    desc: 'É a leitura do artigo em si: o texto oficial do art. 5º do CP, sem enrolação, para você saber exatamente o que a lei diz antes de qualquer explicação.',
    items: [
      'Texto oficial dividido em 3 blocos curtos',
      'Um “não confunda” e um caso prático em cada bloco',
      '6 trechos para marcar como lidos e avançar o progresso',
    ],
  },
  ouvir: {
    id: 'ouvir',
    orderLabel: '2 de 7',
    title: 'Ouvir',
    cta: 'Ouvir agora',
    time: '≈ 21 min no total',
    desc: 'É o artigo em áudio, para estudar ouvindo: no carro, na caminhada ou revisando sem olhar para a tela.',
    items: [
      'Áudio-aula completa do artigo (18 min)',
      'Pílula rápida de revisão (2:50)',
      'Velocidade ajustável: 1×, 1,5× e 2×',
    ],
  },
  assistir: {
    id: 'assistir',
    orderLabel: '3 de 7',
    title: 'Assistir',
    cta: 'Assistir agora',
    time: '≈ 44 min no total',
    desc: 'É o artigo em vídeo: a explicação visual completa e as pílulas desenhadas na lousa, uma para cada ponto que mais cai.',
    items: [
      'Videoaula completa do art. 5º (38 min)',
      'Lousa Animada: território real × ficto',
      'Lousa Animada: pública × privada',
    ],
  },
  entender: {
    id: 'entender',
    orderLabel: '4 de 7',
    title: 'Entender',
    cta: 'Ver o resumo',
    time: '≈ 8 min de estudo',
    desc: 'É o artigo explicado de forma curta e visual, para a ideia entrar de vez antes de você treinar.',
    items: [
      'Resumo no formato Cornell, pergunta e resposta',
      'Mapa mental do artigo inteiro',
      '4 pares “não confunda” que mais pegam em prova',
    ],
  },
  praticar: {
    id: 'praticar',
    orderLabel: '5 de 7',
    title: 'Praticar',
    cta: 'Praticar agora',
    time: '≈ 12 min de treino',
    desc: 'É a hora de testar o que você estudou, só com este artigo: errar aqui é barato, errar na prova não.',
    items: [
      '5 questões com gabarito comentado na hora',
      '6 flashcards que viram ao toque',
      'O resultado alimenta o seu progresso no artigo',
    ],
  },
  aprofundar: {
    id: 'aprofundar',
    orderLabel: '6 de 7',
    title: 'Aprofundar',
    cta: 'Aprofundar agora',
    time: '≈ 7 min de leitura',
    desc: 'É ir além do texto seco: os limites da regra, os artigos vizinhos e o raciocínio completo por trás do art. 5º.',
    items: [
      'Por que a territorialidade é “temperada”',
      'Arts. 6º e 7º comentados, lado a lado',
      'Caso prático completo, resolvido passo a passo',
    ],
  },
  estudo: {
    id: 'estudo',
    orderLabel: '7 de 7',
    title: 'Meu Estudo',
    cta: 'Ver meu estudo',
    time: 'Leva 1 min',
    desc: 'É o seu painel dentro deste artigo: quanto você já fez, quanto falta e qual é o próximo passo para fechar os 100%.',
    items: [
      'Trechos lidos, acertos e flashcards num só lugar',
      'Domínio do artigo em percentual',
      'Lista do que ainda falta para concluir',
    ],
  },
}

export const BLOCKS: ArticleBlock[] = [
  {
    kicker: 'Bloco 1 · Caput',
    title: 'Territorialidade: a regra é o território',
    official:
      'Aplica-se a lei brasileira, sem prejuízo de convenções, tratados e regras de direito internacional, ao crime cometido no território nacional.',
    body: 'Crime cometido no território nacional → aplica-se a lei brasileira. É o princípio da territorialidade, adotado como regra no Brasil, mas de forma temperada (ou mitigada): a própria lei abre espaço para tratados e para a extraterritorialidade do art. 7º.',
    notConfunda:
      'Territorialidade (art. 5º) diz qual lei se aplica pelo lugar do crime. O art. 6º diz qual é o lugar do crime (teoria da ubiquidade: ação ou resultado).',
    case: 'Um furto cometido em São Paulo por um estrangeiro, contra vítima estrangeira. Ainda assim aplica-se a lei brasileira — o que importa é o território, não a nacionalidade.',
  },
  {
    kicker: 'Bloco 2 · § 1º',
    title: 'Extensão do território: embarcações e aeronaves brasileiras',
    official:
      'Para os efeitos penais, consideram-se extensão do território nacional as embarcações e aeronaves brasileiras, de natureza pública ou a serviço do governo brasileiro, onde quer que se encontrem, bem como as aeronaves e embarcações brasileiras, mercantes ou de propriedade privada, que se achem, respectivamente, no espaço aéreo correspondente ou em alto-mar.',
    body: 'Para efeitos penais, consideram-se extensão do território nacional: (i) embarcações e aeronaves brasileiras, de natureza pública ou a serviço do governo brasileiro, onde quer que se encontrem; (ii) aeronaves e embarcações brasileiras, mercantes ou de propriedade privada, que estejam, respectivamente, no espaço aéreo correspondente ou em alto-mar.',
    notConfunda:
      'Pública brasileira vale em qualquer lugar. Privada/mercante brasileira só vale como extensão quando está em alto-mar ou no espaço aéreo correspondente — se estiver em porto ou espaço estrangeiro, em regra vale a lei daquele país.',
    case: 'Crime a bordo de navio mercante brasileiro em alto-mar → lei brasileira (§ 1º). O mesmo navio atracado em porto estrangeiro → em regra, lei do país do porto.',
  },
  {
    kicker: 'Bloco 3 · § 2º',
    title: 'Embarcações e aeronaves estrangeiras privadas no Brasil',
    official:
      'É também aplicável a lei brasileira aos crimes praticados a bordo de aeronaves ou embarcações estrangeiras de propriedade privada, achando-se aquelas em pouso no território nacional ou em voo no espaço aéreo correspondente, e estas em porto ou mar territorial do Brasil.',
    body: 'Também se aplica a lei brasileira aos crimes praticados a bordo de aeronaves ou embarcações estrangeiras de propriedade privada, quando: a aeronave está em pouso no território nacional ou em voo no espaço aéreo correspondente; e a embarcação está em porto ou mar territorial do Brasil.',
    notConfunda:
      'O § 2º só fala de embarcação/aeronave estrangeira privada. Embarcação pública estrangeira (ex.: navio de guerra) não entra aqui — ela é protegida pela imunidade do Estado estrangeiro.',
    case: 'Agressão a bordo de avião comercial estrangeiro já pousado em Guarulhos → lei brasileira (§ 2º). Crime em navio de guerra estrangeiro em porto brasileiro → não se aplica a regra do § 2º.',
  },
]

export const TRECHOS: Trecho[] = [
  {
    label: 'Caput',
    text: 'Aplica-se a lei brasileira, sem prejuízo de convenções, tratados e regras de direito internacional, ao crime cometido no território nacional.',
  },
  {
    label: 'Caput · princípio',
    text: 'Princípio da territorialidade temperada: a regra é o território, com as exceções dos tratados e da extraterritorialidade do art. 7º.',
  },
  {
    label: '§ 1º · pública',
    text: 'Consideram-se extensão do território nacional as embarcações e aeronaves brasileiras, de natureza pública ou a serviço do governo brasileiro, onde quer que se encontrem.',
  },
  {
    label: '§ 1º · privada',
    text: 'Consideram-se também extensão as aeronaves e embarcações brasileiras, mercantes ou de propriedade privada, que se achem, respectivamente, no espaço aéreo correspondente ou em alto-mar.',
  },
  {
    label: '§ 2º · aeronave',
    text: 'É aplicável a lei brasileira aos crimes a bordo de aeronaves estrangeiras de propriedade privada em pouso no território nacional ou em voo no espaço aéreo correspondente.',
  },
  {
    label: '§ 2º · embarcação',
    text: 'É aplicável a lei brasileira aos crimes a bordo de embarcações estrangeiras de propriedade privada em porto ou mar territorial do Brasil.',
  },
]

export const QUIZ: QuizQuestion[] = [
  {
    q: 'Pelo caput do art. 5º do CP, a lei brasileira se aplica ao crime cometido:',
    opts: [
      'Apenas por brasileiro, onde quer que esteja',
      'No território nacional, sem prejuízo de convenções, tratados e regras de direito internacional',
      'Em qualquer lugar do mundo, sem exceções',
      'Somente no território nacional, sem nenhuma ressalva',
    ],
    right: 1,
    exp: 'É a letra do caput. A ressalva dos tratados é o que torna a territorialidade brasileira temperada (mitigada), e não absoluta.',
  },
  {
    q: 'Um crime é cometido a bordo de aeronave brasileira a serviço do governo, sobrevoando outro país. Aplica-se a lei brasileira?',
    opts: [
      'Não, vale só a lei do país sobrevoado',
      'Sim — § 1º: aeronave brasileira pública ou a serviço do governo é extensão do território onde quer que se encontre',
      'Só se o autor for brasileiro',
      'Só se houver tratado com aquele país',
    ],
    right: 1,
    exp: '§ 1º, primeira parte: embarcações e aeronaves brasileiras públicas ou a serviço do governo são extensão do território nacional onde quer que estejam.',
  },
  {
    q: 'Crime a bordo de navio mercante brasileiro em alto-mar. E o mesmo navio, depois, atracado em porto estrangeiro?',
    opts: [
      'Lei brasileira nos dois casos',
      'Lei estrangeira nos dois casos',
      'Em alto-mar, lei brasileira (§ 1º); em porto estrangeiro, em regra a lei daquele país',
      'Em alto-mar, nenhuma lei se aplica',
    ],
    right: 2,
    exp: 'A privada/mercante brasileira só é extensão do território em alto-mar (e a aeronave, no espaço aéreo correspondente). Em porto estrangeiro, ela se submete, em regra, à lei local.',
  },
  {
    q: 'Crime a bordo de avião comercial estrangeiro (propriedade privada) já pousado em aeroporto brasileiro:',
    opts: [
      'Vale a lei do país da bandeira do avião',
      'Aplica-se a lei brasileira, pelo art. 5º, § 2º',
      'Nenhuma lei se aplica até a decolagem',
      'Só se aplica se a vítima for brasileira',
    ],
    right: 1,
    exp: '§ 2º: aeronave estrangeira de propriedade privada em pouso no território nacional (ou em voo no espaço aéreo correspondente) atrai a lei brasileira. O mesmo vale para embarcação estrangeira privada em porto ou mar territorial.',
  },
  {
    q: 'Crime a bordo de navio de guerra estrangeiro atracado em porto brasileiro. A regra do § 2º se aplica?',
    opts: [
      'Sim, porque está em porto brasileiro',
      'Sim, porque todo navio em porto é privado por equiparação',
      'Não — o § 2º só alcança embarcação estrangeira de propriedade privada; a pública estrangeira é protegida por imunidade',
      'Não, porque crime em navio nunca atrai lei brasileira',
    ],
    right: 2,
    exp: 'Pegadinha clássica: o § 2º fala apenas em aeronaves e embarcações estrangeiras de propriedade privada. Navio de guerra é embarcação pública estrangeira, fora da regra.',
  },
]

export const FLASHCARDS: Flashcard[] = [
  {
    tag: 'Caput',
    front: 'Territorialidade temperada',
    back: 'Crime no território nacional → lei brasileira, sem prejuízo de tratados e do direito internacional. Regra temperada, não absoluta.',
  },
  {
    tag: '§ 1º',
    front: 'Brasileira pública: qualquer lugar',
    back: 'Embarcação e aeronave brasileiras públicas ou a serviço do governo são extensão do território onde quer que se encontrem.',
  },
  {
    tag: '§ 1º',
    front: 'Brasileira privada: alto-mar',
    back: 'Mercante ou privada brasileira só é extensão em alto-mar (embarcação) ou no espaço aéreo correspondente (aeronave).',
  },
  {
    tag: '§ 2º',
    front: 'Estrangeira privada no Brasil',
    back: 'Lei brasileira se a aeronave estrangeira privada está em pouso ou no espaço aéreo brasileiro, e se a embarcação está em porto ou mar territorial.',
  },
  {
    tag: 'Fora do § 2º',
    front: 'Estrangeira pública: imunidade',
    back: 'Navio de guerra e aeronave pública estrangeira não entram no § 2º — prevalece a imunidade do Estado estrangeiro.',
  },
  {
    tag: 'Arts. 5º × 7º',
    front: 'Regra × exceção',
    back: 'Art. 5º: territorialidade (regra). Art. 7º: extraterritorialidade (exceção, hipóteses taxativas de crime no estrangeiro).',
  },
]

export const CORNELL: { q: string; a: string }[] = [
  {
    q: 'O que diz o caput?',
    a: 'Aplica-se a lei brasileira ao crime cometido no território nacional, sem prejuízo de convenções, tratados e regras de direito internacional.',
  },
  {
    q: 'Qual é o princípio?',
    a: 'Territorialidade temperada (mitigada): a regra é o território, mas há exceções — tratados e a extraterritorialidade do art. 7º.',
  },
  {
    q: 'O que é território por equiparação?',
    a: '§ 1º: embarcações e aeronaves brasileiras públicas (onde quer que estejam) e brasileiras mercantes/privadas em alto-mar ou no espaço aéreo correspondente são tratadas como território nacional.',
  },
  {
    q: 'E a estrangeira privada?',
    a: '§ 2º: lei brasileira se aplica ao crime a bordo dela quando está em pouso, porto, mar territorial ou espaço aéreo brasileiro.',
  },
  {
    q: 'O que fica de fora?',
    a: 'Embarcação e aeronave públicas estrangeiras não estão no § 2º — prevalece a imunidade do Estado estrangeiro, além das imunidades previstas em tratados.',
  },
]

export const CORNELL_SUMMARY =
  'Pergunte sempre nesta ordem: 1) o crime foi no território real? 2) se foi em navio/avião, ele é brasileiro ou estrangeiro, público ou privado, e onde exatamente ele estava? Essas três respostas resolvem o art. 5º.'

export const NAO_CONFUNDA: { a: string; b: string }[] = [
  {
    a: 'Territorialidade (art. 5º) × extraterritorialidade (art. 7º)',
    b: 'Art. 5º é a regra: crime no território (real ou ficto). Art. 7º é a exceção: crime fora do território que, em hipóteses taxativas, ainda assim se submete à lei brasileira.',
  },
  {
    a: 'Brasileira pública × brasileira privada',
    b: 'Pública: extensão do território onde quer que esteja. Privada/mercante: só em alto-mar ou no espaço aéreo correspondente (§ 1º).',
  },
  {
    a: 'Estrangeira privada × estrangeira pública',
    b: 'Privada no Brasil: lei brasileira (§ 2º). Pública estrangeira: fora do § 2º, protegida por imunidade.',
  },
  {
    a: 'Art. 5º × art. 6º',
    b: 'Art. 5º escolhe a lei aplicável pelo território. Art. 6º define o lugar do crime pela ubiquidade: onde houve ação/omissão ou onde se produziu (ou deveria produzir-se) o resultado.',
  },
]

export const VIDEOS = [
  {
    kind: 'Videoaula completa',
    duration: '38 min',
    title: 'Art. 5º do CP — a aula inteira',
    desc: 'Lei penal no espaço: territorialidade, território real e ficto, e a ponte para a extraterritorialidade do art. 7º.',
  },
  {
    kind: 'Lousa Animada',
    duration: '2 min 40',
    title: 'Lousa: território real × ficto',
    desc: 'Por que um navio brasileiro em alto-mar é tratado como território nacional — e quando isso muda.',
  },
  {
    kind: 'Lousa Animada',
    duration: '2 min 55',
    title: 'Lousa: pública × privada',
    desc: 'A tabela que resolve a prova: brasileira pública em qualquer lugar; privada brasileira só em alto-mar; estrangeira privada só no Brasil.',
  },
]

export const AUDIOS = [
  {
    key: 'aula' as const,
    title: 'Áudio-aula — Art. 5º do CP completo',
    desc: 'Leitura comentada do caput e dos §§ 1º e 2º: territorialidade, território ficto e embarcações estrangeiras privadas.',
    totalSeconds: 18 * 60,
    totalLabel: '18:00',
  },
  {
    key: 'pilula' as const,
    title: 'Pílula — Art. 5º do CP em 3 minutos',
    desc: 'Revisão rápida: territorialidade temperada, alto-mar, espaço aéreo e a diferença entre pública e privada.',
    totalSeconds: 2 * 60 + 50,
    totalLabel: '2:50',
  },
]

export const APROFUNDAR = [
  {
    tag: 'CAPUT',
    title: '“Sem prejuízo de tratados” — territorialidade temperada',
    body: 'A ressalva do caput é o que torna a territorialidade brasileira temperada: convenções, tratados e regras de direito internacional podem afastar ou limitar a aplicação da lei brasileira mesmo para crime no território.',
  },
  {
    tag: 'ART. 6º',
    title: 'Lugar do crime — teoria da ubiquidade',
    body: 'Considera-se praticado o crime no lugar em que ocorreu a ação ou omissão, no todo ou em parte, bem como onde se produziu ou deveria produzir-se o resultado. É o art. 6º que alimenta a territorialidade do art. 5º nos crimes à distância.',
  },
  {
    tag: 'ART. 7º',
    title: 'Extraterritorialidade — a exceção organizada',
    body: 'Ficam sujeitos à lei brasileira, embora cometidos no estrangeiro, os crimes listados no art. 7º (ex.: contra a vida do Presidente da República, genocídio, e os casos condicionados do § 2º). Sem hipótese do art. 7º, crime fora do território (real ou ficto) não atrai a lei brasileira.',
  },
  {
    tag: '§ 2º · LIM.',
    title: 'Imunidade de embarcação e aeronave públicas estrangeiras',
    body: 'O § 2º alcança apenas as de propriedade privada. As públicas estrangeiras representam outro Estado e são protegidas por sua imunidade — por isso prova boa troca “privada” por “pública” para tornar a assertiva errada.',
  },
]

export const CASO_COMPLETO =
  'Um disparo é feito a bordo de navio mercante brasileiro em alto-mar e a vítima morre já em hospital em terra estrangeira. A bordo em alto-mar, o navio é extensão do território (§ 1º); pelo art. 6º, o lugar do crime abrange ação e resultado. Conclusão do caso: a lei brasileira se aplica pela territorialidade.'

export const CONEXOES =
  'O art. 5º forma, com os arts. 6º e 7º, o sistema da lei penal no espaço. Ele também se conecta ao mar territorial e ao espaço aéreo como partes do território real, e às imunidades diplomáticas e consulares previstas em tratados — a ressalva expressa do caput.'

/** Marcadores das 7 funções sobre o globo (mesmas lat/lon do protótipo). */
export const MARKERS: MarkerDef[] = [
  { id: 'texto', label: 'Texto', lat: 24, lon: -38 },
  { id: 'ouvir', label: 'Ouvir', lat: 48, lon: 55 },
  { id: 'assistir', label: 'Assistir', lat: -6, lon: 118 },
  { id: 'entender', label: 'Entender', lat: -38, lon: -95 },
  { id: 'praticar', label: 'Praticar', lat: 12, lon: 178 },
  { id: 'aprofundar', label: 'Aprofundar', lat: 58, lon: -128 },
  { id: 'estudo', label: 'Meu Estudo', lat: -52, lon: 12 },
]

/**
 * Cadeia de artigos navegáveis como planetas (arts. 3º–7º do CP).
 * Só o art. 5º tem conteúdo completo neste projeto; os vizinhos têm
 * título e subtítulo corretos e, ao pousar neles, a tela informa que o
 * conteúdo completo ainda não foi carregado (ver README).
 */
export const NEIGHBORS: Record<number, NeighborArticle> = {
  3: {
    num: 3,
    label: 'Art. 3º',
    name: 'Lei excepcional ou temporária',
    sub: 'A lei temporária dura só pelo tempo determinado.',
  },
  4: {
    num: 4,
    label: 'Art. 4º',
    name: 'Tempo do crime',
    sub: 'Considera-se praticado no momento da ação ou omissão.',
  },
  5: {
    num: 5,
    label: 'Art. 5º',
    name: 'Territorialidade',
    sub: 'Onde a lei penal brasileira alcança.',
  },
  6: {
    num: 6,
    label: 'Art. 6º',
    name: 'Lugar do crime',
    sub: 'Onde ocorreu a ação ou onde se produziu o resultado.',
  },
  7: {
    num: 7,
    label: 'Art. 7º',
    name: 'Extraterritorialidade',
    sub: 'Crimes no estrangeiro que ainda seguem a lei brasileira.',
  },
}

export const ARTICLE_ORDER = [3, 4, 5, 6, 7]
