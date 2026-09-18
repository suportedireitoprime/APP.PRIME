// Shared helper: chama a API do Gemini com fallback para chave reserva (gratuita).
//
// Uso: substitua `fetch(url, init)` por `geminiFetch(url, init)` em toda chamada
// para `generativelanguage.googleapis.com`. A `url` continua vindo com o
// `?key=${chave}` embutido — o helper reescreve o parâmetro quando precisa
// tentar a reserva.
//
// Regras:
// - Tenta primeiro com a chave paga (GEMINI_API_KEY).
// - Se a paga retornar 429 (RESOURCE_EXHAUSTED / créditos esgotados) e a reserva
//   NÃO estiver marcada como esgotada, refaz a chamada com GEMINI_API_KEY_RESERVA.
// - Se a reserva também retornar 429, marca-a como esgotada por 1h em memória
//   (do isolate) para não continuar chamando e sofrer restrição.
// - A marcação é apenas em memória do isolate: reinicia sozinha e não persiste.

import { getVertexAuth } from "./gcpAuth.ts";

const PRIMARY = Deno.env.get("GEMINI_API_KEY") ?? "";
const AUDIO_KEY = Deno.env.get("GEMINI_AUDIO_API_KEY") ?? "";
const RESERVA = Deno.env.get("GEMINI_API_KEY_RESERVA") ?? "";
const GCP_SERVICE_ACCOUNT = Deno.env.get("GCP_SERVICE_ACCOUNT");

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora
let reservaExhaustedUntil = 0;

function replaceKey(url: string, newKey: string): string {
  // Substitui apenas o valor de key= (mantém demais parâmetros)
  if (url.includes("key=")) {
    return url.replace(/([?&])key=[^&]*/, `$1key=${encodeURIComponent(newKey)}`);
  }
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key=${encodeURIComponent(newKey)}`;
}

function isQuotaExhausted(status: number, bodyText: string): boolean {
  if (status === 429) return true;
  if (!bodyText) return false;
  const lower = bodyText.toLowerCase();
  return (
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("prepayment credits are depleted") ||
    lower.includes("credits are depleted")
  );
}

// Chave inválida / sem permissão / faturamento — também deve tentar a próxima chave.
function isKeyProblem(status: number, bodyText: string): boolean {
  const lower = (bodyText || "").toLowerCase();
  if (status === 401 || status === 403) return true;
  return (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("invalid api key") ||
    lower.includes("permission_denied") ||
    lower.includes("billing")
  );
}

async function readBodySafely(res: Response): Promise<string> {
  try {
    // Clona para não consumir o body original
    return await res.clone().text();
  } catch {
    return "";
  }
}

function extractKey(url: string): string {
  const m = url.match(/[?&]key=([^&]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export async function geminiFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const isGemini = typeof url === "string" && url.includes("generativelanguage.googleapis.com");
  if (!isGemini) {
    return fetch(url, init);
  }

  // INTERCEPTAÇÃO: Se houver Service Account configurada, tentar Vertex AI primeiro!
  if (GCP_SERVICE_ACCOUNT) {
    try {
      const { token, projectId } = await getVertexAuth(GCP_SERVICE_ACCOUNT);
      const region = "us-central1"; // Padrão GCP AI
      
      // Extrair o modelo e o método da URL original
      // URL original ex: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=X
      const match = url.match(/models\/([^:]+):([^?]+)/);
      if (match) {
        const model = match[1];
        let action = match[2];
        if (action === 'streamGenerateContent') action = 'streamGenerateContent?alt=sse';
        
        const vertexUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:${action}`;
        
        const headers = new Headers(init?.headers);
        headers.set('Authorization', `Bearer ${token}`);
        
        const vertexRes = await fetch(vertexUrl, { ...init, headers });
        if (vertexRes.ok) {
          return vertexRes;
        }
        console.warn(`[geminiFetch] Vertex AI falhou HTTP ${vertexRes.status} para ${model}. Fazendo fallback para AI Studio.`);
      }
    } catch (err: any) {
      console.warn(`[geminiFetch] Erro ao preparar Vertex AI: ${err.message}. Fazendo fallback para AI Studio.`);
    }
  }

  const isAudioReq = url.includes("tts") || url.includes("speech") || url.includes("audio");

  // Monta a fila de chaves a tentar (AI Studio Legacy)
  const urlKey = extractKey(url);
  const candidates: string[] = [];
  const pushUnique = (k: string) => { if (k && !candidates.includes(k)) candidates.push(k); };

  if (isAudioReq && AUDIO_KEY) {
    pushUnique(AUDIO_KEY);
  }
  pushUnique(urlKey);
  pushUnique(PRIMARY);
  if (RESERVA && Date.now() >= reservaExhaustedUntil) pushUnique(RESERVA);

  if (candidates.length === 0) {
    return fetch(url, init);
  }

  let lastResponse: Response | null = null;
  for (let i = 0; i < candidates.length; i++) {
    const key = candidates[i];
    const attemptUrl = replaceKey(url, key);
    const response = await fetch(attemptUrl, init);
    if (response.ok) return response;

    const bodyText = await readBodySafely(response);
    const exhausted = isQuotaExhausted(response.status, bodyText);
    const keyProblem = isKeyProblem(response.status, bodyText);

    // Marca a reserva gratuita como esgotada para não continuar tentando por 1h.
    if (exhausted && key === RESERVA) {
      reservaExhaustedUntil = Date.now() + COOLDOWN_MS;
      console.warn("[geminiFetch] Reserva gratuita esgotada — cooldown de 1h ativado.");
    }

    lastResponse = response;
    // Continua para a próxima chave em problema de quota OU de chave inválida.
    if (!exhausted && !keyProblem) return response;
    console.warn(`[geminiFetch] Chave #${i + 1} falhou (${exhausted ? "quota" : "chave inválida"}) — tentando próxima.`);
  }

  return lastResponse ?? fetch(url, init);
}
