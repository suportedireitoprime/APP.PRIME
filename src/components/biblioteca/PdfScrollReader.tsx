import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, List, ZoomIn, ZoomOut } from 'lucide-react';
import { createPortal } from 'react-dom';
import { openPdfNative } from '@/lib/fileOpener';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { logPdfEvent } from '@/lib/pdfTelemetry';
import {
  BOOKMARK_KEY,
  PAGE_KEY,
  MIN_ZOOM,
  MAX_ZOOM,
} from './pdf/pdfReaderTypes';
import PdfReaderHeader from './pdf/PdfReaderHeader';
import PdfReaderFooter from './pdf/PdfReaderFooter';
import PdfContinuarPrompt from './pdf/PdfContinuarPrompt';
import PdfSumarioSheet from './pdf/PdfSumarioSheet';
import PdfBuscaSheet from './pdf/PdfBuscaSheet';
import { usePdfSearch } from './pdf/usePdfSearch';
import { usePdfDocument } from './pdf/usePdfDocument';

interface Props {
  url: string;
  titulo: string;
  onClose: () => void;
  livroId?: number | string | null;
  capaUrl?: string | null;
}

/**
 * Leitor de PDF com suporte a scroll contínuo e modo página dupla (lado a lado) no desktop.
 * Renderiza páginas em <canvas> conforme entram no viewport.
 */
const PdfScrollReader = ({ url, titulo, onClose, livroId, capaUrl }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef<Set<number>>(new Set());
  const renderTasksRef = useRef<Map<number, any>>(new Map());
  const pagesRef = useRef<Map<number, any>>(new Map());

  const {
    pdfRef,
    totalPages,
    loading,
    loadingProgress,
    error,
    outline,
    promptContinuarPage,
    setPromptContinuarPage,
  } = usePdfDocument({
    url,
    titulo,
    livroId,
    renderTasksRef,
    pagesRef,
    renderedRef,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [bookmark, setBookmark] = useState<number | null>(() => {
    const v = localStorage.getItem(BOOKMARK_KEY(url));
    return v ? Number(v) : null;
  });
  const [showSumario, setShowSumario] = useState(false);
  const [zoom, setZoom] = useState(1);
  const isNative = Capacitor.isNativePlatform();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const [dualPage, setDualPage] = useState<boolean>(() => isDesktop);

  const {
    showBusca,
    setShowBusca,
    termo,
    setTermo,
    buscando,
    matches,
    buscar,
  } = usePdfSearch(pdfRef);

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
      <PdfContinuarPrompt
        page={promptContinuarPage}
        onDismiss={() => setPromptContinuarPage(null)}
        onContinue={(p) => {
          scrollToPage(p);
          setCurrentPage(p);
          setPromptContinuarPage(null);
        }}
      />

      {/* Header */}
      <PdfReaderHeader
        titulo={titulo}
        onClose={onClose}
        isDesktop={isDesktop}
        dualPage={dualPage}
        onToggleDualPage={() => setDualPage((d) => !d)}
        onOpenBusca={() => setShowBusca(true)}
      />

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
            Ir para p.{bookmark}
          </button>
        )}
      </div>

      {/* Menu de rodapé */}
      {!loading && !error && totalPages > 0 && (
        <PdfReaderFooter
          currentPage={currentPage}
          totalPages={totalPages}
          progress={progress}
          bookmark={bookmark}
          onPrev={goPrev}
          onNext={goNext}
          onToggleBookmark={toggleBookmark}
          onOpenBusca={() => setShowBusca(true)}
          onOpenSumario={() => setShowSumario(true)}
        />
      )}

      {/* Sumário */}
      <PdfSumarioSheet
        showSumario={showSumario}
        onClose={() => setShowSumario(false)}
        totalPages={totalPages}
        currentPage={currentPage}
        outline={outline}
        onSelectPage={(p) => scrollToPage(p)}
      />

      {/* Busca por palavra */}
      <PdfBuscaSheet
        showBusca={showBusca}
        onClose={() => setShowBusca(false)}
        totalPages={totalPages}
        termo={termo}
        setTermo={setTermo}
        buscando={buscando}
        matches={matches}
        onBuscar={buscar}
        onSelectMatch={(p) => scrollToPage(p)}
      />
    </motion.div>
  );

  return typeof document === 'undefined' ? reader : createPortal(reader, document.body);
};

export default PdfScrollReader;
