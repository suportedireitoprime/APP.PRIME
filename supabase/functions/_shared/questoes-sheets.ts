// Helpers compartilhados pelas funções do banco de questões.
import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const ADMIN_EMAILS = new Set([
  "wn7corporation@gmail.com",
  "suporte.vacatio@gmail.com",
  "wn7juridico@gmail.com",
]);

export const PASTA_DRIVE = "1_i0Sp5uvElQx1rHSj7g-_2p7ELZHcbEk";
const SHEETS_GW = "https://connector-gateway.lovable.dev/google_sheets/v4";
const DRIVE_GW = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/** Valida o JWT (sem chamada de rede) e exige e-mail administrativo. */
export function exigirAdmin(req: Request): { ok: true; email: string } | { ok: false; res: Response } {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return { ok: false, res: json({ error: "Não autenticado" }, 401) };
  try {
    const parts = auth.slice(7).trim().split(".");
    if (parts.length !== 3) throw new Error("jwt inválido");
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "=")), (c) => c.charCodeAt(0)),
      ),
    );
    if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error("expirado");
    const email = String(payload.email ?? "").toLowerCase();
    if (!ADMIN_EMAILS.has(email)) return { ok: false, res: json({ error: "Apenas administradores" }, 403) };
    return { ok: true, email };
  } catch {
    return { ok: false, res: json({ error: "Não autenticado" }, 401) };
  }
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gw(url: string, key: string) {
  let ultimo = "";
  // Retenta em 429 / 5xx com backoff exponencial (quota do Google Sheets por minuto)
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "X-Connection-Api-Key": key,
      },
    });
    const txt = await r.text();
    if (r.ok) return JSON.parse(txt);
    ultimo = `[${r.status}] ${txt.slice(0, 400)}`;
    if (r.status !== 429 && r.status < 500) break;
    const retryAfter = Number(r.headers.get("Retry-After"));
    const espera = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(30000, 2000 * 2 ** tentativa) + Math.floor(Math.random() * 500);
    await dormir(espera);
  }
  throw new Error(ultimo);
}

export async function driveListarPlanilhas(): Promise<{ id: string; name: string }[]> {
  const key = Deno.env.get("GOOGLE_DRIVE_API_KEY") ?? "";
  const q = encodeURIComponent(`'${PASTA_DRIVE}' in parents and trashed=false`);
  const data = await gw(
    `${DRIVE_GW}/files?q=${q}&fields=${encodeURIComponent("files(id,name,mimeType)")}&pageSize=500&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    key,
  );
  return (data.files ?? [])
    .filter((f: any) => f.mimeType === "application/vnd.google-apps.spreadsheet")
    .map((f: any) => ({ id: f.id, name: f.name }));
}

export async function sheetsAbas(spreadsheetId: string): Promise<string[]> {
  const key = Deno.env.get("GOOGLE_SHEETS_API_KEY") ?? "";
  const data = await gw(
    `${SHEETS_GW}/spreadsheets/${spreadsheetId}?fields=${encodeURIComponent("sheets.properties.title")}`,
    key,
  );
  return (data.sheets ?? []).map((s: any) => s.properties.title);
}

export async function sheetsValores(spreadsheetId: string, range: string): Promise<string[][]> {
  const key = Deno.env.get("GOOGLE_SHEETS_API_KEY") ?? "";
  // NÃO usar encodeURIComponent no range (os ':' devem permanecer literais)
  const data = await gw(`${SHEETS_GW}/spreadsheets/${spreadsheetId}/values/${encodeURI(range)}`, key);
  return data.values ?? [];
}

/** Nome do cabeçalho normalizado -> chave interna */
const CABECALHO_MAP: Record<string, string> = {
  "id questao": "id_externo",
  "cargo": "cargo",
  "disciplina": "disciplina",
  "assunto": "assunto",
  "ano": "ano",
  "banca": "banca",
  "orgao": "orgao",
  "prova": "prova",
  "texto associado": "texto_associado",
  "link da imagem": "imagem_url",
  "enunciado": "enunciado",
  "alternativa a": "alt_a",
  "alternativa b": "alt_b",
  "alternativa c": "alt_c",
  "alternativa d": "alt_d",
  "alternativa e": "alt_e",
  "gabarito oficial": "gabarito_oficial",
  "gabarito comentado": "gabarito_comentado",
  "tema central": "tema_central",
  "comentario mais curtido": "comentario_curtido",
  "url da questao": "url_questao",
  "data da extracao": "data_extracao",
  "numero da questao": "numero_questao",
};

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Monta { chave_interna: índice_da_coluna } a partir da linha de cabeçalho. */
export function mapearCabecalho(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((col, i) => {
    const chave = CABECALHO_MAP[normalizar(String(col ?? ""))];
    if (chave && map[chave] === undefined) map[chave] = i;
  });
  return map;
}

export function slugify(s: string) {
  return normalizar(s).replace(/\s+/g, "-");
}

export async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
