// Remove emojis/pictogramas do texto — o app usa apenas ícones SVG.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

export function removerEmojis(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .replace(EMOJI_RE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/(^|\n)([>\-*]?\s*)\s+/g, '$1$2')
    .trimEnd();
}
