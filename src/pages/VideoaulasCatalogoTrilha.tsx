import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, PlayCircle, Route as RouteIcon, CheckCircle2, Settings2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useCategoriaTrilhaStore } from '@/lib/categoriaTrilhaStore';
import { getCatalogo, limparTitulo, slugify, ytThumb, formatDuracao, getCapaDaArea } from '@/lib/videoaulasCatalogos';
import { loadCatalogo, getCachedCatalogo, loadProgresso, getCachedProgresso } from '@/lib/videoaulasStore';
import { haptic } from '@/lib/nativeHaptics';
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from '@/components/ui/drawer';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import ThumbImg from '@/components/videoaulas/ThumbImg';

type Aula = {
  id: string | number;
  video_id: string;
  titulo: string;
  area?: string | null;
  duracao_segundos?: number | null;
  thumb?: string | null;
  thumbnail?: string | null;
  percentual?: number;
  concluida?: boolean;
};

// --- SETUP FASE: RITMO/PRAZO ---
const SetupRitmo = ({ catalogoId, titulo, onBack, onFinish }: { catalogoId: string, titulo: string, onBack: () => void, onFinish: (dias: number) => void }) => {
  const [dias, setDias] = useState(15);
  const opcoesDias = [7, 15, 30];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col pt-4 px-4 pb-32"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Prazo da Missão</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Em quanto tempo você quer concluir o catálogo <strong className="text-foreground">{titulo}</strong>?
        </p>

        <div className="grid grid-cols-3 gap-3 mt-8">
          {opcoesDias.map(num => (
            <button
              key={num}
              onClick={() => {
                haptic.selection();
                setDias(num);
              }}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                dias === num ? 'border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20' : 'border-border/50 bg-card/60 backdrop-blur hover:border-primary/50'
              }`}
            >
              <span className={`text-2xl font-black ${dias === num ? 'text-primary' : 'text-foreground'}`}>
                {num}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${dias === num ? 'text-primary/80' : 'text-muted-foreground'}`}>
                Dias
              </span>
              {dias === num && <CheckCircle2 className="w-4 h-4 text-primary absolute top-2 right-2" />}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            haptic.success();
            onFinish(dias);
          }}
          className="w-full mt-10 bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all active:scale-95"
        >
          Gerar Minha Trilha
        </button>
      </div>
    </motion.div>
  );
};

