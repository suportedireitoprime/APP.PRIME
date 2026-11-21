export interface QuizAlt {
  k: 'A' | 'B' | 'C' | 'D';
  t: string;
  ok: boolean;
  c: string;
}

export interface QuizQuestion {
  enunciado: string;
  alts: QuizAlt[];
}

export const QUIZ: QuizQuestion = {
  enunciado:
    'Amanda e Fernando, com unidade de desígnios, adentraram em supermercado, no qual passaram a esconder, em suas vestes e bolsas, diversos produtos, avaliados em cerca de R$ 2.000,00 (dois mil reais), com o objetivo de furtá-los. Todavia, a ação foi acompanhada pelo sistema de monitoramento de câmeras do supermercado, tendo os seguranças realizado a abordagem dos agentes ainda no interior do estabelecimento, antes, portanto, de conseguirem deixar o local com os produtos escondidos. Diante da situação narrada, a defesa técnica de Amanda e Fernando deverá sustentar, em razão da atipicidade material, que ocorreu',
  alts: [
    {
      k: 'A',
      t: 'tentativa de furto, pois não houve a consumação por circunstâncias alheias à vontade dos agentes.',
      ok: true,
      c: 'É o gabarito oficial. Execução iniciada e consumação impedida por circunstâncias alheias à vontade: art. 14, II, do CP.',
    },
    {
      k: 'B',
      t: 'crime impossível, em razão da ineficácia absoluta do meio empregado pelos agentes.',
      ok: false,
      c: 'O meio (esconder nas vestes e bolsas) era idôneo; quem impediu o resultado foi a vigilância humana e eletrônica, não a ineficácia do meio.',
    },
    {
      k: 'C',
      t: 'crime impossível, em razão da impropriedade absoluta do objeto material.',
      ok: false,
      c: 'Os produtos eram reais e apropriáveis. E a Súmula 567 do STJ afasta peremptoriamente o crime impossível por vigilância eletrônica.',
    },
    {
      k: 'D',
      t: 'desistência voluntária, respondendo os agentes apenas pelos atos até então praticados.',
      ok: false,
      c: 'Eles não desistiram: foram contidos pelos seguranças. Sem voluntariedade do agente, não se aplica o art. 15 do CP.',
    },
  ],
};

export interface ExplainSegment {
  panel: number;
  audio: string;
  title: string;
  text: string;
  base: string;
}

export const EXPLAIN: ExplainSegment[] = [
  {
    panel: 4,
    audio: 'e01-explica.mp3',
    title: 'Lance 1 — A execução começou',
    text: 'Esconder as mercadorias nas vestes e nas bolsas já é ato de execução do furto (art. 155, caput). A demarcação do Telestrator circula a bolsa: é aqui que o iter criminis sai da fase preparatória impunível e entra na execução.',
    base: 'CP, art. 155, caput — subtrair coisa alheia móvel.',
  },
  {
    panel: 15,
    audio: 'e02-explica.mp3',
    title: 'Lance 2 — Faltou a consumação',
    text: 'Ninguém atravessou a porta com a posse mansa e pacífica das mercadorias. Sem a inversão tranquila da posse, fora da esfera de vigilância imediata da vítima, o furto não se consuma.',
    base: 'Consumação do furto: teoria da apprehensio / amotio (posse mansa e pacífica).',
  },
  {
    panel: 9,
    audio: 'e03-explica.mp3',
    title: 'Lance 3 — Circunstância alheia à vontade',
    text: 'Quem interrompeu o caminho do crime foi a abordagem dos seguranças, ainda dentro do supermercado. Interrupção externa e involuntária: é a marca inconfundível da tentativa.',
    base: 'CP, art. 14, II — tentativa: não consumação por circunstâncias alheias à vontade do agente.',
  },
  {
    panel: 6,
    audio: 'e04-explica.mp3',
    title: 'Lance 4 — Câmera não gera crime impossível',
    text: 'A câmera apenas vigiava; meio e objeto eram absolutamente próprios. Por isso não há crime impossível (art. 17): é a aplicação exata da Súmula 567 do STJ.',
    base: 'CP, art. 17 e Súmula 567 do STJ.',
  },
];

