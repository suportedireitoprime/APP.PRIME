// Classificador de intenção rápido e heurístico do Horus (0ms).
// Elimina latência síncrona de LLM antes da resposta do WhatsApp.

export type Intent =
  | "duvida_juridica"
  | "duvida_app"
  | "bate_papo"
  | "fora_escopo"
  | "ininteligivel"
  | "suporte";

export type ClassificationResult = {
  intent: Intent;
  confidence: number;
  redirect: boolean;
  raw?: unknown;
};

/**
 * Classificação instantânea baseada em heurísticas e padrões léxicos (0ms de rede).
 */
export function classifyIntentFast(message: string): ClassificationResult {
  const text = (message || "").trim().toLowerCase();
  if (!text || text.length < 2) {
    return { intent: "ininteligivel", confidence: 0.95, redirect: true };
  }

  // Teclado batido ou caracteres repetidos: "asdasd", "kkk", "???", "..."
  if (/^([a-z0-9])\1{3,}$/i.test(text) || /^[^a-zA-Z0-9áéíóúâêîôûãõç\s]+$/.test(text)) {
    return { intent: "ininteligivel", confidence: 0.9, redirect: true };
  }

  // 1. Suporte urgente / Reclamação
  if (/\b(suporte|reclamação|reclamacao|problema|bug|travou|não funciona|nao funciona|não consigo|nao consigo|deu erro|está com erro|falha)\b/i.test(text)) {
    return { intent: "suporte", confidence: 0.9, redirect: false };
  }

  // 2. Dúvida sobre o App / Assinatura
  if (/\b(app|aplicativo|vade mecum|assinatura|assinar|plano|preço|preco|valor|quanto custa|mensalidade|anual|cupom|login|senha|recuperar conta|pro|premium)\b/i.test(text)) {
    return { intent: "duvida_app", confidence: 0.88, redirect: false };
  }

  // 3. Cumprimentos, Small Talk e Bate-papo
  if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|e aí|e ai|fala|opa|salve|tudo bem|como vai|beleza|blz|valeu|obrigado|obrigada|tks|show|top|legal|perfeito|quem é você|quem e voce|qual seu nome|você é ia|voce e robo)\b/i.test(text)) {
    return { intent: "bate_papo", confidence: 0.95, redirect: false };
  }

  // 4. Fora de escopo óbvio (culinária, futebol, medicina, etc.)
  if (/\b(receita de bolo|escalação do|jogo do flamengo|fórmula 1|remédio para|posologia|sintoma de gripe|piada)\b/i.test(text)) {
    return { intent: "fora_escopo", confidence: 0.85, redirect: true };
  }

  // 5. Dúvida jurídica (padrão principal do Horus)
  if (/\b(lei|artigo|art\b|código|codigo|cp\b|cc\b|cf\b|cpc\b|clt\b|cpp\b|stf|stj|oab|concurso|pena|crime|prisão|habeas corpus|usucapião|dano moral|recurso|prazo|prescrição|decadência|audiência|júri|jurisprudência|doutrina|constituição|trabalhista|tributário|civil|penal|administrativo|previdenciário)\b/i.test(text)) {
    return { intent: "duvida_juridica", confidence: 0.95, redirect: false };
  }

  // Padrão padrão para o assistente Horus: dúvida jurídica
  return { intent: "duvida_juridica", confidence: 0.75, redirect: false };
}

/**
 * Classifica a intenção sem bloquear a resposta do WhatsApp.
 * Retorna em 0ms usando o motor heurístico.
 */
export async function classifyIntent(message: string): Promise<ClassificationResult> {
  return classifyIntentFast(message);
}

// Decide se a intenção é "off-topic" para efeito de tracking de streak.
export function isOffTopic(intent: Intent): boolean {
  return intent === "bate_papo" || intent === "fora_escopo" || intent === "ininteligivel";
}
