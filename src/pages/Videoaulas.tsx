import { Suspense } from 'react';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useVideoaulas } from '@/hooks/useVideoaulas';
import { VideoaulasMobileView } from '@/components/videoaulas/home/VideoaulasMobileView';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

const VideoaulasDesktop = lazyWithRetry(() => import('./VideoaulasDesktop'));

const Videoaulas = () => {
  const isDesktop = useIsDesktop();
  const state = useVideoaulas();

  const pct = Math.min(100, Math.round((state.emAndamentoCount / Math.max(state.areasDireito.length, 1)) * 100));
  const r = 50;
  const c = 2 * Math.PI * r;
  const dash = c - (pct / 100) * c;
  const horasAssistidas = Math.floor(state.data.totalConcluidas * 0.5);

  if (isDesktop) {
    return (
      <Suspense fallback={<div className="h-screen bg-background" />}>
        <VideoaulasDesktop
          data={state.data}
          filtro={state.filtro}
          setFiltro={state.setFiltro}
          busca={state.busca}
          setBusca={state.setBusca}
          lista={state.lista}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-32 lg:pb-0 overflow-x-hidden w-full relative">
      <div className="absolute inset-0 z-0 opacity-60">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.1)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <VideoaulasMobileView
        state={state}
        c={c}
        dash={dash}
        horasAssistidas={horasAssistidas}
      />
    </div>
  );
};

export default Videoaulas;
