import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ResumoVideoaulas } from '@/lib/videoaulasResumo';
import { haptic } from '@/lib/nativeHaptics';
import ContinuarAssistindoCarousel from '@/components/videoaulas/ContinuarAssistindoCarousel';
import DesktopSidebar from '@/components/vademecum/desktop/DesktopSidebar';
import DesktopOnboardingOverlay from '@/components/desktop/DesktopOnboardingOverlay';
import { VideoaulasDesktopTabsBar, DESKTOP_TABS } from '@/components/videoaulas/desktop/VideoaulasDesktopTabsBar';
import { VideoaulasDesktopAreaCard } from '@/components/videoaulas/desktop/VideoaulasDesktopAreaCard';
import { VideoaulasDesktopRecentActivity } from '@/components/videoaulas/desktop/VideoaulasDesktopRecentActivity';

interface VideoaulasDesktopProps {
  data: ResumoVideoaulas;
  filtro: 'todas' | 'andamento';
  setFiltro: (f: 'todas' | 'andamento') => void;
  busca: string;
  setBusca: (s: string) => void;
  lista: any[];
}

export const VideoaulasDesktop = memo(function VideoaulasDesktop({
  lista,
}: VideoaulasDesktopProps) {
  const navigate = useNavigate();

  const handleAreaClick = useCallback((slug: string) => {
    haptic.selection();
    navigate(`/videoaulas/areas/${slug}`);
  }, [navigate]);

  const handleTabChange = useCallback((t: string) => {
    const tab = DESKTOP_TABS.find(x => x.id === t);
    if (tab) navigate(tab.path);
  }, [navigate]);

  return (
    <div className="h-[calc(100dvh-104px)] bg-background flex flex-col">
      <DesktopOnboardingOverlay />

      <div className="flex flex-1 min-h-0">
        <DesktopSidebar activeTab={'aprender' as any} onTabChange={handleTabChange} />

        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative contain-content overscroll-contain">
          <VideoaulasDesktopTabsBar />

          <div className="px-8 py-6 2xl:px-14 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
            {/* Painel Central: Conteúdo Principal (Lista de Áreas) */}
            <div className="lg:col-span-9 space-y-6">
              <ContinuarAssistindoCarousel />

              <div className="flex items-center justify-between mb-4 mt-8">
                <h2 className="text-xl font-bold text-foreground font-display">Cursos Regulares</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {lista.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-muted-foreground">
                    Nenhuma área encontrada.
                  </div>
                ) : (
                  lista.map((a) => (
                    <VideoaulasDesktopAreaCard
                      key={`${a.catalogo}-${a.slug}`}
                      a={a}
                      handleAreaClick={handleAreaClick}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Painel Direito: Widgets e Histórico */}
            <VideoaulasDesktopRecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
});

export default VideoaulasDesktop;
