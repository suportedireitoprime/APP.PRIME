import { useNavigate } from 'react-router-dom';
import { Search, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import VideoaulasDesempenhoSheet from '@/components/videoaulas/VideoaulasDesempenhoSheet';
import { useIsDesktop } from '@/hooks/use-desktop';
import { VideoaulasDesktop } from './VideoaulasDesktop';
import { haptic } from '@/lib/nativeHaptics';

import { useVideoaulas } from '@/hooks/useVideoaulas';
import { VideoaulasHero } from '@/components/videoaulas/home/VideoaulasHero';
import { VideoaulasAtalhos } from '@/components/videoaulas/home/VideoaulasAtalhos';
import { VideoaulasListaAreas } from '@/components/videoaulas/home/VideoaulasListaAreas';
import { VideoaulasBuscaDrawer } from '@/components/videoaulas/home/VideoaulasBuscaDrawer';

const Videoaulas = () => {
 const navigate = useNavigate();
 const isDesktop = useIsDesktop();
 const state = useVideoaulas();

 const pct = Math.min(100, Math.round((state.emAndamentoCount / Math.max(state.areasDireito.length, 1)) * 100));
 const r = 50;
 const c = 2 * Math.PI * r;
 const dash = c - (pct / 100) * c;

 if (isDesktop) {
 return (
 <VideoaulasDesktop
 data={state.data}
 filtro={state.filtro}
 setFiltro={state.setFiltro}
 busca={state.busca}
 setBusca={state.setBusca}
 lista={state.lista}
 />
 );
 }

 const horasAssistidas = Math.floor(state.data.totalConcluidas * 0.5);

 return (
 <div className="min-h-dvh bg-background pb-32 lg:pb-0 overflow-x-hidden w-full">
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
 {/* Card Principal com Botão de Pesquisa */}
 <div className="bg-card border border-border/80 p-5 rounded-3xl shadow-xl">
 <div className="flex items-center gap-2">
 <span className="h-5 w-1 rounded-full bg-amber-500" />
 <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Procurar Aula</h2>
 </div>
 <p className="ml-3 mt-1 mb-4 text-xs text-muted-foreground">
 Encontre videoaulas por disciplina, assunto ou termo.
 </p>

 <motion.button
 whileHover={{ scale: 1.015 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => { haptic.selection(); state.setDrawerBusca(true); }}
 className="relative w-full group text-left transition-all focus-visible:outline-none"
 >
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
 <div className="w-full h-14 sm:h-16 bg-black/80 border border-white/10 rounded-2xl pl-12 pr-12 text-muted-foreground flex items-center group-hover:border-primary/50 transition-all text-base font-medium shadow-inner shadow-black/50">
 Pesquisar no catálogo...
 </div>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full transition-colors pointer-events-none">
 <Mic className="h-5 w-5 text-muted-foreground" />
 </div>
 </motion.button>
 </div>

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

export default Videoaulas;
