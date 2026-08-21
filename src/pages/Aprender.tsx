import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Home, Bell, Landmark, Building2, Gavel, ShieldCheck, Briefcase, DollarSign, Scale, FileText,
  HeartPulse, Users, Globe, Leaf, Trophy, Hammer, Coins, Swords, Building, Globe2, AlertTriangle,
  GraduationCap, Microscope, BookText, ClipboardList, Award, Lightbulb, Sparkles, ChevronRight, BookOpen,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isAdminEmail } from '@/lib/adminEmails';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import AprenderBottomNav from '@/components/aprender/AprenderBottomNav';
import AprenderLembretesSheet from '@/components/aprender/AprenderLembretesSheet';
import ContinueCarousel from '@/components/aprender/ContinueCarousel';
import MateriaRow from '@/components/aprender/MateriaRow';
import MateriaCard from '@/components/aprender/MateriaCard';
import AulaCarouselCard from '@/components/aprender/AulaCarouselCard';
import { useAprenderAreaModulesMap } from '@/hooks/useAprenderAreaModulesMap';
import { shortenAreaName } from '@/lib/areaNameShortener';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { prefetchAprenderArea } from '@/lib/aprenderAreaLoader';
import { prefetchAprenderAula } from '@/lib/aprenderAulaPrefetch';
import { warmAprenderCache } from '@/lib/warmAprenderCache';
import {
  readAprenderHomeLocal,
  writeAprenderHomeLocal,
  pruneAprenderHomeLocal,
  type AprenderHomeData,
  type AprenderHomeAula,
} from '@/lib/aprenderHomeSnapshot';
import hero1 from '@/assets/aprender-hero/hero-1.png.asset.json';
import hero2 from '@/assets/aprender-hero/hero-2.png.asset.json';
import hero3 from '@/assets/aprender-hero/hero-3.png.asset.json';
import hero4 from '@/assets/aprender-hero/hero-4.png.asset.json';
import hero5 from '@/assets/aprender-hero/hero-5.png.asset.json';
import hero6 from '@/assets/aprender-hero/hero-6.png.asset.json';
import horusOwl from '@/assets/horus/horus-owl.webp';
import { useTrackArea } from "@/hooks/useTrackArea";
import { srcOf } from '@/lib/assetUrl';
import { cn } from '@/lib/utils';

const HERO_ILLUSTRATIONS = [srcOf(hero1), srcOf(hero2), srcOf(hero3), srcOf(hero4), srcOf(hero5), srcOf(hero6)];

// Ícones vetoriais por área — no estilo dos ícones dos códigos.
const AREA_ICON_MAP: Record<string, { Icon: typeof Landmark; color: string }> = {
  'direito-administrativo': { Icon: Landmark, color: '#f97316' },
  'direito-civil': { Icon: Home, color: '#a81f40' },
  'direito-penal': { Icon: Gavel, color: '#c2274a' },
  'direito-constitucional': { Icon: Scale, color: '#3b82f6' },
  'direito-processual-civil': { Icon: FileText, color: '#38bdf8' },
  'direito-processual-penal': { Icon: ShieldCheck, color: '#a78bfa' },
  'direito-tributario': { Icon: DollarSign, color: '#22c55e' },
  'direito-do-trabalho': { Icon: Briefcase, color: '#a81f40' },
  'direito-empresarial': { Icon: Building2, color: '#94a3b8' },
  'direito-ambiental': { Icon: Leaf, color: '#10b981' },
  'direitos-humanos': { Icon: Users, color: '#f472b6' },
  'direito-internacional-publico': { Icon: Globe, color: '#0ea5e9' },
  'direito-previdenciario': { Icon: HeartPulse, color: '#ec4899' },
  'direito-desportivo': { Icon: Trophy, color: '#c2274a' },
  'direito-processual-do-trabalho': { Icon: Hammer, color: '#60a5fa' },
  'direito-financeiro': { Icon: Coins, color: '#c2274a' },
  'direito-concorrencial': { Icon: Swords, color: '#c084fc' },
  'direito-urbanistico': { Icon: Building, color: '#fb923c' },
  'direito-internacional-privado': { Icon: Globe2, color: '#2dd4bf' },
  'lei-penal-especial': { Icon: AlertTriangle, color: '#f87171' },
  'formacao-complementar': { Icon: GraduationCap, color: '#fb923c' },
  'pesquisa-cientifica': { Icon: Microscope, color: '#22d3ee' },
  'politicas-publicas': { Icon: Users, color: '#818cf8' },
  'portugues': { Icon: BookText, color: '#fb923c' },
  'pratica-profissional': { Icon: ClipboardList, color: '#a8a29e' },
  'revisao-oab': { Icon: Award, color: '#f87171' },
  'teoria-e-filosofia-do-direito': { Icon: Lightbulb, color: '#a5b4fc' },
};

