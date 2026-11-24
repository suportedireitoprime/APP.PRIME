import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, Sparkles, Smartphone, Tablet, 
  Monitor, Info, Layers, Zap, ExternalLink 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { 
  LAYOUTS_METADATA, HomeLayoutId, useHomeLayoutState 
} from '@/lib/homeLayoutStore';
import { DeviceFrame } from './DeviceFrame';

// Import dos 10 Layouts
import { Layout1Comando } from './layouts/Layout1Comando';
import { Layout2CinemaStreaming } from './layouts/Layout2CinemaStreaming';
import { Layout3JornadaRPG } from './layouts/Layout3JornadaRPG';
import { Layout4LeitorClassico } from './layouts/Layout4LeitorClassico';
import { Layout5BentoGrid } from './layouts/Layout5BentoGrid';
import { Layout6DailyBriefing } from './layouts/Layout6DailyBriefing';
import { Layout7QuestoesHub } from './layouts/Layout7QuestoesHub';
import { Layout8IATutorBusca } from './layouts/Layout8IATutorBusca';
import { Layout9TimelineCronograma } from './layouts/Layout9TimelineCronograma';
import { Layout10WorkspaceMultiPane } from './layouts/Layout10WorkspaceMultiPane';

interface HomeLayoutStudioProps {
  onVoltar?: () => void;
}

export const HomeLayoutStudio: React.FC<HomeLayoutStudioProps> = ({ onVoltar }) => {
  const navigate = useNavigate();
  const {
    activeLayout,
    previewLayout,
    setPreviewLayout,
    switchActive,
    viewport,
    setViewport,
    isFullscreen,
    setIsFullscreen,
  } = useHomeLayoutState();

  const [toastAtivacao, setToastAtivacao] = useState(false);

  const handleVoltar = () => {
    try { haptic.impact('light'); } catch {};
    if (onVoltar) {
      onVoltar();
    } else {
      navigate('/admin-laboratorio-aulas');
    }
  };

  const handleAtivar = (id: HomeLayoutId) => {
    try { haptic.impact('heavy'); } catch {};
    switchActive(id);
    setToastAtivacao(true);
    setTimeout(() => setToastAtivacao(false), 3000);
  };

  const metaAtual = LAYOUTS_METADATA[previewLayout];

  // Renderizador do layout ativo
  const renderLayout = () => {
    switch (previewLayout) {
      case 1: return <Layout1Comando />;
      case 2: return <Layout2CinemaStreaming />;
      case 3: return <Layout3JornadaRPG />;
      case 4: return <Layout4LeitorClassico />;
      case 5: return <Layout5BentoGrid />;
      case 6: return <Layout6DailyBriefing />;
      case 7: return <Layout7QuestoesHub />;
      case 8: return <Layout8IATutorBusca />;
      case 9: return <Layout9TimelineCronograma />;
      case 10: return <Layout10WorkspaceMultiPane />;
      default: return <Layout1Comando />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      {/* ── HEADER PREMIUM COM BOTÃO VOLTAR PADRÃO ── */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleVoltar}
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  LABORATÓRIO · DESIGN STUDIO
                </span>
                <span className="text-xs text-zinc-500 font-mono">Design Studio</span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Estúdio de Layouts da Tela de Início
              </h1>
            </div>
          </div>

          {/* Botão de Ativação do Layout Atual */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAtivar(previewLayout)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                activeLayout === previewLayout
                  ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/30'
                  : 'bg-white text-zinc-950 hover:bg-zinc-200'
              }`}
            >
              {activeLayout === previewLayout ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Layout Ativo no App</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-amber-500" />
                  <span>Definir como Principal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── NOTIFICAÇÃO TOAST DE ATIVAÇÃO ── */}
      {toastAtivacao && (
        <div className="fixed top-20 right-4 z-50 p-3 rounded-2xl bg-emerald-500 text-zinc-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-3">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Layout #{previewLayout} definido como tela inicial padrão!</span>
        </div>
      )}

      {/* ── SELETOR DE VERSÕES DE LAYOUT (1..10) ── */}
      <div className="w-full bg-zinc-950/80 border-b border-white/5 py-3 px-4 overflow-x-auto scrollbar-none">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as HomeLayoutId[]).map((num) => {
            const m = LAYOUTS_METADATA[num];
            const isSelected = previewLayout === num;
            const isAppActive = activeLayout === num;

            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {};
                  setPreviewLayout(num);
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-white text-zinc-950 border-white shadow-md'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border-white/5 hover:border-white/10'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                  isSelected ? 'bg-zinc-950 text-white' : 'bg-white/10 text-zinc-300'
                }`}>
                  {num}
                </span>
                <span>{m.nome}</span>
                {isAppActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Ativo no App" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BANNER INFORMATIVO DO LAYOUT SELECIONADO ── */}
      <div className="max-w-5xl mx-auto w-full px-4 pt-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-bold border border-white/10">
                {metaAtual.badge}
              </span>
              <span className="text-xs text-zinc-400">{metaAtual.destaque}</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Versão #{metaAtual.id}: {metaAtual.nome}
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              {metaAtual.proposta}
            </p>
          </div>
        </div>
      </div>

      {/* ── DEVICE FRAME & SIMULADOR DE LAYOUT ── */}
      <main className="flex-1 w-full flex flex-col items-center">
        <DeviceFrame
          viewport={viewport}
          onViewportChange={setViewport}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        >
          {renderLayout()}
        </DeviceFrame>
      </main>
    </div>
  );
};
