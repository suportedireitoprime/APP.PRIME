import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Columns,
  Square,
  X,
  Search,
  List,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Sliders,
} from 'lucide-react';
import {
  pdfjsLib,
  configurarPdfWorker,
  getPdfDocumentParams,
  getPdfUrlParams,
} from '@/lib/pdfWorkerConfig';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { toast } from 'sonner';
import { logPdfEvent } from '@/lib/pdfTelemetry';
import { haptic } from '@/lib/nativeHaptics';
import { DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM } from './pdf/pdfReaderTypes';
import BookPageFlip3D, { type BookPageFlip3DHandle } from './leitor/BookPageFlip3D';
import PdfReaderFooter from './pdf/PdfReaderFooter';
import PdfSumarioSheet from './pdf/PdfSumarioSheet';
import PdfBuscaSheet from './pdf/PdfBuscaSheet';
import PdfAjustesSheet from './pdf/PdfAjustesSheet';
import AssistenteIA from './leitor/AssistenteIA';
import { usePdfSearch } from './pdf/usePdfSearch';
import { TEMAS } from '@/hooks/useLeitorPrefs';
import { AnimatePresence, motion } from 'framer-motion';

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
  urlClara?: string | null;
  urlEscura?: string | null;
  onSwitchVersao?: (versao: 'clara' | 'escura') => void;
  titulo: string;
  onClose: () => void;
  livroId?: number | string | null;
  capaUrl?: string | null;
  onSwitchToScroll?: () => void;
}

const BOOKMARK_KEY = (url: string) => `pdf-reader:bookmark:${url}`;
const PAGE_KEY = (url: string) => `pdf-reader:page:${url}`;

