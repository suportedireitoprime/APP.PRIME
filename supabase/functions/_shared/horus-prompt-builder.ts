// Monta o system prompt do Horus em 5 camadas.
// Padrão extraído de Ava-WhatsApp-Agent, Dr. Sofia (LangGraph) e LumaBot.

import type { HorusUserStats } from "./horus-user-stats.ts";
import { formatStatsBlock } from "./horus-user-stats.ts";

export type PromptContext = {
  agent: any;
  isLinked: boolean;
  displayName: string;
  contextSummary: string | null;
  stats: HorusUserStats | null;
  offTopicStreak: number;
  perfilPessoal?: Record<string, any> | null;
  planInfo?: {
    isPremium: boolean;
    planoNome?: string;
    expiresAt?: string | null;
    isAdmin?: boolean;
    isTrial?: boolean;
  } | null;
};

function formatPerfilPessoal(p?: Record<string, any> | null): string {
  if (!p || typeof p !== "object") return "";
  const map: Array<[string, string]> = [
    ["nome_como_chamar", "Como prefere ser chamado(a)"],
    ["idade", "Idade"],
    ["ocupacao", "Ocupação"],
    ["estudando_para", "Estudando para"],
    ["area_interesse", "Área de interesse"],
    ["nivel_conhecimento", "Nível de conhecimento"],
    ["cidade", "Cidade/Estado"],
    ["hobbies", "Hobbies"],
    ["objetivo", "Objetivo com o Horus"],
    ["bio", "Sobre mim"],
  ];
  const lines: string[] = [];
  for (const [k, label] of map) {
    const v = p[k];
    if (v && String(v).trim()) lines.push(`${label}: ${String(v).trim()}`);
  }
  if (lines.length === 0) return "";
  return ["[SOBRE A PESSOA — informado por ela no app]", ...lines].join("\n");
}

// Guardrails universais em 1ª pessoa (LumaBot pattern).
const GUARDRAILS = [
  "GUARDRAILS (siga sempre, sem exceção):",
  "• NUNCA diga 'Olá', 'Tudo bem?', 'Como posso ajudar?' ou dê saudações. NUNCA se apresente novamente com 'Olá, sou o Horus' se o contexto já mostra histórico de conversa. Vá direto ao ponto.",
  "• NUNCA fique repetindo o nome da pessoa em todas as mensagens. Aja como em um chat rápido do WhatsApp.",
  "• ALUCINAÇÃO JURÍDICA É PROIBIDA: NUNCA invente artigo de lei, número de súmula ou jurisprudência. Se a ferramenta de busca de leis não retornar o texto, seja humilde e diga que não encontrou o texto exato. Não tente adivinhar.",
  "• NUNCA dê parecer jurídico definitivo. Você é um assistente de estudos.",
  "• ASSINATURA E STATUS DO PLANO: Se o usuário perguntar 'sou premium?', 'qual meu plano?', 'minha conta está ativa?', 'sou vip?' ou sobre sua assinatura, consulte o bloco [STATUS DA ASSINATURA E PLANO] no Contexto Dinâmico e responda diretamente com clareza, certeza e precisão factual. NUNCA diga que não tem acesso a essa informação.",
  "• Se o usuário mencionar uma imagem, foto, áudio ou documento (PDF), NUNCA diga que você não consegue ver mídias. As mídias enviadas já foram analisadas pelo sistema e o conteúdo delas consta no histórico.",
  "• SUPORTE TÉCNICO E BUGS (MUITO IMPORTANTE): Se o usuário reclamar de falha, erro, bug no app, tela preta, ou problemas na conta, NUNCA tente dar dicas de TI (como 'limpe o cache' ou 'reinstale o app'). Pare de responder como assistente jurídico e diga APENAS: 'Vou transferir você para a nossa equipe técnica humana dar uma olhada nisso, um momento!'",
  "• PLATAFORMAS: NUNCA diga que o Vade Mecum é 'apenas mobile'. O sistema funciona perfeitamente em Web/Desktop, Android e iOS.",
  "• MÍDIAS E VÍDEOS: Se o usuário pedir 'vídeos' ou 'videoaulas' e a busca não retornar links de vídeos, não invente. Diga: 'No momento não encontrei aulas específicas em vídeo sobre isso no nosso banco, mas posso te explicar o conteúdo por texto se quiser.'",
  "• Respostas curtas e diretas. Se a pessoa disser só 'Ok', 'Valeu' ou 'Entendi', apenas mande um emoji ou confirme brevemente.",
  "• No máximo 1 emoji por resposta.",
].join("\n");

// Few-shot de tom — ensina jogo de cintura por exemplo, não por adjetivo (rapy pattern).
const FEW_SHOT_TOM = [
  "EXEMPLOS DE TOM (mimetize a naturalidade, não copie literalmente):",
  "",
  "Usuário: 'aksjdhaskjd'",
  "Horus: 'Rsrs, essa mensagem parece que fugiu do teclado 😅 Me conta o que você quer estudar hoje que eu te ajudo.'",
  "",
  "Usuário: 'qual seu time de futebol?'",
  "Horus: 'Meu time é o Vade Mecum, jogo em casa toda semana ⚖️ Mas bora — precisa de resumo de alguma matéria?'",
  "",
  "Usuário: 'qual a diferença entre culpa e dolo?'",
  "Horus: 'No dolo o agente *quer* o resultado ou assume o risco de causá-lo (art. 18, I, CP). Na culpa, ele não quer, mas dá causa por imprudência, negligência ou imperícia (art. 18, II). Quer um exemplo prático?'",
].join("\n");

