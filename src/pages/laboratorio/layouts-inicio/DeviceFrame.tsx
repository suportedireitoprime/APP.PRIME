import React from 'react';
import { Smartphone, Tablet, Monitor, Maximize2, Minimize2 } from 'lucide-react';
import { ViewportMode } from '@/lib/homeLayoutStore';

interface DeviceFrameProps {
  viewport: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  viewport,
  onViewportChange,
  isFullscreen,
  onToggleFullscreen,
  children,
}) => {
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0D0D0D] overflow-y-auto">
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 shadow-2xl backdrop-blur-md hover:bg-zinc-800 cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Sair da Tela Cheia</span>
        </button>
        <div className="w-full min-h-screen">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full py-4 px-2 sm:px-4">
      {/* Barra de Seleção de Viewport */}
      <div className="flex items-center justify-between w-full max-w-5xl mb-4 bg-zinc-900/70 border border-white/10 rounded-2xl p-2 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onViewportChange('mobile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (390px)</span>
          </button>
          <button
            type="button"
            onClick={() => onViewportChange('tablet')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewport === 'tablet'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet (768px)</span>
          </button>
          <button
            type="button"
            onClick={() => onViewportChange('desktop')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-white text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Widescreen</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleFullscreen}
          title="Ver em tela cheia no navegador"
          className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tela Cheia</span>
        </button>
      </div>

      {/* Frame de Apresentação */}
      <div className="w-full flex justify-center items-start min-h-[780px]">
        {viewport === 'mobile' && (
          <div className="w-[390px] max-w-full rounded-[44px] border-[10px] border-zinc-800 bg-[#0D0D0D] shadow-2xl overflow-hidden relative shadow-black/80 ring-1 ring-white/10 transition-all">
            {/* Dynamic Island / Notch Fake */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-40 border border-white/5 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700/60 ml-auto mr-3" />
            </div>
            {/* Scrollable Container */}
            <div className="h-[780px] overflow-y-auto overflow-x-hidden pt-7 scrollbar-thin scrollbar-thumb-zinc-800">
              {children}
            </div>
            {/* Home Indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full pointer-events-none z-40" />
          </div>
        )}

        {viewport === 'tablet' && (
          <div className="w-[768px] max-w-full rounded-[36px] border-[12px] border-zinc-800 bg-[#0D0D0D] shadow-2xl overflow-hidden relative shadow-black/80 ring-1 ring-white/10 transition-all">
            <div className="h-[800px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-800">
              {children}
            </div>
          </div>
        )}

        {viewport === 'desktop' && (
          <div className="w-full max-w-6xl rounded-2xl border border-white/10 bg-[#0D0D0D] shadow-2xl overflow-hidden shadow-black/80">
            {/* Browser Header Bar */}
            <div className="h-9 bg-zinc-900/90 border-b border-white/10 px-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="mx-auto w-80 h-5 bg-zinc-950/80 rounded-md border border-white/5 text-[10px] text-zinc-500 flex items-center justify-center font-mono">
                app.direitoprime.com/inicio
              </div>
            </div>
            <div className="min-h-[750px] max-h-[850px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-800">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
