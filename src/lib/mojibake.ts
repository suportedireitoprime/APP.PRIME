/**
 * Utilitário universal para detectar e corrigir strings corrompidas por dupla codificação
 * UTF-8 / Windows-1252 / ISO-8859-1 (Mojibake comum em dados importados ou textos legados).
 */

const MOJIBAKE_MAP: Record<string, string> = {
  'Ã§Ã£': 'çã',
  'Ã§Ãµ': 'çõ',
  'Ã‡Ãƒ': 'ÇÃ',
  'Ã‡Ã•': 'ÇÕ',
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
  'Ã€': 'À',
  'Ã\x81': 'Á',
  'Ã‰': 'É',
  'Ã\x8D': 'Í',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ã‚': 'Â',
  'ÃŠ': 'Ê',
  'Ã”': 'Ô',
  'Ãƒ': 'Ã',
  'Ã•': 'Õ',
  'Ã‡': 'Ç',
  'Âº': 'º',
  'Â°': 'º',
  'Â§': '§',
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
  'Ã\xa0': 'à',
  'Ã ': 'à',
  'Ã\x80': 'À',
  'Ã—': '×',
};

/**
 * Corrige caracteres especiais corrompidos em uma string.
 */
export function fixMojibake(text?: string | null): string {
  if (!text || typeof text !== 'string') return text || '';
  if (!/[ÃÂâ]/.test(text)) return text;

  let result = text;
  for (const [bad, good] of Object.entries(MOJIBAKE_MAP)) {
    if (result.includes(bad)) {
      result = result.split(bad).join(good);
    }
  }
  return result;
}

/**
 * Corrige recursivamente campos textuais de um objeto de artigo ou legislação.
 */
export function sanitizeArtigo<T extends Record<string, any>>(artigo: T): T {
  if (!artigo || typeof artigo !== 'object') return artigo;
  const copy: any = { ...artigo };
  if (typeof copy.numero === 'string') copy.numero = fixMojibake(copy.numero);
  if (typeof copy.caput === 'string') copy.caput = fixMojibake(copy.caput);
  if (typeof copy.texto === 'string') copy.texto = fixMojibake(copy.texto);
  if (typeof copy.titulo === 'string') copy.titulo = fixMojibake(copy.titulo);
  if (typeof copy.capitulo === 'string') copy.capitulo = fixMojibake(copy.capitulo);
  if (typeof copy.epigrafe === 'string') copy.epigrafe = fixMojibake(copy.epigrafe);
  if (Array.isArray(copy.paragrafos)) {
    copy.paragrafos = copy.paragrafos.map((p: any) => typeof p === 'string' ? fixMojibake(p) : p);
  }
  if (Array.isArray(copy.incisos)) {
    copy.incisos = copy.incisos.map((i: any) => typeof i === 'string' ? fixMojibake(i) : i);
  }
  return copy as T;
}
