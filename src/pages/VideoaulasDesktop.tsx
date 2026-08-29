import { useMemo, useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, ChevronRight, Scale, BookOpenText, Gavel, Library, MessageSquare, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { simplificarNomeArea } from '@/lib/videoaulasCatalogos';
import type { ResumoVideoaulas } from '@/lib/videoaulasResumo';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import ContinuarAssistindoCarousel from '@/components/videoaulas/ContinuarAssistindoCarousel';
import { prefetchCatalogo } from '@/lib/videoaulasStore';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';
import DesktopSidebar from '@/components/vademecum/DesktopSidebar';
import DesktopOnboardingOverlay from '@/components/desktop/DesktopOnboardingOverlay';

const DESKTOP_TABS: Array<{ id: string; label: string; icon: any; path: string; prefetch?: PrefetchKey }> = [
  { id: 'legislacao', label: 'Legislação', icon: Scale, path: '/' },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library, path: '/bibliotecas' },
  { id: 'ferramentas', label: 'Ferramentas', icon: Gavel, path: '/ferramentas', prefetch: 'ferramentas' },
  { id: 'aprender', label: 'Aprender', icon: GraduationCap, path: '/aprender', prefetch: 'aprender' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/assistente-horus' },
  { id: 'vademecum', label: 'Vade Mecum', icon: BookOpenText, path: '/vade-mecum' },
];

const AreaCard = memo(({ a, handleAreaClick }: any) => {
  const { Icon, color } = areaIconFor(a.area);
  return (
    <button
      onPointerDown={() => prefetchCatalogo('areas')}
      onClick={() => handleAreaClick(a.slug)}
      className="group flex flex-col items-start gap-4 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-5 text-left transition-all hover:border-primary/50 hover:bg-card hover:shadow-xl hover:-translate-y-1 will-change-transform"
    >
      <div className="flex w-full items-center justify-between">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/30 group-hover:bg-primary/10 transition-colors">
          <Icon className="h-8 w-8 transition-transform group-hover:scale-110 will-change-transform" strokeWidth={1.9} style={{ color }} />
        </div>
        {a.pct > 0 && (
          <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold text-primary">{a.pct}%</span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-base font-bold text-foreground leading-tight">
          {simplificarNomeArea(a.area)}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
          <Video className="h-3.5 w-3.5" />
          <span>{a.total} aulas</span>
        </p>
      </div>

      {a.pct > 0 && (
        <div className="w-full h-1 bg-border/50 rounded-full overflow-hidden mt-1">
          <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${a.pct}%` }} />
        </div>
      )}
    </button>
  );
});

interface VideoaulasDesktopProps {
  data: ResumoVideoaulas;
  filtro: 'todas' | 'andamento';
  setFiltro: (f: 'todas' | 'andamento') => void;
  busca: string;
  setBusca: (s: string) => void;
  lista: any[];
}

export const VideoaulasDesktop = memo(function VideoaulasDesktop({
  data,
  filtro,
  setFiltro,
  busca,
  setBusca,
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
    <div className="min-h-dvh bg-background flex flex-col">
      <DesktopOnboardingOverlay />
      
      <div className="flex flex-1 min-h-0">
        <DesktopSidebar activeTab={'aprender' as any} onTabChange={handleTabChange} />
        
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative contain-content overscroll-contain">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center gap-1 px-8 h-12">
              {DESKTOP_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = 'aprender' === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    onMouseEnter={() => { if (tab.prefetch) prefetchRoute(tab.prefetch); }}
                    onFocus={() => { if (tab.prefetch) prefetchRoute(tab.prefetch); }}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground/60 hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {isActive && <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-8 py-6 2xl:px-14 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
            
            {/* === PAINEL CENTRAL: Conteúdo Principal (Lista de Áreas) === */}
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
                <AreaCard key={`${a.catalogo}-${a.slug}`} a={a} handleAreaClick={handleAreaClick} />
              ))
            )}
          </div>
        </div>

        {/* === PAINEL DIREITO: Widgets e Histórico === */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 pt-3 lg:pt-0">
          <div className="bg-card/30 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Atividade Recente</h2>
            </div>
            
            <button 
              onClick={() => navigate('/videoaulas/recentes')}
              className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-foreground">Histórico de Visualização</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Veja todas as aulas que você já começou.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </button>
          </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoaulasDesktop;


