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

function rewriteToVertex(url: string, projectId: string, location = 'us-central1'): string {
  const match = url.match(/models\/([^:]+):([^?]+)/);
  if (!match) return url;
  
  let modelId = match[1];
  // O Vertex AI usa nomenclaturas fixas corporativas, não suporta as versões 'lite' ou '2.5' do AI Studio ainda.
  if (modelId.includes('3.1') || modelId.includes('2.5') || modelId.includes('1.5-flash')) {
    modelId = 'gemini-1.5-flash-002'; 
  } else if (modelId.includes('pro')) {
    modelId = 'gemini-1.5-pro-002';
  }

  let method = match[2];
  // Remove o 'key=' da query string, pois o Vertex AI exige apenas o Bearer Token
  if (method.includes('key=')) {
    method = method.replace(/([?&])key=[^&]*&?/, '$1').replace(/[?&]$/, '');
  }
  
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:${method}`;
}

export async function geminiFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const isGemini = typeof url === "string" && url.includes("generativelanguage.googleapis.com");
  if (!isGemini) {
    return fetch(url, init);
  }

  const isAudioReq = url.includes("tts") || url.includes("speech") || url.includes("audio");

  // Tenta autenticação via Service Account (Bearer Token) usando os créditos do Google Cloud
  // Usa o MESMO endpoint generativelanguage.googleapis.com mas com Bearer em vez de API Key
  if (!isAudioReq && GCP_SERVICE_ACCOUNT) {
    try {
      console.log(`[geminiFetch] GCP_SERVICE_ACCOUNT encontrada (${GCP_SERVICE_ACCOUNT.length} chars). Tentando Bearer Token...`);
      const { token, projectId } = await getVertexAuth(GCP_SERVICE_ACCOUNT);
      
      // Remove o parâmetro key= da URL (Bearer Token substitui)
      let bearerUrl = url.replace(/([?&])key=[^&]*&?/, '$1').replace(/[?&]$/, '');
      // Se a URL não tem mais query string, garante que não fica com '?' solto
      if (bearerUrl.endsWith('?') || bearerUrl.endsWith('&')) {
        bearerUrl = bearerUrl.slice(0, -1);
      }
      
      console.log(`[geminiFetch] Bearer URL: ${bearerUrl}`);
      
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('x-goog-user-project', projectId);
      headers.delete('x-goog-api-key');
      if (headers.get('Content-Type')?.includes('application/json')) {
         headers.set('Content-Type', 'application/json');
      }

      const bearerInit = { ...init, headers };
      const response = await fetch(bearerUrl, bearerInit);
      
      if (response.ok) {
        console.log(`[geminiFetch] ✅ Bearer Token respondeu OK!`);
        return response;
      }
      const errText = await readBodySafely(response);
      console.warn(`[geminiFetch] ❌ Bearer Token falhou HTTP ${response.status}:`, errText.slice(0, 500));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[geminiFetch] ❌ Exceção na autenticação Service Account:`, msg);
    }
  } else if (!GCP_SERVICE_ACCOUNT) {
    console.warn(`[geminiFetch] GCP_SERVICE_ACCOUNT não configurada — Bearer Token desativado.`);
  }

  // Fallback para as chaves do AI Studio (Legacy)
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

    if (exhausted && key === RESERVA) {
      reservaExhaustedUntil = Date.now() + COOLDOWN_MS;
      console.warn("[geminiFetch] Reserva gratuita esgotada — cooldown de 1h ativado.");
    }

    lastResponse = response;
    if (!exhausted && !keyProblem) return response;
    console.warn(`[geminiFetch] Chave #${i + 1} falhou (${exhausted ? "quota" : "chave inválida"}) — tentando próxima.`);
  }

  return lastResponse ?? fetch(url, init);
}
