import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, History, Play, Video, Search, Mic, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { CATALOGOS, limparTitulo, simplificarNomeArea, slugify, ytThumb, getCapaDaArea } from '@/lib/videoaulasCatalogos';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  carregarResumoVideoaulas,
  RESUMO_VAZIO,
  resumoVideoaulasSincrono,
  type ResumoVideoaulas,
} from '@/lib/videoaulasResumo';
import {
  getCachedCatalogo,
  prefetchCatalogo,
  subscribeVideoaulas,
  warmVideoaulasCache,
} from '@/lib/videoaulasStore';
import { haptic } from '@/lib/nativeHaptics';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const vowels: Record<string, string> = {
    a: '[aáàãâä]', e: '[eéèêë]', i: '[iíìîï]', o: '[oóòõôö]', u: '[uúùûü]', c: '[cç]'
  };
  
  const termos = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (termos.length === 0) return <>{text}</>;

  const patternStr = termos.map(termo => 
    escapeRegExp(termo).split('').map(char => vowels[char] || char).join('')
  ).join('|');

  try {
    const regex = new RegExp(`(${patternStr})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="text-primary font-bold">{part}</span> : part
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
};

const Videoaulas = () => {
  const navigate = useNavigate();
  // Render instantâneo: se o cache em memória já tem os catálogos, pinta na hora.
  const [data, setData] = useState<ResumoVideoaulas>(() => resumoVideoaulasSincrono() ?? RESUMO_VAZIO);
  const [loading, setLoading] = useState(() => !resumoVideoaulasSincrono());
  const [filtro, setFiltro] = useState<'todas' | 'andamento'>('todas');
  const [busca, setBusca] = useState('');
  const [drawerBusca, setDrawerBusca] = useState(false);
  const [drawerCategoria, setDrawerCategoria] = useState('Todos');

  useEffect(() => {
    if (!drawerBusca) {
      setBusca('');
      setDrawerCategoria('Todos');
    }
  }, [drawerBusca]);

  useEffect(() => {
    let alive = true;
    const atualizar = () => {
      carregarResumoVideoaulas().then((r) => {
        if (!alive) return;
        setData(r);
        setLoading(false);
      });
    };
    atualizar();
    warmVideoaulasCache();
    // Quando o cache é revalidado em background, a tela se atualiza sozinha.
    const off = subscribeVideoaulas(() => {
      const sync = resumoVideoaulasSincrono();
      if (alive && sync) {
        setData(sync);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
      off();
    };
  }, []);



  // No início: as áreas do Direito (Penal, Civil, etc.).
  const areasDireito = useMemo(
    () => data.areas.filter((a) => a.catalogo === 'areas'),
    [data.areas],
  );

  const emAndamentoCount = useMemo(
    () => areasDireito.filter((a) => a.pct > 0).length,
    [areasDireito],
  );

  const lista = useMemo(() => {
    const l = [...areasDireito].sort((a, b) => {
      const ai = a.pct > 0 ? 0 : 1;
      const bi = b.pct > 0 ? 0 : 1;
      if (ai !== bi) return ai - bi;
      if (ai === 0 && b.pct !== a.pct) return b.pct - a.pct;
      return a.area.localeCompare(b.area, 'pt-BR');
    });
    let result = filtro === 'andamento' ? l.filter((a) => a.pct > 0) : l;
    if (busca.trim()) {
      const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const termos = normalize(busca).split(/\s+/).filter(Boolean);
      result = result.filter(a => {
        const areaNormalizada = normalize(a.area);
        return termos.every(t => areaNormalizada.includes(t));
      });
    }
    return result;
  }, [areasDireito, filtro, busca]);

  // Busca nas aulas individuais (títulos) — só quando há termo de busca
  const buscaAulas = useMemo(() => {
    if (!busca.trim()) return [];
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const termos = normalize(busca).split(/\s+/).filter(Boolean);
    type AulaHit = { catalogoId: string; videoId: string; titulo: string; area: string; slugArea: string };
    const hits: AulaHit[] = [];
    for (const cat of CATALOGOS) {
      const cache = getCachedCatalogo(cat.id);
      if (!cache) continue;
      for (const row of cache) {
        const area = cat.temAreas ? String(row.area ?? '').trim() : cat.titulo;
        const textoBusca = normalize(`${String(row.titulo ?? '')} ${area}`);
        if (termos.every(t => textoBusca.includes(t))) {
          hits.push({
            catalogoId: cat.id,
            videoId: String(row.video_id ?? ''),
            titulo: String(row.titulo ?? ''),
            area,
            slugArea: cat.temAreas ? slugify(area) : 'aulas',
          });
        }
        if (hits.length >= 300) break;
      }
      if (hits.length >= 300) break;
    }
    return hits;
  }, [busca]);

  const areasDosResultados = useMemo(() => {
    if (!buscaAulas.length) return [];
    const areas = new Set(buscaAulas.map(a => a.area));
    return ['Todos', ...Array.from(areas).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [buscaAulas]);

  const aulasFiltradas = useMemo(() => {
    if (drawerCategoria === 'Todos') return buscaAulas;
    return buscaAulas.filter(a => a.area === drawerCategoria);
  }, [buscaAulas, drawerCategoria]);

  const pct = data.pctGeral;
  const size = 72;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c - (pct / 100) * c;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Videoaulas" onBack={() => navigate('/')} />

      <div className="mx-auto w-full max-w-3xl pb-32 lg:max-w-[1400px] lg:px-10 lg:pt-6 2xl:max-w-[1600px]">
        {/* Painel — mesmo do Aprender */}
        <section
          className="bg-hero-yellow relative isolate overflow-hidden border-b border-black/10 lg:rounded-3xl lg:border lg:border-black/10 lg:shadow-xl"
          aria-label="Seu progresso em videoaulas"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.18),transparent_65%)]" />

          <div className="relative p-4 sm:p-5 lg:flex lg:items-center lg:gap-10 lg:p-8">

            <div className="flex items-start gap-3 lg:min-w-0 lg:flex-1 lg:items-center lg:gap-6">
              <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                  <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} fill="none" />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="#fff"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={c}
                    strokeDashoffset={dash}
                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-base font-black leading-none text-white">{pct}%</span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-white/70">
                    Assistido
                  </span>
                </div>
              </div>

              <div className="min-w-0 max-w-[58%] lg:max-w-none lg:flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Sua trilha</p>
                <h1 className="mt-0.5 font-display text-[22px] font-black leading-tight text-white sm:text-[28px] lg:text-[38px]">
                  Videoaulas
                  <span className="ml-2 font-display text-[15px] font-semibold italic text-white/80 sm:text-[20px]">
                    em trilhas
                  </span>
                </h1>
                <p
                  className="mt-0.5 text-[12px] leading-snug text-white/80 sm:text-[13px]"
                  style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                >
                  Aulas em vídeo com ferramentas de estudo por área.
                </p>
              </div>
            </div>


            <div className="relative mt-3 rounded-xl lg:mt-0 lg:w-[440px] lg:shrink-0 bg-black/85 text-white ring-1 ring-black/20 shadow-lg">
              <div className="grid grid-cols-3 divide-x divide-white/10 lg:py-2">
                <div className="flex flex-col items-center justify-center px-2 py-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Áreas</span>
                  <span className="mt-0.5 font-display text-base font-black leading-none">{areasDireito.length}</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Aulas</span>
                  <span className="mt-0.5 font-display text-base font-black leading-none">{data.totalAulas}</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Assistidas</span>
                  <span className="mt-0.5 font-display text-base font-black leading-none text-[hsl(var(--aprender-accent))]">
                    {data.totalConcluidas}
                    <span className="text-white/50">/{data.totalAulas}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-5 px-4 pt-5 sm:px-6 lg:space-y-8 lg:px-0 lg:pt-8">
          {/* Continue assistindo */}
          {data.recentes.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-primary" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Continue assistindo
                </p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:pb-0 xl:grid-cols-5 2xl:grid-cols-6">
                {data.recentes.map((r, i) => (
                  <button
                    key={r.rota}
                    onClick={() => navigate(r.rota)}
                    className="w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:border-primary/40 hover:shadow-lg active:scale-[0.98] lg:w-auto"
                  >
                    <div className="relative aspect-video bg-muted">
                      <ThumbImg
                        src={getCapaDaArea(r.area) || ytThumb(r.videoId, 'mq')}
                        alt={r.titulo}
                        priority={i < 3}
                        fallback={<Play className="h-6 w-6 text-primary/50" />}
                      />
                      <span
                        className="absolute bottom-0 left-0 h-1 bg-primary"
                        style={{ width: `${r.percentual}%` }}
                      />
                    </div>
                    <p className="line-clamp-2 px-2 pt-1.5 text-[11.5px] font-semibold leading-snug text-foreground">
                      {limparTitulo(r.titulo)}
                    </p>
                    <p className="px-2 pb-1.5 pt-0.5 text-[10.5px] text-muted-foreground">
                      {Math.round(r.percentual)}% assistido
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar - Abre Drawer */}
          <button 
            onClick={() => { haptic.selection(); setDrawerBusca(true); }}
            className="relative w-full mb-6 group text-left"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-12 text-muted-foreground flex items-center group-hover:border-white/20 transition-all">
              Pesquisar disciplina...
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full transition-colors pointer-events-none">
              <Mic className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          {/* Áreas do Direito */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground lg:text-[13px]">
                Áreas do Direito
              </p>
              {emAndamentoCount > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-muted p-0.5">
                  {(['todas', 'andamento'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFiltro(f)}
                      className={[
                        'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                        filtro === f
                          ? 'bg-[hsl(var(--aprender-accent))] text-[hsl(var(--aprender-accent-foreground))]'
                          : 'text-muted-foreground hover:text-foreground',
                      ].join(' ')}
                    >
                      {f === 'todas' ? 'Todas' : `Em andamento (${emAndamentoCount})`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 2xl:grid-cols-3">
              {loading && !lista.length
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="h-[84px] animate-pulse rounded-2xl bg-muted" />
                  ))
                : lista.map((a) => {
                    const { Icon, color } = areaIconFor(a.area);
                    return (
                      <button
                        key={`${a.catalogo}-${a.slug}`}
                        onPointerDown={() => prefetchCatalogo('areas')}
                        onClick={() => {
                          haptic.selection();
                          navigate(`/videoaulas/areas/${a.slug}`);
                        }}

                        className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.995] sm:p-3.5"
                      >
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16 aprender-icon-shine">
                          <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.9} style={{ color }} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground sm:text-[16px]"
                              style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                            >
                              {simplificarNomeArea(a.area)}
                            </p>
                            <span
                              className={[
                                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                                a.pct > 0
                                  ? 'bg-[hsl(var(--aprender-accent)/0.18)] text-[hsl(var(--aprender-accent))]'
                                  : 'bg-muted text-muted-foreground',
                              ].join(' ')}
                            >
                              {a.pct}%
                            </span>
                          </div>
                          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground sm:text-[13px]">
                            <Video className="h-3 w-3" />
                            {a.total} {a.total === 1 ? 'aula' : 'aulas'}
                            {a.concluidas > 0 && ` · ${a.concluidas} assistida${a.concluidas === 1 ? '' : 's'}`}
                          </p>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-[hsl(var(--aprender-accent))] transition-all"
                              style={{ width: `${a.pct}%` }}
                            />
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </button>
                    );
                  })}
            </div>
          </div>
        </div>
      </div>

      <Drawer open={drawerBusca} onOpenChange={setDrawerBusca}>
        <DrawerContent className="h-[95vh] bg-background border-t border-white/10 px-0 flex flex-col">
          <DrawerTitle className="sr-only">Pesquisar disciplina</DrawerTitle>
          <div className="p-4 border-b border-white/10 shrink-0 flex items-center gap-3">
             <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <input
                 autoFocus
                 type="text"
                 placeholder="Digite o nome da disciplina..."
                 value={busca}
                 onChange={(e) => {
                   setBusca(e.target.value);
                   setDrawerCategoria('Todos');
                 }}
                 className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-12 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
               />
               <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                 {busca && (
                   <button 
                     onClick={() => { setBusca(''); setDrawerCategoria('Todos'); }}
                     className="p-2 hover:bg-white/5 rounded-full transition-colors"
                   >
                     <X className="h-4 w-4 text-muted-foreground" />
                   </button>
                 )}
               </div>
             </div>
             <button 
               onClick={() => { haptic.selection(); /* lgica p voz */ }}
               className="p-3 hover:bg-white/5 rounded-full transition-colors -ml-1"
             >
               <Mic className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
             </button>
             <button 
               onClick={() => { haptic.selection(); setDrawerBusca(false); }}
               className="p-3 hover:bg-white/5 rounded-full transition-colors -ml-1"
             >
               <X className="h-5 w-5 text-muted-foreground hover:text-white transition-colors" />
             </button>
          </div>

          {areasDosResultados.length > 1 && (
            <div className="border-b border-white/10 shrink-0">
              <div className="flex overflow-x-auto p-4 gap-2 no-scrollbar">
                {areasDosResultados.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      haptic.selection();
                      setDrawerCategoria(cat);
                    }}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      drawerCategoria === cat 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {simplificarNomeArea(cat)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {lista.length === 0 && aulasFiltradas.length === 0 && (
              <p className="text-center text-muted-foreground text-[13px] py-8 font-medium">
                {busca.trim() ? 'Nenhum resultado encontrado.' : 'Digite para buscar disciplinas e aulas.'}
              </p>
            )}

            {/* Áreas encontradas */}
            {lista.length > 0 && busca.trim() && drawerCategoria === 'Todos' && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 pt-1 pb-0.5">Disciplinas</p>
            )}
            {drawerCategoria === 'Todos' && lista.map((a) => {
              const { Icon, color } = areaIconFor(a.area);
              return (
                <button
                  key={`${a.catalogo}-${a.slug}-busca`}
                  onPointerDown={() => prefetchCatalogo('areas')}
                  onClick={() => {
                    haptic.selection();
                    setDrawerBusca(false);
                    setBusca('');
                    navigate(`/videoaulas/areas/${a.slug}`);
                  }}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.995]"
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center aprender-icon-shine">
                    <Icon className="h-7 w-7" strokeWidth={1.9} style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground font-display">
                      <Highlight text={simplificarNomeArea(a.area)} query={busca} />
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                      <Video className="h-3 w-3" />
                      {a.total} {a.total === 1 ? 'aula' : 'aulas'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}

            {/* Aulas individuais encontradas */}
            {aulasFiltradas.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 pt-3 pb-0.5">Aulas</p>
            )}
            {aulasFiltradas.map((a) => (
              <button
                key={`aula-${a.catalogoId}-${a.videoId}`}
                onClick={() => {
                  haptic.selection();
                  setDrawerBusca(false);
                  setBusca('');
                  navigate(`/videoaulas/${a.catalogoId}/${a.slugArea}/${a.videoId}`);
                }}
                className="group flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-2.5 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.995]"
              >
                <div className="relative w-28 aspect-video shrink-0 rounded-lg overflow-hidden bg-muted">
                  <ThumbImg
                    src={ytThumb(a.videoId, 'mq')}
                    alt={a.titulo}
                    fallback={<Play className="h-5 w-5 text-primary/50" />}
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center min-h-[63px]">
                  <p className="min-w-0 text-[13px] font-semibold leading-snug text-foreground whitespace-normal">
                    <Highlight text={limparTitulo(a.titulo)} query={busca} />
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground truncate">
                    {simplificarNomeArea(a.area)}
                  </p>
                </div>
                <div className="flex h-full items-center justify-center shrink-0 min-h-[63px]">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <VideoaulasBottomNav />
    </div>
  );
};

export default Videoaulas;
