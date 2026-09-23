/**
 * Modelos Gemini permitidos no app - FONTE UNICA DE VERDADE.
 *
 * Politica oficial: TODA chamada de texto/multimodal usa
 * gemini-3.1-flash-lite (modelo de texto rapido, eficiente e de ultima geracao).
 *
 * Documentacao canonica:
 * https://ai.google.dev/gemini-api/docs/models
 *
 * Excecoes (nao sao texto, mantem modelos proprios):
 *  - Imagem: gemini-2.5-flash-image
 *  - TTS:    gemini-2.5-flash-preview-tts
 */

export const MODELS = {
  text: "gemini-3.1-flash-lite",
  textGateway: 'gemini-3.1-flash-lite',
  image: "gemini-2.5-flash-image",
  imageGateway: 'gemini-2.5-flash-image',
  tts: "gemini-2.5-flash-preview-tts",
} as const;

// Modelos de texto permitidos com fallback gracioso.
export const TEXT_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
] as const;

export const ALLOWED_TEXT_MODELS = new Set<string>([
  "gemini-3.1-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
]);

// Aliases/modelos proibidos - se algum bater aqui, forcamos o modelo permitido.
const DENY_PATTERNS: RegExp[] = [
  // /-latest$/i,               // qualquer alias -latest
  /gemini-2\.5-pro/i,        // 2.5 Pro
];

/**
 * Forca qualquer id de modelo de texto para gemini-3.1-flash-lite.
 * Se o id vier na forma google/... (Gemini Gateway), preserva o prefixo.
 * Loga warning para qualquer tentativa fora da politica.
 */
export function assertTextModel(id: string): string {
  const raw = String(id || "").trim();
  const isGateway = raw.startsWith("google/");
  const bare = isGateway ? raw.replace(/^google\//i, "") : raw;

  if (ALLOWED_TEXT_MODELS.has(raw)) return raw;

  const denied = DENY_PATTERNS.some((re) => re.test(bare));
  if (denied || !bare) {
    console.warn(
      '[ai-models] Modelo de texto "' + raw + '" bloqueado pela politica. ' +
      'Forcando "' + MODELS.text + '".',
    );
  } else {
    console.warn(
      '[ai-models] Modelo de texto "' + raw + '" fora da allowlist. ' +
      'Forcando "' + MODELS.text + '".',
    );
  }
  return isGateway ? MODELS.textGateway : MODELS.text;
}

/**
 * Helper: URL pronta para chamada REST direta ao Gemini
 * (generativelanguage.googleapis.com). Sempre injeta o modelo permitido.
 */
export function buildGeminiTextUrl(apiKey: string): string {
  return "https://generativelanguage.googleapis.com/v1beta/models/" + MODELS.text + ":generateContent?key=" + apiKey;
}

export type ModelKind = keyof typeof MODELS;
