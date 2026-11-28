const SIGLAS_JURIDICAS = new Set([
  "CF", "STF", "STJ", "TST", "TSE", "STM", "CNJ", "CNMP", "OAB", "CLT", "CDC",
  "CPC", "CPP", "CTN", "ECA", "LINDB", "MP", "EC", "LC", "INSS", "FGTS", "SUS",
  "AGU", "IBAMA", "BACEN", "TCU", "MPU", "MPE", "DPU", "TRF", "TRT", "TRE", "TJ",
  "PF", "PRF", "PM", "PC", "PGR", "ADPF", "ADI", "ADC", "ADO", "HC", "MS", "MI",
  "RE", "RESP", "RCL", "SV", "RG", "CPF", "CNPJ", "LGPD", "IA", "TJSP", "TJRJ",
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
  "XXI", "XXII", "XXIII", "XXIV", "XXV",
]);

const CONECTIVOS_PT = new Set([
  "a", "à", "ao", "aos", "as", "às", "com", "da", "das", "de", "do", "dos",
  "e", "em", "na", "nas", "no", "nos", "o", "os", "ou", "para", "pela",
  "pelas", "pelo", "pelos", "por", "sem", "sob", "sobre",
]);

/**
 * Padroniza títulos jurídicos:
 * 1) Remove prefixos numéricos redundantes ("01. ", "02 - ") já exibidos em badges.
 * 2) Converte termos em CAIXA ALTA para Title Case jurídico, preservando siglas e romanos.
 */
export function formatJuridicoTitle(raw?: string | null): string {
  if (!raw) return "";
  const semPrefixo = raw.replace(/^\d+[\.\-\s_]+\s*/i, "").trim();
  if (!semPrefixo) return "";

  return semPrefixo
    .split(/\s+/)
    .map((token, idx) => {
      if (token.includes("/")) {
        return token
          .split("/")
          .map((parte) => {
            const pure = parte.replace(/[^A-Za-zÀ-ÿ]/g, "").toUpperCase();
            if (SIGLAS_JURIDICAS.has(pure)) return parte.toUpperCase();
            return parte;
          })
          .join("/");
      }

      const match = token.match(/^([^A-Za-zÀ-ÿ]*)([A-Za-zÀ-ÿ]+)([^A-Za-zÀ-ÿ]*)$/);
      if (!match) return token;

      const [, prefix, word, suffix] = match;
      const upper = word.toUpperCase();
      const lower = word.toLowerCase();

      if (SIGLAS_JURIDICAS.has(upper)) {
        return `${prefix}${upper}${suffix}`;
      }

      if (
        idx > 0 &&
        (lower === "n" || lower === "nº") &&
        (suffix.includes("º") || suffix.includes("°") || lower === "nº")
      ) {
        return `${prefix}nº${suffix.replace(/[º°]/g, "")}`;
      }

      const isAllCaps = word === upper && word !== lower;
      if (idx > 0 && CONECTIVOS_PT.has(lower) && (isAllCaps || word === lower)) {
        return `${prefix}${lower}${suffix}`;
      }

      if (isAllCaps && word.length >= 2) {
        return `${prefix}${lower.charAt(0).toUpperCase()}${lower.slice(1)}${suffix}`;
      }

      if (idx === 0) {
        return `${prefix}${word.charAt(0).toUpperCase()}${word.slice(1)}${suffix}`;
      }

      return token;
    })
    .join(" ");
}
