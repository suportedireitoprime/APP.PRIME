import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Play, Video, Search, Mic, BookOpenText, Target, Trophy, Clock } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { simplificarNomeArea } from '@/lib/videoaulasCatalogos';
import type { ResumoVideoaulas } from '@/lib/videoaulasResumo';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import ContinuarAssistindoCarousel from '@/components/videoaulas/ContinuarAssistindoCarousel';
import { prefetchCatalogo } from '@/lib/videoaulasStore';

interface VideoaulasDesktopProps {
  data: ResumoVideoaulas;
  filtro: 'todas' | 'andamento';
  setFiltro: (f: 'todas' | 'andamento') => void;
  busca: string;
  setBusca: (s: string) => void;
  lista: any[];
}

export function VideoaulasDesktop({
  data,
  filtro,
  setFiltro,
  busca,
  setBusca,
  lista,
}: VideoaulasDesktopProps) {
  const navigate = useNavigate();

  const handleAreaClick = (slug: string) => {
    haptic.selection();
    navigate(`/videoaulas/areas/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader title="Videoaulas" onBack={() => navigate('/')} />

      <div className="w-full 2xl:max-w-[1750px] mx-auto px-6 lg:pt-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        
        {/* === PAINEL ESQUERDO: Atalhos & Hub === */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-2">
             <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-3">Atalhos</h2>
             
             <button
               onClick={() => navigate('/videoaulas/favoritos')}
               className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/40 transition-all group"
             >
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Target className="w-5 h-5" />
                 </div>
                 <span className="font-semibold text-sm">Favoritos</span>
               </div>
               <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
             </button>

             <button
               onClick={() => navigate('/videoaulas/trilhas')}
               className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/40 transition-all group"
             >
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <RouteIcon className="w-5 h-5" />
                 </div>
                 <span className="font-semibold text-sm">Trilhas Geradas</span>
               </div>
               <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
             </button>

             <button
               onClick={() => navigate('/videoaulas/anotacoes')}
               className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/40 transition-all group"
             >
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <BookOpenText className="w-5 h-5" />
                 </div>
                 <span className="font-semibold text-sm">Caderno do Aluno</span>
               </div>
               <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
             </button>
             
             <button
               onClick={() => navigate('/videoaulas/conquistas')}
               className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/40 transition-all group"
             >
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <Trophy className="w-5 h-5" />
                 </div>
                 <span className="font-semibold text-sm">Conquistas</span>
               </div>
               <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
             </button>
          </div>
        </aside>

        {/* === PAINEL CENTRAL: Conteúdo Principal (Lista de Áreas) === */}
        <div className="lg:col-span-6 space-y-6">
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
              lista.map((a) => {
                const { Icon, color } = areaIconFor(a.area);
                return (
                  <button
                    key={`${a.catalogo}-${a.slug}`}
                    onPointerDown={() => prefetchCatalogo('areas')}
                    onClick={() => handleAreaClick(a.slug)}
                    className="group flex flex-col items-start gap-4 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-5 text-left transition-all hover:border-primary/50 hover:bg-card hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/30 group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-8 w-8 transition-transform group-hover:scale-110" strokeWidth={1.9} style={{ color }} />
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

                    {/* Progress Bar Sutil */}
                    {a.pct > 0 && (
                      <div className="w-full h-1 bg-border/50 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${a.pct}%` }} />
                      </div>
                    )}
                  </button>
                );
              })
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
  );
}

export default VideoaulasDesktop;

// Para usar o RouteIcon corretamente
function RouteIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}