const TrilhaMap = ({ catalogoId, titulo, aulas, onBack }: { catalogoId: string, titulo: string, aulas: Aula[], onBack: () => void }) => {
  const navigate = useNavigate();
  const { trilhasAtivas, limparCategoriaTrilha } = useCategoriaTrilhaStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [expandedDays, setExpandedDays] = useState<number[]>([]);

  const toggleExpand = (dia: number, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    setExpandedDays(prev => 
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

  const trilhaAtiva = trilhasAtivas[catalogoId];

  const nodos = useMemo(() => {
    if (!trilhaAtiva || !aulas.length) return [];
    const diasList = [];
    const totalAulas = aulas.length;
    const aulasPorDia = Math.ceil(totalAulas / trilhaAtiva.diasMeta);
    
    for (let i = 0; i < trilhaAtiva.diasMeta; i++) {
      const startIndex = i * aulasPorDia;
      const selecionadas = aulas.slice(startIndex, startIndex + aulasPorDia);
      if (selecionadas.length > 0) {
        diasList.push({ dia: i + 1, aulas: selecionadas });
      }
    }
    return diasList;
  }, [trilhaAtiva, aulas]);

  const firstUncompleted = nodos.find(n => !n.aulas.every(a => a.concluida))?.dia || 1;
  const [diaSelecionado, setDiaSelecionado] = useState(firstUncompleted);

  if (!trilhaAtiva) return null;

  const totalConcluido = nodos.filter(n => n.aulas.every(a => a.concluida)).length;
  const progressoPct = Math.round((totalConcluido / trilhaAtiva.diasMeta) * 100);

  const nodoAtual = nodos.find(n => n.dia === diaSelecionado);
  const diaConcluido = nodoAtual?.aulas.every(a => a.concluida) ?? false;
  const percentualDia = nodoAtual?.aulas.length 
    ? Math.round((nodoAtual.aulas.filter(a => a.concluida).length / nodoAtual.aulas.length) * 100) 
    : 0;

  return (
    <div className="w-full pb-32">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-0.5">Trilha Inteligente</p>
            <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{titulo}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-primary">{progressoPct}%</span>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
                <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressoPct}%` }} />
              </div>
            </div>
            <button 
              onClick={() => {
                haptic.selection();
                setDrawerOpen(true);
              }}
              className="p-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex bg-white/5 rounded-full p-1 mt-1">
          <button 
            onClick={() => { haptic.selection(); setViewMode('map'); }} 
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 ${viewMode === 'map' ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <RouteIcon className="w-4 h-4" />
            Mapa
          </button>
          <button 
            onClick={() => { haptic.selection(); setViewMode('list'); }} 
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Calendar className="w-4 h-4" />
            Por Dia
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="px-4 py-10 relative overflow-hidden">
          <div className="absolute left-1/2 top-10 bottom-10 w-1.5 bg-white/5 -translate-x-1/2 z-0 rounded-full overflow-hidden">
            <div 
              className="w-full bg-primary/80 transition-all duration-700 ease-in-out" 
              style={{ height: `${(totalConcluido / trilhaAtiva.diasMeta) * 100}%`, boxShadow: '0 0 10px rgba(var(--primary), 0.5)' }} 
            />
          </div>

          <div className="space-y-10">
            {nodos.map((nodo, i) => {
              const concluido = nodo.aulas.every(a => a.concluida);
              const isLeft = i % 2 === 0;
              const isExpanded = expandedDays.includes(nodo.dia);
              const needsExpand = nodo.aulas.length > 4;
              const displayedAulas = (needsExpand && !isExpanded) ? nodo.aulas.slice(0, 3) : nodo.aulas;

              return (
                <motion.div
                  key={nodo.dia}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ type: 'spring', stiffness: 110, damping: 15, delay: i * 0.05 }}
                  className={`relative z-10 flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`absolute top-1/2 w-[calc(50%-2.5rem)] h-[2px] border-b-2 border-dotted -translate-y-1/2 z-0 ${concluido ? 'border-primary/40' : 'border-white/10'} ${isLeft ? 'left-1/2' : 'right-1/2'}`} />

                  <div
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-20 flex items-center justify-center transition-all duration-300 ${
                      concluido 
                        ? 'bg-primary border-4 border-background shadow-[0_0_15px_rgba(var(--primary),0.6)] scale-110' 
                        : 'bg-[#1A1A1A] border-4 border-background text-muted-foreground'
                    }`}
                  >
                    {concluido ? (
                      <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <span className="text-[11px] font-black">{nodo.dia}</span>
                    )}
                  </div>

                  <div 
                    className={`w-[45%] rounded-3xl p-4 relative z-30 transition-all duration-300 backdrop-blur-md border ${
                      concluido 
                        ? 'bg-primary/5 border-primary/20 shadow-sm opacity-80' 
                        : 'bg-card/40 border-white/10 shadow-lg hover:border-white/20 hover:-translate-y-1'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${concluido ? 'text-primary/70' : 'text-muted-foreground'}`}>
                        Dia {nodo.dia}
                        <span className="opacity-50 text-[9px]">• {nodo.aulas.length} aulas</span>
                      </p>
                      {(nodo.dia === 1 || nodo.dia === trilhaAtiva.diasMeta) && !concluido && (
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500/70 animate-pulse" />
                      )}
                    </div>
                    
                    <div className="space-y-2.5">
                      {displayedAulas.map((aula, idx) => {
                        const rotaAula = aula.area 
                          ? `/videoaulas/${catalogoId}/${slugify(aula.area)}/${aula.video_id}`
                          : `/videoaulas/${catalogoId}/todas/${aula.video_id}`;

                        return (
                          <button 
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.light();
                              navigate(rotaAula);
                            }}
                            className="flex flex-col gap-1 w-full text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${concluido ? 'bg-primary/20' : 'bg-white/5 group-hover:bg-primary/20'}`}>
                                <PlayCircle className={`w-3 h-3 ${concluido ? 'text-primary' : 'text-foreground/70 group-hover:text-primary'}`} />
                              </div>
                              <p className={`text-[11px] font-semibold line-clamp-2 leading-tight ${concluido ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                                {limparTitulo(aula.titulo)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                      
                      {needsExpand && (
                        <button
                          onClick={(e) => toggleExpand(nodo.dia, e)}
                          className={`w-full mt-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            isExpanded 
                              ? 'bg-white/5 text-muted-foreground hover:bg-white/10' 
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {isExpanded ? 'Ver menos' : `+ ${nodo.aulas.length - 3} Aulas`}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto hide-scrollbar px-4 py-4 border-b border-white/5 sticky top-[110px] z-30 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {nodos.map(nodo => {
                const isSelected = nodo.dia === diaSelecionado;
                const isConcluido = nodo.aulas.every(a => a.concluida);
                
                return (
                  <button
                    key={nodo.dia}
                    onClick={() => {
                      haptic.selection();
                      setDiaSelecionado(nodo.dia);
                    }}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 relative ${
                      isSelected 
                        ? 'border-primary bg-primary/10 scale-105 shadow-[0_0_15px_rgba(var(--primary),0.3)]' 
                        : isConcluido
                          ? 'border-white/10 bg-white/5 opacity-60'
                          : 'border-white/10 bg-card/60 hover:border-white/20'
                    }`}
                  >
                    <span className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      Dia
                    </span>
                    <span className={`text-xl font-black ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {nodo.dia}
                    </span>
                    {isConcluido && (
                      <div className="absolute -top-1 -right-1 bg-background rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={diaSelecionado}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black text-foreground">Aulas do Dia {diaSelecionado}</h3>
                  <span className="text-xs font-bold text-muted-foreground px-2 py-1 bg-white/5 rounded-full uppercase tracking-wider">
                    {nodoAtual?.aulas.length} Aulas
                  </span>
                </div>

                <div className="flex flex-col relative pl-6">
                  <div className="absolute left-[7px] top-8 bottom-8 w-[2px] bg-white/10" />

                  {nodoAtual?.aulas.map((aula, idx) => {
                    const rotaAula = aula.area 
                      ? `/videoaulas/${catalogoId}/${slugify(aula.area)}/${aula.video_id}`
                      : `/videoaulas/${catalogoId}/todas/${aula.video_id}`;

                    return (
                      <div key={idx} className="relative flex items-center gap-4 py-3">
                        <div className={`absolute -left-6 w-3 h-3 rounded-full border-2 border-background z-20 ${diaConcluido ? 'bg-primary' : 'bg-white/20'}`} />

                        <button
                          onClick={() => {
                            haptic.light();
                            navigate(rotaAula);
                          }}
                          className="group flex gap-4 w-full text-left bg-card/30 border border-white/5 rounded-2xl p-2.5 hover:bg-card/60 hover:border-white/20 transition-all active:scale-[0.98]"
                        >
                          <div className={`relative aspect-video w-[100px] rounded-xl overflow-hidden shrink-0 border ${
                            diaConcluido ? 'border-primary/20 opacity-70' : 'border-white/10 group-hover:border-primary/50'
                          } transition-colors bg-muted`}>
                            <ThumbImg
                              src={getCapaDaArea(aula.area) || aula.thumb || aula.thumbnail || ytThumb(aula.video_id)}
                              alt={`Capa da aula ${limparTitulo(aula.titulo)}`}
                              fallback={<PlayCircle className="h-6 w-6 text-primary/50" />}
                            />
                            <span className="absolute inset-0 grid place-items-center bg-black/20 group-hover:bg-black/10 transition-colors">
                              <PlayCircle className={`h-6 w-6 fill-current ${diaConcluido ? 'text-primary' : 'text-white'}`} />
                            </span>
                            {typeof aula.percentual === 'number' && aula.percentual > 0 && (
                              <span
                                className="absolute bottom-0 left-0 h-1 bg-primary z-30 transition-all"
                                style={{ width: `${Math.min(100, aula.percentual)}%` }}
                              />
                            )}
                          </div>
                          
                          <div className="flex-1 py-1 flex flex-col justify-center">
                            <p className={`text-[11px] font-bold line-clamp-2 leading-tight mb-1 ${diaConcluido ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                              {limparTitulo(aula.titulo)}
                            </p>
                            {aula.duracao_segundos && (
                              <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 opacity-80">
                                <PlayCircle className="w-3 h-3" />
                                {formatDuracao(aula.duracao_segundos)}
                              </p>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {diaConcluido ? (
                  <div className="w-full mt-6 py-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    <span className="text-sm font-black text-primary uppercase tracking-widest">Dia Concluído!</span>
                  </div>
                ) : (
                  <div className="w-full mt-6 bg-card border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progresso do Dia {diaSelecionado}</span>
                      <span className="text-xs font-black text-primary">{percentualDia}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${percentualDia}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium text-center">Falta {100 - percentualDia}% para você concluir</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <DrawerContent className="bg-card border-t border-white/10 flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 pb-[calc(1.25rem+var(--safe-bottom))]">
            <div className="p-6">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />
              <h3 className="text-xl font-black mb-2">Ajustes da Trilha</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Você definiu o prazo de <strong className="text-foreground">{trilhaAtiva.diasMeta} dias</strong> para concluir este catálogo.
              </p>
              
              <button
                onClick={() => {
                  haptic.medium();
                  limparCategoriaTrilha(catalogoId);
                  setDrawerOpen(false);
                }}
                className="w-full bg-destructive/10 text-destructive font-bold py-4 rounded-2xl hover:bg-destructive/20 transition-colors active:scale-[0.98]"
              >
                Refazer Trilha (Alterar Dias)
              </button>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </div>
  );
};


const VideoaulasCatalogoTrilha = () => {
  const navigate = useNavigate();
  const { catalogo: catalogoIdParam } = useParams();
  const catalogo = getCatalogo(catalogoIdParam);
  
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { trilhasAtivas, setCategoriaTrilhaAtiva } = useCategoriaTrilhaStore();

  useEffect(() => {
    if (!catalogo) {
      setLoading(false);
      return;
    }
    let alive = true;

    (async () => {
      const cacheAulas = getCachedCatalogo(catalogo.id) as Aula[] | null;
      let aulasTemp = cacheAulas || [];
      if (aulasTemp.length > 0) {
        setAulas(aulasTemp);
        setLoading(false);
      }

      const rows = await loadCatalogo(catalogo.id);
      if (!alive) return;
      aulasTemp = rows as Aula[];
      
      const prog = getCachedProgresso() ?? (await loadProgresso());
      if (!alive) return;

      const progMap = new Map(prog.filter(p => p.tabela === catalogo.tabela).map(p => [p.video_id, p]));
      
      const aulasComProgresso = aulasTemp.map(a => {
        const p = progMap.get(a.video_id);
        return {
          ...a,
          percentual: p?.percentual,
          concluida: p?.concluida
        };
      });

      setAulas(aulasComProgresso);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [catalogo]);

  if (!catalogo) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <PageHeader title="Erro" onBack={() => navigate('/videoaulas/categorias')} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Catálogo não encontrado.</p>
        </div>
      </div>
    );
  }

  const hasTrilha = !!trilhasAtivas[catalogo.id];

  return (
    <div className="relative min-h-screen bg-[#0A0A0A]">
      <div className="relative z-10">
        <PageHeader
          title={catalogo.titulo}
          subtitle="Trilha Inteligente"
          onBack={() => navigate(`/videoaulas/${catalogo.id}`)}
        />

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!hasTrilha ? (
              <SetupRitmo 
                key="ritmo" 
                catalogoId={catalogo.id} 
                titulo={catalogo.titulo}
                onBack={() => navigate(`/videoaulas/${catalogo.id}`)}
                onFinish={(dias) => {
                  setCategoriaTrilhaAtiva(catalogo.id, {
                    catalogoId: catalogo.id,
                    diasMeta: dias,
                    diasConcluidos: [],
                    dataInicio: new Date().toISOString()
                  });
                }} 
              />
            ) : (
              <motion.div key="mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TrilhaMap 
                  catalogoId={catalogo.id}
                  titulo={catalogo.titulo}
                  aulas={aulas}
                  onBack={() => navigate(`/videoaulas/${catalogo.id}`)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasCatalogoTrilha;
