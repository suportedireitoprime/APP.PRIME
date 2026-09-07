/**
 * Utilitário universal para detectar e corrigir strings corrompidas por dupla codificação
 * UTF-8 / Windows-1252 / ISO-8859-1 (Mojibake comum em dados importados ou textos legados do Planalto/Diário Oficial).
 */

const HTML_ENTITIES_MAP: Record<string, string> = {
  '&amp;sect;': '§',
  '&amp;ordm;': 'º',
  '&amp;orda;': 'ª',
  '&amp;nbsp;': ' ',
  '&amp;quot;': '"',
  '&amp;ndash;': '–',
  '&amp;mdash;': '—',
  '&sect;': '§',
  '&ordm;': 'º',
  '&orda;': 'ª',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ndash;': '–',
  '&mdash;': '—',
  '&ccedil;': 'ç',
  '&Ccedil;': 'Ç',
  '&aacute;': 'á',
  '&eacute;': 'é',
  '&iacute;': 'í',
  '&oacute;': 'ó',
  '&uacute;': 'ú',
  '&atilde;': 'ã',
  '&otilde;': 'õ',
  '&acirc;': 'â',
  '&ecirc;': 'ê',
  '&ocirc;': 'ô',
  '&agrave;': 'à',
  '&Agrave;': 'À',
  '&Aacute;': 'Á',
  '&Eacute;': 'É',
  '&Iacute;': 'Í',
  '&Oacute;': 'Ó',
  '&Uacute;': 'Ú',
  '&Atilde;': 'Ã',
  '&Otilde;': 'Õ',
  '&Acirc;': 'Â',
  '&Ecirc;': 'Ê',
  '&Ocirc;': 'Ô',
  '&#167;': '§',
  '&#186;': 'º',
  '&#170;': 'ª',
  '&#8211;': '–',
  '&#8212;': '—',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8216;': '‘',
  '&#8217;': '’',
  '&#8230;': '…',
};

const MOJIBAKE_MAP: Record<string, string> = {
  // Sequências compostas (prioridade máxima para evitar substituição parcial)
  'Ã§Ã£': 'çã',
  'Ã§Ãµ': 'çõ',
  'Ã‡Ãƒ': 'ÇÃ',
  'Ã‡Ã•': 'ÇÕ',
  'Ã\x83Â§Ã\x83Â£': 'çã',

  // Minúsculas acentuadas
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã¢': 'â',
  'Ãª': 'ê',
  'Ã´': 'ô',
  'Ã£': 'ã',
  'Ãµ': 'õ',
  'Ã§': 'ç',
  'Ã\xa0': 'à',
  'Ã ': 'à',
  'Ã¼': 'ü',

  // Maiúsculas acentuadas
  'Ã€': 'À',
  'Ã\x80': 'À',
  'Ã\x81': 'Á',
  'Ã\x89': 'É',
  'Ã\x8D': 'Í',
  'Ã“': 'Ó',
  'Ã\x93': 'Ó',
  'Ãš': 'Ú',
  'Ã\x9A': 'Ú',
  'Ã‚': 'Â',
  'Ã\x82': 'Â',
  'ÃŠ': 'Ê',
  'Ã\x8A': 'Ê',
  'Ã”': 'Ô',
  'Ã\x94': 'Ô',
  'Ãƒ': 'Ã',
  'Ã\x83': 'Ã',
  'Ã•': 'Õ',
  'Ã\x95': 'Õ',
  'Ã‡': 'Ç',
  'Ã\x87': 'Ç',
  'Ã\x9C': 'Ü',

  // Símbolos jurídicos e numerais
  'Âº': 'º',
  'Â°': 'º',
  'Âª': 'ª',
  'Â§': '§',
  'Â±': '±',
  'Â²': '²',
  'Â³': '³',
  'Â¹': '¹',
  'Â¼': '¼',
  'Â½': '½',
  'Â¾': '¾',
  'Â«': '«',
  'Â»': '»',
  'Â·': '·',

  // Pontuação tipográfica e traços
  'â€”': '—',
  'â€“': '–',
  'â†’': '→',
  'â€¢': '•',
  'â€œ': '“',
  'â€\u009d': '”',
  'â€\u009c': '“',
  'â€ ': '”',
  'â€˜': '‘',
  'â€™': '’',
  'â€¦': '…',
  'â„¢': '™',
  'Ã—': '×',
  'ï»¿': '',
};

/**
 * Corrige caracteres especiais corrompidos e entidades HTML em uma string.
 */
export function fixMojibake(text?: string | null): string {
  if (!text || typeof text !== 'string') return text || '';

  let result = text;

  // 1. Remove Byte Order Mark (BOM) se presente
  if (result.charCodeAt(0) === 0xFEFF) {
    result = result.slice(1);
  }

  // 2. Corrige entidades HTML legadas do Diário Oficial / Planalto
  if (result.includes('&')) {
    for (const [entity, char] of Object.entries(HTML_ENTITIES_MAP)) {
      if (result.includes(entity)) {
        result = result.split(entity).join(char);
      }
    }
  }

  // 3. Aplica o mapa de Mojibake se houver vestígios de corrupção
  if (/[ÃÂâï]/.test(result)) {
    for (const [bad, good] of Object.entries(MOJIBAKE_MAP)) {
      if (result.includes(bad)) {
        result = result.split(bad).join(good);
      }
    }
  }

  return result;
}

/**
 * Corrige recursivamente campos textuais de um objeto de artigo ou legislação,
 * cobrindo caput, títulos, notas de redação revogada, incisos e alíneas.
 */
export function sanitizeArtigo<T extends Record<string, any>>(artigo: T): T {
  if (!artigo || typeof artigo !== 'object') return artigo;
  const copy: any = { ...artigo };

  const stringFields = [
    'numero',
    'caput',
    'texto',
    'titulo',
    'capitulo',
    'epigrafe',
    'nomen_juris',
    'livro',
    'secao',
    'subsecao',
    'parte',
    'redacao_anterior',
    'explicacao',
  ];

  for (const field of stringFields) {
    if (typeof copy[field] === 'string') {
      copy[field] = fixMojibake(copy[field]);
    }
  }

  const arrayFields = ['paragrafos', 'incisos', 'alineas', 'itens', 'alteracoes'];
  for (const field of arrayFields) {
    if (Array.isArray(copy[field])) {
      copy[field] = copy[field].map((item: any) => {
        if (typeof item === 'string') return fixMojibake(item);
        if (item && typeof item === 'object') return sanitizeArtigo(item);
        return item;
      });
    }
  }

  return copy as T;
}

export default fixMojibake;

