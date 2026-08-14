export type CharacterRole = 'juiz' | 'promotor' | 'defesa' | 'reu' | 'testemunha' | 'professor';

export interface GameScores {
  credibilidadeDefesa: number;
  forcaAcusacao: number;
  pacienciaJuiz: number;
  dominioTecnico: number;
}

export interface Choice {
  id: string;
  text: string;
  scoreImpact: Partial<GameScores>;
  nextPhase: string;
  feedback?: string;
}

export interface DialogueNode {
  speaker: CharacterRole;
  text: string;
}

export interface GamePhase {
  id: string;
  title: string;
  dialogues: DialogueNode[];
  choices?: Choice[];
  nextPhase?: string;
}

export const INITIAL_SCORES: GameScores = {
  credibilidadeDefesa: 50,
  forcaAcusacao: 50,
  pacienciaJuiz: 50,
  dominioTecnico: 50,
};

export const COURT_SCRIPT: Record<string, GamePhase> = {
  '1_abertura': {
    id: '1_abertura',
    title: 'Abertura da Sessão',
    dialogues: [
      { speaker: 'juiz', text: 'Declaro aberta a presente sessão de julgamento.' },
      { speaker: 'juiz', text: 'Hoje julgaremos Carlos Silva, acusado de subtrair um celular durante uma discussão em uma lanchonete.' },
      { speaker: 'juiz', text: 'Passo a palavra ao Ministério Público para as considerações iniciais.' },
    ],
    nextPhase: '2_acusacao',
  },
  '2_acusacao': {
    id: '2_acusacao',
    title: 'Acusação',
    dialogues: [
      { speaker: 'promotor', text: 'Excelência, a autoria e a materialidade estão demonstradas pelas imagens e pelo depoimento da vítima.' },
      { speaker: 'promotor', text: 'A acusação sustenta que houve grave ameaça, razão pela qual o fato deve ser tratado como roubo.' },
    ],
    nextPhase: '3_conversa_cliente',
  },
  '3_conversa_cliente': {
    id: '3_conversa_cliente',
    title: 'Conversa com o Cliente',
    dialogues: [
      { speaker: 'reu', text: 'Doutor, eu peguei o celular, mas não ameacei ninguém. Fui embora porque entrei em pânico.' },
      { speaker: 'defesa', text: 'Preciso separar a subtração da suposta grave ameaça. A tese pode mudar completamente a pena.' },
    ],
    nextPhase: '4_depoimento',
  },
  '4_depoimento': {
    id: '4_depoimento',
    title: 'Depoimento da Testemunha',
    dialogues: [
      { speaker: 'testemunha', text: 'Eu vi ele pegar o celular. Ele me olhou de um jeito agressivo, e eu achei que poderia me bater se gritasse.' },
      { speaker: 'juiz', text: 'A defesa deseja inquirir a testemunha?' },
    ],
    choices: [
      {
        id: 'pergunta_objetiva',
        text: 'Perguntar se houve ameaça verbal, gesto concreto ou arma visível',
        scoreImpact: { credibilidadeDefesa: 10, dominioTecnico: 10, forcaAcusacao: -10 },
        nextPhase: '5_objecao',
        feedback: 'Boa escolha. A pergunta separa medo subjetivo de grave ameaça juridicamente relevante.',
      },
      {
        id: 'contraditar',
        text: 'Contraditar a testemunha sem prova prévia',
        scoreImpact: { pacienciaJuiz: -20, credibilidadeDefesa: -10 },
        nextPhase: '5_objecao',
        feedback: 'Contraditar sem base concreta soa agressivo e enfraquece a defesa.',
      },
      {
        id: 'silencio',
        text: 'Não fazer perguntas neste momento',
        scoreImpact: { forcaAcusacao: 10, dominioTecnico: -10 },
        nextPhase: '5_objecao',
        feedback: 'O silêncio deixou intacta a narrativa da acusação sobre a ameaça.',
      },
    ],
  },
  '5_objecao': {
    id: '5_objecao',
    title: 'Objeção',
    dialogues: [
      { speaker: 'promotor', text: 'A senhora confirma que ficou apavorada com a arma escondida sob a camisa do acusado, correto?' },
    ],
    choices: [
      {
        id: 'objetar_indutiva',
        text: 'Objetar por pergunta indutiva e inclusão de fato não narrado',
        scoreImpact: { credibilidadeDefesa: 20, pacienciaJuiz: 10, dominioTecnico: 20 },
        nextPhase: '6_prova',
        feedback: 'Excelente. O promotor não pode inserir uma arma que a testemunha não mencionou espontaneamente.',
      },
      {
        id: 'nao_objetar',
        text: 'Não objetar e deixar a resposta seguir',
        scoreImpact: { forcaAcusacao: 20, credibilidadeDefesa: -10 },
        nextPhase: '6_prova',
        feedback: 'A ausência de objeção permitiu que a acusação reforçasse um fato novo sem controle.',
      },
    ],
  },
  '6_prova': {
    id: '6_prova',
    title: 'Prova Documental',
    dialogues: [
      { speaker: 'juiz', text: 'A defesa tem prova objetiva a apresentar sobre a dinâmica do fato?' },
    ],
    choices: [
      {
        id: 'prova_documental',
        text: 'Apresentar vídeo da câmera de segurança',
        scoreImpact: { forcaAcusacao: -30, credibilidadeDefesa: 20, dominioTecnico: 10 },
        nextPhase: '7_tese',
        feedback: 'Ótimo. Prova audiovisual ajuda a demonstrar ausência de violência ou ameaça concreta.',
      },
      {
        id: 'nenhuma_prova',
        text: 'Dispensar prova material e confiar apenas no interrogatório',
        scoreImpact: { forcaAcusacao: 10, credibilidadeDefesa: -10 },
        nextPhase: '7_tese',
        feedback: 'Sem prova objetiva, o juiz tende a dar mais peso ao depoimento da vítima e da testemunha.',
      },
    ],
  },
  '7_tese': {
    id: '7_tese',
    title: 'Tese Defensiva',
    dialogues: [
      { speaker: 'juiz', text: 'Encerrada a instrução. Defesa, apresente sua tese principal.' },
    ],
    choices: [
      {
        id: 'ausencia_dolo',
        text: 'Sustentar ausência de dolo e atipicidade total',
        scoreImpact: { pacienciaJuiz: -20, dominioTecnico: -10 },
        nextPhase: '8_alegacoes',
        feedback: 'Tese fraca para o caso: a subtração foi admitida e registrada em vídeo.',
      },
      {
        id: 'insuficiencia_probatoria',
        text: 'Pedir desclassificação para furto por falta de prova da grave ameaça',
        scoreImpact: { credibilidadeDefesa: 20, dominioTecnico: 20, forcaAcusacao: -20 },
        nextPhase: '8_alegacoes',
        feedback: 'Tese tecnicamente adequada. Você atacou o ponto que diferencia furto de roubo.',
      },
    ],
  },
  '8_alegacoes': {
    id: '8_alegacoes',
    title: 'Alegações Finais',
    dialogues: [
      { speaker: 'defesa', text: 'Excelência, a prova demonstra subtração, mas não demonstra grave ameaça. A defesa requer a desclassificação.' },
      { speaker: 'promotor', text: 'O Ministério Público mantém o pedido condenatório nos termos da denúncia.' },
    ],
    nextPhase: '9_sentenca',
  },
  '9_sentenca': {
    id: '9_sentenca',
    title: 'Sentença',
    dialogues: [
      { speaker: 'juiz', text: 'Analisando os autos, as provas e a atuação das partes em audiência...' },
    ],
    nextPhase: '10_feedback',
  },
  '10_feedback': {
    id: '10_feedback',
    title: 'Avaliação Final',
    dialogues: [
      { speaker: 'professor', text: 'Encerrada a simulação. Agora vamos avaliar a qualidade técnica das suas escolhas.' },
    ],
  },
};
