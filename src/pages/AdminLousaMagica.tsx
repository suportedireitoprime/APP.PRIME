import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ExternalLink, 
  Presentation,
  ArrowLeft
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export default function AdminLousaMagica() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);

  const handleReload = useCallback(() => {
    haptic.selection();
    setKey((prev) => prev + 1);
  }, []);

  const handleOpenExternal = useCallback(() => {
    haptic.selection();
    window.open('/lousa-magica/index.html', '_blank');
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    haptic.selection();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="h-dvh max-h-dvh w-full overflow-hidden flex flex-col bg-[#0D0D0D] text-white select-none">
      {/* Top Bar Compacta & Ergonômica com Safe-Area */}
      <header className="h-12 flex-none px-3 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between z-20 pt-[env(safe-area-inset-top,0px)]">
        {/* Lado Esquerdo: Voltar & Título */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic.selection();
              navigate('/admin-funcoes');
            }}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Voltar para Funções ADM"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-200" strokeWidth={2.4} />
          </button>

          <div className="flex flex-col ml-1">
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5 leading-none">
              <Presentation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              LOUSA MÁGICA
            </span>
            <span className="text-[10px] text-zinc-400 truncate max-w-[160px] sm:max-w-none mt-0.5 leading-none">
              Hans Kelsen & Teoria Pura
            </span>
          </div>
        </div>

        {/* Lado Direito: Ações Rápidas */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReload}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Reiniciar aula"
            aria-label="Reiniciar aula"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            aria-label="Tela Cheia"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={handleOpenExternal}
            className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
            title="Abrir em aba isolada"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Isolado</span>
          </button>
        </div>
      </header>

      {/* Container Fullscreen do Player da Lousa Mágica */}
      <main
        ref={containerRef}
        className="flex-1 w-full h-full min-h-0 bg-[#0e0f0e] flex items-center justify-center overflow-hidden relative"
      >
        <iframe
          key={key}
          ref={iframeRef}
          src="/lousa-magica/index.html"
          title="Lousa Mágica - Hans Kelsen"
          className="w-full h-full border-0 block overflow-hidden max-w-[460px] md:max-w-none"
          allow="autoplay; fullscreen; clipboard-write"
        />
      </main>
    </div>
  );
}
