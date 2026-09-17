import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import VisualScene, { exportarPdf } from '../VisualScene';
import type { VisualRecord, VisualContent } from '@/lib/visuaisJuridicos/types';

interface VisuaisPdfModalProps {
  open: boolean;
  registro: VisualRecord | null;
  onClose: () => void;
}

export function VisuaisPdfModal({ open, registro, onClose }: VisuaisPdfModalProps) {
  useBodyScrollLock(open);
  const [baixando, setBaixando] = useState(false);
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
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setZoom((z) => Math.min(4, Math.max(0.6, +(z * Math.exp(-dy * 0.0018)).toFixed(3))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

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
      {/* Top Header — Limpo, título completo e apenas Baixar e Fechar */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-zinc-950/90 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] shrink-0">
        <div className="flex-1 min-w-0 pr-3">
          <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide leading-snug break-words font-['Plus_Jakarta_Sans',sans-serif]">
            {registro.titulo}
          </h2>
          {registro.tipo && (
            <p className="text-[11px] text-zinc-400 capitalize leading-tight mt-0.5">
              {registro.tipo.replace('_', ' ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Botão Baixar PDF */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={baixando}
            aria-label="Baixar PDF"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold active:scale-95 transition-all shadow-lg"
          >
            {baixando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Baixar PDF</span>
          </button>

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

      {/* Content Area — 100% sangrado sem margens e sem barra cinza inferior */}
      <div className="flex-1 relative w-full h-full overflow-hidden bg-neutral-950 p-0 m-0">
        <div
          ref={wrapRef}
          className="w-full h-full overflow-auto p-0 m-0 flex items-start justify-center pb-24"
        >
          <div
            style={{
              width: `${zoom * 100}%`,
              maxWidth: `${Math.max(100, zoom * 100)}%`,
              transition: 'width 0.15s ease-out',
            }}
            className="w-full mx-auto"
          >
            <VisualScene content={content} estilo="limpo" />
          </div>
        </div>

        {/* Botão de Zoom Flutuante — cinza escuro sobreposto, sem barra de rodapé */}
        <div className="absolute bottom-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] left-4 sm:left-6 z-30 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md rounded-full border border-white/15 px-2.5 py-1 shadow-2xl">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
            className="p-1 text-white hover:text-primary active:scale-90 transition-transform"
            aria-label="Diminuir zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center font-bold text-white text-[11px] select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
            className="p-1 text-white hover:text-primary active:scale-90 transition-transform"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
