import { useEffect, useRef, useState } from 'react';
import { pdfjsLib } from '@/lib/pdfWorkerConfig';
import { Capacitor } from '@capacitor/core';
import { logPdfEvent } from '@/lib/pdfTelemetry';
import {
  type OutlineItem,
  normalizePdfUrl,
  fetchPdfBytes,
  PAGE_KEY,
} from './pdfReaderTypes';

interface UsePdfDocumentOptions {
  url: string;
  titulo: string;
  livroId?: number | string | null;
  renderTasksRef: React.MutableRefObject<Map<number, any>>;
  pagesRef: React.MutableRefObject<Map<number, any>>;
  renderedRef: React.MutableRefObject<Set<number>>;
}

export function usePdfDocument({
  url,
  titulo,
  livroId,
  renderTasksRef,
  pagesRef,
  renderedRef,
}: UsePdfDocumentOptions) {
  const pdfRef = useRef<any>(null);
  const startedAtRef = useRef<number>(Date.now());
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [promptContinuarPage, setPromptContinuarPage] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let timedOut = false;
    let localBlobUrl: string | null = null;
    startedAtRef.current = Date.now();
    logPdfEvent({ url, event: 'load_start', livroId, livroTitulo: titulo });

    (async () => {
      try {
        const normalizedUrl = normalizePdfUrl(url);
        const isNativeNow = Capacitor.isNativePlatform();
        const isLocalMem = normalizedUrl.startsWith('blob:') || normalizedUrl.startsWith('data:');

        let source: any;
        if (isNativeNow && !isLocalMem) {
          const bytes = await fetchPdfBytes(normalizedUrl);
          const blob = new Blob([bytes.buffer], { type: 'application/pdf' });
          localBlobUrl = URL.createObjectURL(blob);
          source = { url: localBlobUrl, withCredentials: false };
        } else {
          source = { url: normalizedUrl, withCredentials: false };
        }

        const task = pdfjsLib.getDocument(source);

        try {
          (task as any).onProgress = (p: { loaded: number; total: number }) => {
            if (p?.total) {
              setLoadingProgress(Math.round((p.loaded / p.total) * 100));
            }
          };
        } catch {}

        // Timeout de 25s — evita loading infinito quando o servidor não responde/CORS.
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = window.setTimeout(() => {
            timedOut = true;
            reject(new Error('Tempo esgotado ao carregar o PDF (25s).'));
          }, 25000);
        });
        const pdf = (await Promise.race([task.promise, timeoutPromise])) as any;
        if (timeoutId) window.clearTimeout(timeoutId);
        if (cancelled) return;
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);
        setLoading(false);
        logPdfEvent({
          url,
          event: 'load_success',
          livroId,
          livroTitulo: titulo,
          durationMs: Date.now() - startedAtRef.current,
          totalPages: pdf.numPages,
        });

        // Sumário (outline) do documento — resolve destinos em números de página
        try {
          const raw = await pdf.getOutline();
          if (raw?.length) {
            const itens: OutlineItem[] = [];
            const walk = async (nodes: any[], nivel: number) => {
              for (const n of nodes) {
                let pagina = 0;
                try {
                  const dest = typeof n.dest === 'string' ? await pdf.getDestination(n.dest) : n.dest;
                  if (dest?.[0]) pagina = (await pdf.getPageIndex(dest[0])) + 1;
                } catch {}
                if (n.title) itens.push({ titulo: String(n.title).trim(), pagina: pagina || 1, nivel });
                if (n.items?.length) await walk(n.items, nivel + 1);
              }
            };
            await walk(raw, 0);
            if (!cancelled) setOutline(itens);
          }
        } catch {}

        // Verifica progresso salvo para o prompt "Continuar de onde parou"
        const savedPage = Number(localStorage.getItem(PAGE_KEY(url)) || '1');
        if (savedPage > 1 && savedPage <= pdf.numPages) {
          setPromptContinuarPage(savedPage);
        }
      } catch (e: any) {
        console.error('[PdfScrollReader]', e);
        if (!cancelled) {
          setError(e?.message || 'Falha ao carregar o PDF.');
          setLoading(false);
          logPdfEvent({
            url,
            event: timedOut ? 'load_timeout' : 'load_error',
            livroId,
            livroTitulo: titulo,
            durationMs: Date.now() - startedAtRef.current,
            errorMessage: String(e?.message || e),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);

      renderTasksRef.current.forEach((t) => {
        try { t.cancel(); } catch {}
      });
      renderTasksRef.current.clear();

      pagesRef.current.forEach((page) => {
        try { page.cleanup(); } catch {}
      });
      pagesRef.current.clear();

      if (pdfRef.current) {
        try {
          pdfRef.current.destroy();
        } catch {}
      }
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
      pdfRef.current = null;
      renderedRef.current.clear();
    };
  }, [url, livroId, titulo, renderTasksRef, pagesRef, renderedRef]);

  return {
    pdfRef,
    totalPages,
    loading,
    loadingProgress,
    error,
    outline,
    promptContinuarPage,
    setPromptContinuarPage,
  };
}
