// Acesso ao Google Drive por Service Account (JWT RS256 -> access token).
// Segredos: GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON, DRIVE_ROOT_FOLDER_ID.

const SCOPE = "https://www.googleapis.com/auth/drive";

interface SA {
  client_email: string;
  private_key: string;
}

function sa(): SA {
  const raw = Deno.env.get("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON ausente");
  const json = JSON.parse(raw);
  if (!json.client_email || !json.private_key) throw new Error("JSON da service account inválido");
  return json as SA;
}

export function rootFolderId(): string {
  const id = Deno.env.get("DRIVE_ROOT_FOLDER_ID");
  if (!id) throw new Error("DRIVE_ROOT_FOLDER_ID ausente");
  return id;
}

function b64url(bytes: Uint8Array | string): string {
  const raw = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cache: { token: string; exp: number } | null = null;

export async function driveToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cache && cache.exp - 60 > now) return cache.token;

  // Preferência: OAuth de usuário (refresh token) — os arquivos ficam na cota do dono do Drive.
  const rt = Deno.env.get("GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN");
  const cid = Deno.env.get("GOOGLE_DRIVE_OAUTH_CLIENT_ID");
  const csec = Deno.env.get("GOOGLE_DRIVE_OAUTH_CLIENT_SECRET");
  if (rt && cid && csec) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: cid,
        client_secret: csec,
        refresh_token: rt,
        grant_type: "refresh_token",
      }),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`token drive oauth ${res.status}: ${body.slice(0, 300)}`);
    const data = JSON.parse(body);
    cache = { token: data.access_token, exp: now + Number(data.expires_in ?? 3600) };
    return cache.token;
  }

  const { client_email, private_key } = sa();

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: client_email,
    scope: SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(private_key.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`)),
  );
  const assertion = `${header}.${claims}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`token drive ${res.status}: ${body.slice(0, 300)}`);
  const data = JSON.parse(body);
  cache = { token: data.access_token, exp: now + Number(data.expires_in ?? 3600) };
  return cache.token;
}

async function api(path: string, init: RequestInit = {}) {
  const token = await driveToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`drive ${res.status} ${path}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const esc = (s: string) => s.replace(/'/g, "\\'");

/** Cria (ou reutiliza) uma subpasta. Idempotente. */
export async function ensureFolder(name: string, parentId: string): Promise<string> {
  const q = [
    `name='${esc(name)}'`,
    `'${esc(parentId)}' in parents`,
    "mimeType='application/vnd.google-apps.folder'",
    "trashed=false",
  ].join(" and ");
  const found = await api(
    `/files?q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  );
  if (found?.files?.length) return found.files[0].id as string;

  const created = await api(`/files?fields=id&supportsAllDrives=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parents: [parentId], mimeType: "application/vnd.google-apps.folder" }),
  });
  return created.id as string;
}

/** Cria/atualiza um arquivo de texto simples (usado para os prompts). */
export async function upsertTextFile(name: string, parentId: string, content: string): Promise<string> {
  const q = `name='${esc(name)}' and '${esc(parentId)}' in parents and trashed=false`;
  const found = await api(
    `/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  );
  const existing = found?.files?.[0]?.id as string | undefined;
  const token = await driveToken();

  if (existing) {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existing}?uploadType=media&supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain; charset=utf-8" },
        body: content,
      },
    );
    if (!res.ok) throw new Error(`drive update ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return existing;
  }
  return await uploadFile({ name, parentId, mime: "text/plain; charset=utf-8", data: new TextEncoder().encode(content) });
}

/** Upload multipart de um arquivo binário. Devolve o fileId. */
export async function uploadFile(opts: {
  name: string;
  parentId: string;
  mime: string;
  data: Uint8Array | string;
}): Promise<string> {
  const token = await driveToken();
  const boundary = `prime${crypto.randomUUID()}`;
  const meta = JSON.stringify({ name: opts.name, parents: [opts.parentId] });
  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${opts.mime}\r\n\r\n`,
  );
  const bin = typeof opts.data === "string" ? enc.encode(opts.data) : opts.data;
  const tail = enc.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + bin.length + tail.length);
  body.set(head, 0);
  body.set(bin, head.length);
  body.set(tail, head.length + bin.length);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`drive upload ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text).id as string;
}

/** Extrai o fileId de qualquer formato de link do Drive. */
export function fileIdFromLink(link: string): string | null {
  const s = link.trim();
  if (/^[\w-]{20,}$/.test(s)) return s;
  const m =
    s.match(/\/file\/d\/([\w-]+)/) ??
    s.match(/\/folders\/([\w-]+)/) ??
    s.match(/[?&]id=([\w-]+)/) ??
    s.match(/\/d\/([\w-]+)/);
  return m ? m[1] : null;
}

export async function fileMeta(fileId: string) {
  return await api(
    `/files/${fileId}?fields=id,name,mimeType,size,webViewLink&supportsAllDrives=true`,
  );
}

/** Torna o arquivo legível por qualquer pessoa com o link e devolve a URL direta. */
export async function makePublic(fileId: string): Promise<string> {
  try {
    await api(`/files/${fileId}/permissions?supportsAllDrives=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    });
  } catch (e) {
    // Já público ou política de domínio bloqueou — segue com o link direto.
    console.warn("makePublic:", e instanceof Error ? e.message : e);
  }
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export async function downloadFile(fileId: string): Promise<Uint8Array> {
  const token = await driveToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`drive download ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Estrutura padrão de pastas do projeto. Devolve o mapa nome -> folderId. */
export async function ensureTree(): Promise<Record<string, string>> {
  const root = rootFolderId();
  const ids: Record<string, string> = { raiz: root };

  const prompts = await ensureFolder("Prompts", root);
  ids["Prompts"] = prompts;
  for (const nome of ["Apresentacoes", "Audioaulas", "Leis-Cantadas"]) {
    ids[`Prompts/${nome}`] = await ensureFolder(nome, prompts);
  }
  ids["Fila"] = await ensureFolder("Fila", root);

  const pdfs = await ensureFolder("PDFs", root);
  ids["PDFs"] = pdfs;
  for (const nome of ["Resumos", "Mapas-Mentais", "Infograficos", "Fluxogramas", "Outros"]) {
    ids[`PDFs/${nome}`] = await ensureFolder(nome, pdfs);
  }
  return ids;
}
