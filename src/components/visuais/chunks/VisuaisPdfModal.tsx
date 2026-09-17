import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  FileText,
  Loader2,
  ExternalLink,
  Eye,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import VisualScene, { gerarPdfBlob, exportarPdf } from '../VisualScene';
import type { VisualRecord, VisualContent } from '@/lib/visuaisJuridicos/types';

interface VisuaisPdfModalProps {
  open: boolean;
  registro: VisualRecord | null;
  onClose: () => void;
}

export function VisuaisPdfModal({ open, registro, onClose }: VisuaisPdfModalProps) {
  useBodyScrollLock(open);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);
  const [modo, setModo] = useState<'visual' | 'pdf'>('visual');
  const [zoom, setZoom] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fechar no Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Zoom por scroll / pinça no modo visual
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || modo !== 'visual') return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setZoom((z) => Math.min(4, Math.max(0.6, +(z * Math.exp(-dy * 0.0018)).toFixed(3))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [modo]);

  // Pré-gera o PDF blob em background
  useEffect(() => {
    if (!open || !registro) {
      setPdfUrl(null);
      setLoadingPdf(false);
      return;
    }

    let cancelado = false;
    let createdUrl = '';
    setLoadingPdf(true);

    gerarPdfBlob(registro.conteudo as VisualContent, 'limpo')
      .then(({ url }) => {
        if (!cancelado) {
          createdUrl = url;
          setPdfUrl(url);
          setLoadingPdf(false);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch((err) => {
        console.warn('[VisuaisPdfModal] Geração de preview PDF em background:', err);
        if (!cancelado) {
          setLoadingPdf(false);
        }
      });

    return () => {
      cancelado = true;
      if (createdUrl) {
        setTimeout(() => URL.revokeObjectURL(createdUrl), 2000);
      }
      setPdfUrl(null);
    };
  }, [open, registro]);

  const handleDownload = async () => {
    if (!registro) return;
    setBaixando(true);
    haptic.selection();
    try {
      const nome = `${registro.tipo}-${registro.item_key.replace(/[^a-z0-9]+/gi, '-')}`;
      await exportarPdf(registro.conteudo as VisualContent, 'limpo', nome);
      toast.success('Download do PDF concluído!');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      toast.error('Erro ao baixar o arquivo PDF.');
    } finally {
      setBaixando(false);
    }
  };

  if (!open || !registro) return null;

  const content = registro.conteudo as VisualContent;

  const modalContent = (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#0d0d0f] text-foreground backdrop-blur-md isolate">
      {/* Top Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-zinc-950/90 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                PDF Oficial
              </span>
              <span className="text-xs text-muted-foreground capitalize truncate">
                {registro.tipo.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-[220px] sm:max-w-md mt-0.5 font-['Plus_Jakarta_Sans',sans-serif]">
              {registro.titulo}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Alternador Visual / PDF (quando houver URL de PDF pronta) */}
          {pdfUrl && (
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  haptic.light();
                  setModo('visual');
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  modo === 'visual'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Visual
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic.light();
                  setModo('pdf');
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  modo === 'pdf'
                    ? 'bg-red-500/30 text-red-300 shadow-sm'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Documento PDF
              </button>
            </div>
          )}

          {/* Botão Baixar PDF */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={baixando}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold active:scale-95 transition-all shadow-lg"
          >
            {baixando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Baixar PDF</span>
          </button>

          {/* Abrir em nova aba */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir em nova aba"
              className="w-10 h-10 rounded-xl bg-secondary/80 hover:bg-secondary flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Fechar */}
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onClose();
            }}
            aria-label="Fechar"
            className="w-10 h-10 rounded-xl bg-secondary/80 hover:bg-secondary flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
        {modo === 'pdf' && pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            title={registro.titulo}
            className="w-full h-full rounded-xl border border-white/10 shadow-2xl bg-neutral-900"
          />
        ) : (
          /* Modo Visual em Alta Resolução (Instantâneo 0ms, sempre funciona e zoomável) */
          <div
            ref={wrapRef}
            className="w-full h-full overflow-auto rounded-xl border border-white/10 bg-[#09090b] flex items-center justify-center p-2 sm:p-6 shadow-inner relative"
          >
            <div
              style={{
                width: `${zoom * 100}%`,
                maxWidth: `${Math.max(100, zoom * 100)}%`,
                transition: 'width 0.15s ease-out',
              }}
              className="mx-auto flex items-center justify-center"
            >
              <VisualScene content={content} estilo="limpo" />
            </div>
          </div>
        )}
      </div>

      {/* Footer com Controles de Zoom no Modo Visual */}
      {modo === 'visual' && (
        <footer className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-zinc-950/80 pb-[calc(0.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] text-xs text-muted-foreground">
          <div className="flex items-center gap-1 bg-zinc-900 rounded-full border border-white/10 px-2 py-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
              className="p-1 text-white hover:text-primary active:scale-90"
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-bold text-white text-[11px]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
              className="p-1 text-white hover:text-primary active:scale-90"
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Visual esquematizado em alta definição pronto para impressão em PDF</span>
          </p>
        </footer>
      )}
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
