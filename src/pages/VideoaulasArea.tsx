import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { CheckCircle2, History, Mic, PlayCircle, Search, Star, Video, BookOpenText, Route as RouteIcon, Calendar, Lightbulb, Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { formatDuracao, getCatalogo, limparTitulo, ytThumb } from '@/lib/videoaulasCatalogos';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from '@/components/ui/drawer';
import {
  getCachedAulasDaArea,
  getCachedFavoritos,
  getCachedProgresso,
  loadAulasDaArea,
  loadFavoritos,
  loadProgresso,
  subscribeVideoaulas,
  type ProgressoRow,
} from '@/lib/videoaulasStore';
import { useAreaTrilhaStore } from '@/lib/areaTrilhasStore';

type Aula = {
  id: string | number;
  video_id: string;
  titulo: string;
  area?: string | null;
  ordem?: number | null;
  duracao_segundos?: number | null;
  thumb?: string | null;
  thumbnail?: string | null;
};

type ProgressoMap = Record<string, { percentual: number; concluida: boolean }>;

function mapearProgresso(rows: ProgressoRow[] | null, tabela: string): ProgressoMap {
  const map: ProgressoMap = {};
  (rows ?? [])
    .filter((p) => p.tabela === tabela)
    .forEach((p) => {
      map[p.video_id] = { percentual: p.percentual ?? 0, concluida: !!p.concluida };
    });
  return map;
}

// --- SETUP RITMO DA TRILHA LOCAL ---
const AreaTrilhaSetup = ({ areaSlug, onFinish }: { areaSlug: string, onFinish: (dias: number) => void }) => {
  const [dias, setDias] = useState(30);
  const opcoesDias = [15, 30, 45, 90];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full flex flex-col pt-4 px-4 pb-32"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Prazo da Disciplina</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Em quanto tempo você quer bater todas as aulas desta área?
        </p>

        <div className="grid grid-cols-2 gap-3 mt-8">
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
              <span className={`text-xs font-semibold uppercase tracking-wider ${dias === num ? 'text-primary/80' : 'text-muted-foreground'}`}>
                Dias
              </span>
              {dias === num && <CheckCircle2 className="w-5 h-5 text-primary absolute top-2 right-2" />}
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


// --- MAPA FLUIDO DA TRILHA LOCAL ---
const AreaTrilhaMap = ({ areaSlug, catalogoId, aulas }: { areaSlug: string, catalogoId: string, aulas: Aula[] }) => {
  const navigate = useNavigate();
  const { trilhasAtivas, limparAreaTrilha, marcarDiaConcluido, desmarcarDiaConcluido } = useAreaTrilhaStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const trilhaAtiva = trilhasAtivas[areaSlug];

  const nodos = useMemo(() => {
    if (!trilhaAtiva || !aulas.length) return [];
    const diasList = [];
    
    // Distribui as aulas pelo número de dias selecionado
    const aulasPorDia = Math.ceil(aulas.length / trilhaAtiva.diasMeta);
    let aulaIndex = 0;

    for (let i = 0; i < trilhaAtiva.diasMeta; i++) {
      const selecionadas = [];
      for(let a=0; a < aulasPorDia; a++){
        if (aulaIndex < aulas.length) {
          selecionadas.push(aulas[aulaIndex]);
          aulaIndex++;
        }
      }
      // Mesmo se um dia ficar vazio (por arredondamento), mantemos o nó
      diasList.push({ dia: i + 1, aulas: selecionadas });
    }
    return diasList;
  }, [aulas, trilhaAtiva]);

  if (!trilhaAtiva) return null;

  const totalConcluido = trilhaAtiva.diasConcluidos.length;
  const progressoPct = Math.round((totalConcluido / trilhaAtiva.diasMeta) * 100);

  return (
    <div className="w-full pb-32">
      <div className="sticky top-[58px] z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-0.5">Missão Local</p>
          <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{trilhaAtiva.diasMeta} Dias</p>
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

      <div className="px-4 py-10 relative overflow-hidden">
        <div className="absolute left-1/2 top-10 bottom-10 w-1.5 bg-white/5 -translate-x-1/2 z-0 rounded-full overflow-hidden">
          <div 
            className="w-full bg-primary/80 transition-all duration-700 ease-in-out" 
            style={{ height: `${(totalConcluido / trilhaAtiva.diasMeta) * 100}%`, boxShadow: '0 0 10px rgba(var(--primary), 0.5)' }} 
          />
        </div>

        <div className="space-y-10">
          {nodos.map((nodo, i) => {
            const concluido = trilhaAtiva.diasConcluidos.includes(nodo.dia);
            const isLeft = i % 2 === 0;

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

                <button
                  onClick={() => {
                    haptic.selection();
                    if(concluido) {
                      desmarcarDiaConcluido(areaSlug, nodo.dia);
                    } else {
                      marcarDiaConcluido(areaSlug, nodo.dia);
                    }
                  }}
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
                </button>

                <div 
                  className={`w-[45%] rounded-3xl p-4 relative z-30 transition-all duration-300 backdrop-blur-md border ${
                    concluido 
                      ? 'bg-primary/5 border-primary/20 shadow-sm opacity-80' 
                      : 'bg-card/40 border-white/10 shadow-lg hover:border-white/20 hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${concluido ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      Dia {nodo.dia}
                    </p>
                    {(nodo.dia === 1 || nodo.dia === trilhaAtiva.diasMeta) && !concluido && (
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500/70 animate-pulse" />
                    )}
                  </div>
                  
                  <div className="space-y-2.5">
                    {nodo.aulas.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic">Revisão livre</p>
                    ) : (
                      nodo.aulas.map((aula) => (
                        <button 
                          key={String(aula.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            haptic.light();
                            navigate(`/videoaulas/${catalogoId}/${areaSlug}/${aula.video_id}`);
                          }}
                          className="flex flex-col gap-1 w-full text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${concluido ? 'bg-primary/20' : 'bg-white/5 group-hover:bg-primary/20'}`}>
                              <PlayCircle className={`w-3 h-3 ${concluido ? 'text-primary' : 'text-foreground/70 group-hover:text-primary'}`} />
                            </div>
                            <p className={`text-[11px] font-semibold line-clamp-3 leading-tight ${concluido ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                              {limparTitulo(aula.titulo)
                                .replace(new RegExp(`^${aula.area} - `, 'i'), '')
                                .replace(new RegExp(`^${aula.area} `, 'i'), '')}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <DrawerContent className="bg-card border-t border-white/10 flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
            <div className="p-6">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />
              <h3 className="text-xl font-black mb-2">Ajustes da Missão</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Você definiu o prazo de <strong className="text-foreground">{trilhaAtiva.diasMeta} dias</strong> para finalizar esta disciplina.
              </p>
              <button
                onClick={() => {
                  haptic.medium();
                  limparAreaTrilha(areaSlug);
                  setDrawerOpen(false);
                }}
                className="w-full bg-destructive/10 text-destructive font-bold py-4 rounded-2xl hover:bg-destructive/20 transition-colors active:scale-[0.98]"
              >
                Abortar Missão
              </button>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </div>
  );
};


/** Aulas de uma área do catálogo. */
const VideoaulasArea = () => {
  const { catalogo: catalogoId, area: areaSlug } = useParams();
  const navigate = useNavigate();
  const catalogo = getCatalogo(catalogoId);

  const [aulas, setAulas] = useState<Aula[]>(
    () => (catalogo ? (getCachedAulasDaArea(catalogo.id, areaSlug!) as Aula[] | null) : null) ?? [],
  );
  const [progresso, setProgresso] = useState<ProgressoMap>(() =>
    catalogo ? mapearProgresso(getCachedProgresso(), catalogo.tabela) : {},
  );
  const [favoritos, setFavoritos] = useState<Set<string>>(
    () => new Set((getCachedFavoritos() ?? []).map((f) => f.video_id)),
  );
  
  const location = useLocation();
  const [aba, setAba] = useState<'videos' | 'trilhas' | 'favoritos' | 'recentes' | 'anotacoes'>(
    (location.state as any)?.tab || 'videos'
  );
  const [busca, setBusca] = useState('');
  const { listening, partial, toggle } = useVoiceInput((t) => setBusca(t));
  const [loading, setLoading] = useState(
    () => !(catalogo && getCachedAulasDaArea(catalogo.id, areaSlug!)?.length),
  );

  const { trilhasAtivas, setAreaTrilhaAtiva } = useAreaTrilhaStore();

  useEffect(() => {
    if (!catalogo || !areaSlug) return;
    let alive = true;

    const doCache = getCachedAulasDaArea(catalogo.id, areaSlug) as Aula[] | null;
    if (doCache?.length) {
      setAulas(doCache);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setProgresso(mapearProgresso(getCachedProgresso(), catalogo.tabela));

    void (async () => {
      const [rows, prog, favs] = await Promise.all([
        loadAulasDaArea(catalogo.id, areaSlug),
        loadProgresso(),
        loadFavoritos(),
      ]);
      if (!alive) return;
      setAulas(rows as Aula[]);
      setProgresso(mapearProgresso(prog, catalogo.tabela));
      setFavoritos(new Set((favs ?? []).map((f) => f.video_id)));
      setLoading(false);
    })();

    const off = subscribeVideoaulas(() => {
      if (!alive) return;
      const novas = getCachedAulasDaArea(catalogo.id, areaSlug) as Aula[] | null;
      if (novas?.length) setAulas(novas);
      setProgresso(mapearProgresso(getCachedProgresso(), catalogo.tabela));
      setFavoritos(new Set((getCachedFavoritos() ?? []).map((f) => f.video_id)));
    });

    return () => {
      alive = false;
      off();
    };
  }, [catalogo, areaSlug]);

  const nomeArea = useMemo(
    () => aulas[0]?.area || (catalogo?.temAreas ? 'Área' : catalogo?.titulo) || 'Aulas',
    [aulas, catalogo],
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let base = aulas;
    if (aba === 'favoritos') base = base.filter((a) => favoritos.has(a.video_id));
    if (aba === 'recentes') {
      base = base.filter((a) => (progresso[a.video_id]?.percentual ?? 0) > 0);
    }
    if (termo) base = base.filter((a) => limparTitulo(a.titulo).toLowerCase().includes(termo));
    return base;
  }, [aulas, aba, busca, favoritos, progresso]);

  if (!catalogo || !areaSlug) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-sm text-muted-foreground">Catálogo não encontrado.</p>
      </div>
    );
  }

  // Menus do Rodapé
  const MENU = [
    { id: 'videos', label: 'Vídeos', icon: Video },
    { id: 'trilhas', label: 'Trilhas', icon: RouteIcon },
    { id: 'favoritos', label: 'Favoritos', icon: Star },
    { id: 'recentes', label: 'Recentes', icon: History },
    { id: 'anotacoes', label: 'Anotações', icon: BookOpenText },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px))+80px)]">
      <PageHeader
        title={nomeArea}
        subtitle={loading ? 'Carregando…' : `${aulas.length} aulas`}
        onBack={() => navigate(`/videoaulas/${catalogo.id}`)}
      />

      <AnimatePresence mode="wait">
        {(aba === 'videos' || aba === 'favoritos' || aba === 'recentes') && (
          <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mx-auto max-w-md lg:max-w-5xl px-4 pt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={listening ? partial : busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={listening ? 'Ouvindo…' : 'Buscar aula…'}
                  aria-label="Buscar aula"
                  className="rounded-full bg-card pl-9 pr-11"
                />
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={listening ? 'Parar busca por voz' : 'Buscar por voz'}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full transition-colors ${
                    listening ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-w-md lg:max-w-7xl mx-auto px-4 pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lista.map((a, i) => {
                const p = progresso[a.video_id];
                const pct = p?.concluida ? 100 : Math.min(100, Math.round(p?.percentual ?? 0));
                return (
                  <button
                    key={String(a.id)}
                    onClick={() => navigate(`/videoaulas/${catalogo.id}/${areaSlug}/${a.video_id}`)}
                    className="w-full text-left rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-lg hover:border-primary/50 transition-all overflow-hidden flex gap-3 p-3 active:scale-[0.98] h-32"
                  >
                    <div className="relative w-36 shrink-0 aspect-video rounded-xl overflow-hidden bg-muted self-center shadow-inner">
                      <img
                        src={a.thumb || a.thumbnail || ytThumb(a.video_id, 'mq')}
                        alt={`Capa da aula ${limparTitulo(a.titulo)}`}
                        width={320}
                        height={180}
                        loading={i < 4 ? 'eager' : 'lazy'}
                        // @ts-expect-error atributo nativo
                        fetchpriority={i < 4 ? 'high' : 'low'}
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      <span className="absolute inset-0 grid place-items-center">
                        {p?.concluida ? (
                          <CheckCircle2 className="h-7 w-7 text-primary shadow-sm" fill="currentColor" />
                        ) : (
                          <PlayCircle className="h-8 w-8 text-white drop-shadow-md" />
                        )}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-[10px] font-black tracking-wider uppercase text-primary/80">Aula {a.ordem ?? i + 1}</p>
                          {favoritos.has(a.video_id) && (
                            <Star className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" />
                          )}
                        </div>
                        
                        <p className="text-xs font-semibold leading-tight text-foreground line-clamp-2">
                          {limparTitulo(a.titulo)}
                        </p>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-1.5">
                           <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            {p?.concluida ? 'Concluída' : pct > 0 ? `${pct}% assistido` : a.duracao_segundos ? formatDuracao(a.duracao_segundos) : '0%'}
                          </p>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {!loading && lista.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Nenhuma aula encontrada.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {aba === 'trilhas' && (
          <motion.div key="trilhas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!trilhasAtivas[areaSlug] ? (
              <AreaTrilhaSetup 
                areaSlug={areaSlug} 
                onFinish={(dias) => {
                  setAreaTrilhaAtiva(areaSlug, {
                    areaSlug,
                    areaName: nomeArea,
                    catalogoId: catalogo.id,
                    diasMeta: dias,
                    diasConcluidos: [],
                    dataInicio: new Date().toISOString()
                  });
                }} 
              />
            ) : (
              <AreaTrilhaMap areaSlug={areaSlug} catalogoId={catalogo.id} aulas={aulas} />
            )}
          </motion.div>
        )}

        {aba === 'anotacoes' && (
          <motion.div key="anotacoes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center pt-24 px-6 text-center">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpenText className="w-10 h-10 text-primary opacity-80" />
             </div>
             <h2 className="text-xl font-bold mb-2">Anotações da Disciplina</h2>
             <p className="text-sm text-muted-foreground">Em breve, seus cadernos e resumos de <strong>{nomeArea}</strong> aparecerão listados aqui.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu de Rodapé Exclusivo da Área */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))]">
        <div className="flex h-16 max-w-md mx-auto relative px-1">
          {MENU.map(({ id, label, icon: Icon }) => {
            const ativo = aba === id;
            return (
              <button
                key={id}
                onClick={() => {
                  if (!ativo) haptic.selection();
                  setAba(id as typeof aba);
                }}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative z-10"
              >
                <motion.div 
                  animate={{ y: ativo ? -2 : 0, scale: ativo ? 1.1 : 1 }} 
                  className={`relative p-1.5 rounded-full transition-colors ${ativo ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={ativo ? 2.5 : 2} />
                </motion.div>
                <span className={`text-[10px] font-semibold transition-colors ${ativo ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default VideoaulasArea;