export interface CounterfactualScenario {
  q: string;
  r: string;
}

export const ESE: CounterfactualScenario[] = [
  {
    q: 'E se Amanda e Fernando tivessem saído da loja e se afastado com tranquilidade, sem perseguição imediata?',
    r: '<b>Furto consumado.</b> Com a posse mansa e pacífica da coisa, ainda que breve, o crime do art. 155 se consuma plenamente — deixando de ser tentativa.',
  },
  {
    q: 'E se, no meio do caminho, eles tivessem desistido por vontade própria e devolvido tudo às prateleiras?',
    r: '<b>Desistência voluntária (art. 15 do CP).</b> Quem desiste voluntariamente de prosseguir na execução responde apenas pelos atos já praticados — a tentativa não é punida.',
  },
  {
    q: 'E se os “produtos” fossem réplicas cenográficas de isopor, sem valor algum, postas só para vitrine?',
    r: '<b>Crime impossível (art. 17 do CP).</b> Objeto absolutamente impróprio: conduta materialmente atípica, pois o bem jurídico patrimônio jamais esteve em risco.',
  },
];

export interface StudyCard {
  t: string;
  p: string;
}

export const STUDY: StudyCard[] = [
  {
    t: 'Art. 155, caput — Furto',
    p: 'Subtrair, para si ou para outrem, coisa alheia móvel. Pena: reclusão de 1 a 4 anos e multa. Esconder a mercadoria para levar já inicia os atos executórios.',
  },
  {
    t: 'Art. 14, II — Tentativa',
    p: 'Diz-se o crime tentado quando, iniciada a execução, não se consuma por circunstâncias alheias à vontade do agente. É o gabarito oficial (Alternativa A).',
  },
  {
    t: 'Art. 17 — Crime Impossível',
    p: 'Não se pune a tentativa quando, por ineficácia absoluta do meio ou por absoluta impropriedade do objeto, é impossível consumar-se o crime. Monitoramento de câmeras não torna o meio ineficaz.',
  },
  {
    t: 'Súmula 567 — STJ',
    p: '“Sistema de vigilância realizado por monitoramento eletrônico ou por existência de segurança no interior de estabelecimento comercial, por si só, não torna impossível a configuração do crime de furto.”',
  },
  {
    t: 'Não Confunda',
    p: 'Tentativa × desistência voluntária: na tentativa, o agente é interrompido por um obstáculo externo; na desistência voluntária (art. 15), o agente para por deliberação própria.',
  },
];

export interface LegalCard {
  seg: number;
  t: string;
  p: string;
}

export const LEGALCARDS: LegalCard[] = [
  {
    seg: 0,
    t: 'Base Legal · Art. 155, caput — Código Penal',
    p: '“Subtrair, para si ou para outrem, coisa alheia móvel.” Esconder as mercadorias nas vestes e nas bolsas já é ato de execução do furto — Lance 1 demarcado pelo Telestrator.',
  },
  {
    seg: 1,
    t: 'Por que não consumou?',
    p: 'Faltou a posse mansa e pacífica da coisa fora da vigilância imediata: ninguém atravessou a porta com as mercadorias. Sem inversão da posse, não há consumação — Lance 2.',
  },
  {
    seg: 2,
    t: 'Base Legal · Art. 14, II — Código Penal',
    p: 'Tentativa: iniciada a execução, o crime não se consuma por circunstâncias alheias à vontade do agente. Quem interrompeu foi a abordagem dos seguranças dentro da loja — Lance 3.',
  },
  {
    seg: 3,
    t: 'Base Legal · Art. 17 — Código Penal',
    p: 'Crime impossível só existe quando o meio é absolutamente ineficaz ou o objeto absolutamente impróprio. Aqui o meio era idôneo e os produtos reais — Lance 4.',
  },
  {
    seg: 3,
    t: 'Súmula 567 — STJ',
    p: '“Sistema de vigilância realizado por monitoramento eletrônico ou por existência de segurança no interior de estabelecimento comercial, por si só, não torna impossível a configuração do crime de furto.”',
  },
];
