const crypto = require('crypto');

const ACCESS_KEY_ID = '3372ef3eff66f9d766be0175549a5970';
const SECRET_ACCESS_KEY = '6c73e9a65b74a4e456225ef2efc8596f9ca8f4371c094b40e8495ba7e89f9146';
const ENDPOINT = 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com';
const REGION = 'auto';
const SERVICE = 's3';

function hmac(key, string) {
  return crypto.createHmac('sha256', key).update(string).digest();
}

function hash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function uploadToR2(bucket, key, buffer, contentType) {
  const urlObj = new URL(ENDPOINT);
  urlObj.pathname = `/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = hash(buffer);

  const reqHeaders = {
    'host': urlObj.host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    'content-type': contentType,
    'cache-control': 'public, max-age=31536000, immutable'
  };

  const signedHeaderKeys = Object.keys(reqHeaders).map(k => k.toLowerCase()).sort();
  const signedHeaders = signedHeaderKeys.join(';');
  const canonicalHeaders = signedHeaderKeys.map(k => `${k}:${reqHeaders[k]}\n`).join('');
  const canonicalQuery = '';

  const canonicalRequest = ['PUT', urlObj.pathname, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, hash(Buffer.from(canonicalRequest))].join('\n');

  const kDate = hmac('AWS4' + SECRET_ACCESS_KEY, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  reqHeaders['Authorization'] = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(urlObj.toString(), {
    method: 'PUT',
    headers: reqHeaders,
    body: buffer
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload falhou para ${bucket}/${key}: ${res.status} ${text}`);
  }
}

const files = [
  {
    url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/vinhetas/intro_audioaulas.mp3',
    key: 'audios/vinhetas/intro_audioaulas.mp3',
    contentType: 'audio/mpeg'
  },
  {
    url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/audio-intro-2.mp3',
    key: 'audios/audio-intro-2.mp3',
    contentType: 'audio/mpeg'
  }
];

const buckets = ['vacatio-midias', 'estudos-juridicos-midias'];

async function main() {
  for (const item of files) {
    console.log(`Baixando ${item.url}...`);
    const resp = await fetch(item.url);
    if (!resp.ok) {
      console.error(`Falha ao baixar ${item.url}: ${resp.status}`);
      continue;
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    console.log(`Download OK (${buf.length} bytes). Enviando para os buckets...`);

    for (const bucket of buckets) {
      console.log(`Enviando ${item.key} para ${bucket}...`);
      await uploadToR2(bucket, item.key, buf, item.contentType);
      console.log(`Sucesso em ${bucket}/${item.key}`);
    }
  }
  console.log('TUDO ENVIADO COM SUCESSO!');
}

main().catch(console.error);
