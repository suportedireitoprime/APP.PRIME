// Edge function: documentos-listar
// Navega a pasta de modelos jurídicos no Google Drive.
//   (sem parâmetros)                  -> categorias (subpastas do 1º nível)
//   ?pasta=<id>&q=&pageToken=         -> conteúdo paginado de uma pasta
//   ?arquivo=<id>                     -> bytes do arquivo (download/preview)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { driveToken } from '../_shared/googleDrive.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const CACHE_TTL = 60_000;
const cache = new Map<string, { at: number; body: unknown }>();
const ID_RE = /^[\w-]{10,}$/;

const escapar = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function drive(token: string, params: URLSearchParams) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`drive ${res.status}: ${texto.slice(0, 300)}`);
  return JSON.parse(texto) as {
    nextPageToken?: string;
    files: Array<Record<string, string>>;
  };
}

function mapear(f: Record<string, string>) {
  const pasta = f.mimeType === FOLDER_MIME;
  return {
    id: f.id,
    nome: f.name,
    pasta,
    mime: f.mimeType,
    tamanho: f.size ? Number(f.size) : null,
    modificadoEm: f.modifiedTime ?? null,
    webViewLink: f.webViewLink ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const raiz = Deno.env.get('DRIVE_DOCUMENTOS_FOLDER_ID');
    if (!raiz) return json({ error: 'DRIVE_DOCUMENTOS_FOLDER_ID ausente' }, 500);

    const url = new URL(req.url);
    const arquivoId = url.searchParams.get('arquivo');
    const pastaId = url.searchParams.get('pasta') || raiz;
    const busca = (url.searchParams.get('q') || '').trim();
    const pageToken = url.searchParams.get('pageToken') || '';

    if (arquivoId) {
      if (!ID_RE.test(arquivoId)) return json({ error: 'id inválido' }, 400);
      const token = await driveToken();
      const meta = await fetch(
        `https://www.googleapis.com/drive/v3/files/${arquivoId}?fields=id,name,mimeType&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!meta.ok) return json({ error: 'documento não encontrado' }, 404);
      const info = await meta.json();

      // Google Docs/Sheets precisam ser exportados; demais baixam direto.
      const ehGoogle = String(info.mimeType || '').startsWith('application/vnd.google-apps');
      const alvo = ehGoogle
        ? `https://www.googleapis.com/drive/v3/files/${arquivoId}/export?mimeType=application%2Fpdf`
        : `https://www.googleapis.com/drive/v3/files/${arquivoId}?alt=media&supportsAllDrives=true`;
      const res = await fetch(alvo, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const detalhe = await res.text();
        console.error(`drive download ${res.status}: ${detalhe.slice(0, 300)}`);
        return json({ error: 'falha ao baixar do Drive', status: res.status, details: detalhe.slice(0, 300) }, res.status);
      }
      const nome = String(info.name || 'documento').replace(/["\\]/g, '');
      return new Response(res.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': ehGoogle ? 'application/pdf' : (info.mimeType || 'application/octet-stream'),
          'Content-Disposition': `inline; filename="${ehGoogle ? `${nome}.pdf` : nome}"`,
          'Cache-Control': 'private, max-age=300',
        },
      });
    }

    if (!ID_RE.test(pastaId)) return json({ error: 'pasta inválida' }, 400);

    const chave = `${pastaId}|${busca}|${pageToken}`;
    const emCache = cache.get(chave);
    if (emCache && Date.now() - emCache.at < CACHE_TTL) return json(emCache.body);

    const token = await driveToken();
    const filtros = [`'${escapar(pastaId)}' in parents`, 'trashed=false'];
    if (busca) filtros.push(`name contains '${escapar(busca)}'`);
    const params = new URLSearchParams({
      q: filtros.join(' and '),
      fields: 'nextPageToken, files(id,name,mimeType,size,modifiedTime,webViewLink)',
      pageSize: '100',
      orderBy: 'folder,name',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const data = await drive(token, params);
    const body = {
      ok: true,
      pastaId,
      raiz: pastaId === raiz,
      itens: (data.files ?? []).map(mapear),
      nextPageToken: data.nextPageToken ?? null,
    };
    cache.set(chave, { at: Date.now(), body });
    if (cache.size > 300) cache.clear();
    return json(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('documentos-listar:', msg);
    return json({ error: msg }, 500);
  }
});
