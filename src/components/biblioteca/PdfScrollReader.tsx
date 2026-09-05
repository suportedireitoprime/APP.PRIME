import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Loader2, ExternalLink, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  List, Search, X, ZoomIn, ZoomOut, Columns,
} from 'lucide-react';
import { pdfjsLib, configurarPdfWorker } from '@/lib/pdfWorkerConfig';
import { createPortal } from 'react-dom';
import { openPdfNative } from '@/lib/fileOpener';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { logPdfEvent } from '@/lib/pdfTelemetry';

configurarPdfWorker(pdfjsLib);

/**
 * Normaliza URLs de compartilhamento comuns (Drive/Dropbox) para o
 * arquivo binário direto. Sem isso, pdf.js recebe uma página HTML
 * (viewer do Drive) e falha com "Invalid PDF structure".
 */
function normalizePdfUrl(raw: string): string {
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
async function fetchPdfBytes(url: string): Promise<Uint8Array> {
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

interface Props {
  url: string;
  titulo: string;
  onClose: () => void;
  livroId?: number | string | null;
  capaUrl?: string | null;
}

interface OutlineItem { titulo: string; pagina: number; nivel: number }
interface Match { pagina: number; trecho: string }

const BOOKMARK_KEY = (url: string) => `pdf-reader:bookmark:${url}`;
const PAGE_KEY = (url: string) => `pdf-reader:page:${url}`;

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Leitor de PDF com suporte a scroll contínuo e modo página dupla (lado a lado) no desktop.
 * Renderiza páginas em <canvas> conforme entram no viewport.
 */
const PdfScrollReader = ({ url, titulo, onClose, livroId, capaUrl }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<any>(null);
  const renderedRef = useRef<Set<number>>(new Set());
  const renderTasksRef = useRef<Map<number, any>>(new Map());
  const pagesRef = useRef<Map<number, any>>(new Map());
  const startedAtRef = useRef<number>(Date.now());
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmark, setBookmark] = useState<number | null>(() => {
    const v = localStorage.getItem(BOOKMARK_KEY(url));
    return v ? Number(v) : null;
  });
  const [showSumario, setShowSumario] = useState(false);
  const [showBusca, setShowBusca] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [zoom, setZoom] = useState(1);
  const isNative = Capacitor.isNativePlatform();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const [dualPage, setDualPage] = useState<boolean>(() => isDesktop);
  const [promptContinuarPage, setPromptContinuarPage] = useState<number | null>(null);

  useEffect(() => {
    if (isNative && !isDesktop) {
      ScreenOrientation.lock({ type: 'portrait' }).catch(() => {});
    }
    return () => {
      if (isNative && !isDesktop) {
        ScreenOrientation.unlock().catch(() => {});
      }
    };
  }, [isNative, isDesktop]);

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
      
      renderTasksRef.current.forEach((task) => {
        try { task.cancel(); } catch {}
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
  }, [url, livroId, titulo]);

  useEffect(() => {
    if (loading || error || !totalPages || !containerRef.current) return;
    const container = containerRef.current;
    let observer: IntersectionObserver | null = null;
    let rafId = 0;

    rafId = requestAnimationFrame(() => {
      const pages = Array.from(container.querySelectorAll<HTMLDivElement>('[data-page]'));
      if (pages.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target as HTMLDivElement;
            const idx = Number(el.dataset.page);
            if (entry.isIntersecting) {
              renderPage(idx, el);
              if (entry.intersectionRatio > 0.5) setCurrentPage(idx);
            } else {
              // Virtualização: limpa a página se ela sair da viewport
              if (renderedRef.current.has(idx)) {
                // Cancela renderização em andamento se houver
                const pendingTask = renderTasksRef.current.get(idx);
                if (pendingTask) {
                  try { pendingTask.cancel(); } catch {}
                  renderTasksRef.current.delete(idx);
                }

                // Libera memória bruta do canvas (evita leaks no iOS Safari)
                const oldCanvas = el.querySelector('canvas');
                if (oldCanvas) {
                  oldCanvas.width = 0;
                  oldCanvas.height = 0;
                }

                el.style.minHeight = `${el.clientHeight}px`;
                el.innerHTML = `<div class="text-neutral-400 text-xs py-8 w-full h-full flex items-center justify-center">Página ${idx}</div>`;
                renderedRef.current.delete(idx);

                // Libera a memória interna que o PDF.js alocou para as estruturas dessa página
                const pageObj = pagesRef.current.get(idx);
                if (pageObj) {
                  try { pageObj.cleanup(); } catch {}
                  pagesRef.current.delete(idx);
                }
              }
            }
          });
        },
        { root: container, rootMargin: '800px 0px', threshold: [0, 0.5] }
      );
      pages.forEach((p) => observer!.observe(p));
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [loading, error, totalPages, dualPage]);

  // Persiste página atual
  const finishedRef = useRef(false);
  useEffect(() => {
    if (currentPage > 0) localStorage.setItem(PAGE_KEY(url), String(currentPage));
    if (currentPage > 0 && currentPage === totalPages && !finishedRef.current) {
      finishedRef.current = true;
      import('@/lib/nativeHaptics').then(m => m.haptic.success());
    }
  }, [currentPage, url, totalPages]);

  // Navegação por teclado
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPage, totalPages, dualPage]);

  const renderPage = async (idx: number, host: HTMLDivElement) => {
    if (renderedRef.current.has(idx)) return;
    renderedRef.current.add(idx);
    try {
      const pdf = pdfRef.current;
      if (!pdf) return;
      const page = await pdf.getPage(idx);
      pagesRef.current.set(idx, page);
      
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const targetWidth = dualPage
        ? Math.min((containerWidth - 60) / 2, 600)
        : Math.min(containerWidth - 24, 900);
      const viewport = page.getViewport({ scale: 1 });
      const scale = (targetWidth / viewport.width) * (window.devicePixelRatio || 1);
      const finalVp = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = finalVp.width;
      canvas.height = finalVp.height;
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      canvas.style.margin = '0 auto';
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const renderTask = page.render({ canvasContext: ctx, viewport: finalVp, canvas } as any);
      renderTasksRef.current.set(idx, renderTask);
      
      try {
        await renderTask.promise;
      } catch (e: any) {
        if (e?.name === 'RenderingCancelledException') {
          // Renderização cancelada pelo IntersectionObserver (página saiu da tela)
          return;
        }
        throw e;
      } finally {
        renderTasksRef.current.delete(idx);
      }

      host.innerHTML = '';
      host.appendChild(canvas);
    } catch (e) {
      console.warn('[PdfScrollReader] render page', idx, e);
      renderedRef.current.delete(idx);
      logPdfEvent({
        url, event: 'render_error', livroId, livroTitulo: titulo,
        errorMessage: `page ${idx}: ${String((e as any)?.message || e)}`,
      });
    }
  };

  const scrollToPage = (idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current?.querySelector<HTMLDivElement>(`[data-page="${idx}"]`);
    if (el) el.scrollIntoView({ behavior, block: 'start' });
  };

  const goPrev = () => {
    const step = dualPage ? 2 : 1;
    scrollToPage(Math.max(1, currentPage - step));
  };
  const goNext = () => {
    const step = dualPage ? 2 : 1;
    scrollToPage(Math.min(totalPages, currentPage + step));
  };

  // ---- Zoom em pinça (dois dedos) + botões ----
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const dist2 = (t: TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { dist: dist2(e.touches as any), zoom };
    }
  }, [zoom]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const d = dist2(e.touches as any);
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (pinchRef.current.zoom * d) / pinchRef.current.dist));
      setZoom(Number(next.toFixed(3)));
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
  }, []);

  const ajustarZoom = (delta: number) =>
    setZoom((z) => Number(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)).toFixed(3)));

  // ---- Busca por palavra ----
  const buscar = async (q: string) => {
    const alvo = q.trim();
    if (alvo.length < 2 || !pdfRef.current) { setMatches(null); return; }
    setBuscando(true);
    try {
      const pdf = pdfRef.current;
      const alvoNormalized = alvo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const achados: Match[] = [];
      
      const fetchPageText = async (i: number) => {
        let pageObj: any = null;
        try {
          pageObj = await pdf.getPage(i);
          const content = await pageObj.getTextContent();
          const texto = content.items.map((it: any) => it.str).join(' ').replace(/\s+/g, ' ');
          const textoNormalized = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const pos = textoNormalized.indexOf(alvoNormalized);
          if (pos >= 0) {
            return {
              pagina: i,
              trecho: texto.slice(Math.max(0, pos - 50), pos + alvo.length + 60).trim(),
            };
          }
        } catch {} finally {
          if (pageObj) {
            try { pageObj.cleanup(); } catch {}
          }
        }
        return null;
      };

      const promises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        promises.push(fetchPageText(i));
      }
      
      const chunkSize = 20;
      for (let i = 0; i < promises.length; i += chunkSize) {
        const chunk = await Promise.all(promises.slice(i, i + chunkSize));
        chunk.forEach(res => {
          if (res && achados.length < 80) achados.push(res);
        });
        if (achados.length >= 80) break;
      }
      
      achados.sort((a, b) => a.pagina - b.pagina);
      setMatches(achados);
      if (!achados.length) toast.info('Nenhuma ocorrência encontrada');
    } finally {
      setBuscando(false);
    }
  };

  const toggleBookmark = () => {
    if (bookmark === currentPage) {
      setBookmark(null);
      localStorage.removeItem(BOOKMARK_KEY(url));
      toast.success('Marcador removido');
    } else {
      setBookmark(currentPage);
      localStorage.setItem(BOOKMARK_KEY(url), String(currentPage));
      toast.success(`Página ${currentPage} marcada`);
    }
  };

  const jumpToBookmark = () => {
    if (bookmark) scrollToPage(bookmark);
  };

  const openNativo = () => openPdfNative(url, `${titulo}.pdf`);

  const progress = totalPages ? (currentPage / totalPages) * 100 : 0;

  const reader = (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="fixed inset-0 z-[1300] h-[100dvh] max-h-[100dvh] bg-neutral-900 flex flex-col overflow-hidden"
    >
      {/* Prompt: Continuar de onde parou */}
      <AnimatePresence>
        {promptContinuarPage != null && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 inset-x-4 mx-auto sm:left-1/2 sm:-translate-x-1/2 z-[1400] max-w-sm w-[calc(100%-2rem)] bg-neutral-950/95 border border-rose-500/40 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Continuar de onde parou?
                </p>
                <p className="text-xs text-neutral-300 mt-1">
                  Sua última leitura foi na <strong className="text-white">página {promptContinuarPage}</strong>.
                </p>
              </div>
              <button
                onClick={() => setPromptContinuarPage(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  scrollToPage(promptContinuarPage);
                  setCurrentPage(promptContinuarPage);
                  setPromptContinuarPage(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition"
              >
                Ir para pág. {promptContinuarPage}
              </button>
              <button
                onClick={() => {
                  scrollToPage(1);
                  setCurrentPage(1);
                  setPromptContinuarPage(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-semibold active:scale-95 transition"
              >
                Pág. 1
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        className="flex items-center gap-3 shrink-0 bg-neutral-950/95 backdrop-blur border-b border-white/5"
        style={{
          paddingTop: 'calc(var(--sai-top) + 0.875rem)',
          paddingBottom: '0.875rem',
          paddingLeft: 'calc(1rem + var(--sai-left))',
          paddingRight: 'calc(1rem + var(--sai-right))',
          minHeight: 'calc(5rem + var(--sai-top))',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Voltar"
          className="w-12 h-12 md:w-11 md:h-11 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/15 flex items-center justify-center shrink-0 active:scale-95 transition"
        >
          <ArrowLeft className="w-[22px] h-[22px] text-white" />
        </button>
        <p className="flex-1 min-w-0 text-center font-display text-[18px] md:text-[17px] font-semibold text-white tracking-wide truncate">
          {titulo}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {isDesktop && (
            <button
              onClick={() => setDualPage((d) => !d)}
              title={dualPage ? 'Alternar para visão de 1 página' : 'Alternar para visão lado a lado (2 páginas)'}
              className={`px-3 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition ${
                dualPage
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/[0.06] border-white/10 text-neutral-300 hover:bg-white/15'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">{dualPage ? '2 Páginas' : '1 Página'}</span>
            </button>
          )}
          <button
            onClick={() => setShowBusca(true)}
            aria-label="Procurar no PDF"
            className="w-12 h-12 md:w-11 md:h-11 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/15 flex items-center justify-center transition"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Área de leitura */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-auto overscroll-contain"
          style={{ touchAction: zoom > 1 ? 'pan-x pan-y' : 'pan-y' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading-overlay"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-white z-[50]"
              >
              {capaUrl && (
                <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
                  <img src={capaUrl} alt="" className="w-full h-full object-cover blur-[100px] scale-125 mix-blend-screen" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950" />
                </div>
              )}
              
              <div className="z-10 flex flex-col items-center w-full max-w-xs px-6">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className="relative w-32 h-44 mb-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden ring-1 ring-white/10"
                >
                  {capaUrl ? (
                    <img src={capaUrl} alt="Capa" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <List className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                  
                  {/* Sweep loading overlay */}
                  <motion.div 
                    initial={{ top: '100%' }}
                    animate={{ top: `${100 - loadingProgress}%` }}
                    className="absolute inset-x-0 bottom-0 bg-primary/20 backdrop-blur-[2px] transition-all duration-300 ease-out"
                  />
                </motion.div>

                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-display font-semibold text-lg text-center mb-1 text-white/90"
                >
                  {titulo}
                </motion.h3>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-white/50 mb-6 font-medium uppercase tracking-widest"
                >
                  Preparando documento...
                </motion.p>
                
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
                <div className="w-full flex justify-between mt-2 text-[10px] text-white/40 font-semibold tabular-nums">
                  <span>Carregando</span>
                  <span>{loadingProgress}%</span>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-white/80 gap-3 px-6 text-center">
              <p className="text-sm">{error}</p>
              {isNative && (
                <button
                  onClick={openNativo}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
                >
                  Abrir no visualizador nativo
                </button>
              )}
            </div>
          )}
          {!loading && !error && !dualPage && (
            <div
              className="py-4 pb-44 space-y-3"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: `${100 / zoom}%`,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={i}
                  data-page={i + 1}
                  className="mx-auto bg-white rounded shadow-lg min-h-[400px] flex items-center justify-center overflow-hidden"
                  style={{ maxWidth: 900 }}
                >
                  <div className="text-neutral-400 text-xs py-8">Página {i + 1}</div>
                </div>
              ))}
            </div>
          )}
          {!loading && !error && dualPage && (
            <div
              className="py-6 pb-44 px-4 flex flex-wrap items-start justify-center gap-6"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: `${100 / zoom}%`,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {Array.from({ length: Math.ceil(totalPages / 2) }).map((_, spreadIdx) => {
                const p1 = spreadIdx * 2 + 1;
                const p2 = spreadIdx * 2 + 2;
                return (
                  <div
                    key={`spread-${spreadIdx}`}
                    className="w-full flex flex-col md:flex-row items-center justify-center gap-4 border-b border-white/5 pb-8 mb-4"
                  >
                    <div
                      data-page={p1}
                      className="bg-white rounded-lg shadow-2xl min-h-[450px] flex items-center justify-center overflow-hidden"
                      style={{ maxWidth: 600, width: '100%' }}
                    >
                      <div className="text-neutral-400 text-xs py-8">Página {p1}</div>
                    </div>
                    {p2 <= totalPages && (
                      <div
                        data-page={p2}
                        className="bg-white rounded-lg shadow-2xl min-h-[450px] flex items-center justify-center overflow-hidden"
                        style={{ maxWidth: 600, width: '100%' }}
                      >
                        <div className="text-neutral-400 text-xs py-8">Página {p2}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Zonas laterais de toque para navegar por página (desligadas com zoom) */}
        {!loading && !error && zoom === 1 && (
          <>
            <button
              type="button"
              aria-label="Página anterior"
              onClick={goPrev}
              className="absolute left-0 top-0 bottom-32 w-[18%] z-[2]"
            />
            <button
              type="button"
              aria-label="Próxima página"
              onClick={goNext}
              className="absolute right-0 top-0 bottom-32 w-[18%] z-[2]"
            />
          </>
        )}

        {/* Controles de zoom */}
        {!loading && !error && (
          <div className="absolute right-3 bottom-48 z-[4] flex flex-col gap-2">
            <button
              onClick={() => ajustarZoom(0.25)}
              aria-label="Aumentar zoom"
              className="w-11 h-11 rounded-full bg-neutral-950/85 border border-white/10 text-white flex items-center justify-center backdrop-blur shadow-lg"
            >
              <ZoomIn className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => ajustarZoom(-0.25)}
              aria-label="Diminuir zoom"
              disabled={zoom <= MIN_ZOOM}
              className="w-11 h-11 rounded-full bg-neutral-950/85 border border-white/10 text-white flex items-center justify-center backdrop-blur shadow-lg disabled:opacity-30"
            >
              <ZoomOut className="w-[18px] h-[18px]" />
            </button>
            {zoom > 1 && (
              <button
                onClick={() => setZoom(1)}
                className="px-2 py-1 rounded-full bg-neutral-950/85 border border-white/10 text-white text-[10px] tabular-nums backdrop-blur"
              >
                {Math.round(zoom * 100)}%
              </button>
            )}
          </div>
        )}

        {/* Botão flutuante para retomar marcador */}
        {bookmark && bookmark !== currentPage && (
          <button
            onClick={jumpToBookmark}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg flex items-center gap-2 z-[3]"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            Ir para p.{bookmark}
          </button>
        )}
      </div>

      {/* Menu de rodapé */}
      {!loading && !error && totalPages > 0 && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-[1310] border-t border-white/10 bg-neutral-950/95 backdrop-blur-xl shadow-2xl"
          style={{ paddingBottom: 'var(--sai-bottom)' }}
        >
          <div className="px-5 pt-3 pb-2 flex items-center gap-3 text-[11px] text-white/70">
            <span className="tabular-nums">{currentPage} / {totalPages}</span>
            <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-primary"
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              />
            </div>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>

          <div className="flex items-center justify-around px-2 pb-3 pt-1">
            <button
              onClick={goPrev}
              disabled={currentPage <= 1}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={toggleBookmark}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
              title="Marcador"
            >
              {bookmark === currentPage
                ? <BookmarkCheck className="w-[18px] h-[18px] text-primary" />
                : <Bookmark className="w-[18px] h-[18px]" />}
            </button>
            <button
              onClick={() => setShowBusca(true)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
              title="Procurar palavra"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSumario(true)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
              title="Sumário"
            >
              <List className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={goNext}
              disabled={currentPage >= totalPages}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Sumário — bottom sheet responsivo, acima do rodapé */}
      <AnimatePresence>
        {showSumario && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSumario(false)}
              className="fixed inset-0 bg-black/70 z-[1320]"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-[1330] mx-auto w-full sm:max-w-lg bg-neutral-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl sm:bottom-6 flex flex-col max-h-[75dvh] shadow-2xl"
              style={{ paddingBottom: 'var(--sai-bottom)' }}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
                <List className="w-4 h-4 text-primary" />
                <p className="flex-1 text-white text-sm font-semibold">Sumário</p>
                <button
                  onClick={() => setShowSumario(false)}
                  aria-label="Fechar sumário"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const input = form.elements.namedItem('page') as HTMLInputElement;
                  const n = Math.max(1, Math.min(totalPages, Number(input.value) || 1));
                  scrollToPage(n);
                  setShowSumario(false);
                }}
                className="flex gap-2 px-4 py-3 shrink-0"
              >
                <input
                  name="page"
                  type="number"
                  min={1}
                  max={totalPages}
                  defaultValue={currentPage}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/10 text-white text-sm outline-none border border-white/10 focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shrink-0"
                >
                  Ir p/ página
                </button>
              </form>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pb-4">
                {outline.length === 0 ? (
                  <p className="text-white/50 text-xs px-3 py-6 text-center">
                    Este PDF não tem sumário embutido. Use o campo acima para ir direto a uma página (1 – {totalPages}).
                  </p>
                ) : (
                  outline.map((it, i) => (
                    <button
                      key={i}
                      onClick={() => { scrollToPage(it.pagina); setShowSumario(false); }}
                      className="w-full flex items-center gap-3 text-left px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition"
                      style={{ paddingLeft: 12 + it.nivel * 14 }}
                    >
                      <span className="flex-1 min-w-0 text-white text-sm truncate">{it.titulo}</span>
                      <span className="text-white/45 text-xs tabular-nums shrink-0">{it.pagina}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Busca por palavra */}
      <AnimatePresence>
        {showBusca && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBusca(false)}
              className="fixed inset-0 bg-black/70 z-[1320]"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-[1330] mx-auto w-full sm:max-w-lg bg-neutral-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl sm:bottom-6 flex flex-col max-h-[75dvh] shadow-2xl"
              style={{ paddingBottom: 'var(--sai-bottom)' }}
            >
              <form
                onSubmit={(e) => { e.preventDefault(); buscar(termo); }}
                className="flex items-center gap-2 px-4 py-3 border-b border-white/10 shrink-0"
              >
                <Search className="w-4 h-4 text-white/60 shrink-0" />
                <input
                  autoFocus
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  placeholder="Procurar palavra no livro…"
                  className="flex-1 min-w-0 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
                />
                <button
                  type="submit"
                  disabled={buscando || termo.trim().length < 2}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0 disabled:opacity-40"
                >
                  {buscando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBusca(false)}
                  aria-label="Fechar busca"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </form>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2">
                {buscando && (
                  <p className="text-white/60 text-xs px-3 py-6 text-center">Procurando nas {totalPages} páginas…</p>
                )}
                {!buscando && matches?.length === 0 && (
                  <p className="text-white/50 text-xs px-3 py-6 text-center">Nenhuma ocorrência encontrada.</p>
                )}
                {!buscando && matches?.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => { scrollToPage(m.pagina); setShowBusca(false); }}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition"
                  >
                    <p className="text-primary text-[11px] font-semibold mb-0.5">Página {m.pagina}</p>
                    <p className="text-white/75 text-xs line-clamp-2">…{m.trecho}…</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return typeof document === 'undefined' ? reader : createPortal(reader, document.body);
};

export default PdfScrollReader;