function areaIconFor(slug?: string | null) {
  if (!slug) return null;
  return AREA_ICON_MAP[slug] ?? null;
}

const EMPTY: AprenderHomeData = {
  areas: [],
  emAndamento: [],
  proxima: null,
  totalAulas: 0,
  totalConcluidas: 0,
  pctGeral: 0,
};

// Cache em memória — evita qualquer flash ao navegar dentro da sessão.
let memoData: AprenderHomeData | null = null;
let memoUid: string | null | undefined;

function onIdle(cb: () => void, timeout = 800) {
  const ric: any =
    (typeof window !== 'undefined' && (window as any).requestIdleCallback) ||
    ((fn: any) => setTimeout(fn, timeout));
  return ric(cb, { timeout });
}

const Aprender = () => {
  useTrackArea("aprender_aberto");
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const isAdmin = isAdminEmail(user?.email);
  const { modulesMap } = useAprenderAreaModulesMap();
  const [selectedAreaSlug, setSelectedAreaSlug] = useState<string | null>(null);

  // Timer Countdown logic
  const targetDate = useMemo(() => new Date('2026-08-25T00:00:00-03:00').getTime(), []);
  const [timeLeft, setTimeLeft] = useState({ days: 5, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (isAdmin) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAdmin, targetDate]);

  // Primeiro render já pintado: memória → localStorage (síncrono).
  const [data, setData] = useState<AprenderHomeData>(() => {
    if (memoData && memoUid === uid) return memoData;
    return readAprenderHomeLocal(uid) ?? EMPTY;
  });
  const [loading, setLoading] = useState(() => !(memoData && memoUid === uid) && !readAprenderHomeLocal(uid));
  const [filtro, setFiltro] = useState<'todas' | 'andamento'>('todas');
  const [heroIdx, setHeroIdx] = useState(0);
  const [lembretesOpen, setLembretesOpen] = useState(false);
  const painted = useRef(false);

  useEffect(() => {
    pruneAprenderHomeLocal();
  }, []);

  // Rotação da ilustração só depois do primeiro paint.
  useEffect(() => {
    let id: number | undefined;
    const start = onIdle(() => {
      id = window.setInterval(() => {
        setHeroIdx((i) => (i + 1) % HERO_ILLUSTRATIONS.length);
      }, 4500);
    }, 1200);
    return () => {
      if (id) clearInterval(id);
      const cancel: any = (window as any).cancelIdleCallback;
      if (cancel) cancel(start);
    };
  }, []);

  // Carga única e agregada no banco (stale-while-revalidate).
  useEffect(() => {
    let cancelled = false;

    // Hidrata a partir do localStorage se o uid mudou (login/logout).
    if (!(memoData && memoUid === uid)) {
      const local = readAprenderHomeLocal(uid);
      if (local) {
        setData(local);
        setLoading(false);
      }
    }

    (async () => {
      const { data: res, error } = await supabase.rpc('aprender_home_resumo');
      if (cancelled || error || !res) {
        if (!cancelled) setLoading(false);
        return;
      }
      const next = res as unknown as AprenderHomeData;
      memoData = next;
      memoUid = uid;
      setData(next);
      setLoading(false);
      writeAprenderHomeLocal(uid, next);
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Aquecimento leve depois do primeiro paint (não compete com a carga inicial).
  useEffect(() => {
    if (painted.current || !data.areas.length) return;
    painted.current = true;
    const handle = onIdle(() => {
      warmAprenderCache(uid);
      data.areas.forEach((a) => {
        const cover = getAreaCover(a.nome);
        if (cover?.cover) {
          const img = new Image();
          img.src = cover.cover;
        }
      });
      // Só as aulas realmente prováveis: as em andamento + a próxima sugerida.
      [...data.emAndamento.slice(0, 4), ...(data.proxima ? [data.proxima] : [])].forEach((a) =>
        prefetchAprenderAula(a.aulaId),
      );
    }, 1500);
    return () => {
      const cancel: any = (window as any).cancelIdleCallback;
      if (cancel) cancel(handle);
    };
  }, [data, uid]);

  const continuar: AprenderHomeAula[] = useMemo(() => {
    if (data.emAndamento.length) return data.emAndamento;
    return data.proxima ? [data.proxima] : [];
  }, [data]);

  const areasOrdenadas = useMemo(() => {
    const lista = [...data.areas];
    lista.sort((a, b) => {
      const ai = a.pct > 0 ? 0 : 1;
      const bi = b.pct > 0 ? 0 : 1;
      if (ai !== bi) return ai - bi;
      if (ai === 0 && b.pct !== a.pct) return b.pct - a.pct;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
    return filtro === 'andamento' ? lista.filter((a) => a.pct > 0) : lista;
  }, [data.areas, filtro]);

  const emAndamentoCount = useMemo(() => data.areas.filter((a) => a.pct > 0).length, [data.areas]);

  const activeArea = useMemo(() => {
    if (!areasOrdenadas.length) return null;
    if (selectedAreaSlug) {
      const found = areasOrdenadas.find((a) => a.slug === selectedAreaSlug);
      if (found) return found;
    }
    return areasOrdenadas[0];
  }, [areasOrdenadas, selectedAreaSlug]);

  const pct = data.pctGeral ?? 0;
  const size = 72;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c - (pct / 100) * c;

  const mobileHeader = (
    <PageHeader
      title={<span className="font-display font-black text-[22px] sm:text-[24px] uppercase tracking-wide">APRENDER</span>}
      onBack={() => navigate('/')}
    />
  );

  return (
    <DesktopPageLayout
      activeId="aprender"
      title="Aprender"
      subtitle="Seu hub de estudos"
      mobileHeader={mobileHeader}
      wide
    >
      <div className={cn("w-full 2xl:max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8 lg:pt-4 pb-[calc(7rem+var(--sai-bottom,env(safe-area-bottom,0px)))]", !isAdmin && "relative h-[100dvh] sm:h-auto overflow-hidden")}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* ── Sidebar Esquerda Desktop: Filtros & Lembretes de Estudo ───────────── */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4 bg-card/40 border border-border/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold text-foreground">Filtrar Matérias</h2>
              <span className="text-[11px] font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                {data.areas.length} totais
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setFiltro('todas')}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between',
                  filtro === 'todas'
                    ? 'border-primary/60 bg-primary/15 text-primary'
                    : 'border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <span>Todas as Matérias</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted">
                  {data.areas.length}
                </span>
              </button>

              <button
                onClick={() => setFiltro('andamento')}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between',
                  filtro === 'andamento'
                    ? 'border-primary/60 bg-primary/15 text-primary'
                    : 'border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <span>Em Andamento</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted">
                  {emAndamentoCount}
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-border/60">
              <button
                onClick={() => setLembretesOpen(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
              >
                <Bell className="w-4 h-4" /> Configurar Lembretes
              </button>
            </div>
          </aside>

          {/* ── Coluna Central Widescreen: Trilha Hero, Continuar & Matérias ─────── */}
          <div className="lg:col-span-6 space-y-5">
            {/* Hero amarelo full-bleed */}
            <section
              className="bg-hero-yellow relative isolate overflow-hidden -mx-3 sm:mx-0 rounded-none sm:rounded-2xl border-b border-black/10 sm:border-x sm:border-t shadow-lg"
              aria-label="Seu progresso em trilhas"
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
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="absolute inset-y-0 right-0 h-full w-auto object-contain object-right transition-opacity duration-[1400ms] ease-in-out"
                    style={{ opacity: i === heroIdx ? 1 : 0 }}
                  />
                ))}
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-light)) 100%)',
                    mixBlendMode: 'multiply',
                  }}
                />
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background via-background/60 to-transparent" />
              </div>

              <div className="relative p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  {/* Anel de progresso */}
                  <div className="relative shrink-0" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="-rotate-90">
                      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} fill="none" />
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke="#ffffff"
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
                      <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-white/80">
                        Progresso
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 max-w-[58%] lg:max-w-[70%]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/90">Sua trilha de aprendizado</p>
                    <h1 className="mt-0.5 font-display text-[22px] font-black leading-tight text-white sm:text-[26px]">
                      AULAS
                      <span className="ml-2 font-display text-[15px] font-semibold italic text-white/90 sm:text-[18px]">
                        EM TRILHAS
                      </span>
                    </h1>
                    <p
                      className="mt-0.5 text-[12px] leading-snug text-white/85 sm:text-[13px]"
                      style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                    >
                      Slides, flashcards e questões por matéria.
                    </p>
                  </div>
                </div>

                {/* Barra única com as 3 métricas */}
                <div className="relative mt-3 rounded-xl bg-black/85 text-white ring-1 ring-black/20 shadow-lg">
                  <div className="grid grid-cols-3 divide-x divide-white/10">
                    <div className="flex flex-col items-center justify-center px-2 py-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Matérias</span>
                      <span className="mt-0.5 font-display text-base font-black leading-none">{data.areas.length}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-2 py-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Aulas</span>
                      <span className="mt-0.5 font-display text-base font-black leading-none">{data.totalAulas}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-2 py-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Concluídas</span>
                      <span className="mt-0.5 font-display text-base font-black leading-none text-[hsl(var(--aprender-accent))]">
                        {data.totalConcluidas}
                        <span className="text-white/50">/{data.totalAulas}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Continue de onde parou — dinâmico */}
            {continuar.length > 0 ? (
              <ContinueCarousel
                aulas={continuar}
                onOpen={(id) => navigate(`/aprender/aula/${id}`)}
              />
            ) : loading ? (
              <div className="h-[104px] rounded-2xl bg-muted animate-pulse" />
            ) : null}

            {/* Menu de Alternância de Matérias + Lista de Subtópicos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Matérias ({areasOrdenadas.length})</p>
                {emAndamentoCount > 0 && (
                  <div className="flex items-center gap-1 rounded-full bg-muted p-0.5 lg:hidden">
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
                        {f === 'todas' ? 'Todas' : `Andamento (${emAndamentoCount})`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {loading && !data.areas.length ? (
                <div className="h-28 rounded-2xl bg-muted animate-pulse" />
              ) : areasOrdenadas.length === 0 ? (
                <div className="w-full rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  {filtro === 'andamento'
                    ? 'Você ainda não começou nenhuma matéria.'
                    : 'Nenhuma matéria disponível ainda.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {areasOrdenadas.map((area) => {
                    const icon = areaIconFor(area.slug);
                    return (
                      <MateriaRow
                        key={area.id}
                        area={area}
                        icon={icon}
                        onOpen={() => navigate(`/aprender/area/${area.slug}`)}
                        onPrefetch={() => prefetchAprenderArea(area.slug, uid)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar Direita Desktop: Estatísticas & Ferramentas de Apoio ────── */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4 bg-card/40 border border-border/60 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2.5">
              Seu Desempenho
            </h2>

            <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Meta de Estudo</span>
                <span className="font-bold text-primary">{pct}% atingido</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/aprender/desempenho')}
                className="w-full text-left p-3 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Estatísticas Detalhadas</p>
                    <p className="text-[11px] text-muted-foreground">Ofensiva, precisão e horas</p>
                  </div>
                </div>
              </button>
            </div>
          </aside>
        </div>

        {/* Overlay de Ofuscação para Não-Admins */}
        {!isAdmin && (
          <div className="absolute inset-0 z-[60] backdrop-blur-[16px] bg-background/50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-card/90 p-8 rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full mx-auto relative overflow-hidden flex flex-col items-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
              <img src={horusOwl} alt="Hórus" className="w-24 h-24 mb-4 relative z-10 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.3)] object-cover" />
              <h2 className="text-xl font-display font-black text-foreground mb-2 relative z-10">Novidade a Caminho!</h2>
              <p className="text-sm font-body text-muted-foreground mb-6 relative z-10">
                O seu hub de estudos inteligente estará disponível em breve com cronogramas gerados pela IA.
              </p>
              
              <div className="flex gap-3 justify-center relative z-10">
                <div className="bg-background rounded-xl p-3 min-w-[70px] border border-border shadow-sm flex flex-col items-center justify-center">
                  <span className="block text-3xl font-display font-black text-primary leading-none">5</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Dias Restantes</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AprenderLembretesSheet open={lembretesOpen} onOpenChange={setLembretesOpen} />
    </DesktopPageLayout>
  );
};

export default Aprender;
