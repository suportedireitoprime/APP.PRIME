import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Square,
  Columns,
  Sun,
  Moon,
  Maximize2,
  Sliders,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM } from './pdfReaderTypes';

interface PdfAjustesSheetProps {
  open: boolean;
  onClose: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  dualPage: boolean;
  setDualPage: React.Dispatch<React.SetStateAction<boolean>>;
  urlClara?: string | null;
  urlEscura?: string | null;
  onSwitchVersao?: (versao: 'clara' | 'escura') => void;
  isEscura?: boolean;
}

const ZOOM_PRESETS = [0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];

export default function PdfAjustesSheet({
  open,
  onClose,
  zoom,
  setZoom,
  dualPage,
  setDualPage,
  urlClara,
  urlEscura,
  onSwitchVersao,
  isEscura,
}: PdfAjustesSheetProps) {
  if (!open) return null;

  const currentPercent = Math.round(zoom * 100);

  const handleAdjustZoom = (delta: number) => {
    haptic.selection();
    setZoom((prev) => {
      const next = Number((prev + delta).toFixed(2));
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    });
  };

  const handleSetPreset = (val: number) => {
    haptic.selection();
    setZoom(val);
  };

  const handleResetZoom = () => {
    haptic.selection();
    setZoom(DEFAULT_ZOOM);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2620] flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Sheet Content */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#141416] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white"
          style={{ paddingBottom: 'calc(var(--sai-bottom, 0px) + 1rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-white tracking-wide">
                Ajustes de Visualização
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar ajustes"
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* ── Seção 1: Controle de Zoom ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Nível de Zoom
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold text-xs tabular-nums">
                  {currentPercent}%
                </span>
              </div>

              {/* Botões - / + e Valor */}
              <div className="flex items-center justify-between gap-3 bg-white/[0.04] border border-white/10 p-2.5 rounded-2xl">
                <button
                  onClick={() => handleAdjustZoom(-0.1)}
                  disabled={zoom <= MIN_ZOOM}
                  className="flex-1 h-11 rounded-xl bg-white/[0.06] hover:bg-white/10 disabled:opacity-30 flex items-center justify-center gap-2 text-sm font-semibold transition active:scale-95"
                >
                  <ZoomOut className="w-4 h-4" />
                  <span>-10%</span>
                </button>

                <button
                  onClick={handleResetZoom}
                  title="Redefinir para 110%"
                  className="px-3 h-11 rounded-xl bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-xs font-bold text-neutral-300 gap-1.5 transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Padrão</span>
                </button>

                <button
                  onClick={() => handleAdjustZoom(0.1)}
                  disabled={zoom >= MAX_ZOOM}
                  className="flex-1 h-11 rounded-xl bg-white/[0.06] hover:bg-white/10 disabled:opacity-30 flex items-center justify-center gap-2 text-sm font-semibold transition active:scale-95"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>+10%</span>
                </button>
              </div>

              {/* Presets Rápidos */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {ZOOM_PRESETS.map((p) => {
                  const pPercent = Math.round(p * 100);
                  const isSelected = Math.abs(zoom - p) < 0.03;
                  return (
                    <button
                      key={p}
                      onClick={() => handleSetPreset(p)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold tabular-nums transition shrink-0 active:scale-95 ${
                        isSelected
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-white/[0.05] hover:bg-white/10 text-neutral-300'
                      }`}
                    >
                      {pPercent}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Seção 2: Disposição de Páginas (1 ou 2 páginas) ── */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Disposição na Tela
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    haptic.selection();
                    setDualPage(false);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition active:scale-95 ${
                    !dualPage
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Square className="w-5 h-5" />
                  <span className="text-xs font-bold">1 Página (Adaptação Total)</span>
                </button>

                <button
                  onClick={() => {
                    haptic.selection();
                    setDualPage(true);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition active:scale-95 ${
                    dualPage
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Columns className="w-5 h-5" />
                  <span className="text-xs font-bold">2 Páginas (Lado a Lado)</span>
                </button>
              </div>
            </div>

            {/* ── Seção 3: Versão do Documento (se houver clara/escura) ── */}
            {urlClara && urlEscura && onSwitchVersao && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Modo de Contraste
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      haptic.selection();
                      onSwitchVersao('clara');
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition active:scale-95 ${
                      !isEscura
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">Versão Clara</span>
                  </button>

                  <button
                    onClick={() => {
                      haptic.selection();
                      onSwitchVersao('escura');
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition active:scale-95 ${
                      isEscura
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Versão Escura</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
