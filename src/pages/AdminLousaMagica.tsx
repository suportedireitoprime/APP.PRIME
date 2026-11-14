import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Maximize2, 
  RotateCcw, 
  ExternalLink, 
  Volume2, 
  Layers, 
  Info,
  Presentation
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';

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
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white pb-24 relative overflow-x-hidden">
      {/* Background ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid 
          speed={0.4} 
          squareSize={42} 
          borderColor="rgba(255, 255, 255, 0.04)" 
          hoverFillColor="rgba(234, 179, 8, 0.08)"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 pt-2">
        {/* Header */}
        <PageHeader
          title="LOUSA MÁGICA"
          subtitle="Reprodução interativa de aulas em lousa animada com áudio e giz"
          onBack={() => navigate('/admin-funcoes')}
        />

        {/* Barra de Ações Rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-4 p-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Aula: Hans Kelsen & Teoria Pura</p>
              <p className="text-[11px] text-zinc-400">Escolas Penais • Áudio e Animação Integrados</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReload}
              className="gap-1.5 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
              title="Reiniciar aula do início"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reiniciar</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleFullscreen}
              className="gap-1.5 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200"
              title="Tela Cheia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tela Cheia</span>
            </Button>

            <Button
              size="sm"
              onClick={handleOpenExternal}
              className="gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-md shadow-amber-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Isolado</span>
            </Button>
          </div>
        </div>

        {/* Player Container da Lousa Mágica */}
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black shadow-black/80 aspect-[9/16] sm:aspect-[4/3] md:aspect-[16/10] max-h-[82vh]"
        >
          <iframe
            key={key}
            ref={iframeRef}
            src="/lousa-magica/index.html"
            title="Lousa Mágica - Hans Kelsen"
            className="w-full h-full border-0 block"
            allow="autoplay; fullscreen; clipboard-write"
          />
        </div>

        {/* Informações Técnicas e de Apoio */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Animação Sincronizada</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Mão que desenha traços de giz e apagador animado sincronizados com a locução do professor.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Áudio Embutido</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Áudio de alta fidelidade compactado com controle de velocidade (1x a 2x) e pausa dinâmica.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Quadros e Navegação</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Seletor de quadros e linha do tempo para saltar entre temas e revisar conceitos chave.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
