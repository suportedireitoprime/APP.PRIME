import React, { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Headphones,
  Sparkles,
  Play,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { AudiobookLivro } from '@/data/audiobooksCatalogo';
import { getResumoForLivro } from '@/data/audiobooksResumosMap';
import { getAudiobookDuracaoBadge } from '@/pages/audiobooks/Audiobooks';

interface AudiobookModalidadeDialogProps {
  open: boolean;
  livro: AudiobookLivro | null;
  onClose: () => void;
  onSelectCompleto: (livro: AudiobookLivro) => void;
  onSelectResumo: (livro: AudiobookLivro) => void;
}

export const AudiobookModalidadeDialog: React.FC<AudiobookModalidadeDialogProps> = ({
  open,
  livro,
  onClose,
  onSelectCompleto,
  onSelectResumo,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !livro) return null;

  const resumo = getResumoForLivro(livro);
  const duracaoResumo = resumo?.duracaoFormatada || '~30 min';
  const totalCapitulos = livro.totalCapitulos || livro.capitulos?.length || 8;
  const duracaoCompleto = getAudiobookDuracaoBadge(livro);

  const handleCompleto = () => {
    haptic.impact();
    onSelectCompleto(livro);
  };

  const handleResumo = () => {
    haptic.impact();
    onSelectResumo(livro);
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
      >
        {/* Backdrop suave e cinematográfico */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Card Modalidade Minimalista e Ultra-Responsivo */}
        <motion.div
          key="modalidade-card"
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="relative w-full sm:max-w-md bg-gradient-to-b from-[#18181D] via-[#131316] to-[#0E0E12] border-t sm:border border-white/15 rounded-t-[30px] sm:rounded-2xl shadow-[0_-12px_50px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] sm:pb-5"
        >
          {/* Barra de arrasto no Mobile */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-2.5 sm:hidden" />

          {/* Header Compacto */}
          <div className="px-5 sm:px-6 pt-3.5 pb-3 flex items-center justify-between border-b border-white/5 relative">
            <div className="min-w-0 pr-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                <Headphones className="w-3 h-3 text-purple-400" />
                Como prefere ouvir?
              </span>
              <h3 className="font-sans font-bold text-base sm:text-lg text-white truncate mt-0.5">
                {livro.titulo}
              </h3>
              <p className="text-xs text-white/50 truncate">
                {livro.autor} {livro.ano && `• ${livro.ano}`}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-white/60 hover:text-white transition-all cursor-pointer shrink-0 border border-white/5"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de Opções: 1 Linha de Título + 1 Linha com Tempo & Porquê */}
          <div className="px-4 sm:px-5 pt-3.5 pb-1 flex flex-col gap-2.5">
            {/* OPÇÃO 1: AUDIOBOOK COMPLETO */}
            <div
              onClick={handleCompleto}
              className="group relative p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#161224] to-[#12101A] hover:from-purple-950/45 hover:to-[#171424] border border-purple-500/25 hover:border-purple-400/60 transition-all duration-200 cursor-pointer select-none active:scale-[0.99] flex items-center gap-3 sm:gap-3.5 shadow-md hover:shadow-[0_6px_24px_rgba(147,51,234,0.2)] overflow-hidden"
            >
              {/* Capa Compacta com Lombada e Badge */}
              <div className="relative w-14 sm:w-16 aspect-[3/4] rounded-lg overflow-hidden bg-black/60 border border-purple-500/35 shrink-0 shadow-md group-hover:border-purple-300 transition-colors">
                <img
                  src={livro.capaUrl}
                  alt={livro.titulo}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover brightness-[1.05]"
                />
                <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-purple-600/95 text-[7px] font-black uppercase tracking-wider text-white flex items-center gap-0.5 shadow">
                  <Headphones className="w-2 h-2" />
                  <span>Integral</span>
                </div>
              </div>

              {/* Título e Uma Linha com Tempo + Porquê */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-sans font-bold text-sm sm:text-base text-white group-hover:text-purple-200 transition-colors truncate">
                  Audiobook Completo
                </h4>
                <p className="text-[11.5px] sm:text-xs text-purple-300/80 font-medium truncate mt-0.5">
                  <span className="font-mono font-bold text-purple-200">{duracaoCompleto}</span>
                  <span className="text-white/40 mx-1">•</span>
                  <span>Obra integral sem cortes ({totalCapitulos} caps)</span>
                </p>
              </div>

              {/* Botão Play */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600 group-hover:bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30 group-hover:scale-105 active:scale-95 transition-all">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>
            </div>

            {/* OPÇÃO 2: RESUMO ANALÍTICO */}
            <div
              onClick={handleResumo}
              className="group relative p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/25 via-[#1A1510] to-[#13110E] hover:from-amber-950/40 hover:to-[#17140F] border border-amber-500/25 hover:border-amber-400/60 transition-all duration-200 cursor-pointer select-none active:scale-[0.99] flex items-center gap-3 sm:gap-3.5 shadow-md hover:shadow-[0_6px_24px_rgba(245,158,11,0.2)] overflow-hidden"
            >
              {/* Capa Compacta com Lombada e Badge */}
              <div className="relative w-14 sm:w-16 aspect-[3/4] rounded-lg overflow-hidden bg-black/60 border border-amber-500/35 shrink-0 shadow-md group-hover:border-amber-300 transition-colors">
                <img
                  src={livro.capaUrl}
                  alt={livro.titulo}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover brightness-[1.05]"
                />
                <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-r from-amber-200/40 to-transparent pointer-events-none" />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-400 text-[7px] font-black uppercase tracking-wider text-zinc-950 flex items-center gap-0.5 shadow">
                  <Sparkles className="w-2 h-2 fill-zinc-950" />
                  <span>Resumo</span>
                </div>
              </div>

              {/* Título e Uma Linha com Tempo + Porquê */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-sans font-bold text-sm sm:text-base text-white group-hover:text-amber-200 transition-colors truncate">
                  Resumo Analítico
                </h4>
                <p className="text-[11.5px] sm:text-xs text-amber-300/80 font-medium truncate mt-0.5">
                  <span className="font-mono font-bold text-amber-200">{duracaoResumo}</span>
                  <span className="text-white/40 mx-1">•</span>
                  <span>Síntese rápida para revisão e provas</span>
                </p>
              </div>

              {/* Botão Play */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400 group-hover:bg-amber-300 text-zinc-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 group-hover:scale-105 active:scale-95 transition-all">
                <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default memo(AudiobookModalidadeDialog);
