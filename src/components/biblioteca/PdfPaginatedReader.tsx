import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Loader2, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  Columns, Square, X, Search, List
} from 'lucide-react';
import { pdfjsLib, configurarPdfWorker } from '@/lib/pdfWorkerConfig';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { toast } from 'sonner';
import { logPdfEvent } from '@/lib/pdfTelemetry';
import pageTurnAsset from '@/assets/page-turn.mp3.asset.json';

configurarPdfWorker(pdfjsLib);

function normalizePdfUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (/(^|\.)drive\.google\.com$/.test(u.hostname) || /(^|\.)googleusercontent\.com$/.test(u.hostname)) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1] || u.searchParams.get('id');
      if (id) return `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
    }
    if (/dropbox\.com$/.test(u.hostname)) {
      u.searchParams.set('dl', '1');
      return u.toString();
    }
    return raw;
  } catch {
    return raw;
  }
}

async function fetchPdfBytes(url: string): Promise<Uint8Array> {
  const res = await CapacitorHttp.get({
    url,
    responseType: 'arraybuffer',
    headers: { Accept: 'application/pdf,*/*' },
  });
  const data = res.data as any;
  if (typeof data === 'string') {
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

const BOOKMARK_KEY = (url: string) => `pdf-reader:bookmark:${url}`;
const PAGE_KEY = (url: string) => `pdf-reader:page:${url}`;

const PdfPaginatedReader = ({ url, titulo, onClose, livroId }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<any>(null);
  const renderTasksRef = useRef<Map<number, any>>(new Map());
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
  
  const [dualPage, setDualPage] = useState<boolean>(true);

  // Load PDF
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
        
        let pdf: any;
        
        const tryLoad = async (sourceUrl: string) => {
          let source: any;
          if (isNativeNow && !isLocalMem) {
            const bytes = await fetchPdfBytes(sourceUrl);
            const blob = new Blob([bytes.buffer], { type: 'application/pdf' });
            localBlobUrl = URL.createObjectURL(blob);
            source = { url: localBlobUrl, withCredentials: false };
          } else {
            source = { url: sourceUrl, withCredentials: false };
          }
          
          const task = pdfjsLib.getDocument(source);
          try {
            (task as any).onProgress = (p: { loaded: number; total: number }) => {
              if (p?.total) setLoadingProgress(Math.round((p.loaded / p.total) * 100));
            };
          } catch {}

          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = window.setTimeout(() => {
              timedOut = true;
              reject(new Error('Tempo esgotado ao carregar o PDF (25s).'));
            }, 25000);
          });
          return await Promise.race([task.promise, timeoutPromise]);
        };

        try {
          pdf = await tryLoad(normalizedUrl);
        } catch (e: any) {
          if (!isNativeNow && e.name !== 'TimeoutError') {
             console.warn("Normal fetch failed, trying CORS proxy");
             pdf = await tryLoad(`https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`);
          } else {
             throw e;
          }
        }

        if (timeoutId) window.clearTimeout(timeoutId);
        if (cancelled) return;
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);
        setLoading(false);
        logPdfEvent({
          url, event: 'load_success', livroId, livroTitulo: titulo,
          durationMs: Date.now() - startedAtRef.current, totalPages: pdf.numPages,
        });

        const savedPage = Number(localStorage.getItem(PAGE_KEY(url)) || '1');
        if (savedPage > 1 && savedPage <= pdf.numPages) {
          setCurrentPage(savedPage);
        }
      } catch (e: any) {
        console.error('[PdfPaginatedReader]', e);
        if (!cancelled) {
          setError(e?.message || 'Falha ao carregar o PDF.');
          setLoading(false);
          logPdfEvent({
            url, event: timedOut ? 'load_timeout' : 'load_error', livroId, livroTitulo: titulo,
            durationMs: Date.now() - startedAtRef.current, errorMessage: String(e?.message || e),
          });
        }
      }
    })();
    
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      renderTasksRef.current.forEach((task) => { try { task.cancel(); } catch {} });
      renderTasksRef.current.clear();
      if (pdfRef.current) { try { pdfRef.current.destroy(); } catch {} }
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
      pdfRef.current = null;
    };
  }, [url, livroId, titulo]);

  useEffect(() => {
    if (currentPage > 0) localStorage.setItem(PAGE_KEY(url), String(currentPage));
  }, [currentPage, url]);

  const playTurnSound = () => {
    if (!pageTurnAsset?.url) return;
    try {
      const audio = new Audio(pageTurnAsset.url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  };

  const goPrev = () => {
    const step = dualPage ? 2 : 1;
    setCurrentPage(p => {
      const n = Math.max(1, p - step);
      if (n !== p) playTurnSound();
      return n;
    });
  };
  
  const goNext = () => {
    const step = dualPage ? 2 : 1;
    setCurrentPage(p => {
      const n = Math.min(totalPages, p + step);
      if (n !== p) playTurnSound();
      return n;
    });
  };

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
  }, [totalPages, dualPage]);

  return (
    <div className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col theme-vademecum">
      <div className="h-14 border-b border-white/10 bg-zinc-900/50 flex items-center px-4 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 ml-3">
          <h2 className="text-white font-medium text-sm sm:text-base truncate">{titulo}</h2>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => setDualPage(!dualPage)}
            className="p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            title={dualPage ? 'Uma página' : 'Duas páginas'}
          >
            {dualPage ? <Square className="w-5 h-5" /> : <Columns className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => {
              if (bookmark === currentPage) {
                setBookmark(null);
                localStorage.removeItem(BOOKMARK_KEY(url));
                toast('Marcação removida.');
              } else {
                setBookmark(currentPage);
                localStorage.setItem(BOOKMARK_KEY(url), String(currentPage));
                toast.success('Página marcada');
              }
            }}
            className={`p-2 transition-colors rounded-lg hover:bg-white/10 ${bookmark === currentPage ? 'text-primary' : 'text-white/70 hover:text-white'}`}
          >
            {bookmark === currentPage ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-zinc-950 flex flex-col" ref={containerRef}>
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <div className="text-white/60 text-sm">Carregando PDF... {loadingProgress}%</div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Falha ao abrir PDF</h3>
            <p className="text-red-400 text-sm mb-6 max-w-md">{error}</p>
            <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
              Voltar
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full w-full">
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8 min-h-0 w-full overflow-hidden">
              <div className="relative flex items-center justify-center max-w-[1400px] w-full h-full gap-4">
                <button 
                  onClick={goPrev} 
                  disabled={currentPage <= 1}
                  className="hidden md:flex shrink-0 w-12 h-12 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="flex-1 flex justify-center items-center h-full min-w-0">
                  <div className={`flex justify-center items-center h-full gap-1 sm:gap-2 ${dualPage ? 'w-full' : 'w-auto'}`}>
                    <PdfPage 
                      pdf={pdfRef.current} 
                      pageNumber={currentPage} 
                      isDual={dualPage} 
                      containerRef={containerRef}
                      renderTasksRef={renderTasksRef}
                    />
                    {dualPage && currentPage + 1 <= totalPages && (
                      <PdfPage 
                        pdf={pdfRef.current} 
                        pageNumber={currentPage + 1} 
                        isDual={dualPage} 
                        containerRef={containerRef}
                        renderTasksRef={renderTasksRef}
                      />
                    )}
                  </div>
                </div>

                <button 
                  onClick={goNext} 
                  disabled={currentPage >= totalPages}
                  className="hidden md:flex shrink-0 w-12 h-12 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="h-16 shrink-0 border-t border-white/5 bg-zinc-900/50 flex items-center justify-between px-4 sm:px-6 md:hidden">
              <button 
                onClick={goPrev} 
                disabled={currentPage <= 1}
                className="p-2 text-white/70 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-sm text-white/50 font-medium">
                {currentPage} {dualPage && currentPage + 1 <= totalPages ? `- ${currentPage + 1}` : ''} / {totalPages}
              </div>
              <button 
                onClick={goNext} 
                disabled={currentPage >= totalPages}
                className="p-2 text-white/70 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs text-white/70 font-medium border border-white/10">
              Página {currentPage} {dualPage && currentPage + 1 <= totalPages ? `- ${currentPage + 1}` : ''} de {totalPages}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PdfPage = ({ 
  pdf, 
  pageNumber, 
  isDual, 
  containerRef,
  renderTasksRef
}: { 
  pdf: any, 
  pageNumber: number, 
  isDual: boolean,
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  renderTasksRef: React.MutableRefObject<Map<number, any>>
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let renderTask: any = null;

    const render = async () => {
      if (!pdf || !canvasRef.current || !containerRef.current) return;
      try {
        setRendered(false);
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const containerHeight = containerRef.current.clientHeight - 60;
        const containerWidth = containerRef.current.clientWidth - 100;
        
        const unscaledViewport = page.getViewport({ scale: 1 });
        
        const maxPageWidth = isDual ? (containerWidth / 2) - 16 : containerWidth;
        const scaleHeight = containerHeight / unscaledViewport.height;
        const scaleWidth = maxPageWidth / unscaledViewport.width;
        
        const baseScale = Math.min(scaleHeight, scaleWidth);
        const finalScale = baseScale * (window.devicePixelRatio || 1);
        
        const finalVp = page.getViewport({ scale: finalScale });
        
        const canvas = canvasRef.current;
        canvas.width = finalVp.width;
        canvas.height = finalVp.height;
        canvas.style.width = `${unscaledViewport.width * baseScale}px`;
        canvas.style.height = `${unscaledViewport.height * baseScale}px`;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        renderTask = page.render({ canvasContext: ctx, viewport: finalVp, canvas } as any);
        renderTasksRef.current.set(pageNumber, renderTask);
        
        await renderTask.promise;
        if (!cancelled) setRendered(true);
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException' && !cancelled) {
          console.warn('[PdfPage] render error:', e);
        }
      } finally {
        renderTasksRef.current.delete(pageNumber);
      }
    };

    render();

    return () => {
      cancelled = true;
      if (renderTask) {
        try { renderTask.cancel(); } catch {}
      }
    };
  }, [pdf, pageNumber, isDual, containerRef]);

  return (
    <div className={`relative bg-white rounded shadow-lg overflow-hidden flex items-center justify-center transition-opacity duration-300 ${rendered ? 'opacity-100' : 'opacity-0'}`}>
      <canvas ref={canvasRef} className="block" />
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      )}
    </div>
  );
};

export default PdfPaginatedReader;
