import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { VideoaulasHero } from './VideoaulasHero';
import { VideoaulasSearchCard } from './VideoaulasSearchCard';
import { VideoaulasAtalhos } from './VideoaulasAtalhos';
import { VideoaulasListaAreas } from './VideoaulasListaAreas';
import { VideoaulasBuscaDrawer } from './VideoaulasBuscaDrawer';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import VideoaulasDesempenhoSheet from '@/components/videoaulas/VideoaulasDesempenhoSheet';
import type { useVideoaulas } from '@/hooks/useVideoaulas';

interface VideoaulasMobileViewProps {
  state: ReturnType<typeof useVideoaulas>;
  c: number;
  dash: number;
  horasAssistidas: number;
}

export const VideoaulasMobileView: React.FC<VideoaulasMobileViewProps> = ({
  state,
  c,
  dash,
  horasAssistidas,
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative z-10">
      <PageHeader title="Videoaulas" onBack={() => navigate('/')} />

      <div className="mx-auto w-full max-w-3xl pb-32 lg:max-w-[1400px] lg:px-10 lg:pt-6 2xl:max-w-[1600px]">
        <VideoaulasHero
          data={state.data}
          heroIdx={state.heroIdx}
          emAndamentoCount={state.emAndamentoCount}
          areasDireitoLength={state.areasDireito.length}
          setShowDesempenho={state.setShowDesempenho}
          horasAssistidas={horasAssistidas}
          c={c}
          dash={dash}
        />

        <div className="space-y-6 px-4 pt-6 sm:px-6 lg:space-y-8 lg:px-0 lg:pt-8">
          <VideoaulasSearchCard onOpenBusca={() => state.setDrawerBusca(true)} />

          <VideoaulasAtalhos />

          <VideoaulasListaAreas
            loading={state.loading}
            lista={state.lista}
            emAndamentoCount={state.emAndamentoCount}
            filtro={state.filtro}
            setFiltro={state.setFiltro}
          />
        </div>
      </div>

      <VideoaulasBuscaDrawer
        drawerBusca={state.drawerBusca}
        setDrawerBusca={state.setDrawerBusca}
        busca={state.busca}
        setBusca={state.setBusca}
        drawerCategoria={state.drawerCategoria}
        setDrawerCategoria={state.setDrawerCategoria}
        areasDosResultados={state.areasDosResultados}
        lista={state.lista}
        aulasFiltradas={state.aulasFiltradas}
      />

      <VideoaulasBottomNav />

      <VideoaulasDesempenhoSheet
        open={state.showDesempenho}
        onClose={() => state.setShowDesempenho(false)}
        horasTotais={horasAssistidas}
      />
    </div>
  );
};
