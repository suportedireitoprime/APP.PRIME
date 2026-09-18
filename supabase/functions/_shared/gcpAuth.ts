/**
 * Autenticação GCP via Service Account usando Web Crypto API nativa (Deno-compatível).
 * Gera um JWT assinado com RS256 e troca por um access_token OAuth2 do Google.
 * NÃO depende de npm:google-auth-library.
 */

let cachedToken: string | null = null;
let tokenExpiry = 0;

// ─── Helpers Base64URL ───

function base64url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── Importar chave privada PEM como CryptoKey ───

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/[\r\n\s]/g, '');
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

// ─── Gerar JWT assinado ───

async function createSignedJwt(
  clientEmail: string,
  privateKey: string,
  scopes: string[],
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hora
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${base64url(new Uint8Array(signature))}`;
}

// ─── Trocar JWT por Access Token ───

async function exchangeJwtForToken(jwt: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OAuth2 token exchange falhou (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`OAuth2 retornou sem access_token: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data.access_token;
}

// ─── Função principal exportada ───

/**
 * Obtém um token de acesso de curta duração (Bearer) usando uma Conta de Serviço do GCP.
 * Faz cache do token em memória por 50 minutos.
 *
 * @param serviceAccountJson String JSON da Service Account
 * @returns Token Bearer e o Project ID
 */
export async function getVertexAuth(serviceAccountJson: string): Promise<{ token: string; projectId: string }> {
  const creds = JSON.parse(serviceAccountJson);
  const projectId = creds.project_id;

  if (!projectId) {
    throw new Error("O JSON da Service Account não contém 'project_id'.");
  }
  if (!creds.client_email || !creds.private_key) {
    throw new Error("O JSON da Service Account não contém 'client_email' ou 'private_key'.");
  }

  if (cachedToken && Date.now() < tokenExpiry) {
    return { token: cachedToken, projectId };
  }

  console.log(`[gcpAuth] Gerando JWT para ${creds.client_email} (projeto: ${projectId})...`);

  const jwt = await createSignedJwt(
    creds.client_email,
    creds.private_key,
    ['https://www.googleapis.com/auth/cloud-platform'],
  );

  const token = await exchangeJwtForToken(jwt);

  cachedToken = token;
  // O token do Google expira em 60 min. Usamos 50 min de cache de segurança.
  tokenExpiry = Date.now() + 50 * 60 * 1000;

  console.log(`[gcpAuth] ✅ Access token obtido com sucesso (${token.slice(0, 20)}...)`);
  return { token, projectId };
}
