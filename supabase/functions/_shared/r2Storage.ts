// _shared/r2Storage.ts
// Utilitário universal de integração com Cloudflare R2 (S3 API SigV4) para Edge Functions (Deno)

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") || "f654819db5e99f6d7f9475abf6e3f834";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || "3372ef3eff66f9d766be0175549a5970";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "6c73e9a65b74a4e456225ef2efc8596f9ca8f4371c094b40e8495ba7e89f9146";

export const R2_BUCKETS = {
  MIDIAS: Deno.env.get("R2_MIDIAS_BUCKET") || "estudos-juridicos-midias",
  AUDIO_VACATIO: Deno.env.get("R2_VACATIO_BUCKET") || "vacatio-midias",
};

export const R2_PUBLIC_URLS = {
  MIDIAS: Deno.env.get("R2_MIDIAS_PUBLIC_URL") || "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev",
  AUDIO_VACATIO: Deno.env.get("R2_VACATIO_PUBLIC_URL") || "https://pub-0c1a0e4ebbdd44dfa883dd36c269f19f.r2.dev",
};

const REGION = "auto";
const SERVICE = "s3";

async function hmacSha256(key: Uint8Array | string, data: Uint8Array | string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyBuf = typeof key === "string" ? enc.encode(key) : key;
  const dataBuf = typeof data === "string" ? enc.encode(data) : data;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
  return new Uint8Array(signature);
}

async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const enc = new TextEncoder();
  const buf = typeof data === "string" ? enc.encode(data) : data;
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Faz upload de um arquivo diretamente para o Cloudflare R2 usando SigV4 nativo em Web Crypto.
 */
export async function uploadToR2(
  bucket: string,
  key: string,
  data: Uint8Array,
  contentType: string = "application/octet-stream"
): Promise<{ publicUrl: string; key: string }> {
  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const cleanKey = key.replace(/^\/+/, "").replace(/\\/g, "/");
  const urlObj = new URL(endpoint);
  urlObj.pathname = `/${bucket}/${cleanKey.split("/").map(encodeURIComponent).join("/")}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(data);

  const reqHeaders: Record<string, string> = {
    "host": urlObj.host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    "content-type": contentType,
    "cache-control": "public, max-age=31536000, immutable",
  };

  const signedHeaderKeys = Object.keys(reqHeaders).map((k) => k.toLowerCase()).sort();
  const signedHeaders = signedHeaderKeys.join(";");
  const canonicalHeaders = signedHeaderKeys.map((k) => `${k}:${reqHeaders[k]}\n`).join("");
  const canonicalQuery = "";

  const canonicalRequest = [
    "PUT",
    urlObj.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const canonicalReqHash = await sha256Hex(canonicalRequest);
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    canonicalReqHash,
  ].join("\n");

  const kDate = await hmacSha256("AWS4" + R2_SECRET_ACCESS_KEY, dateStamp);
  const kRegion = await hmacSha256(kDate, REGION);
  const kService = await hmacSha256(kRegion, SERVICE);
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signatureBytes = await hmacSha256(kSigning, stringToSign);
  const signature = toHex(signatureBytes);

  reqHeaders["Authorization"] = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(urlObj.toString(), {
    method: "PUT",
    headers: reqHeaders,
    body: data,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Upload para Cloudflare R2 falhou (${res.status}): ${errorBody}`);
  }

  const basePublic = bucket === R2_BUCKETS.AUDIO_VACATIO
    ? R2_PUBLIC_URLS.AUDIO_VACATIO
    : R2_PUBLIC_URLS.MIDIAS;

  const publicUrl = `${basePublic}/${cleanKey}`;
  return { publicUrl, key: cleanKey };
}
