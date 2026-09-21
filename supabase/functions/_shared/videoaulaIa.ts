// Helpers compartilhados pelas edge functions de Videoaulas.
// Transcrição do YouTube, limpeza de texto institucional, parser de JSON
// tolerante e chamada à API do Gemini via geminiFetch.
import { geminiFetch } from "./geminiFetch.ts";

const GEMINI_MODEL = 'gemini-3.1-flash-lite';

export class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

import { YoutubeTranscript } from "npm:youtube-transcript";

/** Baixa as legendas do vídeo. */
export async function fetchYoutubeTranscript(videoId: string): Promise<string> {
  try {
    const list = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' });
    return list.map((i) => i.text).join(' ').slice(0, 14000);
  } catch (e) {
    try {
      // Fallback sem parametro de linguagem
      const listFallback = await YoutubeTranscript.fetchTranscript(videoId);
      return listFallback.map((i) => i.text).join(' ').slice(0, 14000);
    } catch (fallbackError) {
      console.warn("[videoaulaIa] falha transcricao", (e as Error)?.message);
      return "";
    }
  }
}

/** Legendas com marcação de tempo (para exibir na UI). */
export async function fetchYoutubeTranscriptSegments(
  videoId: string,
): Promise<Array<{ text: string; start: number; dur: number }>> {
  try {
    const list = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' });
    return list.map((i) => ({
      start: i.offset,
      dur: i.duration,
      text: i.text,
    }));
  } catch {
    try {
      const listFallback = await YoutubeTranscript.fetchTranscript(videoId);
      return listFallback.map((i) => ({
        start: i.offset,
        dur: i.duration,
        text: i.text,
      }));
    } catch {
      return [];
    }
  }
}

/** Remove ruído de canal/plataforma do título do vídeo. */
export function limparTituloAula(titulo: string, area: string): string {
  const semRuido = titulo
    .replace(/\|?\s*Kultivi\b/gi, "")
    .replace(/\|?\s*curso gratuito completo\b/gi, "")
    .replace(/\|?\s*curso gratuito\b/gi, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+\|\s+/g, " › ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return semRuido || area || titulo || "Tema jurídico da aula";
}

/** Remove propaganda, saudações e links das descrições/transcrições. */
export function limparTextoInstitucional(texto: string): string {
  return texto
    .split(/\n{2,}|(?<=\.)\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter(
      (p) =>
        !/(kultivi|cultive|kultiver|youtube|inscreva|curta|canal|cadastre|plataforma|certificado|ensino gratuito|curso gratuito|nos vemos|link|http|www\.)/i.test(
          p,
        ),
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseJsonStrict(raw: string): unknown {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  if (i >= 0 && j > i) s = s.slice(i, j + 1);
  try {
    return JSON.parse(s);
  } catch {
    return repairAndParse(s);
  }
}

function repairAndParse(s: string): unknown {
  let t = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (let k = 0; k < t.length; k++) {
    const c = t[k];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") stack.pop();
  }
  if (inStr) t += '"';
  t = t.replace(/,\s*$/g, "");
  while (stack.length) {
    const open = stack.pop();
    t += open === "{" ? "}" : "]";
    t = t.replace(/,\s*([}\]])/g, "$1");
  }
  return JSON.parse(t);
}

interface ChamarIaOpts {
  system?: string;
  prompt: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

/** Chama a API do Gemini via geminiFetch e devolve o texto da resposta. */
export async function chamarIa({
  system,
  prompt,
  json,
  maxTokens = 8192,
  temperature = 0.7,
}: ChamarIaOpts): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY") ?? "";
  if (!key) throw new GatewayError(500, "GEMINI_API_KEY não configurada");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const parts: Array<{ text: string }> = [];
  if (system) parts.push({ text: system });
  parts.push({ text: prompt });

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await geminiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[videoaulaIa] gemini ${res.status}: ${errBody.slice(0, 500)}`);
    throw new GatewayError(res.status, `IA indisponível (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new GatewayError(502, "A IA devolveu resposta vazia");
  return text as string;
}
