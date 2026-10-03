// Remove emojis/pictogramas do texto — o app usa apenas ícones SVG.
const EMOJI_RE =
  /(?:[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{E0020}-\u{E007F}]|\u{FE0F}|\u{200D}|\u{20E3})/gu;

export function removerEmojis(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .replace(EMOJI_RE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/^[ \t]+(?=[^ \t*+\-\d>#])/gm, '')
    .trimEnd();
}

