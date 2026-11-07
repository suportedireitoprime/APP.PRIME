import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

export type PdfEvent =
  | 'load_start'
  | 'load_success'
  | 'load_timeout'
  | 'load_error'
  | 'render_error'
  | 'closed'
  | 'webview_load_start'
  | 'webview_load_success'
  | 'webview_blocked'
  | 'webview_fallback_external';

interface Params {
  url: string;
  event: PdfEvent;
  livroId?: number | string | null;
  livroTitulo?: string;
  durationMs?: number;
  totalPages?: number;
  errorMessage?: string;
}

let pdfEventQueue: Array<{
  url: string;
  event: PdfEvent;
  livroId?: number | string | null;
  livroTitulo?: string;
  durationMs?: number;
  totalPages?: number;
  errorMessage?: string;
}> = [];
let pdfFlushTimeout: any = null;

async function flushPdfEvents() {
  if (pdfEventQueue.length === 0) return;
  const batch = [...pdfEventQueue];
  pdfEventQueue = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    // Se o usuário não estiver autenticado, a política RLS bloqueia insert para anon (42501)
    if (!user) return;

    const payload = batch.map(p => ({
      user_id: user.id,
      livro_id: typeof p.livroId === 'number' ? p.livroId : null,
      livro_titulo: p.livroTitulo ?? null,
      url: p.url,
      event: p.event,
      duration_ms: p.durationMs ?? null,
      total_pages: p.totalPages ?? null,
      error_message: p.errorMessage ?? null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      platform: Capacitor.getPlatform(),
    }));

    await supabase.from('biblioteca_pdf_telemetry').insert(payload);
  } catch (e) {
    console.warn('[pdf-telemetry] batch insert failed', e);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    void flushPdfEvents();
  });
}

/**
 * Registra evento de leitura de PDF/WebView.
 * - Sempre loga no console (com prefixo padronizado) para debug local.
 * - Envia para `biblioteca_pdf_telemetry` com buffer/batching e guarda de autenticação (evita 42501).
 */
export function logPdfEvent(p: Params): void {
  const tag = `[pdf-telemetry] ${p.event}`;
  const payload = {
    url: p.url,
    livro: p.livroTitulo,
    livroId: p.livroId,
    durationMs: p.durationMs,
    totalPages: p.totalPages,
    error: p.errorMessage,
    platform: Capacitor.getPlatform(),
    at: new Date().toISOString(),
  };
  if (p.event.includes('error') || p.event === 'load_timeout' || p.event === 'webview_blocked') {
    console.warn(tag, payload);
  } else {
    console.info(tag, payload);
  }

  // Adiciona ao buffer para envio em lote
  pdfEventQueue.push({
    url: p.url,
    event: p.event,
    livroId: p.livroId,
    livroTitulo: p.livroTitulo,
    durationMs: p.durationMs,
    totalPages: p.totalPages,
    errorMessage: p.errorMessage,
  });

  // Se for erro, encerramento ou acumular mais de 3 eventos, dispara imediatamente
  const isImmediate = p.event.includes('error') || p.event === 'closed' || pdfEventQueue.length >= 3;
  if (isImmediate) {
    if (pdfFlushTimeout) clearTimeout(pdfFlushTimeout);
    pdfFlushTimeout = null;
    void flushPdfEvents();
  } else if (!pdfFlushTimeout) {
    pdfFlushTimeout = setTimeout(() => {
      pdfFlushTimeout = null;
      void flushPdfEvents();
    }, 10000);
  }
}
