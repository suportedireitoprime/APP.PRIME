/**
 * Normaliza markdown gerado por IA para corrigir asteriscos desbalanceados
 * e outros padrões comuns que fazem o ReactMarkdown renderizar texto cru.
 *
 * Regras aplicadas:
 * - ***palavra**  → **palavra**
 * - **palavra***  → **palavra**
 * - ***palavra*** → **palavra**
 * - ** palavra ** → **palavra**
 * - * palavra *   → *palavra*
 * - **palavra*    → **palavra**
 * - *palavra**    → *palavra*
 */
export function normalizarMarkdown(md: string): string {
  if (!md) return '';

  let text = md;

  // Remove espaços dentro dos marcadores — SOMENTE quando o "**" de abertura
  // não está grudado numa palavra (senão "**razão** e nos **direitos**" seria
  // interpretado como um único par e viraria "razão**e nos**direitos").
  text = text.replace(/(^|[\s([{"'—–-])\*\*\s+([^*\n]+?)\s+\*\*(?![\w])/g, '$1**$2**');
  text = text.replace(/(^|[\s([{"'—–-])\*\s+([^*\n]+?)\s+\*(?![\w*])/g, '$1*$2*');

  // Normaliza 3+ asteriscos de abertura seguidos de 2+ de fechamento: ***word** → **word**
  text = text.replace(/\*{3,}([^*\n]+?)\*{2,}/g, '**$1**');

  // Corrige negrito desbalanceado: **word* → **word** (abertura precisa ser válida)
  text = text.replace(/(^|[^\w*])\*\*([^*\n]+?)\*(?!\*)/g, '$1**$2**');

  // Corrige itálico desbalanceado: *word** → *word*
  text = text.replace(/(^|[^\w*])\*([^*\n]+?)\*\*(?!\*)/g, '$1*$2*');


  // Garante que listas com negrito mantenham o espaço: * **word** → * **word**
  text = text.replace(/^(\*\s+)\*\*([^:\n]+?):\*\*/gm, '$1**$2:**');

  // Garante que blocos de código com crases ímpares sejam devidamente fechados
  const backtickMatches = text.match(/```/g);
  if (backtickMatches && backtickMatches.length % 2 !== 0) {
    text = text.trimEnd() + '\n```';
  }

  return text;
}

/**
 * Remove tags de instrução entre colchetes geradas nas planilhas/prompts,
 * como [ATO I — FUNDAMENTOS], [ATO II — APROFUNDAMENTO DOGMÁTICO], [Animação Visual: ...], etc.
 * Também remove títulos H1/H2 repetidos no topo do bloco.
 */
export function limparTextoInstrucoes(raw?: string): string {
  if (!raw) return '';
  let t = String(raw).trim();

  // Remove primeiro heading repetido no topo (ex: ## 11. O Momento Exato da Consumação)
  t = t.replace(/^#{1,3}\s*(?:\d+[-.)]\s*)?[^\n]+\n*/i, '').trim();

  // Remove meta tags entre colchetes
  const tagRegex = /\[\s*(?:ATO\b|CHECKPOINT\b|FLASHCARD\b|Animação\b|Transição\b|Efeito\b|Áudio\b|Locução\b|Destaque\b|Visual\b|Ação\b|Interatividade\b|Fluxo\s+Visual\b|Voltada\s+a\b)[^\]]*\]\s*/gi;
  t = t.replace(tagRegex, '').trim();

  return t;
}

/**
 * Limpa asteriscos soltos ou formatação markdown para títulos de cards ou cabeçalhos
 */
export function limparMarkdownInline(s?: string): string {
  if (!s) return '';
  return String(s)
    .replace(/^[*_#\s]+|[*_#\s]+$/g, '')
    .trim();
}
