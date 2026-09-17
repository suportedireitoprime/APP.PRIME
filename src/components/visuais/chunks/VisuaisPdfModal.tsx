import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { gerarPdfBlob, exportarPdf } from '../VisualScene';
import type { VisualRecord, VisualContent } from '@/lib/visuaisJuridicos/types';

interface VisuaisPdfModalProps {
  open: boolean;
  registro: VisualRecord | null;
  onClose: () => void;
}

export function VisuaisPdfModal({ open, registro, onClose }: VisuaisPdfModalProps) {
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let createdUrl = '';
    setLoading(true);

    gerarPdfBlob(registro.conteudo as VisualContent, 'limpo')
      .then(({ url }) => {
        if (!cancelado) {
          createdUrl = url;
          setPdfUrl(url);
          setLoading(false);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch((err) => {
        console.error('[VisuaisPdfModal] Erro ao renderizar PDF:', err);
        if (!cancelado) {
          toast.error('Não foi possível gerar a prévia do PDF.');
          setLoading(false);
        }
      });

    return () => {
      cancelado = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
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
    } catch {
      toast.error('Erro ao baixar o arquivo PDF.');
    } finally {
      setBaixando(false);
    }
  };

  if (!open || !registro) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex flex-col bg-black/95 backdrop-blur-md">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-zinc-950/90 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-red-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  PDF Oficial
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {registro.tipo.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[280px] sm:max-w-md mt-0.5">
                {registro.titulo}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
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

            <button
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
        <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="font-body text-sm font-medium">Renderizando PDF de alta definição...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              title={registro.titulo}
              className="w-full h-full rounded-xl border border-white/10 shadow-2xl bg-neutral-900"
            />
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              Não foi possível carregar o visualizador de PDF.
            </div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