const PdfPaginatedReader = ({
  url,
  urlClara,
  urlEscura,
  onSwitchVersao,
  titulo,
  onClose,
  livroId,
  onSwitchToScroll,
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const flip3DRef = useRef<BookPageFlip3DHandle>(null);
  const pdfRef = useRef<any>(null);
  const renderTasksRef = useRef<Map<number, any>>(new Map());
  const startedAtRef = useRef<number>(Date.now());
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [showBars, setShowBars] = useState(true);
  const [showSumario, setShowSumario] = useState(false);
  const [showBusca, setShowBusca] = useState(false);
  const [showAssistente, setShowAssistente] = useState(false);
  const [showAjustes, setShowAjustes] = useState(false);
  const [outline, setOutline] = useState<any[]>([]);

  const [bookmark, setBookmark] = useState<number | null>(() => {
    const v = localStorage.getItem(BOOKMARK_KEY(url));
    return v ? Number(v) : null;
  });

  const [dualPage, setDualPage] = useState<boolean>(false);
  const isDarkPdf = url.includes('escura') || url.includes('dark');

  const { termo, setTermo, matches, buscando, buscar } = usePdfSearch(pdfRef.current);

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
            source = getPdfDocumentParams(bytes);
          } else {
            source = getPdfUrlParams(sourceUrl);
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
            console.warn('Normal fetch failed, trying CORS proxy');
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

        try {
          const out = await pdf.getOutline();
          if (out && Array.isArray(out)) {
            setOutline(out);
          }
        } catch {}

        logPdfEvent({
          url,
          event: 'load_success',
          livroId,
          livroTitulo: titulo,
          durationMs: Date.now() - startedAtRef.current,
          totalPages: pdf.numPages,
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
        try {
          task.cancel();
        } catch {}
      });
      renderTasksRef.current.clear();
      if (pdfRef.current) {
        try {
          pdfRef.current.destroy();
        } catch {}
      }
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
      pdfRef.current = null;
    };
  }, [url, livroId, titulo]);

  useEffect(() => {
    if (currentPage > 0) localStorage.setItem(PAGE_KEY(url), String(currentPage));
  }, [currentPage, url]);

  const toggleBookmark = () => {
    if (bookmark === currentPage) {
      setBookmark(null);
      localStorage.removeItem(BOOKMARK_KEY(url));
      toast('Marcação removida.');
    } else {
      setBookmark(currentPage);
      localStorage.setItem(BOOKMARK_KEY(url), String(currentPage));
      toast.success('Página marcada');
    }
  };

  const goPrev = useCallback(() => {
    flip3DRef.current?.flipPrev();
  }, []);

  const goNext = useCallback(() => {
    flip3DRef.current?.flipNext();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  const readerNode = (
    <div className="fixed inset-0 z-[2500] bg-[#0b0b0b] flex flex-col theme-vademecum select-none overflow-hidden">
      {/* ── Top Bar / Header ── */}
      <AnimatePresence>
        {showBars && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.18 }}
            className="fixed top-0 inset-x-0 z-[2510] border-b border-white/10 bg-[#0b0b0b]/90 backdrop-blur-xl flex items-center px-4 shrink-0 shadow-lg"
            style={{
              paddingTop: 'var(--sai-top, env(safe-area-inset-top, 0px))',
              height: 'calc(3.5rem + var(--sai-top, env(safe-area-inset-top, 0px)))',
            }}
          >
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center -ml-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95 cursor-pointer"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0 ml-2">
              <h2 className="text-white font-semibold text-sm sm:text-base truncate tracking-wide">
                {titulo}
              </h2>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
              <button
                onClick={() => {
                  haptic.selection();
                  setShowAjustes(true);
                }}
                className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95 cursor-pointer"
                aria-label="Ajustes de visualização e zoom"
                title="Configurações e Zoom"
              >
                <Sliders className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Book Canvas Area with 3D Page Flip ── */}
      <div
        className="flex-1 relative overflow-hidden bg-[#0a0a0c] w-full h-full"
        ref={containerRef}
      >
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="w-9 h-9 animate-spin text-primary mb-4" />
            <div className="text-white/70 text-sm font-medium tracking-wide">
              Preparando páginas... {loadingProgress > 0 ? `${loadingProgress}%` : ''}
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Falha ao abrir PDF</h3>
            <p className="text-red-400 text-sm mb-6 max-w-md">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Voltar
            </button>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <BookPageFlip3D
              ref={flip3DRef}
              currentPage={currentPage}
              totalPages={totalPages}
              renderPage={(pageNum, isBackFace) => (
                <div
                  ref={(el) => {
                    if (el && !isBackFace) {
                      el.scrollTop = 0;
                    }
                  }}
                  className={`w-full h-full overflow-y-auto overscroll-y-contain flex flex-col items-center px-0 select-none ${
                    isDarkPdf ? 'bg-[#18181b]' : 'bg-white'
                  }`}
                  style={{
                    paddingTop: 'calc(4rem + var(--sai-top, env(safe-area-inset-top, 0px)))',
                    paddingBottom: 'calc(11.5rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))',
                  }}
                >
                  <PdfPage
                    pdf={pdfRef.current}
                    pageNumber={pageNum}
                    isDual={dualPage}
                    containerRef={containerRef}
                    renderTasksRef={renderTasksRef}
                    isDark={isDarkPdf}
                    zoom={zoom}
                    isBackFace={isBackFace}
                    titulo={titulo}
                  />
                </div>
              )}
              onPageChange={(p) => setCurrentPage(p)}
              onTapCenter={() => setShowBars((v) => !v)}
            />
          </div>
        )}
      </div>

      {/* ── Footer Idêntico ao Leitor Nativo ── */}
      <AnimatePresence>
        {!loading && !error && totalPages > 0 && showBars && (
          <PdfReaderFooter
            currentPage={currentPage}
            totalPages={totalPages}
            progress={progress}
            bookmark={bookmark}
            bookmarksCount={bookmark ? 1 : 0}
            onPrev={goPrev}
            onNext={goNext}
            onToggleBookmark={toggleBookmark}
            onOpenBusca={() => setShowBusca(true)}
            onOpenSumario={() => setShowSumario(true)}
            onOpenAssistente={() => setShowAssistente(true)}
          />
        )}
      </AnimatePresence>

      {/* ── Sumário Sheet ── */}
      <PdfSumarioSheet
        showSumario={showSumario}
        onClose={() => setShowSumario(false)}
        totalPages={totalPages}
        currentPage={currentPage}
        outline={outline}
        onSelectPage={(p) => {
          flip3DRef.current?.goToPage(p);
          setShowSumario(false);
        }}
      />

      {/* ── Busca Sheet ── */}
      <PdfBuscaSheet
        showBusca={showBusca}
        onClose={() => setShowBusca(false)}
        totalPages={totalPages}
        termo={termo}
        setTermo={setTermo}
        buscando={buscando}
        matches={matches}
        onBuscar={buscar}
        onSelectMatch={(p) => {
          flip3DRef.current?.goToPage(p);
          setShowBusca(false);
        }}
      />

      {/* ── Ajustes Sheet (Configurações & Zoom) ── */}
      <PdfAjustesSheet
        open={showAjustes}
        onClose={() => setShowAjustes(false)}
        zoom={zoom}
        setZoom={setZoom}
        dualPage={dualPage}
        setDualPage={setDualPage}
        urlClara={urlClara}
        urlEscura={urlEscura}
        onSwitchVersao={onSwitchVersao}
        isEscura={url?.toLowerCase().includes('escura')}
      />

      {/* ── Assistente IA ── */}
      {showAssistente && (
        <AssistenteIA
          open={showAssistente}
          onClose={() => setShowAssistente(false)}
          paginaMd={`# ${titulo}\n\nPágina ${currentPage} de ${totalPages} do documento PDF original.`}
          livroTitulo={titulo}
          capituloTitulo={`Página ${currentPage}`}
          paginaNum={currentPage}
          livroId={String(livroId || 'pdf')}
          tema={TEMAS.noturno}
          fonteFamily="Inter, sans-serif"
        />
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(readerNode, document.body) : readerNode;
};

const PdfPage = ({
  pdf,
  pageNumber,
  isDual,
  containerRef,
  renderTasksRef,
  isDark = false,
  zoom = DEFAULT_ZOOM,
  isBackFace = false,
  titulo = '',
}: {
  pdf: any;
  pageNumber: number;
  isDual: boolean;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  renderTasksRef: React.MutableRefObject<Map<number, any>>;
  isDark?: boolean;
  zoom?: number;
  isBackFace?: boolean;
  titulo?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    if (isBackFace) return;
    let cancelled = false;
    let renderTask: any = null;

    const render = async () => {
      if (!pdf || !canvasRef.current || !containerRef.current) return;
      try {
        setRendered(false);
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const containerWidth =
          containerRef.current.clientWidth > 100
            ? containerRef.current.clientWidth
            : window.innerWidth;

        const unscaledViewport = page.getViewport({ scale: 1 });

        // Zero margens: adaptação total à tela do usuário (100% de largura)
        const availableWidth = isDual
          ? containerWidth / 2
          : containerWidth;

        const baseScale = (availableWidth / unscaledViewport.width) * (zoom || 1.0);

        // Multiplicador Ultra HD / Retina de nitidez absoluta para fontes e vetores
        // No mobile, a largura CSS é de ~375-400px mas a resolução física é de 1080-1440px.
        // A escala de renderização mínima de 2.8x garante ~2000px de resolução rasterizada,
        // entregando fidelidade vetorial de impressão (300 DPI) idêntica ao Desktop!
        const dpr = Math.max(window.devicePixelRatio || 2, 2.5);
        const calculatedScale = baseScale * dpr;
        const minUltraHdScale = 2.8 * (zoom || 1.0);
        const finalScale = Math.max(calculatedScale, minUltraHdScale);

        const finalVp = page.getViewport({ scale: finalScale });

        const canvas = canvasRef.current;
        canvas.width = Math.floor(finalVp.width);
        canvas.height = Math.floor(finalVp.height);

        const displayWidth = Math.round(unscaledViewport.width * baseScale);
        const displayHeight = Math.round(unscaledViewport.height * baseScale);
        setPageSize({ width: displayWidth, height: displayHeight });

        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.maxWidth = '100%';
        canvas.style.aspectRatio = `${unscaledViewport.width} / ${unscaledViewport.height}`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        renderTask = page.render({
          canvasContext: ctx,
          viewport: finalVp,
          canvas,
          intent: 'display',
        } as any);
        renderTasksRef.current.set(pageNumber, renderTask);

        await renderTask.promise;
        if (!cancelled) setRendered(true);
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException' && !cancelled) {
          console.error('[PdfPage] render error:', e);
          import('@/lib/pdfTelemetry').then(({ logPdfEvent }) => {
            logPdfEvent({
              url: 'page-render',
              event: 'load_error',
              errorMessage: `Page ${pageNumber}: ${e?.message || e}`,
            });
          });
        }
      } finally {
        renderTasksRef.current.delete(pageNumber);
      }
    };

    render();

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {}
      }
    };
  }, [pdf, pageNumber, isDual, containerRef, zoom, isBackFace]);

  if (isBackFace) {
    return (
      <div
        className="w-full h-full flex flex-col justify-between p-8 select-none border-l rounded-sm"
        style={{
          background: isDark ? '#18181b' : '#ffffff',
          color: isDark ? '#ffffff' : '#1a1a1a',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          boxShadow: isDark
            ? 'inset 25px 0 35px -15px rgba(0,0,0,0.4)'
            : 'inset 20px 0 30px -15px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-between text-[11px] opacity-40 font-mono tracking-widest uppercase">
          <span className="truncate max-w-[200px]">{titulo || 'Documento Original'}</span>
          <span>p. {pageNumber}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 px-4">
          <div className="w-12 h-0.5 bg-neutral-300 dark:bg-neutral-600 mb-4 rounded-full" />
          <p className="text-xs font-serif italic max-w-xs line-clamp-3">{titulo}</p>
        </div>
        <div className="text-center text-[10px] opacity-35 font-mono">
          Página {pageNumber}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full mx-auto transition-opacity duration-200 ${
        isDark ? 'bg-[#18181b]' : 'bg-white'
      } ${rendered ? 'opacity-100' : 'opacity-0'}`}
      style={{
        width: '100%',
        maxWidth: isDual ? '50%' : '100%',
        boxShadow: 'none',
        borderRadius: '0px',
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-auto" />
      {!rendered && (
        <div
          className={`absolute inset-0 flex items-center justify-center min-h-[500px] ${
            isDark ? 'bg-[#18181b]/80' : 'bg-white/50'
          }`}
        >
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      )}
    </div>
  );
};

export default PdfPaginatedReader;
