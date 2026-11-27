import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ResumoVideoaulas } from '@/lib/videoaulasResumo';
import { haptic } from '@/lib/nativeHaptics';
import ContinuarAssistindoCarousel from '@/components/videoaulas/ContinuarAssistindoCarousel';
import DesktopOnboardingOverlay from '@/components/desktop/DesktopOnboardingOverlay';
import { VideoaulasDesktopTabsBar } from '@/components/videoaulas/desktop/VideoaulasDesktopTabsBar';
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

  return (
    <div className="w-full max-w-[1380px] mx-auto px-6 lg:px-10 py-6">
      <DesktopOnboardingOverlay />
      <VideoaulasDesktopTabsBar />

      <div className="pt-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Painel Central: Conteúdo Principal (Lista de Áreas) */}
        <div className="lg:col-span-9 space-y-6">
          <ContinuarAssistindoCarousel />

          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-xl font-bold text-white font-display tracking-tight">Cursos Regulares</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {lista.length === 0 ? (
              <div className="col-span-full py-10 text-center text-zinc-500">
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
  );
});

export default VideoaulasDesktop;
