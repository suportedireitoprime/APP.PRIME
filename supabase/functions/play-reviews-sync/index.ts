import { createClient } from 'npm:@supabase/supabase-js@2';

const PACKAGE_NAME = Deno.env.get('ANDROID_PACKAGE_NAME') ?? '';
const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON') ?? '';
// Chave opcional via header ou param para proteger a cron
const SYNC_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? 'sua_senha_secreta_aqui';

let tokenCache: { token: string; exp: number } | null = null;

async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp - 60 > now) return tokenCache.token;
  if (!SERVICE_ACCOUNT_JSON) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON não configurado.");
  
  const sa = JSON.parse(SERVICE_ACCOUNT_JSON);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now,
  };
  const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const enc = new TextEncoder();
  const toSign = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(claim)))}`;
  const pem = sa.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(toSign)));
  const jwt = `${toSign}.${b64url(sig)}`;
  
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  
  const json = await res.json();
  if (!json.access_token) throw new Error(`Google OAuth failed: ${JSON.stringify(json)}`);
  
  tokenCache = { token: json.access_token, exp: now + 3500 };
  return json.access_token;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization') || '';
    const tokenQuery = url.searchParams.get('token');
    
    // Autenticação simples (Pode ser via Header Bearer ou Query ?token=)
    if (authHeader !== `Bearer ${SYNC_SECRET}` && tokenQuery !== SYNC_SECRET) {
      console.warn('Unauthorized sync attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (!PACKAGE_NAME) throw new Error("ANDROID_PACKAGE_NAME não configurado.");

    console.log("Iniciando sync de Reviews do Google Play...");
    const accessToken = await getGoogleAccessToken();
    
    // Obter reviews. A API retorna os mais recentes. maxResults max é 100 por default, passamos param se quiser.
    const googleUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(PACKAGE_NAME)}/reviews?maxResults=100`;
    const gRes = await fetch(googleUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    
    if (!gRes.ok) {
      const gErr = await gRes.text();
      throw new Error(`Google API falhou [${gRes.status}]: ${gErr}`);
    }

    const json = await gRes.json();
    const reviews = json.reviews || [];

    if (reviews.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma review encontrada.', count: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let upsertedCount = 0;

    for (const r of reviews) {
      const reviewId = r.reviewId;
      const authorName = r.authorName;
      let userCommentObj = null;
      let devCommentObj = null;

      // Percorre os comentários (o Google separa o do User e a resposta do Dev em um array)
      if (Array.isArray(r.comments)) {
        for (const c of r.comments) {
          if (c.userComment) userCommentObj = c.userComment;
          if (c.developerComment) devCommentObj = c.developerComment;
        }
      }

      if (!userCommentObj) continue;

      const starRating = userCommentObj.starRating;
      const text = userCommentObj.text;
      const reviewerLanguage = userCommentObj.reviewerLanguage;
      const device = userCommentObj.deviceMetadata?.productName || userCommentObj.device;
      const appVersionName = userCommentObj.appVersionName;
      const appVersionCode = userCommentObj.appVersionCode;
      
      const lastModifiedSeconds = userCommentObj.lastModified?.seconds;
      const lastModifiedAt = lastModifiedSeconds ? new Date(Number(lastModifiedSeconds) * 1000).toISOString() : null;

      const replyText = devCommentObj?.text || null;
      const replySeconds = devCommentObj?.lastModified?.seconds;
      const replyLastModifiedAt = replySeconds ? new Date(Number(replySeconds) * 1000).toISOString() : null;

      const payload = {
        review_id: reviewId,
        author_name: authorName,
        star_rating: starRating,
        reviewer_language: reviewerLanguage,
        device: device,
        app_version_name: appVersionName,
        app_version_code: appVersionCode,
        comment: text,
        last_modified_at: lastModifiedAt,
        reply_text: replyText,
        reply_last_modified_at: replyLastModifiedAt,
        updated_at: new Date().toISOString()
      };

      const { error } = await admin
        .from('play_reviews')
        .upsert(payload, { onConflict: 'review_id' });
        
      if (error) {
         console.error(`Erro ao inserir review ${reviewId}:`, error);
      } else {
         upsertedCount++;
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Sync concluído com sucesso', 
      fetched: reviews.length,
      upserted: upsertedCount
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Erro na função play-reviews-sync:', err);
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
