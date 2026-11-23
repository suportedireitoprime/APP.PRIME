import React, { useState } from 'react';
import { ArrowLeft, Film, ShieldCheck, Maximize2, Minimize2 } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface QuestoesAnimadasAlfredoPlayerProps {
  onVoltar: () => void;
}

export function QuestoesAnimadasAlfredoPlayer({ onVoltar }: QuestoesAnimadasAlfredoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleVoltar = () => {
    try {
      haptic.selection();
    } catch {}
    onVoltar();
  };

  const toggleFullscreen = () => {
    try {
      haptic.impact();
    } catch {}
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a1120] flex flex-col overflow-hidden text-white select-none">
      {/* Barra Superior Minimalista (ocultável no modo tela cheia imersivo) */}
      {!isFullscreen ? (
        <header className="h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between border-b border-white/10 bg-[#0a1120]/95 backdrop-blur-md shrink-0 z-20 pt-[env(safe-area-inset-top,0px)] transition-all">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleVoltar}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center border border-white/10 transition-all text-zinc-200 hover:text-white cursor-pointer"
              aria-label="Voltar para o laboratório"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-amber-400" />
                  Questões Animadas 2D
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                  OAB XLII · Q60
                </span>
              </div>
              <span className="text-[11px] sm:text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-md">
                Alfredo e a Receptação Sem Dolo · Guardião Ltda.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              CP Art. 180 c/c 18, I
            </span>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 flex items-center gap-1.5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Expandir 100% no celular"
              aria-label="Expandir 100% no celular"
            >
              <Maximize2 className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Expandir</span>
            </button>
          </div>
        </header>
      ) : (
        /* Botão Flutuante quando em Tela Cheia Imersiva */
        <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-3 z-50 flex items-center gap-2 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xl cursor-pointer"
            aria-label="Sair da tela cheia"
          >
            <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Restaurar</span>
          </button>
        </div>
      )}

      {/* Palco Nativo Modular 2D Edge-to-Edge (120fps, Canvas 2D, Áudio Aria, Quiz Interativo) */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-[#0a1120]">
        <iframe
          src="/questoes-animadas/alfredo-receptacao/index.html"
          title="OAB XLII Q60 - Alfredo e a Receptação Sem Dolo"
          className="w-full h-full border-none select-none bg-[#0a1120] block"
          allow="autoplay"
        />
      </main>
    </div>
  );
}

export default QuestoesAnimadasAlfredoPlayer;
