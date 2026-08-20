import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Play, Video, Search, Mic, X, ListVideo, BarChart3, Scale, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import VideoaulasDesempenhoSheet from '@/components/videoaulas/VideoaulasDesempenhoSheet';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { CATALOGOS, limparTitulo, simplificarNomeArea, slugify, ytThumb, getCapaDaArea } from '@/lib/videoaulasCatalogos';
import { cn } from '@/lib/utils';
import hero1 from '@/assets/aprender-hero/hero-1.png.asset.json';
import hero2 from '@/assets/aprender-hero/hero-2.png.asset.json';
import hero3 from '@/assets/aprender-hero/hero-3.png.asset.json';
import hero4 from '@/assets/aprender-hero/hero-4.png.asset.json';
import hero5 from '@/assets/aprender-hero/hero-5.png.asset.json';
import hero6 from '@/assets/aprender-hero/hero-6.png.asset.json';
import { srcOf } from '@/lib/assetUrl';

const HERO_ILLUSTRATIONS = [srcOf(hero1), srcOf(hero2), srcOf(hero3), srcOf(hero4), srcOf(hero5), srcOf(hero6)];

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
import { useIsDesktop } from '@/hooks/use-desktop';
import { VideoaulasDesktop } from './VideoaulasDesktop';

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
  const isDesktop = useIsDesktop();
  // Render instantâneo: se o cache em memória já tem os catálogos, pinta na hora.
  const [data, setData] = useState<ResumoVideoaulas>(() => resumoVideoaulasSincrono() ?? RESUMO_VAZIO);
  const [loading, setLoading] = useState(() => !resumoVideoaulasSincrono());
  const [filtro, setFiltro] = useState<'todas' | 'andamento'>('todas');
  const [busca, setBusca] = useState('');
  const [drawerBusca, setDrawerBusca] = useState(false);
  const [showDesempenho, setShowDesempenho] = useState(false);
  const [drawerCategoria, setDrawerCategoria] = useState('Todos');
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (!drawerBusca) {
      setBusca('');
      setDrawerCategoria('Todos');
    }
  }, [drawerBusca]);

  useEffect(() => {
    let id: number | undefined;
    const start = setTimeout(() => {
      id = window.setInterval(() => {
        setHeroIdx((i) => (i + 1) % HERO_ILLUSTRATIONS.length);
      }, 4500);
    }, 1200);
    return () => {
      clearTimeout(start);
      if (id) clearInterval(id);
    };
  }, []);

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

  const pct = Math.min(100, Math.round((emAndamentoCount / Math.max(areasDireito.length, 1)) * 100));
  const size = 120;
  const r = 50;
  const stroke = 8;
  const c = 2 * Math.PI * r;
  const dash = c - (pct / 100) * c;

  if (isDesktop) {
    return (
      <VideoaulasDesktop
        data={data}
        filtro={filtro}
        setFiltro={setFiltro}
        busca={busca}
        setBusca={setBusca}
        lista={lista}
      />
    );
  }

  const horasAssistidas = Math.floor(data.totalConcluidas * 0.5);

  return (
    <div className="min-h-dvh bg-background pb-32 lg:pb-0 overflow-x-hidden w-full">
      <PageHeader title="Videoaulas" onBack={() => navigate('/')} />

      <div className="mx-auto w-full max-w-3xl pb-32 lg:max-w-[1400px] lg:px-10 lg:pt-6 2xl:max-w-[1600px]">
        {/* Painel — mesmo do Aprender */}
        <section
          className="bg-primary relative isolate overflow-hidden border-b border-black/10 lg:rounded-3xl lg:border lg:border-black/10 lg:shadow-xl"
          aria-label="Seu progresso em videoaulas"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.18),transparent_65%)]" />

          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-[42%] sm:w-[34%] overflow-hidden"
            aria-hidden="true"
          >
            {HERO_ILLUSTRATIONS.map((url, i) => (
              <img
                key={url}
                src={url}
                alt=""
                className={cn(
                  'absolute inset-0 h-full w-full object-cover object-left opacity-[0.12] sm:opacity-[0.18] transition-opacity duration-[2000ms] ease-in-out',
                  i === heroIdx ? 'opacity-100' : 'opacity-0',
                )}
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                }}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.18),transparent_65%)]" />

          <div className="relative p-4 sm:p-5 lg:flex lg:items-center lg:gap-10 lg:p-8">

            <div className="flex items-start gap-3 lg:min-w-0 lg:flex-1 lg:items-center lg:gap-6">
              <div
                  className="relative h-[72px] w-[72px] sm:h-20 sm:w-20 lg:h-24 lg:w-24 shrink-0 active:scale-95 transition-transform cursor-pointer"
                  onClick={() => { haptic.selection(); setShowDesempenho(true); }}
                >
                  <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      className="text-white/20"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-white"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={c}
                      strokeDashoffset={dash}
                      style={{ transition: 'stroke-dashoffset 600ms ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                    <span className="font-display text-[22px] font-black leading-none text-white">{horasAssistidas}h</span>
                    <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-white/70">
                      Assistidas
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/50 mt-0.5" />
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

        <div className="space-y-6 px-4 pt-6 sm:px-6 lg:space-y-8 lg:px-0 lg:pt-8">

          {/* ── Card Principal com Botão de Pesquisa ───────────────── */}
          <div className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-amber-500" />
              <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Procurar Aula</h2>
            </div>
            <p className="ml-3 mt-1 mb-4 text-xs text-muted-foreground">
              Encontre videoaulas por disciplina, assunto ou termo.
            </p>

            <button 
              onClick={() => { haptic.selection(); setDrawerBusca(true); }}
              className="relative w-full group text-left transition-all active:scale-[0.99]"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="w-full h-14 sm:h-16 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-12 text-muted-foreground flex items-center group-hover:border-primary/50 transition-all text-base font-medium shadow-inner shadow-black/50">
                Pesquisar no catálogo...
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full transition-colors pointer-events-none">
                <Mic className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>
          </div>

          {/* ── Título Atalhos ─────────────────────────────── */}
          <div className="mb-3 px-1 mt-6">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-lg font-extrabold leading-tight text-foreground uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Atalhos</h2>
            </div>
            <p className="ml-3 mt-1 text-xs text-muted-foreground">
              Ações rápidas para continuar, playlists e histórico.
            </p>
          </div>

          {/* ── Ações Rápidas (4 botões) ───────────────── */}
          <section className="grid grid-cols-4 gap-2.5">
            <button
              onClick={() => { haptic.selection(); navigate('/videoaulas/recentes'); }}
              className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-amber-500/50 transition-all active:scale-95 gap-2 text-center"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:scale-110" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-extrabold text-foreground leading-tight">Continuar</p>
              </div>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/videoaulas/playlist'); }}
              className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-amber-500/50 transition-all active:scale-95 gap-2 text-center"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <ListVideo className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:scale-110" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-extrabold text-foreground leading-tight">Playlist</p>
              </div>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/videoaulas/desempenho'); }}
              className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-amber-500/50 transition-all active:scale-95 gap-2 text-center"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:scale-110" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-extrabold text-foreground leading-tight">Desempenho</p>
              </div>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/videoaulas/lei-seca'); }}
              className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-amber-500/50 transition-all active:scale-95 gap-2 text-center"
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <Scale className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:scale-110" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-extrabold text-foreground leading-tight">Lei Seca</p>
              </div>
            </button>
          </section>

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
      {/* Modal Desempenho */}
      <VideoaulasDesempenhoSheet 
        open={showDesempenho} 
        onClose={() => setShowDesempenho(false)} 
        horasTotais={horasAssistidas} 
      />
    </div>
  );
};

export default Videoaulas;
