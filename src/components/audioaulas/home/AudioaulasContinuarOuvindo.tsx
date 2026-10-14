import React, { useEffect, useState, useCallback } from 'react';
import { Play, Pause, X, Headphones, Sparkles } from 'lucide-react';
import { useAudioaulasPlayer } from '@/contexts/AudioaulasPlayerContext';
import { obterUltimoProgressoAudioaula, limparProgressoAudioaula, type ProgressoAudioaula } from '@/lib/audioaulaProgresso';
import { capaDaArea, fmt } from '@/lib/audioaulasHelper';
import { CapaOtimizada } from './CapaOtimizada';
import { motion, AnimatePresence } from 'framer-motion';

export const AudioaulasContinuarOuvindo: React.FC = () => {
  const { aulas, atualId, tocando, tocar, togglePlay } = useAudioaulasPlayer();
  const [progresso, setProgresso] = useState<ProgressoAudioaula | null>(() => obterUltimoProgressoAudioaula());
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<ProgressoAudioaula | null>;
      setProgresso(custom.detail ?? obterUltimoProgressoAudioaula());
    };
    window.addEventListener('audioaula:progresso-mudou', handler);
    return () => window.removeEventListener('audioaula:progresso-mudou', handler);
  }, []);

  const handleRetomar = useCallback(() => {
    if (!progresso) return;
    const aula = aulas.find((a) => a.id === progresso.id);
    if (!aula) return;

    if (atualId === aula.id) {
      togglePlay();
    } else {
      void tocar(aula, undefined, progresso.tempo);
    }
  }, [progresso, aulas, atualId, togglePlay, tocar]);

  const handleDispensar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFechado(true);
    limparProgressoAudioaula();
  }, []);

  if (fechado || !progresso || progresso.tempo <= 2) return null;

  const estaTocandoEsta = atualId === progresso.id && tocando;
  const pct = progresso.duracao > 0 ? Math.min(100, Math.round((progresso.tempo / progresso.duracao) * 100)) : 0;
  const capaUrl = capaDaArea(progresso.area || '');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="mx-auto w-full max-w-[1400px] px-4 mb-4 lg:px-10 2xl:max-w-[1600px]"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-zinc-900/90 to-zinc-900 border border-primary/30 p-3 sm:p-4 shadow-xl shadow-primary/5">
          {/* Luz de fundo decorativa */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/30">
              <Sparkles className="w-3 h-3 text-primary" /> Continue de onde parou
            </span>

            <button
              onClick={handleDispensar}
              aria-label="Dispensar continuar ouvindo"
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            onClick={handleRetomar}
            className="group flex items-center gap-3.5 cursor-pointer select-none"
          >
            {/* Capa com Play pulsante */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md">
              <CapaOtimizada
                src={capaUrl}
                alt={progresso.titulo}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white backdrop-blur-[1px]">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-black/50 group-hover:scale-110 transition-transform">
                  {estaTocandoEsta ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </span>
              </div>
            </div>

            {/* Informações da Aula */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider line-clamp-1">
                {progresso.area} {progresso.tema ? `• ${progresso.tema}` : ''}
              </p>
              <h4 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-1 group-hover:text-primary transition-colors mt-0.5">
                {progresso.titulo}
              </h4>

              {/* Barra de progresso */}
              <div className="mt-2 flex items-center gap-2.5">
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-zinc-400 shrink-0 font-mono">
                  {fmt(progresso.tempo)} {progresso.duracao > 0 ? `/ ${fmt(progresso.duracao)}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
