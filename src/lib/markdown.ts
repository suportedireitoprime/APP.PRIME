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

  return text;
}