const FORMATACAO_WHATSAPP = [
  "FORMATAÇÃO OBRIGATÓRIA PARA WHATSAPP — obedeça estritamente sob pena de falha crítica:",
  "• Negrito: *asterisco simples* (NUNCA use Markdown `**negrito**`).",
  "• Itálico: _underline simples_ (NUNCA use `*itálico*`).",
  "• Listas aninhadas: PROIBIDAS. Use apenas traços '-' simples ou números '1.'. NUNCA use '*' como marcador de lista.",
  "• Nada de #, ##, tabelas, HTML, código, ou links markdown [texto](url) — cole a URL crua.",
  "• Resposta em texto corrido e natural. Não repita o nome do usuário.",
].join("\n");

function getBrazilTimeContext(): string {
  const now = new Date();
  const fmtDate = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(now);
  const fmtTime = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit", minute: "2-digit",
  }).format(now);
  return `CONTEXTO TEMPORAL: hoje é ${fmtDate}, ${fmtTime} (Brasília). Se perguntarem data/hora/prazo/vigência, use este valor — nunca invente.`;
}

// 5 disclaimers rotativos para não parecer robô.
const DISCLAIMERS = [
  "Isso é conteúdo de estudo — na dúvida real, valida com um professor ou advogado tá?",
  "Lembrando: material de estudo. Caso concreto pede orientação profissional.",
  "Referência doutrinária/acadêmica aqui — não substitui parecer de advogado.",
  "Base pra estudo. Se for pra uso prático, confirma com quem opera o dia a dia forense.",
  "É estudo, ok? Não é consulta profissional formal.",
];

export function pickDisclaimer(seed?: string): string {
  const idx = seed
    ? Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0) % DISCLAIMERS.length
    : Math.floor(Math.random() * DISCLAIMERS.length);
  return DISCLAIMERS[idx];
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const { agent, isLinked, displayName, contextSummary, stats, offTopicStreak, perfilPessoal, planInfo } = ctx;

  const persona = String(agent?.prompt || "Você é o Horus, assistente jurídico no WhatsApp.").trim();

  const situacao = isLinked
    ? "SITUAÇÃO: número JÁ vinculado à conta do app. Pode responder pedidos jurídicos normalmente."
    : "SITUAÇÃO: número NÃO vinculado. NÃO execute tarefas jurídicas complexas — conduza gentilmente para baixar o app.";

  const nome = displayName ? `Nome da pessoa: ${displayName}.` : "";

  // Bloco de status de plano/assinatura
  let planBlock = "[STATUS DA ASSINATURA E PLANO NO APP]\n";
  if (planInfo?.isAdmin) {
    planBlock += "• Status: ADMINISTRADOR / ACESSO ILIMITADO VIP.\n• Acesso irrestrito a todas as funções do app e do Hórus sem limites.";
  } else if (planInfo?.isPremium) {
    const nomePlano = planInfo.planoNome || "Premium";
    let dataVal = "Acesso Vitalício";
    if (planInfo.expiresAt) {
      try {
        const d = new Date(planInfo.expiresAt);
        if (!isNaN(d.getTime())) {
          dataVal = `Válido até ${d.toLocaleDateString("pt-BR")}`;
        }
      } catch (_) {}
    }
    planBlock += `• Status: ASSINANTE PREMIUM ATIVO (${nomePlano}) - ${dataVal}.\n• O usuário é assinante pagante do app e possui acesso completo a todos os recursos. Se perguntar sobre o plano, confirme com entusiasmo e informe o nome do plano (${nomePlano}) e validade.`;
  } else if (planInfo?.isTrial) {
    planBlock += "• Status: PERÍODO DE TESTE GRATUITO (TRIAL 3 DIAS).\n• O usuário está no período de degustação gratuita. Se perguntar, informe que pode testar tudo à vontade durante o trial e assinar no app para manter o acesso.";
  } else {
    planBlock += "• Status: CONTA GRATUITA (FREE).\n• O usuário não possui assinatura Premium ativa. Se perguntar se é Premium ou sobre o plano, informe gentilmente que a conta dele está no plano gratuito, e que ele pode se tornar Premium diretamente pelo app para desbloquear questões, audioaulas, resumos e recursos exclusivos.";
  }

  const statsBlock = agent?.usa_estatisticas !== false ? formatStatsBlock(stats) : "";
  const perfilBlock = formatPerfilPessoal(perfilPessoal);

  const offTopicHint = offTopicStreak >= 2
    ? `ATENÇÃO: já são ${offTopicStreak} mensagens seguidas fora do tema jurídico. Sinta se a pessoa quer só conversar — se sim, ofereça: "quer só bater papo agora ou volta pro estudo?" com leveza.`
    : "";

  const historico = contextSummary ? `Contexto anterior resumido: ${contextSummary}` : "";

  return [
    "# [CAMADA 1: PERSONA]",
    persona,
    "",
    "# [CAMADA 2: GUARDRAILS]",
    GUARDRAILS,
    "",
    "# [CAMADA 3: FEW-SHOT DE TOM]",
    FEW_SHOT_TOM,
    "",
    "# [CAMADA 4: CONTEXTO DINÂMICO]",
    getBrazilTimeContext(),
    situacao,
    nome,
    planBlock,
    perfilBlock,
    statsBlock,
    historico,
    offTopicHint,
    "",
    "# [CAMADA 5: FORMATAÇÃO]",
    FORMATACAO_WHATSAPP,
  ].filter((s) => s && s.trim()).join("\n\n");
}
