import { estDur } from '../narracao/narracaoData';

export interface SceneElement {
  id: string;
  label: string;
}

export const ELEMENTS: SceneElement[] = [
  { id: 'prateleiras', label: 'Prateleiras e corredores' },
  { id: 'bolsas', label: 'Bolsas com mercadorias — ± R$ 2.000' },
  { id: 'cameras', label: 'Câmeras e sala de monitoramento' },
  { id: 'segurancas', label: 'Seguranças do supermercado' },
  { id: 'porta', label: 'Porta de saída — ninguém atravessou' },
  { id: 'cesta', label: 'Cesta e caixas do mercado' },
];

export interface PanelConfig {
  placa: string;
  els: string[];
  audios: [string, string, string][]; // [fileName, speakerName, speechText]
  present?: [string, string]; // [title, description]
  cap?: [string, string]; // [who, text] for silent panels
  dur?: number;
}

export const PANELS: PanelConfig[] = [
  {
    placa: 'SUPERMERCADO — PLANO GERAL',
    els: [],
    audios: [
      ['p01-abertura.mp3', 'NARRADORA', 'Furto tentado no supermercado. Direito Penal. Exame quarenta e um, questão cinquenta e sete.'],
    ],
  },
  {
    placa: 'ENTRADA — CÂMERA BAIXA',
    els: ['cesta', 'porta'],
    audios: [
      ['p02-narr.mp3', 'NARRADORA', 'Amanda e Fernando entram juntos num supermercado, no meio da tarde, como clientes comuns.'],
      ['p02-amanda.mp3', 'AMANDA', 'Fernando, pega a cesta. A gente veio buscar bastante coisa hoje.'],
    ],
  },
  {
    placa: 'CORREDOR — VISTA DE CIMA',
    els: ['prateleiras'],
    audios: [
      ['p03-narr.mp3', 'NARRADORA', 'Pelos corredores, os dois olham as prateleiras e também olham para os lados, bem atentos.'],
      ['p03-fernando.mp3', 'FERNANDO', 'Calma, Amanda. Ninguém está olhando para a gente.'],
    ],
  },
  {
    placa: 'PRATELEIRA — OLHAR DA AMANDA',
    els: ['prateleiras', 'bolsas'],
    present: ['BOLSA COM MERCADORIAS', 'Produtos escondidos nas vestes e nas bolsas: cerca de R$ 2.000,00 — art. 155, caput, do CP.'],
    audios: [
      ['p04-narr.mp3', 'NARRADORA', 'Sem pagar nada, eles escondem mercadorias nas bolsas. Juntas, somam cerca de dois mil reais.'],
    ],
  },
  {
    placa: 'CLOSE — MÃOS NA BOLSA',
    els: ['bolsas'],
    audios: [],
    cap: ['DETALHE', 'Produtos escondidos nas bolsas: cerca de R$ 2.000,00.'],
    dur: 3.6,
  },
  {
    placa: 'CLOSE — FERNANDO NERVOSO',
    els: [],
    audios: [],
    cap: ['FERNANDO', '(nervoso, olhando para os lados)'],
    dur: 3.0,
  },
  {
    placa: 'CÂMERA DE SEGURANÇA — CCTV',
    els: ['cameras'],
    audios: [
      ['p05-narr.mp3', 'NARRADORA', 'Na sala de monitoramento, as câmeras mostram tudo, ao vivo, para a equipe de segurança.'],
      ['p05-operador.mp3', 'OPERADOR', 'Chefe, olha essa câmera. Os dois estão escondendo produto na bolsa.'],
    ],
  },
  {
    placa: 'MONITORAMENTO — SOBRE O OMBRO',
    els: ['cameras', 'segurancas'],
    audios: [
      ['p06-narr.mp3', 'NARRADORA', 'Os seguranças acompanham cada passo pelos monitores, sem perder os dois de vista.'],
      ['p06-chefe.mp3', 'SEG. CARLOS', 'Acompanha os dois. Não aborda ainda. Vamos esperar o movimento deles.'],
    ],
  },
  {
    placa: 'CORREDOR — PLANO LATERAL',
    els: ['segurancas', 'porta', 'bolsas'],
    audios: [
      ['p07-narr.mp3', 'NARRADORA', 'Ainda dentro do supermercado, antes da saída, os seguranças abordam Amanda e Fernando.'],
    ],
  },
  {
    placa: 'ABORDAGEM — SEGURANÇA IMPONENTE',
    els: ['segurancas', 'porta'],
    audios: [
      ['p07-chefe.mp3', 'SEG. CARLOS', 'Parados aí. Abram as bolsas, por favor. Vimos tudo pelas câmeras.'],
    ],
  },
  {
    placa: 'CLOSE — AMANDA SURPRESA',
    els: ['bolsas', 'porta'],
    audios: [
      ['p08-amanda.mp3', 'AMANDA', 'A gente ainda nem saiu da loja. Não levamos nada daqui.'],
      ['p08-fernando.mp3', 'FERNANDO', 'É verdade. A gente não passou nem pela porta de saída.'],
    ],
  },
  {
    placa: 'DETALHE — CRACHÁ E PRODUTOS',
    els: ['bolsas'],
    audios: [
      ['p09-narr.mp3', 'NARRADORA', 'Nenhuma mercadoria saiu do supermercado. Tudo foi recuperado ali dentro, na hora da abordagem.'],
      ['p09-advogada.mp3', 'DRA. LUÍSA', 'A defesa sustenta a tentativa. O furto começou, mas não chegou ao fim.'],
    ],
  },
  {
    placa: 'ABORDAGEM — PLANO GERAL',
    els: ['prateleiras', 'bolsas'],
    present: ['EXECUÇÃO INICIADA', 'Esconder a coisa para subtrair já é ato de execução do furto — art. 14, II, do CP.'],
    audios: [
      ['p10-narr.mp3', 'NARRADORA', 'No caminho do crime, a execução começou quando eles esconderam as mercadorias para levar.'],
    ],
  },
  {
    placa: 'SÚMULA 567 DO STJ',
    els: ['cameras'],
    present: ['SÚMULA 567 — STJ', 'Vigilância por monitoramento eletrônico, por si só, não torna impossível o crime de furto.'],
    audios: [
      ['p11-narr.mp3', 'NARRADORA', 'A súmula quinhentos e sessenta e sete do Superior Tribunal de Justiça trata exatamente deste caso.'],
    ],
  },
  {
    placa: 'VIGILÂNCIA × IMPOSSIBILIDADE',
    els: ['cameras'],
    audios: [
      ['p12-narr.mp3', 'NARRADORA', 'A vigilância por câmeras não torna o furto impossível. Ela só ajuda a impedir o resultado.'],
    ],
  },
  {
    placa: 'SAÍDA — O QUE FALTOU',
    els: ['porta'],
    present: ['O QUE FALTOU', 'Sair do estabelecimento com a posse mansa e pacífica da coisa, fora da vigilância imediata.'],
    audios: [
      ['p13-narr.mp3', 'NARRADORA', 'Para consumar, faltou sair da loja com a posse tranquila das mercadorias, longe da vigilância.'],
    ],
  },
  {
    placa: 'DESFECHO — O CARRINHO',
    els: ['segurancas', 'porta'],
    audios: [
      ['p14-narr.mp3', 'NARRADORA', 'Eles foram impedidos por um motivo fora da vontade deles. Agora, vamos à questão.'],
    ],
  },
];

export const NPANELS = PANELS.length;

export const CHAPTERS: string[] = [
  'Plano geral',
  'Entrada — câmera baixa',
  'Corredor — vista de cima',
  'POV da Amanda',
  'Close — as mãos',
  'Close — Fernando',
  'POV da câmera CCTV',
  'Sobre o ombro',
  'Plano lateral',
  'Abordagem — imponente',
  'Close — Amanda',
  'Detalhe — crachá',
  'Plano geral — abordagem',
  'Súmula 567',
  'Vigilância × impossibilidade',
  'A porta não cruzada',
  'Desfecho — o carrinho',
];

export function panelEst(p: number): number {
  const pn = PANELS[p];
  if (!pn || !pn.audios.length) return pn?.dur || 3.2;
  return pn.audios.reduce((s, a) => s + estDur(a[2]) + 0.35, 0);
}
