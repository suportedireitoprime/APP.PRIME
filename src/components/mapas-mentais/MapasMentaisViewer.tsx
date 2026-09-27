import React, { useEffect, useRef, useState } from 'react';
import { Download, FileImage, FileText, Loader2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import VisualScene, { exportarPdf, exportarPng } from './VisualScene';
import type { VisualContent, VisualEstilo, VisualRecord } from '@/lib/visuaisJuridicos/types';
import { TIPO_INFO } from '@/lib/visuaisJuridicos/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { haptic } from '@/lib/nativeHaptics';

interface MapasMentaisViewerProps {
  registro: VisualRecord;
  onClose: () => void;
}

export function MapasMentaisViewer({ registro, onClose }: MapasMentaisViewerProps) {
  useBodyScrollLock(true);
  const estilo: VisualEstilo = 'limpo';
  const [zoom, setZoom] = useState(1);
  const [baixando, setBaixando] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const content = registro.conteudo as VisualContent;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Zoom via roda do mouse / trackpad
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setZoom((z) => Math.min(3, Math.max(0.6, +(z * Math.exp(-dy * 0.0018)).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const baixar = async (formato: 'png' | 'pdf') => {
    setBaixando(true);
    try {
      const nome = `${registro.tipo}-${registro.item_key.replace(/[^a-z0-9]+/gi, '-')}`;
      if (formato === 'pdf') {
        await exportarPdf(content, estilo, nome);
        toast.success('PDF exportado com sucesso!');
      } else {
        await exportarPng(content, estilo, nome);
        toast.success('Imagem salva com sucesso!');
      }
    } catch {
      toast.error('Não foi possível exportar o arquivo.');
    } finally {
      setBaixando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#0D0D0D] text-white">
      {/* Topo / Header do Visualizador */}
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 pt-[max(0.75rem,var(--sai-top))] bg-[#141416]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onClose();
            }}
            aria-label="Fechar visualizador"
            className="w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base font-bold text-white truncate">
              {registro.titulo}
            </h2>
            <p className="text-xs text-zinc-400 truncate">
              {TIPO_INFO[registro.tipo]?.label ?? 'Visual'} · {registro.item_label}
            </p>
          </div>
        </div>

        {/* Botão de Exportação */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={baixando}
              className="gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 cursor-pointer shadow-md"
            >
              {baixando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Baixar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[160] bg-zinc-900 border-white/10 text-white">
            <DropdownMenuItem
              onClick={() => baixar('pdf')}
              className="gap-2.5 cursor-pointer hover:bg-zinc-800 text-xs sm:text-sm"
            >
              <FileText className="w-4 h-4 text-purple-400" /> Baixar PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => baixar('png')}
              className="gap-2.5 cursor-pointer hover:bg-zinc-800 text-xs sm:text-sm"
            >
              <FileImage className="w-4 h-4 text-emerald-400" /> Baixar Imagem (PNG)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Área Central Rolável com a Cena SVG */}
      <div ref={wrapRef} className="flex-1 overflow-auto bg-[#070708] p-3 sm:p-6 flex items-start justify-center">
        <div
          style={{
            width: `${Math.round(zoom * 100)}%`,
            maxWidth: `${Math.round(zoom * 1100)}px`,
            transition: 'width 0.15s ease-out',
          }}
          className="mx-auto my-auto shadow-2xl rounded-2xl overflow-hidden bg-white"
        >
          <VisualScene content={content} estilo={estilo} />
        </div>
      </div>

      {/* Rodapé com Controles de Zoom Flutuantes */}
      <footer className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 pb-[max(0.75rem,var(--sai-bottom))] bg-[#141416]/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 rounded-full px-2 py-1 shadow-md">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
            aria-label="Diminuir zoom"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="w-12 text-center text-xs font-bold text-zinc-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
            aria-label="Aumentar zoom"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label="Resetar zoom"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer border-l border-white/10 ml-0.5"
            title="Resetar para 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-[11px] text-zinc-500 hidden sm:inline">
          Use a roda do mouse com Ctrl para aproximar
        </span>
      </footer>
    </div>
  );
}
