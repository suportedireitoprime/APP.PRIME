/**
 * Normaliza URLs de compartilhamento de PDF (Google Drive/Dropbox)
 * para o endpoint binário direto sem redirecionamento 303 ou aviso HTML.
 */
export function normalizePdfUrl(raw: string): string {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    // Google Drive: /file/d/<id>/... ou ?id=<id>
    if (/(^|\.)drive\.google\.com$/.test(u.hostname) || /(^|\.)googleusercontent\.com$/.test(u.hostname)) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1] || u.searchParams.get('id');
      if (id) {
        return `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
      }
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
