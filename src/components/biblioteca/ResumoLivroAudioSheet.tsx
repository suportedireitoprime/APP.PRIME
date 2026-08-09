import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Play, Pause, FastForward, Rewind, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { useBibliotecaCapa } from '@/hooks/useBibliotecaAsset';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { haptic } from '@/lib/nativeHaptics';

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const rs = Math.floor(s % 60);
  return `${m}:${rs.toString().padStart(2, '0')}`;
}

export default function ResumoLivroAudioSheet() {
  const {
    livroAtual,
    tocando,
    tempo,
    dur,
    velocidade,
    aberto,
    setAberto,
    togglePlay,
    seek,
    setVelocidade,
  } = useResumoLivroPlayer();

  useBodyScrollLock(aberto);

  const capaUrl = useBibliotecaCapa(livroAtual?.capa, 500);
  const capaBlurUrl = useBibliotecaCapa(livroAtual?.capaHorizontal || livroAtual?.capa, 800);

  const progressRef = useRef<HTMLDivElement>(null);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !dur) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    seek((x / rect.width) * dur);
  };

  const handleDrag = (e: React.TouchEvent<HTMLDivElement>) => {
    handleSeek(e);
  };

  if (!livroAtual) return null;

  return createPortal((
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%', pointerEvents: 'none' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[2000] bg-background flex flex-col"
        >
          {/* Background blurred */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {capaBlurUrl && (
              <img
                src={capaBlurUrl}
                alt=""
                className="w-full h-full object-cover scale-125 blur-3xl opacity-20"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
          </div>

          <div className="relative z-10 flex flex-col h-full pt-[calc(var(--sai-top,0px)+0.5rem)] pb-[calc(var(--sai-bottom,0px)+1rem)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2">
              <button
                onClick={() => {
                  haptic.selection();
                  setAberto(false);
                }}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" /> Resumo em Áudio
              </div>
              <div className="w-11" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col items-center justify-center min-h-0">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-56 h-80 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 shrink-0 bg-secondary flex items-center justify-center relative mb-8"
              >
                {capaUrl ? (
                  <img src={capaUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Headphones className="w-16 h-16 text-muted-foreground" />
                )}
              </motion.div>

              <div className="text-center space-y-2 w-full max-w-sm">
                <h2 className="text-2xl font-bold text-foreground leading-tight">
                  {livroAtual.titulo}
                </h2>
                {livroAtual.autor && (
                  <p className="text-lg text-muted-foreground">
                    {livroAtual.autor}
                  </p>
                )}
              </div>
            </div>

            {/* Player Controls */}
            <div className="px-6 pb-6 w-full max-w-md mx-auto shrink-0">
              {/* Progress */}
              <div className="space-y-2 mb-6">
                <div
                  ref={progressRef}
                  className="h-2.5 bg-secondary rounded-full cursor-pointer relative overflow-hidden"
                  onClick={(e) => {
                    haptic.selection();
                    handleSeek(e);
                  }}
                  onTouchMove={handleDrag}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100 ease-linear"
                    style={{ width: `${dur > 0 ? (tempo / dur) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-medium text-muted-foreground tabular-nums">
                  <span>{formatTime(tempo)}</span>
                  <span>{formatTime(dur)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => {
                    haptic.selection();
                    setVelocidade(velocidade === 1 ? 1.25 : velocidade === 1.25 ? 1.5 : velocidade === 1.5 ? 2 : 1);
                  }}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary/50 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {velocidade}x
                </button>

                <button
                  onClick={() => {
                    haptic.selection();
                    seek(Math.max(0, tempo - 15));
                  }}
                  className="w-14 h-14 flex items-center justify-center rounded-full text-foreground hover:bg-secondary transition-colors"
                >
                  <Rewind className="w-7 h-7" />
                </button>

                <button
                  onClick={() => {
                    haptic.selection();
                    togglePlay();
                  }}
                  className="w-20 h-20 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  {tocando ? (
                    <Pause className="w-10 h-10 fill-current" />
                  ) : (
                    <Play className="w-10 h-10 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={() => {
                    haptic.selection();
                    seek(Math.min(dur, tempo + 15));
                  }}
                  className="w-14 h-14 flex items-center justify-center rounded-full text-foreground hover:bg-secondary transition-colors"
                >
                  <FastForward className="w-7 h-7" />
                </button>

                <div className="w-12" /> {/* Spacer to balance */}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ), document.body);
}
