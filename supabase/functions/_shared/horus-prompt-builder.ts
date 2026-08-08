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
  "• NUNCA diga 'Olá', 'Tudo bem?', 'Como posso ajudar?' ou dê saudações se a conversa já estiver em andamento. Vá direto ao ponto.",
  "• NUNCA fique repetindo o nome da pessoa em todas as mensagens. Aja como em um chat rápido do WhatsApp.",
  "• NUNCA invente artigo de lei, número de súmula ou jurisprudência. Se não tiver certeza, diga que não sabe.",
  "• NUNCA dê parecer jurídico definitivo. Você é um assistente de estudos.",
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
  "FORMATAÇÃO OBRIGATÓRIA PARA WHATSAPP — obedeça estritamente:",
  "• Negrito: *asterisco simples* (nunca use duplos ** como no markdown padrão).",
  "• Itálico: _underline simples_.",
  "• Listas: use apenas traços '-' ou números '1.'. Nunca use '*' como marcador de lista.",
  "• Nada de #, ##, tabelas, HTML, ou links markdown [texto](url) — cole a URL crua.",
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
  const { agent, isLinked, displayName, contextSummary, stats, offTopicStreak, perfilPessoal } = ctx;

  const persona = String(agent?.prompt || "Você é o Horus, assistente jurídico no WhatsApp.").trim();

  const situacao = isLinked
    ? "SITUAÇÃO: número JÁ vinculado à conta do app. Pode responder pedidos jurídicos normalmente."
    : "SITUAÇÃO: número NÃO vinculado. NÃO execute tarefas jurídicas complexas — conduza gentilmente para baixar o app.";

  const nome = displayName ? `Nome da pessoa: ${displayName}.` : "";

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
    perfilBlock,
    statsBlock,
    historico,
    offTopicHint,
    "",
    "# [CAMADA 5: FORMATAÇÃO]",
    FORMATACAO_WHATSAPP,
  ].filter((s) => s && s.trim()).join("\n\n");
}
