import { CapacitorHttp } from '@capacitor/core';

export interface OutlineItem {
  titulo: string;
  pagina: number;
  nivel: number;
}

export interface Match {
  pagina: number;
  trecho: string;
}

export const BOOKMARK_KEY = (url: string) => `pdf-reader:bookmark:${url}`;
export const PAGE_KEY = (url: string) => `pdf-reader:page:${url}`;

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

/**
 * Normaliza URLs de compartilhamento comuns (Drive/Dropbox) para o
 * arquivo binário direto. Sem isso, pdf.js recebe uma página HTML
 * (viewer do Drive) e falha com "Invalid PDF structure".
 */
export function normalizePdfUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Google Drive: /file/d/<id>/... ou ?id=<id>
    if (/(^|\.)drive\.google\.com$/.test(u.hostname) || /(^|\.)googleusercontent\.com$/.test(u.hostname)) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1] || u.searchParams.get('id');
      if (id) return `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
    }
    // Dropbox: ?dl=0 -> ?dl=1
    if (/dropbox\.com$/.test(u.hostname)) {
      u.searchParams.set('dl', '1');
      return u.toString();
    }
    return raw;
  } catch {
    return raw;
  }
}

/**
 * Em plataforma nativa (Android/iOS), a webview do Capacitor bloqueia várias
 * respostas cross-origin (CORS/redirect). Baixa via CapacitorHttp (que roda
 * fora da webview) e devolve os bytes para o pdf.js consumir.
 */
export async function fetchPdfBytes(url: string): Promise<Uint8Array> {
  const res = await CapacitorHttp.get({
    url,
    responseType: 'arraybuffer',
    headers: { Accept: 'application/pdf,*/*' },
  });
  const data = res.data as any;
  if (typeof data === 'string') {
    // base64
    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array((data as any).buffer);
  throw new Error('Resposta HTTP inesperada ao baixar o PDF.');
}
