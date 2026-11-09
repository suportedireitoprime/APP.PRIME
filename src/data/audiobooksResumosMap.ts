import { AudiobookLivro } from './audiobooksCatalogo';

export interface AudiobookResumoInfo {
  slug: string;
  titulo: string;
  subtitulo?: string;
  autor: string;
  audioUrl: string;
  srtUrl?: string;
  duracaoFormatada?: string;
  descricao?: string;
}

const R2_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/resumos';

/**
 * Catálogo dos 42 Resumos em Áudio (Diálogo Professora e Aluna)
 * Hospedados no Cloudflare R2 com CDN global a 0ms
 */
export const AUDIOBOOKS_RESUMOS_MAP: Record<string, AudiobookResumoInfo> = {
  '1984': {
    slug: '1984',
    titulo: '1984',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'George Orwell',
    audioUrl: `${R2_BASE}/1984/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/1984/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'Resumo completo e aprofundado dos dilemas do totalitarismo, duplipensar e controle estatal.',
  },
  'a-arte-da-guerra': {
    slug: 'a-arte-da-guerra',
    titulo: 'A Arte da Guerra',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Sun Tzu',
    audioUrl: `${R2_BASE}/a-arte-da-guerra/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/a-arte-da-guerra/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Estratégia militar aplicada ao raciocínio lógico, táticas jurídicas e liderança.',
  },
  'a-era-dos-direitos': {
    slug: 'a-era-dos-direitos',
    titulo: 'A Era dos Direitos',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Norberto Bobbio',
    audioUrl: `${R2_BASE}/a-era-dos-direitos/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/a-era-dos-direitos/audiobook-completo.srt`,
    duracaoFormatada: '~30 min',
    descricao: 'A evolução histórica, filosófica e institucional dos Direitos Humanos fundamentais.',
  },
  'a-estrada-para-o-carater': {
    slug: 'a-estrada-para-o-carater',
    titulo: 'A Estrada para o Caráter',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'David Brooks',
    audioUrl: `${R2_BASE}/a-estrada-para-o-carater/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/a-estrada-para-o-carater/audiobook-completo.srt`,
    duracaoFormatada: '~32 min',
    descricao: 'Valores morais internos versus virtudes exteriores na construção ética do indivíduo.',
  },
  'a-luta-pelo-direito': {
    slug: 'a-luta-pelo-direito',
    titulo: 'A Luta pelo Direito',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Rudolf von Ihering',
    audioUrl: `${R2_BASE}/a-luta-pelo-direito/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/a-luta-pelo-direito/audiobook-completo.srt`,
    duracaoFormatada: '~25 min',
    descricao: 'O dever ético e prático de todo cidadão de lutar e defender ativamente seus direitos.',
  },
  'a-meta': {
    slug: 'a-meta',
    titulo: 'A Meta',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Eliyahu M. Goldratt',
    audioUrl: `${R2_BASE}/a-meta/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/a-meta/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'A Teoria das Restrições e processos de melhoria contínua aplicados à resolução de problemas complexos.',
  },
  'a-republica': {
    slug: 'a-republica',
    titulo: 'A República',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Platão',
    audioUrl: `${R2_BASE}/a-republica/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/a-republica/audiobook-completo.srt`,
    duracaoFormatada: '~40 min',
    descricao: 'A justiça individual e coletiva, a Cidade Ideal e a célebre alegoria da caverna.',
  },
  'a-riqueza-das-nacoes': {
    slug: 'a-riqueza-das-nacoes',
    titulo: 'A Riqueza das Nações',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Adam Smith',
    audioUrl: `${R2_BASE}/a-riqueza-das-nacoes/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/a-riqueza-das-nacoes/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'Divisão do trabalho, mercado livre, incentivos econômicos e o papel das leis na prosperidade.',
  },
  'a-teoria-das-formas-de-governo': {
    slug: 'a-teoria-das-formas-de-governo',
    titulo: 'A Teoria das Formas de Governo',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Norberto Bobbio',
    audioUrl: `${R2_BASE}/a-teoria-das-formas-de-governo/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/a-teoria-das-formas-de-governo/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Análise comparativa das formas de governo desde os gregos até o constitucionalismo moderno.',
  },
  'acesso-a-justica': {
    slug: 'acesso-a-justica',
    titulo: 'Acesso à Justiça',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Mauro Cappelletti e Bryant Garth',
    audioUrl: `${R2_BASE}/acesso-a-justica/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/acesso-a-justica/audiobook-completo.srt`,
    duracaoFormatada: '~25 min',
    descricao: 'As três ondas renovatórias do acesso à ordem jurídica justa e democratização do Judiciário.',
  },
  'admiravel-mundo-novo': {
    slug: 'admiravel-mundo-novo',
    titulo: 'Admirável Mundo Novo',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Aldous Huxley',
    audioUrl: `${R2_BASE}/admiravel-mundo-novo/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/admiravel-mundo-novo/audiobook-completo.srt`,
    duracaoFormatada: '~40 min',
    descricao: 'Distopia sobre controle social tecnológico, perda da individualidade e bioética.',
  },
  'as-21-irrefutaveis-leis-da-lideranca': {
    slug: 'as-21-irrefutaveis-leis-da-lideranca',
    titulo: 'As 21 Irrefutáveis Leis da Liderança',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'John C. Maxwell',
    audioUrl: `${R2_BASE}/as-21-irrefutaveis-leis-da-lideranca/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/as-21-irrefutaveis-leis-da-lideranca/audiobook-completo.srt`,
    duracaoFormatada: '~40 min',
    descricao: 'Princípios atemporais de influência, integridade e tomada de decisão estratégica.',
  },
  'blink': {
    slug: 'blink',
    titulo: 'Blink: A Decisão num Piscar de Olhos',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Malcolm Gladwell',
    audioUrl: `${R2_BASE}/blink/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/blink/audiobook-completo.srt`,
    duracaoFormatada: '~30 min',
    descricao: 'A psicologia da intuição rápida, vieses cognitivos e julgamento sob pressão.',
  },
  'comece-pelo-porque': {
    slug: 'comece-pelo-porque',
    titulo: 'Comece pelo Porquê',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Simon Sinek',
    audioUrl: `${R2_BASE}/comece-pelo-porque/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/comece-pelo-porque/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'O Círculo Dourado: propósito, clareza institucional e capacidade de inspirar pessoas.',
  },
  'como-as-democracias-morrem': {
    slug: 'como-as-democracias-morrem',
    titulo: 'Como as Democracias Morrem',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Steven Levitsky e Daniel Ziblatt',
    audioUrl: `${R2_BASE}/como-as-democracias-morrem/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/como-as-democracias-morrem/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Erosão democrática por vias legais, limites institucionais e tolerância mútua.',
  },
  'comunicacao-nao-violenta': {
    slug: 'comunicacao-nao-violenta',
    titulo: 'Comunicação Não-Violenta',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Marshall B. Rosenberg',
    audioUrl: `${R2_BASE}/comunicacao-nao-violenta/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/comunicacao-nao-violenta/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Resolução consensual de conflitos, mediação, empatia ativa e linguagem assertiva.',
  },
  'dos-delitos-e-das-penas': {
    slug: 'dos-delitos-e-das-penas',
    titulo: 'Dos Delitos e das Penas',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Cesare Beccaria',
    audioUrl: `${R2_BASE}/dos-delitos-e-das-penas/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/dos-delitos-e-das-penas/audiobook-completo.srt`,
    duracaoFormatada: '~40 min',
    descricao: 'Marco iluminista que fundou o Direito Penal humanitário e a proporcionalidade das sanções.',
  },
  'eles-os-juizes-vistos-por-nos-os-advogados': {
    slug: 'eles-os-juizes-vistos-por-nos-os-advogados',
    titulo: 'Eles, os Juízes, Vistos por Nós, os Advogados',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Piero Calamandrei',
    audioUrl: `${R2_BASE}/eles-os-juizes-vistos-por-nos-os-advogados/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/eles-os-juizes-vistos-por-nos-os-advogados/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'A relação ética entre a advocacia e a magistratura com elegância e sabedoria forense.',
  },
  'etica-a-nicomaco': {
    slug: 'etica-a-nicomaco',
    titulo: 'Ética a Nicômaco',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Aristóteles',
    audioUrl: `${R2_BASE}/etica-a-nicomaco/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/etica-a-nicomaco/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Virtude moral, justa medida, prudência (phronesis) e busca da felicidade autêntica.',
  },
  'filosofia-do-direito': {
    slug: 'filosofia-do-direito',
    titulo: 'Filosofia do Direito',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'G. W. F. Hegel / Sergio Cavalieri Filho',
    audioUrl: `${R2_BASE}/filosofia-do-direito/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/filosofia-do-direito/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Conceitos fundamentais da essência do Direito, moralidade, eticidade e Estado.',
  },
  'introducao-ao-estudo-do-direito': {
    slug: 'introducao-ao-estudo-do-direito',
    titulo: 'Introdução ao Estudo do Direito',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Tércio Sampaio Ferraz Jr.',
    audioUrl: `${R2_BASE}/introducao-ao-estudo-do-direito/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/introducao-ao-estudo-do-direito/audiobook-completo.srt`,
    duracaoFormatada: '~30 min',
    descricao: 'Zetética e dogmática jurídica, teoria da norma e fontes de validade do ordenamento.',
  },
  'justica': {
    slug: 'justica',
    titulo: 'Justiça: O que é fazer a coisa certa',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Michael J. Sandel',
    audioUrl: `${R2_BASE}/justica/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/justica/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Dilemas morais fundamentais: utilitarismo, libertarianismo, imperativo categórico e bem comum.',
  },
  'licoes-preliminares-de-direito': {
    slug: 'licoes-preliminares-de-direito',
    titulo: 'Lições Preliminares de Direito',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Miguel Reale',
    audioUrl: `${R2_BASE}/licoes-preliminares-de-direito/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/licoes-preliminares-de-direito/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'A Teoria Tridimensional do Direito (Fato, Valor e Norma) e metodologia jurídica.',
  },
  'o-advogado-do-diabo': {
    slug: 'o-advogado-do-diabo',
    titulo: 'O Advogado do Diabo',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Morris West',
    audioUrl: `${R2_BASE}/o-advogado-do-diabo/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-advogado-do-diabo/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Investigação forense rigorosa, dilemas de consciência, verdade material e santidade.',
  },
  'o-caso-dos-exploradores-de-cavernas': {
    slug: 'o-caso-dos-exploradores-de-cavernas',
    titulo: 'O Caso dos Exploradores de Cavernas',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Lon L. Fuller',
    audioUrl: `${R2_BASE}/o-caso-dos-exploradores-de-cavernas/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-caso-dos-exploradores-de-cavernas/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Julgamento simulado de Harvard confrontando Direito Natural, Positivismo e Realismo Jurídico.',
  },
  'o-caso-dos-irmaos-naves': {
    slug: 'o-caso-dos-irmaos-naves',
    titulo: 'O Caso dos Irmãos Naves',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'João Alamy Filho',
    audioUrl: `${R2_BASE}/o-caso-dos-irmaos-naves/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-caso-dos-irmaos-naves/audiobook-completo.srt`,
    duracaoFormatada: '~40 min',
    descricao: 'O maior erro judiciário da história brasileira e o papel inegociável do devido processo legal.',
  },
  'o-contrato-social': {
    slug: 'o-contrato-social',
    titulo: 'O Contrato Social',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Jean-Jacques Rousseau',
    audioUrl: `${R2_BASE}/o-contrato-social/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-contrato-social/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'Vontade geral, soberania popular, liberdade civil e a legitimidade do pacto político.',
  },
  'o-espirito-das-leis': {
    slug: 'o-espirito-das-leis',
    titulo: 'O Espírito das Leis',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Montesquieu',
    audioUrl: `${R2_BASE}/o-espirito-das-leis/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-espirito-das-leis/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'A teoria da separação dos poderes (Executivo, Legislativo e Judiciário) e freios e contrapesos.',
  },
  'o-futuro-da-democracia': {
    slug: 'o-futuro-da-democracia',
    titulo: 'O Futuro da Democracia',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Norberto Bobbio',
    audioUrl: `${R2_BASE}/o-futuro-da-democracia/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-futuro-da-democracia/audiobook-completo.srt`,
    duracaoFormatada: '~30 min',
    descricao: 'As promessas não cumpridas da democracia e os desafios da representação política.',
  },
  'o-leviata': {
    slug: 'o-leviata',
    titulo: 'O Leviatã',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Thomas Hobbes',
    audioUrl: `${R2_BASE}/o-leviata/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-leviata/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'Estado de natureza, contrato de submissão, segurança jurídica e a soberania do poder público.',
  },
  'o-monge-e-o-executivo': {
    slug: 'o-monge-e-o-executivo',
    titulo: 'O Monge e o Executivo',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'James C. Hunter',
    audioUrl: `${R2_BASE}/o-monge-e-o-executivo/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-monge-e-o-executivo/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Liderança servidora, inteligência emocional e construção de confiança e autoridade legítima.',
  },
  'o-mundo-assombrado-pelos-demonios': {
    slug: 'o-mundo-assombrado-pelos-demonios',
    titulo: 'O Mundo Assombrado pelos Demônios',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Carl Sagan',
    audioUrl: `${R2_BASE}/o-mundo-assombrado-pelos-demonios/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-mundo-assombrado-pelos-demonios/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'O método científico como vela no escuro, combate a pseudociências e pensamento crítico.',
  },
  'o-mundo-de-sofia': {
    slug: 'o-mundo-de-sofia',
    titulo: 'O Mundo de Sofia',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Jostein Gaarder',
    audioUrl: `${R2_BASE}/o-mundo-de-sofia/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-mundo-de-sofia/audiobook-completo.srt`,
    duracaoFormatada: '~50 min',
    descricao: 'Viagem panorâmica pelos 3.000 anos da história do pensamento filosófico ocidental.',
  },
  'o-principe': {
    slug: 'o-principe',
    titulo: 'O Príncipe',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Nicolau Maquiavel',
    audioUrl: `${R2_BASE}/o-principe/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-principe/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'Realismo político puro: virtù, fortuna e a conservação do poder no Estado moderno.',
  },
  'o-processo': {
    slug: 'o-processo',
    titulo: 'O Processo',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Franz Kafka',
    audioUrl: `${R2_BASE}/o-processo/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-processo/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'O pesadelo burocrático, a alienação do réu e a crítica contundente ao formalismo opressor.',
  },
  'o-que-e-direito': {
    slug: 'o-que-e-direito',
    titulo: 'O que é Direito',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Roberto Lyra Filho',
    audioUrl: `${R2_BASE}/o-que-e-direito/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-que-e-direito/audiobook-completo.srt`,
    duracaoFormatada: '~25 min',
    descricao: 'Dialética jurídica, crítica sociológica e a libertação do Direito das amarras meramente estatais.',
  },
  'o-ultimo-dia-de-um-condenado': {
    slug: 'o-ultimo-dia-de-um-condenado',
    titulo: 'O Último Dia de um Condenado',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Victor Hugo',
    audioUrl: `${R2_BASE}/o-ultimo-dia-de-um-condenado/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/o-ultimo-dia-de-um-condenado/audiobook-completo.srt`,
    duracaoFormatada: '~45 min',
    descricao: 'Manifesto visceral contra a pena de morte e a desumanização institucional no sistema carcerário.',
  },
  'os-7-habitos-das-pessoas-altamente-eficazes': {
    slug: 'os-7-habitos-das-pessoas-altamente-eficazes',
    titulo: 'Os 7 Hábitos das Pessoas Altamente Eficazes',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Stephen R. Covey',
    audioUrl: `${R2_BASE}/os-7-habitos-das-pessoas-altamente-eficazes/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/os-7-habitos-das-pessoas-altamente-eficazes/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Proatividade, foco no que importa, sinergia e liderança pessoal fundamentada em princípios.',
  },
  'sobre-a-liberdade': {
    slug: 'sobre-a-liberdade',
    titulo: 'Sobre a Liberdade',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'John Stuart Mill',
    audioUrl: `${R2_BASE}/sobre-a-liberdade/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/sobre-a-liberdade/audiobook-completo.srt`,
    duracaoFormatada: '~30 min',
    descricao: 'O princípio do dano, liberdade de expressão irrestrita e os limites do poder sobre o indivíduo.',
  },
  'teoria-pura-do-direito': {
    slug: 'teoria-pura-do-direito',
    titulo: 'Teoria Pura do Direito',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Hans Kelsen',
    audioUrl: `${R2_BASE}/teoria-pura-do-direito/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/teoria-pura-do-direito/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Pirâmide de Kelsen, norma fundamental hipotética e a depuração científica do positivismo.',
  },
  'vigiar-e-punir': {
    slug: 'vigiar-e-punir',
    titulo: 'Vigiar e Punir',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Michel Foucault',
    audioUrl: `${R2_BASE}/vigiar-e-punir/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/vigiar-e-punir/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'O Panóptico, a disciplina dos corpos, microfísica do poder e o surgimento da prisão moderna.',
  },
  'virando-a-propria-mesa': {
    slug: 'virando-a-propria-mesa',
    titulo: 'Virando a Própria Mesa',
    subtitulo: 'Diálogo Professora e Aluna',
    autor: 'Ricardo Semler',
    audioUrl: `${R2_BASE}/virando-a-propria-mesa/audiobook-completo.mp3`,
    srtUrl: `${R2_BASE}/virando-a-propria-mesa/audiobook-completo.srt`,
    duracaoFormatada: '~35 min',
    descricao: 'Gestão revolucionária, autonomia corporativa, transparência radical e quebra de dogmas empresariais.',
  },
};

/**
 * Mapeamento de IDs do catálogo (tanto slugs quanto livro-classico-XXX)
 * para a chave correspondente em AUDIOBOOKS_RESUMOS_MAP
 */
const ALIASES_CATALOGO: Record<string, string> = {
  // Slugs diretos
  '1984': '1984',
  'a-arte-da-guerra': 'a-arte-da-guerra',
  'a-era-dos-direitos': 'a-era-dos-direitos',
  'a-estrada-para-o-carater': 'a-estrada-para-o-carater',
  'a-luta-pelo-direito': 'a-luta-pelo-direito',
  'a-meta': 'a-meta',
  'a-republica': 'a-republica',
  'a-riqueza-das-nacoes': 'a-riqueza-das-nacoes',
  'a-teoria-das-formas-de-governo': 'a-teoria-das-formas-de-governo',
  'acesso-a-justica': 'acesso-a-justica',
  'admiravel-mundo-novo': 'admiravel-mundo-novo',
  'as-21-irrefutaveis-leis-da-lideranca': 'as-21-irrefutaveis-leis-da-lideranca',
  'blink': 'blink',
  'comece-pelo-porque': 'comece-pelo-porque',
  'como-as-democracias-morrem': 'como-as-democracias-morrem',
  'comunicacao-nao-violenta': 'comunicacao-nao-violenta',
  'dos-delitos-e-das-penas': 'dos-delitos-e-das-penas',
  'eles-os-juizes-vistos-por-nos-os-advogados': 'eles-os-juizes-vistos-por-nos-os-advogados',
  'etica-a-nicomaco': 'etica-a-nicomaco',
  'filosofia-do-direito': 'filosofia-do-direito',
  'introducao-ao-estudo-do-direito': 'introducao-ao-estudo-do-direito',
  'justica': 'justica',
  'justica-o-que-e-fazer-a-coisa-certa': 'justica',
  'licoes-preliminares-de-direito': 'licoes-preliminares-de-direito',
  'o-advogado-do-diabo': 'o-advogado-do-diabo',
  'o-caso-dos-exploradores-de-cavernas': 'o-caso-dos-exploradores-de-cavernas',
  'o-caso-dos-irmaos-naves': 'o-caso-dos-irmaos-naves',
  'o-contrato-social': 'o-contrato-social',
  'o-espirito-das-leis': 'o-espirito-das-leis',
  'o-futuro-da-democracia': 'o-futuro-da-democracia',
  'o-leviata': 'o-leviata',
  'o-monge-e-o-executivo': 'o-monge-e-o-executivo',
  'o-mundo-assombrado-pelos-demonios': 'o-mundo-assombrado-pelos-demonios',
  'o-mundo-de-sofia': 'o-mundo-de-sofia',
  'o-principe': 'o-principe',
  'o-processo': 'o-processo',
  'o-que-e-direito': 'o-que-e-direito',
  'o-ultimo-dia-de-um-condenado': 'o-ultimo-dia-de-um-condenado',
  'os-7-habitos-das-pessoas-altamente-eficazes': 'os-7-habitos-das-pessoas-altamente-eficazes',
  'sobre-a-liberdade': 'sobre-a-liberdade',
  'teoria-pura-do-direito': 'teoria-pura-do-direito',
  'vigiar-e-punir': 'vigiar-e-punir',
  'virando-a-propria-mesa': 'virando-a-propria-mesa',

  // IDs clássicos (tabelas e em breve)
  'livro-classico-122': 'justica',
  'livro-classico-124': 'o-monge-e-o-executivo',
  'livro-classico-125': 'a-arte-da-guerra',
  'livro-classico-126': 'o-leviata',
  'livro-classico-127': 'o-que-e-direito',
  'livro-classico-128': 'acesso-a-justica',
  'livro-classico-129': 'o-contrato-social',
  'livro-classico-130': 'o-espirito-das-leis',
  'livro-classico-131': '1984',
  'livro-classico-132': 'o-advogado-do-diabo',
  'livro-classico-133': 'a-luta-pelo-direito',
  'livro-classico-134': 'o-ultimo-dia-de-um-condenado',
  'livro-classico-135': 'como-as-democracias-morrem',
  'livro-classico-136': 'o-processo',
  'livro-classico-137': 'o-mundo-assombrado-pelos-demonios',
  'livro-classico-138': 'sobre-a-liberdade',
  'livro-classico-139': 'a-republica',
  'livro-classico-140': 'o-principe',
  'livro-classico-141': 'etica-a-nicomaco',
  'livro-classico-142': 'eles-os-juizes-vistos-por-nos-os-advogados',
  'livro-classico-143': 'virando-a-propria-mesa',
  'livro-classico-144': 'teoria-pura-do-direito',
  'livro-classico-145': 'vigiar-e-punir',
  'livro-classico-146': 'a-meta',
  'livro-classico-147': 'introducao-ao-estudo-do-direito',
  'livro-classico-148': 'a-era-dos-direitos',
  'livro-classico-149': 'o-mundo-de-sofia',
  'livro-classico-150': 'a-riqueza-das-nacoes',
  'livro-classico-151': 'a-teoria-das-formas-de-governo',
  'livro-classico-153': 'licoes-preliminares-de-direito',
  'livro-classico-154': 'o-futuro-da-democracia',
  'livro-classico-155': 'filosofia-do-direito',
};

function normalizeString(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Retorna as informações do Resumo em Áudio de um livro se disponível
 */
export function getResumoForLivro(livro: { id?: string; titulo?: string } | null | undefined): AudiobookResumoInfo | null {
  if (!livro) return null;

  // 1. Busca por ID direto no alias
  if (livro.id && ALIASES_CATALOGO[livro.id]) {
    const slug = ALIASES_CATALOGO[livro.id];
    if (AUDIOBOOKS_RESUMOS_MAP[slug]) {
      return AUDIOBOOKS_RESUMOS_MAP[slug];
    }
  }

  // 2. Busca por slug direto no mapa
  if (livro.id && AUDIOBOOKS_RESUMOS_MAP[livro.id]) {
    return AUDIOBOOKS_RESUMOS_MAP[livro.id];
  }

  // 3. Busca por similaridade de título normalizado
  if (livro.titulo) {
    const tNorm = normalizeString(livro.titulo);
    for (const [slug, info] of Object.entries(AUDIOBOOKS_RESUMOS_MAP)) {
      const iNorm = normalizeString(info.titulo);
      if (tNorm === iNorm || tNorm.includes(iNorm) || iNorm.includes(tNorm)) {
        return info;
      }
    }
  }

  return null;
}

/**
 * Checa se o livro tem resumo em áudio disponível no Cloudflare R2
 */
export function hasResumoDisponivel(livro: { id?: string; titulo?: string } | null | undefined): boolean {
  return !!getResumoForLivro(livro);
}

/**
 * Converte um livro para uma estrutura AudiobookLivro virtual pronta para tocar
 * o Resumo em Áudio contínuo com legendas sincronizadas SRT no Player Modal
 */
export function criarLivroPlayerResumo(livro: AudiobookLivro): AudiobookLivro {
  const resumo = getResumoForLivro(livro);
  const audioUrl = resumo?.audioUrl || livro.resumoAudioUrl || '';
  const srtUrl = resumo?.srtUrl || livro.resumoSrtUrl;

  return {
    ...livro,
    id: `${livro.id}-resumo`,
    titulo: `${livro.titulo}`,
    subtitulo: 'Resumo em Diálogo • Professora e Aluna',
    status: 'disponivel',
    totalCapitulos: 1,
    duracaoTotalFormatada: resumo?.duracaoFormatada || 'Resumo',
    capitulos: [
      {
        numero: 1,
        id: `${livro.id}-resumo-dialogo`,
        titulo: 'Resumo Completo (Diálogo Professora & Aluna)',
        autor: resumo?.autor || livro.autor,
        descricao: resumo?.descricao || `Resumo pedagógico e aprofundado da obra ${livro.titulo}.`,
        duracaoSegundos: 2400,
        duracaoFormatada: resumo?.duracaoFormatada || '~35 min',
        audioUrl,
        srtUrl,
        cues: [],
        imagens: livro.capitulos?.[0]?.imagens || [],
      },
    ],
  };
}
